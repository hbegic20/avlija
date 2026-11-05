import { bs } from "@/lib/i18n/bs";
import { absoluteUrl } from "@/lib/seo/site-url";
import { ViberShareLink } from "./viber-share-link";

const linkClasses = "text-small font-medium text-vranica underline underline-offset-3 hover:text-crijep";

export function ShareLinks({ path, title }: { path: string; title: string }) {
  const message = bs.detail.shareMessage(title, absoluteUrl(path));
  return (
    <nav aria-label={bs.detail.shareVia} className="flex flex-wrap gap-x-4 gap-y-1">
      <ViberShareLink message={message} className={linkClasses} />
      <a
        href={`https://wa.me/?text=${encodeURIComponent(message)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClasses}
      >
        {bs.detail.shareWhatsApp}
      </a>
    </nav>
  );
}
