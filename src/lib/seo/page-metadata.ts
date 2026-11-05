import type { Metadata } from "next";
import { bs } from "@/lib/i18n/bs";

export const defaultOpenGraph = {
  siteName: bs.site.name,
  locale: "bs_BA",
  type: "website",
} as const;

export function publicPageMetadata({
  title,
  description,
  path,
}: {
  title: Metadata["title"];
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { ...defaultOpenGraph, description, url: path },
  };
}
