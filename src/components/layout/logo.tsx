import Link from "next/link";
import { bs } from "@/lib/i18n/bs";
import { routes } from "./routes";

export function Logo() {
  return (
    <Link
      href={routes.home}
      aria-label={bs.nav.home}
      className="font-display text-h2 font-semibold tracking-[-0.02em] text-tinta"
    >
      {bs.site.name}
      <span className="text-crijep">.</span>
    </Link>
  );
}
