export function SearchPageHeader({ title, intro }: { title: string; intro: string }) {
  return (
    <header className="flex flex-col gap-3">
      <h1 className="border-t-2 border-t-tinta pt-3 font-display text-h1">{title}</h1>
      <p className="max-w-[60ch] text-tinta-2">{intro}</p>
    </header>
  );
}
