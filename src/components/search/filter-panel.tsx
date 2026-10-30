"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, type FormEvent, type ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { listingFeatures, propertyTypes } from "@/lib/domain/enums";
import { sbkMunicipalities } from "@/lib/domain/municipalities";
import { cn } from "@/lib/cn";
import { formatInteger } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";
import { searchBasePath, searchParamNames as names, type SearchFilters } from "@/lib/search/filters";

const text = bs.search;
const roomOptions = [1, 2, 3, 4, 5].map((rooms) => ({ value: String(rooms), label: `${rooms}+` }));

function Group({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <fieldset className={cn("flex flex-col gap-3 border-t pt-4", className)}>
      <legend className="float-left mb-1 w-full text-label text-tinta-2 uppercase">{title}</legend>
      {children}
    </fieldset>
  );
}

function RangeInputs({
  fromName,
  toName,
  fromValue,
  toValue,
  unit,
  label,
}: {
  fromName: string;
  toName: string;
  fromValue: number | null;
  toValue: number | null;
  unit: string;
  label: string;
}) {
  const display = (value: number | null) => (value === null ? "" : formatInteger(value));
  return (
    <div className="grid grid-cols-2 gap-2">
      <Input
        name={fromName}
        inputMode="numeric"
        unit={unit}
        defaultValue={display(fromValue)}
        aria-label={`${label} ${text.from}`}
        placeholder={text.from}
      />
      <Input
        name={toName}
        inputMode="numeric"
        unit={unit}
        defaultValue={display(toValue)}
        aria-label={`${label} ${text.to}`}
        placeholder={text.to}
      />
    </div>
  );
}

function FilterFields({ filters, fixedMunicipality }: { filters: SearchFilters; fixedMunicipality?: string }) {
  return (
    <div className="flex flex-col gap-5">
      <Input
        label={text.query}
        name={names.query}
        type="search"
        defaultValue={filters.query}
        placeholder={text.queryPlaceholder}
        maxLength={100}
      />
      {fixedMunicipality ? null : (
        <Group title={text.municipality}>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 lg:grid-cols-1">
            {sbkMunicipalities.map((municipality) => (
              <Checkbox
                key={municipality.slug}
                name={names.municipality}
                value={municipality.slug}
                label={municipality.name}
                defaultChecked={filters.municipalities.includes(municipality.slug)}
              />
            ))}
          </div>
        </Group>
      )}
      <Group title={text.type}>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 lg:grid-cols-1">
          {propertyTypes.map((type) => (
            <Checkbox
              key={type}
              name={names.type}
              value={type}
              label={bs.enums.propertyType[type]}
              defaultChecked={filters.types.includes(type)}
            />
          ))}
        </div>
      </Group>
      <Group title={text.price}>
        <RangeInputs
          fromName={names.priceFrom}
          toName={names.priceTo}
          fromValue={filters.priceFrom}
          toValue={filters.priceTo}
          unit="KM"
          label={text.price}
        />
      </Group>
      <Group title={text.area}>
        <RangeInputs
          fromName={names.areaFrom}
          toName={names.areaTo}
          fromValue={filters.areaFrom}
          toValue={filters.areaTo}
          unit="m²"
          label={text.area}
        />
      </Group>
      <Group title={text.landArea}>
        <RangeInputs
          fromName={names.landFrom}
          toName={names.landTo}
          fromValue={filters.landFrom}
          toValue={filters.landTo}
          unit="m²"
          label={text.landArea}
        />
      </Group>
      <Group title={text.roomsMin}>
        <Select
          name={names.roomsMin}
          aria-label={text.roomsMin}
          placeholder={text.any}
          options={roomOptions}
          defaultValue={filters.roomsMin === null ? "" : String(filters.roomsMin)}
        />
      </Group>
      <Group title={bs.listingForm.details.documents}>
        <Checkbox name={names.registered} value="1" label={text.registeredOnly} defaultChecked={filters.registeredOnly} />
        <Checkbox name={names.includeSold} value="1" label={text.includeSold} defaultChecked={filters.includeSold} />
      </Group>
      <Group title={text.features}>
        <details open={filters.features.length > 0} className="group">
          <summary className="cursor-pointer text-small text-vranica underline underline-offset-3">
            {text.features} ({listingFeatures.length})
          </summary>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 lg:grid-cols-1">
            {listingFeatures.map((feature) => (
              <Checkbox
                key={feature}
                name={names.feature}
                value={feature}
                label={bs.enums.feature[feature]}
                defaultChecked={filters.features.includes(feature)}
              />
            ))}
          </div>
        </details>
      </Group>
      {filters.sort !== "najnovije" ? <input type="hidden" name={names.sort} value={filters.sort} /> : null}
      {filters.view !== "mreza" ? <input type="hidden" name={names.view} value={filters.view} /> : null}
    </div>
  );
}

function useFilterSubmit(fixedMunicipality?: string) {
  const router = useRouter();
  return (event: FormEvent<HTMLFormElement>, afterSubmit?: () => void) => {
    event.preventDefault();
    const params = new URLSearchParams();
    for (const [name, value] of new FormData(event.currentTarget)) {
      if (typeof value === "string" && value.trim() !== "") {
        params.append(name, value.trim());
      }
    }
    const query = params.toString();
    const base = searchBasePath(fixedMunicipality);
    afterSubmit?.();
    router.push(query ? `${base}?${query}` : base);
  };
}

type FilterPanelProps = {
  filters: SearchFilters;
  fixedMunicipality?: string;
  activeCount: number;
  clearHref: string;
};

export function FilterSidebar({ filters, fixedMunicipality, activeCount, clearHref }: FilterPanelProps) {
  const submit = useFilterSubmit(fixedMunicipality);
  const action = searchBasePath(fixedMunicipality);
  const formKey = JSON.stringify(filters);

  return (
    <aside className="hidden lg:block">
      <form
        key={formKey}
        action={action}
        method="get"
        onSubmit={(event) => submit(event)}
        aria-label={text.filters}
        className="sticky top-6 flex max-h-[calc(100dvh-3rem)] flex-col gap-5 overflow-y-auto pr-2 pb-4"
      >
        <FilterFields filters={filters} fixedMunicipality={fixedMunicipality} />
        <div className="flex flex-col gap-2 border-t pt-4">
          <Button type="submit" className="w-full">
            {text.apply}
          </Button>
          {activeCount > 0 ? (
            <Link href={clearHref} className={buttonStyles({ variant: "ghost", size: "sm", className: "-ml-3 self-start" })}>
              {text.clearAll}
            </Link>
          ) : null}
        </div>
      </form>
    </aside>
  );
}

export function FilterSheet({ filters, fixedMunicipality, activeCount, clearHref }: FilterPanelProps) {
  const submit = useFilterSubmit(fixedMunicipality);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const action = searchBasePath(fixedMunicipality);
  const formKey = JSON.stringify(filters);

  return (
    <div className="lg:hidden">
      <Button variant="secondary" onClick={() => dialogRef.current?.showModal()} aria-haspopup="dialog">
        <SlidersHorizontal aria-hidden="true" size={18} strokeWidth={1.5} />
        <span className="font-mono tabular-nums">{text.filtersCount(activeCount)}</span>
      </Button>
      <dialog
        ref={dialogRef}
        aria-label={text.filters}
        className={cn(
          "m-0 h-dvh max-h-none w-full max-w-none border-t-2 border-t-tinta bg-papir p-0 text-tinta",
          "opacity-0 transition-opacity duration-180 ease-paper open:opacity-100 starting:open:opacity-0",
          "backdrop:bg-tinta/40",
        )}
      >
        <form
          key={formKey}
          action={action}
          method="get"
          onSubmit={(event) => submit(event, () => dialogRef.current?.close())}
          className="flex h-full flex-col"
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="font-display text-h3">{text.filters}</h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label={text.close}
              className="inline-flex size-10 items-center justify-center rounded-xs border border-tinta"
            >
              <X aria-hidden="true" size={20} strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-5">
            <FilterFields filters={filters} fixedMunicipality={fixedMunicipality} />
          </div>
          <div className="flex items-center gap-3 border-t px-4 py-3">
            {activeCount > 0 ? (
              <Link href={clearHref} onClick={() => dialogRef.current?.close()} className={buttonStyles({ variant: "secondary" })}>
                {text.clearAll}
              </Link>
            ) : null}
            <Button type="submit" className="flex-1">
              {text.apply}
            </Button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
