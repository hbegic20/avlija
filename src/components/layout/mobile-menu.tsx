"use client";

import Link from "next/link";
import { useRef } from "react";
import { Menu, X } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { bs } from "@/lib/i18n/bs";
import { routes } from "./routes";

const iconButtonClasses =
  "inline-flex size-10 items-center justify-center rounded-xs border border-tinta text-tinta transition-colors hover:bg-papir-2";

const menuLinkClasses = "block border-b py-3 font-display text-h3 text-tinta hover:underline";

export function MobileMenu() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label={bs.nav.openMenu}
        aria-haspopup="dialog"
        className={iconButtonClasses}
      >
        <Menu aria-hidden="true" size={20} strokeWidth={1.5} />
      </button>
      <dialog
        ref={dialogRef}
        aria-label={bs.nav.menu}
        className={cn(
          "m-0 h-dvh max-h-none w-full max-w-none border-t-2 border-t-tinta bg-papir p-0 text-tinta",
          "opacity-0 transition-opacity duration-180 ease-paper open:opacity-100 starting:open:opacity-0",
          "backdrop:bg-tinta/40",
        )}
      >
        <div className="flex h-full flex-col gap-8 px-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-label text-tinta-2 uppercase">{bs.nav.menu}</span>
            <button type="button" onClick={close} aria-label={bs.nav.closeMenu} className={iconButtonClasses}>
              <X aria-hidden="true" size={20} strokeWidth={1.5} />
            </button>
          </div>
          <nav aria-label={bs.nav.main}>
            <ul className="border-t">
              <li>
                <Link href={routes.listings} onClick={close} className={menuLinkClasses}>
                  {bs.nav.listings}
                </Link>
              </li>
              <li>
                <Link href={routes.login} onClick={close} className={menuLinkClasses}>
                  {bs.nav.login}
                </Link>
              </li>
            </ul>
          </nav>
          <ThemeSwitcher name="theme-mobile" labelled />
          <Link href={routes.newListing} onClick={close} className={buttonStyles({ size: "lg", className: "mt-auto" })}>
            {bs.nav.publish}
          </Link>
        </div>
      </dialog>
    </>
  );
}
