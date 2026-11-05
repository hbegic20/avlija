"use client";

import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { cn } from "@/lib/cn";
import { bs } from "@/lib/i18n/bs";
import { listingsBasePath } from "@/lib/search/filters";

export type CantonMapShape = {
  slug: string;
  name: string;
  path: string;
  labelX: number;
  labelY: number;
  count: number;
};

const desktopQuery = "(min-width: 768px)";
const maxSingleLineLabel = 14;
const labelLineHeightEm = 1.2;

function labelLines(name: string): string[] {
  const hyphen = name.indexOf("-");
  if (name.length <= maxSingleLineLabel || hyphen === -1) {
    return [name];
  }
  return [name.slice(0, hyphen + 1), name.slice(hyphen + 1)];
}

export function CantonMap({
  viewBox,
  shapes,
  selectedSlug,
  onSelect,
  className,
}: {
  viewBox: string;
  shapes: CantonMapShape[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
  className?: string;
}) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const handleClick = (event: MouseEvent<Element>, slug: string) => {
    const isPointerClick = event.detail > 0;
    if (isPointerClick && window.matchMedia(desktopQuery).matches) {
      event.preventDefault();
      onSelect(selectedSlug === slug ? "" : slug);
    }
  };

  return (
    <figure className={cn("flex w-full max-w-[460px] flex-col gap-2 lg:max-w-none", className)}>
      <svg viewBox={viewBox} role="group" aria-label={bs.home.mapTitle} className="h-auto w-full border bg-papir">
        <defs>
          <pattern id="canton-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="10" className="stroke-papir-3" strokeWidth="2" />
          </pattern>
        </defs>
        {shapes.map((shape) => {
          const selected = shape.slug === selectedSlug;
          return (
            <Link
              key={shape.slug}
              href={`${listingsBasePath}/${shape.slug}`}
              aria-label={bs.municipalityCount(shape.name, shape.count)}
              aria-current={selected ? "true" : undefined}
              onClick={(event) => handleClick(event, shape.slug)}
              onMouseEnter={() => setActiveSlug(shape.slug)}
              onMouseLeave={() => setActiveSlug(null)}
              onFocus={() => setActiveSlug(shape.slug)}
              onBlur={() => setActiveSlug(null)}
              className="group outline-none"
            >
              <path
                d={shape.path}
                className={cn(
                  "fill-[url(#canton-hatch)] stroke-tinta-3 transition-colors [stroke-width:1.5] [vector-effect:non-scaling-stroke]",
                  "group-hover:fill-crijep/16 group-hover:stroke-crijep",
                  "group-focus-visible:fill-crijep/16 group-focus-visible:stroke-vranica group-focus-visible:[stroke-width:3]",
                  selected && "fill-crijep/16 stroke-crijep",
                )}
              />
            </Link>
          );
        })}
        {shapes.map((shape) => {
          const selected = shape.slug === selectedSlug;
          const showCount = selected || shape.slug === activeSlug;
          const lines = labelLines(shape.name);
          return (
            <g key={`label-${shape.slug}`} className="pointer-events-none" aria-hidden="true">
              <text
                x={shape.labelX}
                y={shape.labelY}
                textAnchor="middle"
                className={cn(
                  "fill-tinta-2 font-mono text-[28px] tracking-[0.06em] uppercase md:text-[22px] lg:text-[20px]",
                  selected && "fill-crijep font-semibold",
                )}
              >
                {lines.map((line, index) => (
                  <tspan key={line} x={shape.labelX} dy={index === 0 ? 0 : `${labelLineHeightEm}em`}>
                    {line}
                  </tspan>
                ))}
              </text>
              <text
                x={shape.labelX}
                y={shape.labelY}
                dy={`${lines.length * labelLineHeightEm + 0.2}em`}
                textAnchor="middle"
                className={cn(
                  "fill-crijep font-mono text-[26px] font-semibold md:text-[20px] lg:text-[18px]",
                  showCount ? "opacity-100" : "opacity-0",
                )}
              >
                {shape.count}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="text-small text-tinta-2">{bs.home.mapHint}</figcaption>
    </figure>
  );
}
