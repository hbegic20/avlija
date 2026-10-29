import { formatCoordinates } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";
import { Container } from "./container";

export function CoordinatesStrip({ name, lat, lng }: { name: string; lat: number; lng: number }) {
  return (
    <div className="border-t-2 border-b border-t-tinta">
      <Container>
        <p className="truncate py-2 font-mono text-label tracking-[0.08em] text-tinta-2 uppercase">
          {formatCoordinates(lat, lng)} · {name} · {bs.site.region}
        </p>
      </Container>
    </div>
  );
}
