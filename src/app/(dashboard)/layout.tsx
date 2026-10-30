import { Container } from "@/components/layout/container";
import { Suspense } from "react";
import { FavoritesLoader } from "@/components/favorites/favorites-loader";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function DashboardLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main id="sadrzaj" className="flex-1">
        <Container className="py-10">{children}</Container>
      </main>
      <SiteFooter />
      <Suspense fallback={null}>
        <FavoritesLoader />
      </Suspense>
    </>
  );
}
