import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Building2, Car, House, LandPlot, Store, Tent, Trees } from "lucide-react";
import { Container } from "@/components/layout/container";
import { ListingSheet } from "@/components/listings/listing-card";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataRow } from "@/components/ui/data-row";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Ledger } from "@/components/ui/ledger";
import { Pagination } from "@/components/ui/pagination";
import { PriceTag } from "@/components/ui/price-tag";
import { Radio, RadioGroup } from "@/components/ui/radio";
import { SegmentedControl, type SegmentedOption } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Stamp } from "@/components/ui/stamp";
import { Stepper } from "@/components/ui/stepper";
import { Textarea } from "@/components/ui/textarea";
import { heatingTypes, propertyTypes, reportReasons, stampVariants, type PropertyType } from "@/lib/domain/enums";
import { sbkMunicipalities } from "@/lib/domain/municipalities";
import { formatArea, formatKM } from "@/lib/format";
import type { ListingSummary } from "@/lib/listings/summary";
import { bs } from "@/lib/i18n/bs";
import { demo } from "./demo-content";
import { DialogDemo, LoadingButtonDemo, RemovableTagsDemo, ToastDemo } from "./interactive-demos";
import { PageTitle } from "@/components/ui/page-title";

export const metadata: Metadata = {
  title: demo.title,
  robots: { index: false, follow: false },
};

const colourSwatches = [
  { token: "papir", className: "bg-papir" },
  { token: "papir-2", className: "bg-papir-2" },
  { token: "papir-3", className: "bg-papir-3" },
  { token: "linija", className: "bg-linija" },
  { token: "tinta", className: "bg-tinta" },
  { token: "tinta-2", className: "bg-tinta-2" },
  { token: "tinta-3", className: "bg-tinta-3" },
  { token: "crijep", className: "bg-crijep" },
  { token: "crijep-tamni", className: "bg-crijep-tamni" },
  { token: "vranica", className: "bg-vranica" },
  { token: "vrbas", className: "bg-vrbas" },
  { token: "greska", className: "bg-greska" },
  { token: "upozorenje", className: "bg-upozorenje" },
  { token: "na-crijep", className: "bg-na-crijep" },
] as const;

const typeSamples = [
  { token: "text-display", className: "font-display text-display", sample: demo.typography.display },
  { token: "text-h1", className: "font-display text-h1", sample: demo.typography.h1 },
  { token: "text-h2", className: "font-display text-h2", sample: demo.typography.h2 },
  { token: "text-h3", className: "font-display text-h3", sample: demo.typography.h3 },
  { token: "text-body", className: "text-body", sample: demo.typography.body },
  { token: "text-small", className: "text-small text-tinta-2", sample: demo.typography.small },
  { token: "text-label", className: "text-label text-tinta-2 uppercase", sample: demo.typography.label },
  { token: "text-price", className: "font-mono text-price text-crijep", sample: demo.typography.price },
  { token: "text-mono", className: "font-mono text-mono", sample: demo.typography.mono },
] as const;

const typeIconProps = { "aria-hidden": true, size: 18, strokeWidth: 1.5 } as const;

const propertyTypeIcons: Record<PropertyType, ReactNode> = {
  stan: <Building2 {...typeIconProps} />,
  kuca: <House {...typeIconProps} />,
  plac: <LandPlot {...typeIconProps} />,
  poljoprivredno: <Trees {...typeIconProps} />,
  vikendica: <Tent {...typeIconProps} />,
  poslovni_prostor: <Store {...typeIconProps} />,
  garaza: <Car {...typeIconProps} />,
};

const propertyTypeOptions: readonly SegmentedOption<PropertyType>[] = propertyTypes.map((type) => ({
  value: type,
  label: bs.enums.propertyType[type],
  icon: propertyTypeIcons[type],
}));

const viewOptions: readonly SegmentedOption<"grid" | "map">[] = [
  { value: "grid", label: demo.segmented.grid },
  { value: "map", label: demo.segmented.map },
];

const municipalityOptions = sbkMunicipalities.map((municipality) => ({
  value: municipality.slug,
  label: municipality.name,
}));

const demoCards: ListingSummary[] = demo.cards.map((card) => ({
  ...card,
  publicLat: null,
  publicLng: null,
  locationPrecise: false,
  municipalitySlug: null,
  coverUrl: null,
  path: "/dizajn",
  isNew: card.publishedAt === null,
}));

const heatingOptions = heatingTypes.map((type) => ({ value: type, label: bs.enums.heating[type] }));

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-14">
      <h2 className="mb-6 border-t-2 border-t-tinta pt-3 font-display text-h2">{title}</h2>
      {children}
    </section>
  );
}

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-label text-tinta-2">{label}</p>
      {children}
    </div>
  );
}

export default function DesignPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <Container className="py-10">
      <PageTitle>{demo.title}</PageTitle>
      <p className="mt-3 max-w-[60ch] text-tinta-2">{demo.intro}</p>

      <Section title={demo.sections.colours}>
        <div className="grid grid-cols-2 gap-px border bg-linija sm:grid-cols-4 lg:grid-cols-7">
          {colourSwatches.map((swatch) => (
            <div key={swatch.token} className="bg-papir p-3">
              <div className={`mb-2 h-14 border ${swatch.className}`} />
              <p className="font-mono text-label">{swatch.token}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title={demo.sections.typography}>
        <div className="border-t">
          {typeSamples.map((type) => (
            <div key={type.token} className="grid gap-2 border-b py-4 md:grid-cols-[160px_1fr] md:items-baseline md:gap-6">
              <p className="font-mono text-label text-tinta-2">{type.token}</p>
              <p className={type.className}>{type.sample}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title={demo.sections.buttons}>
        <div className="flex flex-col gap-6">
          <Specimen label="variant">
            <div className="flex flex-wrap items-center gap-3">
              <Button>{demo.buttons.publish}</Button>
              <Button variant="secondary">{demo.buttons.saveDraft}</Button>
              <Button variant="ghost">{demo.buttons.cancel}</Button>
              <Button variant="danger">{demo.buttons.remove}</Button>
            </div>
          </Specimen>
          <Specimen label="size: sm · md · lg">
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">{demo.buttons.sizeSmall}</Button>
              <Button size="md">{demo.buttons.sizeMedium}</Button>
              <Button size="lg">{demo.buttons.sizeLarge}</Button>
            </div>
          </Specimen>
          <Specimen label="disabled · loading">
            <div className="flex flex-wrap items-center gap-3">
              <Button disabled>{demo.buttons.disabled}</Button>
              <Button variant="secondary" disabled>
                {demo.buttons.disabled}
              </Button>
              <Button loading>{demo.buttons.publish}</Button>
              <LoadingButtonDemo />
            </div>
          </Specimen>
        </div>
      </Section>

      <Section title={demo.sections.fields}>
        <form className="grid gap-6 md:grid-cols-2">
          <Input label={demo.fields.title} placeholder={demo.fields.titlePlaceholder} />
          <Input label={demo.fields.price} inputMode="numeric" defaultValue="185.000" unit="KM" />
          <Input label={demo.fields.area} inputMode="decimal" defaultValue="84,5" unit="m²" />
          <Input label={demo.fields.phone} type="tel" autoComplete="tel" defaultValue="+387 61 234 567" helper={demo.fields.helperPhone} />
          <Input label={demo.fields.password} type="password" autoComplete="current-password" defaultValue="abc" error={demo.fields.passwordError} />
          <Input label={demo.fields.disabled} defaultValue={demo.fields.disabledValue} disabled />
          <Select
            label={demo.fields.municipality}
            placeholder={demo.fields.municipalityPlaceholder}
            options={municipalityOptions}
            defaultValue=""
          />
          <Select label={demo.fields.heating} options={heatingOptions} defaultValue="" placeholder="—" error={demo.fields.heatingError} />
          <Textarea
            label={demo.fields.description}
            placeholder={demo.fields.descriptionPlaceholder}
            fieldClassName="md:col-span-2"
          />
        </form>
      </Section>

      <Section title={demo.sections.choices}>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <Checkbox label={demo.choices.registered} defaultChecked />
            <Checkbox label={demo.choices.preciseLocation} helper={demo.choices.preciseLocationHelper} />
            <Checkbox label={demo.choices.disabled} disabled />
            <Checkbox label={demo.choices.disabled} disabled defaultChecked />
            <Checkbox label={demo.choices.terms} error={demo.choices.termsError} />
          </div>
          <RadioGroup legend={demo.choices.reasonLegend}>
            {reportReasons.map((reason, index) => (
              <Radio
                key={reason}
                name="report-reason"
                value={reason}
                label={bs.enums.reportReason[reason]}
                defaultChecked={index === 0}
                disabled={reason === "ostalo"}
              />
            ))}
          </RadioGroup>
        </div>
      </Section>

      <Section title={demo.sections.segmented}>
        <div className="flex flex-col gap-6">
          <div className="overflow-x-auto">
            <SegmentedControl
              name="demo-property-type"
              legend={demo.segmented.propertyType}
              options={propertyTypeOptions}
              defaultValue="kuca"
            />
          </div>
          <SegmentedControl name="demo-view" legend={demo.segmented.view} options={viewOptions} defaultValue="grid" />
        </div>
      </Section>

      <Section title={demo.sections.tags}>
        <RemovableTagsDemo />
      </Section>

      <Section title={demo.sections.stamps}>
        <div className="flex flex-wrap items-center gap-6">
          {stampVariants.map((variant) => (
            <Stamp key={variant} variant={variant} />
          ))}
        </div>
      </Section>

      <Section title={demo.sections.ledger}>
        <div className="grid gap-8 md:grid-cols-2">
          <Ledger title={demo.ledger.basic}>
            <DataRow label={demo.ledger.area} value={formatArea(140)} />
            <DataRow label={demo.ledger.landArea} value={formatArea(620)} />
            <DataRow label={demo.ledger.rooms} value="5" />
            <DataRow label={demo.ledger.yearBuilt} value="2008." />
            <DataRow label={demo.ledger.heating} value={bs.enums.heating.centralno} />
            <DataRow label={demo.ledger.registered} value={bs.common.yes} tone="positive" />
            <DataRow label={demo.ledger.usagePermit} value={bs.common.no} tone="negative" />
            <DataRow label={demo.ledger.pricePerSquareMetre} value={formatKM(1321)} />
          </Ledger>
        </div>
      </Section>

      <Section title={demo.sections.prices}>
        <div className="flex flex-wrap gap-12">
          <Specimen label="priceKm">
            <PriceTag priceKm={142500} />
          </Specimen>
          <Specimen label="priceKm + areaM2">
            <PriceTag priceKm={185000} areaM2={140} />
          </Specimen>
          <Specimen label="negotiable">
            <PriceTag priceKm={48000} negotiable />
          </Specimen>
          <Specimen label="priceKm: null">
            <PriceTag priceKm={null} negotiable />
          </Specimen>
        </div>
      </Section>

      <Section title={demo.sections.overlays}>
        <div className="flex flex-col gap-6">
          <Specimen label="Dialog">
            <div>
              <DialogDemo />
            </div>
          </Specimen>
          <Specimen label="Toast">
            <ToastDemo />
          </Specimen>
        </div>
      </Section>

      <Section title={demo.sections.loading}>
        <div className="grid gap-8 md:grid-cols-2">
          <Specimen label="Skeleton">
            <div className="flex flex-col gap-3">
              <Skeleton className="aspect-4/3 w-full" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
            </div>
          </Specimen>
          <Specimen label="EmptyState">
            <EmptyState
              title={demo.loading.emptyTitle}
              description={demo.loading.emptyDescription}
              action={<Button variant="secondary">{demo.loading.emptyAction}</Button>}
            />
          </Specimen>
        </div>
      </Section>

      <Section title={demo.sections.pagination}>
        <div className="flex flex-col gap-6">
          <Pagination page={1} pageSize={24} totalItems={312} hrefForPage={(page) => `/dizajn?stranica=${page}`} />
          <Pagination page={7} pageSize={24} totalItems={312} hrefForPage={(page) => `/dizajn?stranica=${page}`} />
          <Pagination page={13} pageSize={24} totalItems={312} hrefForPage={(page) => `/dizajn?stranica=${page}`} />
          <Pagination page={1} pageSize={24} totalItems={9} hrefForPage={(page) => `/dizajn?stranica=${page}`} />
        </div>
      </Section>

      <Section title={demo.sections.stepper}>
        <div className="flex flex-col gap-6">
          <Stepper steps={demo.stepper} currentIndex={0} />
          <Stepper steps={demo.stepper} currentIndex={2} />
          <Stepper steps={demo.stepper} currentIndex={4} />
        </div>
      </Section>

      <Section title={demo.sections.cards}>
        <ListingSheet listings={demoCards} />
      </Section>

      <Section title={demo.sections.theme}>
        <div className="flex flex-wrap items-start gap-12">
          <Specimen label={demo.theme.compact}>
            <ThemeSwitcher name="theme-demo-compact" />
          </Specimen>
          <Specimen label={demo.theme.labelled}>
            <ThemeSwitcher name="theme-demo-labelled" labelled />
          </Specimen>
        </div>
      </Section>
    </Container>
  );
}
