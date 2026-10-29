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
  auth: {
    fields: {
      fullName: "Ime i prezime",
      email: "Email",
      password: "Lozinka",
      confirmPassword: "Potvrda lozinke",
      newPassword: "Nova lozinka",
      confirmNewPassword: "Potvrda nove lozinke",
    },
    passwordHelper: "Najmanje 8 znakova, barem jedno slovo i jedan broj.",
    termsPrefix: "Prihvatam ",
    termsLink: "uslove korištenja",
    termsJoin: " i ",
    privacyLink: "politiku privatnosti",
    or: "ili",
    continueWithGoogle: "Nastavi s Google",
    login: {
      title: "Prijava",
      description: "Prijavite se da biste objavili oglas, sačuvali nekretnine ili vidjeli broj prodavca.",
      submit: "Prijavi se",
      forgotPassword: "Zaboravili ste lozinku?",
      noAccount: "Nemate račun?",
      register: "Registrujte se",
    },
    register: {
      title: "Registracija",
      description: "Račun je besplatan. Potreban je za objavu oglasa i kontakt s prodavcima.",
      submit: "Registruj se",
      hasAccount: "Već imate račun?",
      login: "Prijavite se",
    },
    checkEmail: {
      title: "Provjerite email",
      description: (email: string) =>
        `Poslali smo link za potvrdu na ${email}. Otvorite ga da biste aktivirali račun.`,
      hint: "Ako email ne stigne za nekoliko minuta, provjerite neželjenu poštu.",
      resend: "Pošalji ponovo",
      resendIn: (seconds: number) => `Pošalji ponovo za ${seconds} s`,
      resent: "Link za potvrdu je ponovo poslan.",
    },
    forgotPassword: {
      title: "Zaboravljena lozinka",
      description: "Upišite email s kojim ste se registrovali. Poslat ćemo Vam link za novu lozinku.",
      submit: "Pošalji link",
      sentTitle: "Provjerite email",
      sent: "Ako postoji račun s tom adresom, poslali smo link za postavljanje nove lozinke.",
      backToLogin: "Nazad na prijavu",
    },
    newPassword: {
      title: "Nova lozinka",
      description: "Upišite novu lozinku. Nakon promjene bit ćete odjavljeni sa svih uređaja.",
      submit: "Sačuvaj lozinku",
      linkExpiredTitle: "Link je istekao",
      linkExpired: "Link za novu lozinku je istekao ili je već iskorišten. Zatražite novi.",
      requestNew: "Zatraži novi link",
    },
    notices: {
      passwordChanged: "Lozinka je promijenjena. Prijavite se novom lozinkom.",
      signedOut: "Odjavljeni ste.",
      linkInvalid: "Link nije važeći ili je istekao. Pokušajte ponovo.",
    },
    validation: {
      fullNameLength: "Ime i prezime mora imati između 2 i 80 znakova.",
      emailInvalid: "Upišite ispravnu email adresu.",
      passwordRequired: "Upišite lozinku.",
      passwordLength: "Lozinka mora imati najmanje 8 znakova.",
      passwordNumber: "Lozinka mora sadržavati barem jedan broj.",
      passwordLetter: "Lozinka mora sadržavati barem jedno slovo.",
      passwordsMismatch: "Lozinke se ne podudaraju.",
      termsRequired: "Morate prihvatiti uslove korištenja i politiku privatnosti.",
    },
    errors: {
      invalidCredentials: "Pogrešan email ili lozinka.",
      emailNotConfirmed: "Email adresa još nije potvrđena. Otvorite link koji smo Vam poslali.",
      resendConfirmation: "Pošalji link ponovo",
      tooManyRequests: "Previše pokušaja. Sačekajte nekoliko minuta pa pokušajte ponovo.",
      network: "Nema veze sa serverom. Provjerite internet i pokušajte ponovo.",
      weakPassword: "Lozinka je preslaba. Izaberite dužu lozinku s brojevima.",
      samePassword: "Nova lozinka mora biti drugačija od stare.",
      sessionMissing: "Sesija je istekla. Zatražite novi link za lozinku.",
      unexpected: "Nešto nije u redu. Pokušajte ponovo.",
    },
  },
  account: {
    menu: "Moj račun",
    openMenu: (name: string) => `Meni računa: ${name}`,
    overview: "Pregled",
    myListings: "Moji oglasi",
    favorites: "Sačuvano",
    profile: "Profil",
    signOut: "Odjavi se",
    welcome: (name: string) => `Dobro došli, ${name}`,
    dashboardIntro: "Ovdje ćete upravljati svojim oglasima, sačuvanim nekretninama i profilom.",
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
