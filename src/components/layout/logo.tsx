import Link from "next/link";
import { logoMarkGeometry, siteLogoMarkSize } from "@/lib/brand/logo-mark";
import { bs } from "@/lib/i18n/bs";
import { routes } from "./routes";

const siteLogoMarkStyle = {
  width: siteLogoMarkSize,
  height: siteLogoMarkSize,
  ...logoMarkGeometry(siteLogoMarkSize),
};

function SiteLogoMark() {
  return (
    <span
      aria-hidden="true"
      style={siteLogoMarkStyle}
      className="flex shrink-0 items-center justify-center bg-tinta leading-none text-papir"
    >
      A<span className="text-crijep">.</span>
    </span>
  );
}

export function Logo() {
  return (
    <Link
      href={routes.home}
      aria-label={bs.nav.home}
      className="inline-flex items-center gap-2.5 font-display text-h2 font-semibold tracking-[-0.02em] text-tinta"
    >
      <SiteLogoMark />
      <span>
        {bs.site.name}
        <span className="text-crijep">.</span>
      </span>
    </Link>
  );
}
