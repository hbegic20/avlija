import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatInteger } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";

type PageItem = number | "gap";

const siblingCount = 1;

function pageItems(current: number, total: number): PageItem[] {
  const pages = new Set<number>([1, total]);
  for (let page = current - siblingCount; page <= current + siblingCount; page += 1) {
    if (page >= 1 && page <= total) {
      pages.add(page);
    }
  }
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((page, index) => {
    const previous = sorted[index - 1];
    if (previous === undefined || page - previous === 1) {
      return [page];
    }
    if (page - previous === 2) {
      return [previous + 1, page];
    }
    return ["gap" as const, page];
  });
}

const cellClasses =
  "flex h-10 min-w-10 items-center justify-center border-r px-2 font-mono text-mono last:border-r-0";

function PageLink({
  href,
  label,
  current = false,
  children,
}: {
  href: string | null;
  label: string;
  current?: boolean;
  children: ReactNode;
}) {
  if (current) {
    return (
      <span aria-current="page" aria-label={label} className={cn(cellClasses, "bg-tinta text-papir")}>
        {children}
      </span>
    );
  }
  if (href === null) {
    return (
      <span aria-hidden="true" className={cn(cellClasses, "text-tinta-3")}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} className={cn(cellClasses, "text-tinta transition-colors hover:bg-papir-2")}>
      {children}
    </Link>
  );
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  hrefForPage,
  className,
}: {
  page: number;
  pageSize: number;
  totalItems: number;
  hrefForPage: (page: number) => string;
  className?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-4", className)}>
      <p className="font-mono text-mono text-tinta-2">
        {bs.pagination.showing(formatInteger(from), formatInteger(to), formatInteger(totalItems))}
      </p>
      {totalPages > 1 ? (
        <nav aria-label={bs.pagination.label} className="flex rounded-xs border">
          <PageLink href={page > 1 ? hrefForPage(page - 1) : null} label={bs.pagination.previous}>
            <ChevronLeft aria-hidden="true" size={18} strokeWidth={1.5} />
          </PageLink>
          {pageItems(page, totalPages).map((item, index) =>
            item === "gap" ? (
              <span key={`gap-${index}`} aria-hidden="true" className={cn(cellClasses, "text-tinta-2")}>
                …
              </span>
            ) : (
              <PageLink
                key={item}
                href={hrefForPage(item)}
                label={bs.pagination.page(item)}
                current={item === page}
              >
                {item}
              </PageLink>
            ),
          )}
          <PageLink href={page < totalPages ? hrefForPage(page + 1) : null} label={bs.pagination.next}>
            <ChevronRight aria-hidden="true" size={18} strokeWidth={1.5} />
          </PageLink>
        </nav>
      ) : null}
    </div>
  );
}
