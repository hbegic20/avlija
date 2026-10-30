import type { Metadata } from "next";
import Link from "next/link";
import { ReportActions } from "@/components/admin/report-actions";
import { DataRow } from "@/components/ui/data-row";
import { adminRoutes } from "@/lib/admin/routes";
import { cn } from "@/lib/cn";
import { reportStatuses, type ReportReason, type ReportStatus } from "@/lib/domain/enums";
import { formatDate, formatListingNumber } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";
import { listingPath } from "@/lib/listings/listing-path";
import { createClient } from "@/lib/supabase/server";
import { HatchNotice } from "@/components/ui/hatch-notice";

export const instant = false;

export const metadata: Metadata = { title: bs.admin.reports.title };

const text = bs.admin.reports;

type ReportRow = {
  id: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  created_at: string;
  listing: { id: string; number: number; title: string; status: keyof typeof bs.enums.listingStatus } | null;
  reporter: { full_name: string } | null;
};

function parseStatus(value: string | string[] | undefined): ReportStatus {
  const raw = Array.isArray(value) ? value[0] : value;
  return (reportStatuses as readonly string[]).includes(raw ?? "") ? (raw as ReportStatus) : "open";
}

export default async function AdminReportsPage({ searchParams }: PageProps<"/admin/prijave">) {
  const status = parseStatus((await searchParams).status);
  const supabase = await createClient();
  const { data } = await supabase
    .from("reports")
    .select(
      "id, reason, details, status, created_at, listing:listings(id, number, title, status), reporter:profiles!reports_reporter_id_fkey(full_name)",
    )
    .eq("status", status)
    .order("created_at", { ascending: status !== "open" ? false : true })
    .limit(100);
  const reports = (data ?? []) as unknown as ReportRow[];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-h1">{text.title}</h1>
      <nav aria-label={text.title}>
        <ul className="flex gap-2">
          {reportStatuses.map((entry) => (
            <li key={entry}>
              <Link
                href={`${adminRoutes.reports}?status=${entry}`}
                aria-current={entry === status ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center rounded-xs border px-3 text-small font-medium",
                  entry === status ? "border-tinta bg-tinta text-papir" : "border-tinta text-tinta hover:bg-papir-2",
                )}
              >
                {bs.enums.reportStatus[entry]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {reports.length === 0 ? (
        <HatchNotice>{text.empty}</HatchNotice>
      ) : (
        <ul className="divide-y border">
          {reports.map((report) => (
            <li key={report.id} className="grid gap-4 bg-papir p-5 lg:grid-cols-[1fr_auto] lg:items-start">
              <div className="flex min-w-0 flex-col gap-3">
                {report.listing ? (
                  <Link
                    href={listingPath(report.listing.number, report.listing.title)}
                    className="flex flex-col gap-1 underline-offset-3 hover:underline"
                  >
                    <span className="font-mono text-label text-tinta-2">{formatListingNumber(report.listing.number)}</span>
                    <span className="font-display text-h3">{report.listing.title}</span>
                  </Link>
                ) : (
                  <p className="text-tinta-2">{text.listingGone}</p>
                )}
                <dl className="grid max-w-xl gap-x-6 sm:grid-cols-2">
                  <DataRow label={text.reason} value={bs.enums.reportReason[report.reason]} />
                  <DataRow label={text.received} value={formatDate(report.created_at)} />
                  <DataRow label={text.reporter} value={report.reporter?.full_name ?? text.reporterDeleted} />
                  {report.listing ? (
                    <DataRow label={text.listingStatus} value={bs.enums.listingStatus[report.listing.status]} />
                  ) : null}
                </dl>
                {report.details ? (
                  <p className="max-w-[70ch] border-l-2 border-l-linija pl-3 text-small whitespace-pre-line text-tinta-2">
                    {report.details}
                  </p>
                ) : null}
              </div>
              {report.status === "open" ? (
                <ReportActions
                  reportId={report.id}
                  listingId={report.listing?.id ?? null}
                  listingNumber={report.listing ? formatListingNumber(report.listing.number) : ""}
                  canHide={report.listing?.status === "active" || report.listing?.status === "sold"}
                  defaultReason={bs.enums.reportReason[report.reason]}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
