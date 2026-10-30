const bihCountryCode = "387";

function internationalDigits(phone: string): string {
  const compact = phone.replace(/[^\d+]/g, "");
  if (compact.startsWith("+")) {
    return compact.slice(1);
  }
  if (compact.startsWith("00")) {
    return compact.slice(2);
  }
  if (compact.startsWith("0")) {
    return `${bihCountryCode}${compact.slice(1)}`;
  }
  return compact;
}

export function contactLinks(phone: string, message: string) {
  const digits = internationalDigits(phone);
  return {
    call: `tel:+${digits}`,
    viber: `viber://chat?number=%2B${digits}`,
    whatsapp: `https://wa.me/${digits}?text=${encodeURIComponent(message)}`,
  };
}
