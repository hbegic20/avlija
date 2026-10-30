import { Suspense } from "react";
import { FavoritesLoader } from "@/components/favorites/favorites-loader";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main id="sadrzaj" className="flex-1">{children}</main>
      <SiteFooter />
      <Suspense fallback={null}>
        <FavoritesLoader />
      </Suspense>
    </>
  );
}
