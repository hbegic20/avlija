"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { propertyTypes } from "@/lib/domain/enums";
import { bs } from "@/lib/i18n/bs";
import { listingsBasePath, searchParamNames as names } from "@/lib/search/filters";
import { CantonMap, type CantonMapShape } from "./canton-map";

export function HomeSearch({ viewBox, shapes }: { viewBox: string; shapes: CantonMapShape[] }) {
  const router = useRouter();
  const [municipality, setMunicipality] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    for (const [name, value] of new FormData(event.currentTarget)) {
      if (typeof value === "string" && value.trim() !== "") {
        params.append(name, value.trim());
      }
    }
    const query = params.toString();
    router.push(query ? `${listingsBasePath}?${query}` : listingsBasePath);
  };

  return (
    <section className="grid gap-8 py-10 md:py-14 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-12">
      <div className="flex flex-col gap-4">
        <p className="text-label text-tinta-2 uppercase">{bs.home.eyebrow}</p>
        <h1 className="font-display text-display">{bs.home.title}</h1>
        <p className="max-w-[46ch] text-tinta-2">{bs.home.intro}</p>
        <form
          action={listingsBasePath}
          method="get"
          onSubmit={submit}
          aria-label={bs.home.searchLabel}
          className="mt-2 grid gap-3 border bg-papir-2 p-5 sm:grid-cols-2"
        >
          <Select
            label={bs.search.municipality}
            name={names.municipality}
            placeholder={bs.home.anyMunicipality}
            options={shapes.map((shape) => ({ value: shape.slug, label: shape.name }))}
            value={municipality}
            onChange={(event) => setMunicipality(event.target.value)}
          />
          <Select
            label={bs.search.type}
            name={names.type}
            placeholder={bs.home.anyType}
            options={propertyTypes.map((type) => ({ value: type, label: bs.enums.propertyType[type] }))}
            defaultValue=""
          />
          <Input label={bs.home.priceTo} name={names.priceTo} inputMode="numeric" unit="KM" />
          <Button type="submit" size="lg" className="self-end">
            {bs.home.search}
          </Button>
        </form>
      </div>
      <CantonMap viewBox={viewBox} shapes={shapes} selectedSlug={municipality} onSelect={setMunicipality} />
    </section>
  );
}
