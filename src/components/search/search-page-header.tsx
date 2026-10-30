import { PageTitle } from "@/components/ui/page-title";

export function SearchPageHeader({ title, intro }: { title: string; intro: string }) {
  return (
    <header className="flex flex-col gap-3">
      <PageTitle>{title}</PageTitle>
      <p className="max-w-[60ch] text-tinta-2">{intro}</p>
    </header>
  );
}
