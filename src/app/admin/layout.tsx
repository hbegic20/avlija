import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { FavoritesLoader } from "@/components/favorites/favorites-loader";
import { Container } from "@/components/layout/container";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { adminRoutes } from "@/lib/admin/routes";
import { requireUser } from "@/lib/auth/current-user";
import { bs } from "@/lib/i18n/bs";

export const instant = false;

export const metadata: Metadata = {
  title: { default: bs.admin.title, template: `%s · ${bs.admin.title} | ${bs.site.name}` },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireUser(adminRoutes.overview);
  if (!user.isAdmin) {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="flex flex-col gap-8 py-10">
          <div className="flex flex-col gap-4">
            <p className="border-t-2 border-t-tinta pt-3 text-label text-tinta-2 uppercase">{bs.admin.title}</p>
            <AdminNav />
          </div>
          {children}
        </Container>
      </main>
      <SiteFooter />
      <Suspense fallback={null}>
        <FavoritesLoader />
      </Suspense>
    </>
  );
}
