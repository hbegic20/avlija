import Link from "next/link";
import { bs } from "@/lib/i18n/bs";
import { routes } from "./routes";

function LogoMark() {
  return (
    <span
      aria-hidden="true"
      className="flex size-9 shrink-0 items-center justify-center bg-tinta pt-1 font-display text-h2 leading-none font-semibold tracking-[-0.02em] text-papir"
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
      className="flex items-center gap-2.5 font-display text-h2 font-semibold tracking-[-0.02em] text-tinta"
    >
      <LogoMark />
      <span>
        {bs.site.name}
        <span className="text-crijep">.</span>
      </span>
    </Link>
  );
}
