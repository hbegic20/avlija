import { ImageResponse } from "next/og";
import { OgLogoMark } from "@/components/seo/logo-mark";
import { loadOgFonts } from "@/lib/seo/og-fonts";

const appleIconSide = 180;

export const size = { width: appleIconSide, height: appleIconSide };
export const contentType = "image/png";

export default async function AppleIcon() {
  const fonts = await loadOgFonts();
  return new ImageResponse(<OgLogoMark size={appleIconSide} />, { ...size, fonts });
}
