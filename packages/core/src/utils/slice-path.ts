import { PathBuilder } from '../render/tree'

/**
 * Build a rounded annular sector (pie/donut slice) SVG path string.
 *
 * Supports different angular offsets at inner vs outer radius for uniform
 * pixel-width gaps between slices.
 *
 * @param cx - Center x
 * @param cy - Center y
 * @param outerR - Outer radius
 * @param innerR - Inner radius (0 for full pie, >0 for donut)
 * @param outerStart - Start angle on outer arc (radians)
 * @param outerEnd - End angle on outer arc (radians)
 * @param innerStart - Start angle on inner arc (radians)
 * @param innerEnd - End angle on inner arc (radians)
 * @param cornerRadius - Corner rounding radius in px
 */
export function roundedSlicePath(
  cx: number, cy: number,
  outerR: number, innerR: number,
  outerStart: number, outerEnd: number,
  innerStart: number, innerEnd: number,
  cornerRadius: number,
): string {
  const pb = new PathBuilder()
  const outerSliceAngle = outerEnd - outerStart
  const innerSliceAngle = innerEnd - innerStart
  const radialThickness = outerR - innerR
  const outerArcLen = outerSliceAngle * outerR
  const innerArcLen = innerSliceAngle * innerR

  // Separate corner radii for outer and inner edges.
  // Inner corners need aggressive clamping — when innerR is small, the angular
  // span of a corner becomes huge relative to the slice, causing path distortion.
  const outerCr = Math.min(
    cornerRadius,
    radialThickness / 2,
    outerArcLen / 4,
  )
  // Skip inner rounding entirely when inner radius is too small (<20px)
  // — the angular span of any rounding would dominate the inner edge.
  const innerCr = innerR >= 20
    ? Math.min(
        cornerRadius,
        radialThickness / 2,
        innerArcLen / 4,
        innerR * 0.25,
      )
    : 0

  if (outerCr < 0.5 && innerCr < 0.5) {
    // No rounding — standard path with per-radius angles
    const x1o = cx + outerR * Math.cos(outerStart)
    const y1o = cy + outerR * Math.sin(outerStart)
    const x2o = cx + outerR * Math.cos(outerEnd)
    const y2o = cy + outerR * Math.sin(outerEnd)
    const x1i = cx + innerR * Math.cos(innerEnd)
    const y1i = cy + innerR * Math.sin(innerEnd)
    const x2i = cx + innerR * Math.cos(innerStart)
    const y2i = cy + innerR * Math.sin(innerStart)

    pb.moveTo(x1o, y1o)
    pb.arc(outerR, outerR, 0, outerSliceAngle > Math.PI, true, x2o, y2o)
    pb.lineTo(x1i, y1i)
    if (innerR > 0) {
      pb.arc(innerR, innerR, 0, innerSliceAngle > Math.PI, false, x2i, y2i)
    }
    pb.close()
    return pb.build()
  }

  // Angular offsets for rounding on each arc (separate for outer/inner)
  const outerCrAngle = outerCr / outerR
  const innerCrAngle = innerR > 0 && innerCr > 0.5 ? innerCr / innerR : 0

  // Outer arc inset by corner angles
  const oa1 = outerStart + outerCrAngle
  const oa2 = outerEnd - outerCrAngle
  // Inner arc inset by corner angles (reverse direction)
  const ia1 = innerEnd - innerCrAngle
  const ia2 = innerStart + innerCrAngle

  // -- Corner 1: outer-start (start radial meets outer arc) --
  pb.moveTo(
    cx + (outerR - outerCr) * Math.cos(outerStart),
    cy + (outerR - outerCr) * Math.sin(outerStart),
  )
  if (outerCr >= 0.5) {
    pb.quadTo(
      cx + outerR * Math.cos(outerStart),
      cy + outerR * Math.sin(outerStart),
      cx + outerR * Math.cos(oa1),
      cy + outerR * Math.sin(oa1),
    )
  }

  // -- Outer arc from oa1 to oa2 --
  if (oa2 > oa1) {
    pb.arc(outerR, outerR, 0, (oa2 - oa1) > Math.PI, true,
      cx + outerR * Math.cos(oa2),
      cy + outerR * Math.sin(oa2),
    )
  }

  // -- Corner 2: outer-end (outer arc meets end radial) --
  if (outerCr >= 0.5) {
    pb.quadTo(
      cx + outerR * Math.cos(outerEnd),
      cy + outerR * Math.sin(outerEnd),
      cx + (outerR - outerCr) * Math.cos(outerEnd),
      cy + (outerR - outerCr) * Math.sin(outerEnd),
    )
  }

  // -- Inner edge --
  if (innerCr >= 0.5 && innerR > 0) {
    // Line down to inner-end corner
    pb.lineTo(
      cx + (innerR + innerCr) * Math.cos(innerEnd),
      cy + (innerR + innerCr) * Math.sin(innerEnd),
    )

    // Corner 3: inner-end (end radial meets inner arc)
    pb.quadTo(
      cx + innerR * Math.cos(innerEnd),
      cy + innerR * Math.sin(innerEnd),
      cx + innerR * Math.cos(ia1),
      cy + innerR * Math.sin(ia1),
    )

    // Inner arc from ia1 to ia2 (reverse)
    if (ia1 > ia2) {
      pb.arc(innerR, innerR, 0, (ia1 - ia2) > Math.PI, false,
        cx + innerR * Math.cos(ia2),
        cy + innerR * Math.sin(ia2),
      )
    }

    // Corner 4: inner-start (inner arc meets start radial)
    pb.quadTo(
      cx + innerR * Math.cos(innerStart),
      cy + innerR * Math.sin(innerStart),
      cx + (innerR + innerCr) * Math.cos(innerStart),
      cy + (innerR + innerCr) * Math.sin(innerStart),
    )
  } else if (innerR > 0) {
    // No inner rounding — sharp inner corners
    pb.lineTo(
      cx + innerR * Math.cos(innerEnd),
      cy + innerR * Math.sin(innerEnd),
    )
    pb.arc(innerR, innerR, 0, innerSliceAngle > Math.PI, false,
      cx + innerR * Math.cos(innerStart),
      cy + innerR * Math.sin(innerStart),
    )
  }

  pb.close()
  return pb.build()
}

/**
 * Compute angular offsets for a uniform pixel gap at different radii.
 * Returns the padded start/end angles for both outer and inner arcs.
 */
export function uniformGapAngles(
  startAngle: number, endAngle: number,
  outerR: number, innerR: number,
  gapPx: number,
): { outerStart: number; outerEnd: number; innerStart: number; innerEnd: number } {
  const halfGap = gapPx / 2
  const outerPad = halfGap / outerR
  const innerPad = innerR > 0 ? halfGap / innerR : 0
  return {
    outerStart: startAngle + outerPad,
    outerEnd: endAngle - outerPad,
    innerStart: startAngle + innerPad,
    innerEnd: endAngle - innerPad,
  }
}
