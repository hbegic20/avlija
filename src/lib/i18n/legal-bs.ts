export type LegalSection = { title: string; paragraphs: readonly string[]; items?: readonly string[] };

export const legalUpdatedAt = "2026-10-30";

export const termsPage = {
  title: "Uslovi korištenja",
  intro:
    "Ovi uslovi vrijede za svakoga ko koristi Avliju, platformu za oglase nekretnina u Bugojnu i Srednjobosanskom kantonu. Korištenjem stranice prihvatate ove uslove.",
  sections: [
    {
      title: "Šta je Avlija",
      paragraphs: [
        "Avlija omogućava vlasnicima da objave oglase za prodaju nekretnina i kupcima da ih pregledaju i kontaktiraju vlasnika direktno.",
        "Avlija nije agencija za nekretnine, posrednik ni strana u kupoprodaji. Sve dogovore, provjere i ugovore kupac i prodavac sklapaju sami.",
      ],
    },
    {
      title: "Korisnički račun",
      paragraphs: [
        "Za objavu oglasa, čuvanje oglasa i pregled broja telefona potreban je račun. Odgovorni ste za tačnost podataka u računu i za čuvanje lozinke.",
        "Račun možete obrisati u svakom trenutku u postavkama profila. Brisanjem računa trajno se brišu i svi Vaši oglasi i fotografije.",
      ],
    },
    {
      title: "Objava oglasa",
      paragraphs: ["Objavom oglasa potvrđujete da imate pravo prodati nekretninu ili da djelujete uz saglasnost vlasnika, i da su podaci tačni."],
      items: [
        "Oglas mora opisivati stvarnu nekretninu na teritoriji Srednjobosanskog kantona.",
        "Cijena, površina, lokacija i podaci o uknjiženosti i dozvolama moraju biti tačni.",
        "Fotografije moraju prikazivati oglašenu nekretninu i ne smiju kršiti tuđa autorska prava.",
        "Zabranjeni su lažni oglasi, dupli oglasi, oglasi agencija predstavljeni kao privatni i sadržaj koji vrijeđa ili obmanjuje.",
        "Jedan korisnik može imati najviše 10 aktivnih oglasa. Oglas je aktivan 90 dana i može se obnoviti.",
      ],
    },
    {
      title: "Kontakt između korisnika",
      paragraphs: [
        "Broj telefona prodavca vidljiv je samo prijavljenim korisnicima. Koristite ga isključivo za upit o oglasu.",
        "Prije bilo kakve uplate lično provjerite nekretninu i dokumentaciju. Avlija ne prima novac i ne garantuje za ponašanje korisnika.",
      ],
    },
    {
      title: "Prijave i moderacija",
      paragraphs: [
        "Svaki prijavljeni korisnik može prijaviti oglas za koji smatra da krši ove uslove. Administrator može sakriti oglas ili sve oglase korisnika i navesti razlog.",
        "Zbog zaštite od zloupotrebe postoje ograničenja broja prijava i pregleda brojeva telefona u kratkom vremenu.",
      ],
    },
    {
      title: "Odgovornost",
      paragraphs: [
        "Za sadržaj oglasa odgovoran je korisnik koji ga je objavio. Avlija se trudi da stranica radi bez prekida, ali ne može garantovati da će uvijek biti dostupna ili bez grešaka.",
      ],
    },
    {
      title: "Izmjene uslova",
      paragraphs: ["Uslove možemo mijenjati. Datum posljednje izmjene naveden je na dnu stranice. Nastavkom korištenja prihvatate izmijenjene uslove."],
    },
  ] satisfies readonly LegalSection[],
};

export const privacyPage = {
  title: "Politika privatnosti",
  intro:
    "Ova politika objašnjava koje lične podatke Avlija obrađuje, zašto i kako ih štitimo, u skladu sa Zakonom o zaštiti ličnih podataka Bosne i Hercegovine.",
  controllerTitle: "Kontrolor podataka",
  controllerText: (name: string) => `Kontrolor ličnih podataka je ${name}.`,
  sections: [
    {
      title: "Koje podatke prikupljamo",
      paragraphs: ["Obrađujemo samo podatke potrebne za rad platforme:"],
      items: [
        "Podaci računa: ime i prezime, email adresa i lozinka (lozinka se čuva samo u šifrovanom obliku).",
        "Podaci profila koje sami unesete: općina, fotografija, broj telefona i da li koristite Viber ili WhatsApp.",
        "Podaci oglasa: opis nekretnine, cijena, fotografije, adresa i tačna lokacija na karti.",
        "Sačuvani oglasi i prijave oglasa koje pošaljete.",
        "Evidencija pregleda brojeva telefona, isključivo radi zaštite od zloupotrebe.",
        "Tehnički podaci potrebni za prijavu, kao što su kolačići sesije.",
      ],
    },
    {
      title: "Svrha i pravni osnov",
      paragraphs: [
        "Podatke obrađujemo da bismo Vam omogućili korištenje računa i objavu oglasa (izvršenje usluge koju ste zatražili), da bismo spriječili zloupotrebe i lažne oglase (legitimni interes) i kada to zahtijeva zakon.",
        "Ne prodajemo lične podatke i ne koristimo ih za oglašavanje trećih strana.",
      ],
    },
    {
      title: "Ko vidi Vaše podatke",
      paragraphs: [],
      items: [
        "Ime, fotografija i datum registracije vidljivi su uz Vaše oglase i na stranici prodavca.",
        "Broj telefona vidljiv je samo prijavljenim korisnicima, i to tek kada ga zatraže na pojedinačnom oglasu.",
        "Tačna lokacija i adresa prikazuju se samo ako uključite opciju „Prikaži tačnu lokaciju”. Inače kupci vide približno područje od oko 300 m, a tačna tačka nije dostupna javno.",
        "Administratori vide podatke potrebne za moderaciju oglasa i prijava.",
      ],
    },
    {
      title: "Obrađivači i treće strane",
      paragraphs: [
        "Podatke čuvamo kod pružaoca infrastrukture Supabase (baza podataka, prijava i pohrana fotografija), a stranica se isporučuje preko hosting servisa Vercel. Karte se učitavaju sa servera OpenStreetMap, koji pri tome vidi Vašu IP adresu.",
      ],
    },
    {
      title: "Koliko dugo čuvamo podatke",
      paragraphs: [
        "Podatke računa i oglasa čuvamo dok ne obrišete račun ili oglas. Prodani oglasi ostaju javno vidljivi 30 dana, nakon čega više nisu dostupni. Evidencija pregleda brojeva telefona koristi se samo za ograničenje zloupotrebe.",
      ],
    },
    {
      title: "Vaša prava",
      paragraphs: ["Imate pravo na pristup svojim podacima, njihovu ispravku i brisanje, ograničenje obrade i prigovor na obradu."],
      items: [
        "Većinu podataka možete sami izmijeniti u profilu i oglasima.",
        "Račun i sve povezane podatke možete obrisati opcijom „Obriši račun” u profilu.",
        "Ako smatrate da su Vaša prava povrijeđena, možete se obratiti Agenciji za zaštitu ličnih podataka u Bosni i Hercegovini.",
      ],
    },
    {
      title: "Kolačići",
      paragraphs: [
        "Koristimo samo neophodne kolačiće: za održavanje prijave i za pamćenje odabrane teme (svijetla ili tamna). Ne koristimo kolačiće za analitiku ni oglašavanje, pa nije potrebna posebna saglasnost.",
      ],
    },
  ] satisfies readonly LegalSection[],
};

export const contactPage = {
  title: "Kontakt",
  intro: "Pitanja o platformi, prijave problema ili zahtjeve u vezi sa ličnim podacima pošaljite na email ispod.",
  emailLabel: "Email",
  emailMissing: "Kontakt email još nije postavljen.",
  reportHint: "Ako je problem sa konkretnim oglasom, najbrže je koristiti „Prijavi oglas” na stranici oglasa.",
  dataRequestHint: "Za brisanje računa ne morate nam pisati: opcija „Obriši račun” nalazi se u Vašem profilu.",
};

export const legalCommon = {
  updated: (date: string) => `Posljednja izmjena: ${date}`,
  contact: "Kontakt",
};
