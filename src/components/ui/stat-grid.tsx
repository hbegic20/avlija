import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatInteger } from "@/lib/format";

export type StatLink = { label: string; value: number; href: string };

export function StatGrid({ stats, className }: { stats: readonly StatLink[]; className?: string }) {
  return (
    <ul className={cn("grid grid-cols-2 border-t border-l", className)}>
      {stats.map((stat) => (
        <li key={stat.label} className="border-r border-b">
          <Link href={stat.href} className="flex h-full flex-col gap-1 bg-papir p-5 transition-colors hover:bg-papir-2">
            <span className="text-label text-tinta-2 uppercase">{stat.label}</span>
            <span className="font-mono text-price text-tinta">{formatInteger(stat.value)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
