"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { signOut } from "@/actions/auth";
import { cn } from "@/lib/cn";
import { bs } from "@/lib/i18n/bs";
import { accountLinks, adminLink, type HeaderUser } from "./account-links";
import { Avatar } from "./avatar";

const itemClasses =
  "flex w-full items-center gap-2 px-4 py-2.5 text-left text-small text-tinta transition-colors hover:bg-papir-2";

export function AccountMenu({ user }: { user: HeaderUser }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={bs.account.openMenu(user.fullName)}
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 items-center gap-2 rounded-xs px-1.5 text-tinta transition-colors hover:bg-papir-2"
      >
        <Avatar fullName={user.fullName} initials={user.initials} avatarUrl={user.avatarUrl} />
        <ChevronDown aria-hidden="true" size={18} strokeWidth={1.5} className={cn(open && "rotate-180")} />
      </button>
      <div
        id={menuId}
        hidden={!open}
        className="absolute top-full right-0 z-40 mt-2 w-64 border border-t-2 border-t-tinta bg-papir"
      >
        <p className="truncate border-b px-4 py-3 font-display text-h3">{user.fullName}</p>
        <nav aria-label={bs.account.menu}>
          <ul className="py-1">
            {[...accountLinks, ...(user.isAdmin ? [adminLink] : [])].map((link) => (
              <li key={link.href}>
                <Link href={link.href} onClick={() => setOpen(false)} className={itemClasses}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <form action={signOut} className="border-t py-1">
          <button type="submit" className={itemClasses}>
            <LogOut aria-hidden="true" size={18} strokeWidth={1.5} />
            {bs.account.signOut}
          </button>
        </form>
      </div>
    </div>
  );
}
