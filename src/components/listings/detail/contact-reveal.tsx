"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { revealContact, type SellerContact } from "@/actions/listing-interactions";
import { Button, buttonStyles } from "@/components/ui/button";
import { bs } from "@/lib/i18n/bs";
import { contactLinks } from "@/lib/listings/contact-links";
import { interactionErrorMessage, type InteractionErrorCode } from "@/lib/listings/interaction-errors";

const iconProps = { "aria-hidden": true, size: 18, strokeWidth: 1.5 } as const;

export function ContactReveal({
  listingId,
  listingNumber,
  listingPath,
  isLoggedIn,
  loginHref,
}: {
  listingId: string;
  listingNumber: string;
  listingPath: string;
  isLoggedIn: boolean;
  loginHref: string;
}) {
  const [contact, setContact] = useState<SellerContact | null>(null);
  const [errorCode, setErrorCode] = useState<InteractionErrorCode | null>(null);
  const [pending, startTransition] = useTransition();

  if (!isLoggedIn) {
    return (
      <Link href={loginHref} className={buttonStyles({ size: "lg", className: "w-full" })}>
        <Phone {...iconProps} />
        {bs.detail.loginToSeePhone}
      </Link>
    );
  }

  if (contact?.phone) {
    const links = contactLinks(
      contact.phone,
      bs.detail.contactMessage(listingNumber, `${window.location.origin}${listingPath}`),
    );
    return (
      <div className="flex flex-col gap-3">
        <a href={links.call} className="font-mono text-price text-tinta underline-offset-3 hover:underline">
          {contact.phone}
        </a>
        <div className="flex flex-wrap gap-2">
          <a href={links.call} className={buttonStyles({ size: "md" })}>
            <Phone {...iconProps} />
            {bs.detail.call}
          </a>
          {contact.hasViber ? (
            <a href={links.viber} className={buttonStyles({ variant: "secondary" })}>
              <MessageCircle {...iconProps} />
              {bs.detail.viber}
            </a>
          ) : null}
          {contact.hasWhatsapp ? (
            <a href={links.whatsapp} target="_blank" rel="noopener noreferrer" className={buttonStyles({ variant: "secondary" })}>
              <MessageCircle {...iconProps} />
              {bs.detail.whatsapp}
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        size="lg"
        className="w-full"
        loading={pending}
        onClick={() =>
          startTransition(async () => {
            setErrorCode(null);
            const result = await revealContact(listingId);
            if (result.ok) {
              setContact(result.data);
            } else {
              setErrorCode(result.error);
            }
          })
        }
      >
        <Phone {...iconProps} />
        {bs.detail.showPhone}
      </Button>
      {contact && !contact.phone ? <p className="text-small text-tinta-2">{bs.detail.phoneUnavailable}</p> : null}
      {errorCode ? (
        <p className="text-small text-greska" role="alert">
          {errorCode === "not_found" ? bs.detail.phoneUnavailable : interactionErrorMessage(errorCode)}
        </p>
      ) : null}
    </div>
  );
}
