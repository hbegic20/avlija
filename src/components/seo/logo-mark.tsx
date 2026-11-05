import { logoMarkGeometry } from "@/lib/brand/logo-mark";
import { ogColours as c } from "@/lib/seo/og-fonts";

export function OgLogoMark({ size }: { size: number }) {
  return (
    <div
      style={{
        display: "flex",
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        background: c.tinta,
      }}
    >
      <div
        style={{
          display: "flex",
          fontFamily: "Fraunces",
          lineHeight: 1,
          color: c.papir,
          ...logoMarkGeometry(size),
        }}
      >
        A<span style={{ color: c.crijep }}>.</span>
      </div>
    </div>
  );
}
