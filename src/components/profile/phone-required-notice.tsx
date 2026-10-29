import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { authRoutes } from "@/lib/auth/routes";
import { bs } from "@/lib/i18n/bs";

export function PhoneRequiredNotice() {
  return (
    <section role="status" className="flex flex-col items-start gap-3 border border-l-4 border-l-upozorenje bg-papir-2 p-5">
      <h2 className="font-display text-h3">{bs.profile.phoneRequired.title}</h2>
      <p className="text-small text-tinta-2">{bs.profile.phoneRequired.description}</p>
      <Link href={`${authRoutes.profile}#kontakt`} className={buttonStyles({ variant: "secondary", size: "sm" })}>
        {bs.profile.phoneRequired.action}
      </Link>
    </section>
  );
}
