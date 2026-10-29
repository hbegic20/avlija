import type {
  HeatingType,
  ListingFeature,
  ListingStatus,
  PropertyCondition,
  PropertyType,
  ReportReason,
  ReportStatus,
  StampVariant,
  UserRole,
} from "@/lib/domain/enums";
import type { ThemePreference } from "@/lib/theme/theme";

const propertyType: Record<PropertyType, string> = {
  stan: "Stan",
  kuca: "Kuća",
  plac: "Plac",
  poljoprivredno: "Poljoprivredno zemljište",
  vikendica: "Vikendica",
  poslovni_prostor: "Poslovni prostor",
  garaza: "Garaža",
};

const listingStatus: Record<ListingStatus, string> = {
  draft: "Nacrt",
  active: "Aktivan",
  sold: "Prodano",
  archived: "Arhiviran",
  hidden: "Skriven",
};

const heating: Record<HeatingType, string> = {
  centralno: "Centralno",
  etazno: "Etažno",
  struja: "Struja",
  drva: "Drva",
  plin: "Plin",
  toplotna_pumpa: "Toplotna pumpa",
  nema: "Nema grijanja",
};

const condition: Record<PropertyCondition, string> = {
  novogradnja: "Novogradnja",
  renovirano: "Renovirano",
  useljivo: "Useljivo",
  potrebna_adaptacija: "Potrebna adaptacija",
  roh_bau: "Roh-bau",
};

const reportReason: Record<ReportReason, string> = {
  lazni_oglas: "Lažni oglas",
  prodano: "Nekretnina je već prodana",
  netacni_podaci: "Netačni podaci",
  neprimjereno: "Neprimjeren sadržaj",
  prevara: "Pokušaj prevare",
  ostalo: "Ostalo",
};

const reportStatus: Record<ReportStatus, string> = {
  open: "Otvorena",
  resolved: "Riješena",
  dismissed: "Odbačena",
};

const userRole: Record<UserRole, string> = {
  user: "Korisnik",
  admin: "Administrator",
};

const feature: Record<ListingFeature, string> = {
  balkon: "Balkon",
  terasa: "Terasa",
  lift: "Lift",
  parking: "Parking",
  garaza: "Garaža",
  podrum: "Podrum",
  tavan: "Tavan",
  basta: "Bašta",
  bazen: "Bazen",
  klima: "Klima",
  namjesteno: "Namješteno",
  internet: "Internet",
  alarm: "Alarm",
  pristup_asfaltu: "Pristup asfaltu",
  struja_na_placu: "Struja na placu",
  voda_na_placu: "Voda na placu",
  kanalizacija: "Kanalizacija",
};

const stamp: Record<StampVariant, string> = {
  uknjizeno: "Uknjiženo",
  prodano: "Prodano",
  novo: "Novo",
  istice: "Ističe",
};

const themeOption: Record<ThemePreference, string> = {
  light: "Svijetla",
  dark: "Tamna",
  system: "Prema sistemu",
};

export const bs = {
  site: {
    name: "Avlija",
    description: "Kuće, stanovi i placevi u Bugojnu i Srednjobosanskom kantonu, direktno od vlasnika.",
    region: "Srednjobosanski kanton",
  },
  nav: {
    main: "Glavna navigacija",
    listings: "Nekretnine",
    login: "Prijava",
    publish: "Objavi oglas",
    home: "Avlija, početna stranica",
    openMenu: "Otvori meni",
    closeMenu: "Zatvori meni",
    menu: "Meni",
  },
  footer: {
    municipalities: "Općine",
    legal: "Informacije",
    terms: "Uslovi korištenja",
    privacy: "Privatnost",
    contact: "Kontakt",
  },
  theme: {
    label: "Tema",
    options: themeOption,
  },
  common: {
    loading: "Učitavanje",
    close: "Zatvori",
    remove: "Ukloni",
    removeItem: (item: string) => `Ukloni: ${item}`,
    yes: "Da",
    no: "Ne",
    optional: "neobavezno",
  },
  price: {
    negotiable: "Cijena po dogovoru",
    perSquareMetre: (amount: string) => `${amount} KM/m²`,
  },
  pagination: {
    label: "Stranice",
    previous: "Prethodna stranica",
    next: "Sljedeća stranica",
    page: (page: number) => `Stranica ${page}`,
    showing: (from: string, to: string, total: string) => `Prikazano ${from}–${to} od ${total}`,
  },
  stepper: {
    label: "Koraci",
    done: "završeno",
    current: "trenutni korak",
  },
  toast: {
    region: "Obavještenja",
  },
  enums: {
    propertyType,
    listingStatus,
    heating,
    condition,
    reportReason,
    reportStatus,
    userRole,
    feature,
    stamp,
  },
} as const;
