import { ogColours as c } from "@/lib/seo/og-fonts";

const glyphScale = 0.74;
const baselineNudge = 0.05;

export function LogoMark({ size }: { size: number }) {
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
          fontSize: size * glyphScale,
          lineHeight: 1,
          letterSpacing: -size * 0.02,
          color: c.papir,
          marginTop: size * baselineNudge,
        }}
      >
        A<span style={{ color: c.crijep }}>.</span>
      </div>
    </div>
  );
}
