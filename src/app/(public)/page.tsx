import Link from "next/link";
import { Container } from "@/components/layout/container";
import { routes } from "@/components/layout/routes";
import { HomeSearch } from "@/components/home/home-search";
import { MunicipalityGrid } from "@/components/home/municipality-grid";
import { SectionHeading } from "@/components/home/section-heading";
import { ListingSheet } from "@/components/listings/listing-card";
import { buttonStyles } from "@/components/ui/button";
import { cantonSvg } from "@/lib/geo/canton-svg";
import { bs } from "@/lib/i18n/bs";
import { listingsBasePath } from "@/lib/search/filters";
import { latestListings, municipalitiesWithCounts } from "@/lib/search/queries";

export default async function HomePage() {
  const [latest, municipalities] = await Promise.all([latestListings(8), municipalitiesWithCounts()]);
  const countBySlug = new Map(municipalities.map((municipality) => [municipality.slug, municipality.activeCount]));
  const shapes = cantonSvg.shapes.map((shape) => ({ ...shape, count: countBySlug.get(shape.slug) ?? 0 }));

  return (
    <Container>
      <HomeSearch viewBox={cantonSvg.viewBox} shapes={shapes} />

      <section className="mt-6">
        <SectionHeading title={bs.home.latest} linkHref={listingsBasePath} linkLabel={bs.home.allListings} />
        {latest.length > 0 ? (
          <ListingSheet listings={latest} priorityCount={4} />
        ) : (
          <p className="hatch border p-6">
            <span className="bg-papir px-2 py-1 text-tinta-2">{bs.home.noListingsYet}</span>
          </p>
        )}
      </section>

      <section className="mt-16">
        <SectionHeading title={bs.home.municipalitiesTitle} />
        <MunicipalityGrid municipalities={municipalities} />
      </section>

      <section className="mt-16 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <SectionHeading title={bs.home.howTitle} />
          <ol className="grid border-t border-l sm:grid-cols-3">
            {bs.home.howSteps.map((step, index) => (
              <li key={step.title} className="flex flex-col gap-2 border-r border-b bg-papir p-5">
                <span className="font-mono text-mono text-crijep">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="font-display text-h3">{step.title}</h3>
                <p className="text-small text-tinta-2">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
        <aside className="flex flex-col items-start gap-4 self-end border border-t-2 border-t-tinta bg-papir-2 p-6">
          <h2 className="font-display text-h2">{bs.home.sellerTitle}</h2>
          <p className="text-tinta-2">{bs.home.sellerText}</p>
          <Link href={routes.newListing} className={buttonStyles({ size: "lg" })}>
            {bs.home.sellerAction}
          </Link>
        </aside>
      </section>
    </Container>
  );
}
