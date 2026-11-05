import { ImageResponse } from "next/og";
import { LogoMark } from "@/components/seo/logo-mark";
import { loadOgFonts } from "@/lib/seo/og-fonts";

const iconSizes = [32, 192, 512] as const;

export function generateImageMetadata() {
  return iconSizes.map((side) => ({
    id: String(side),
    size: { width: side, height: side },
    contentType: "image/png",
  }));
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const [iconId, fonts] = await Promise.all([id, loadOgFonts()]);
  const side = Number(iconId);
  return new ImageResponse(<LogoMark size={side} />, { width: side, height: side, fonts });
}
