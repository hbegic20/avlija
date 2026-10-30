import { ImageResponse } from "next/og";
import { cantonSvg } from "@/lib/geo/canton-svg";
import { bs } from "@/lib/i18n/bs";
import { loadOgFonts, ogColours as c, ogSize } from "@/lib/seo/og-fonts";

export const alt = bs.site.homeTitle;
export const size = ogSize;
export const contentType = "image/png";

export default async function SiteOpenGraphImage() {
  const fonts = await loadOgFonts();
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: c.papir, color: c.tinta }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 620, padding: 64 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24, borderTop: `4px solid ${c.tinta}`, paddingTop: 28 }}>
            <div style={{ display: "flex", fontFamily: "Fraunces", fontSize: 96, letterSpacing: -3 }}>
              {bs.site.name}
              <span style={{ color: c.crijep }}>.</span>
            </div>
            <div style={{ fontFamily: "Fraunces", fontSize: 44, lineHeight: 1.15 }}>{bs.home.title}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontFamily: "Schibsted Grotesk", fontSize: 26, color: c.tinta2 }}>{bs.site.ogTagline}</div>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 20, letterSpacing: 2, color: c.tinta2 }}>
              {bs.home.eyebrow.toUpperCase()}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", borderLeft: `2px solid ${c.linija}`, background: c.papir2 }}>
          <svg viewBox={cantonSvg.viewBox} width={520} height={520}>
            {[...cantonSvg.shapes].sort((a, b) => Number(a.slug === "bugojno") - Number(b.slug === "bugojno")).map((shape) => (
              <path
                key={shape.slug}
                d={shape.path}
                fill={shape.slug === "bugojno" ? "rgba(181,72,43,0.18)" : c.papir}
                stroke={shape.slug === "bugojno" ? c.crijep : c.tinta2}
                strokeWidth={shape.slug === "bugojno" ? 4 : 2}
              />
            ))}
          </svg>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
