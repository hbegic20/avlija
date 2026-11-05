const logoMarkGlyphScale = 0.74;
const logoMarkBaselineNudge = 0.05;
const logoMarkLetterSpacing = -0.02;
export const siteLogoMarkSize = 36;

export function logoMarkGeometry(size: number) {
  return {
    fontSize: size * logoMarkGlyphScale,
    marginTop: size * logoMarkBaselineNudge,
    letterSpacing: size * logoMarkLetterSpacing,
  };
}
