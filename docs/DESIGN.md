# Design system: "Katastar"

The whole interface is designed like a **land registry sheet and cadastral map**: warm archival paper, ink-black type, terracotta roof-tile red, the dark green of Vranica forests and the teal of the Vrbas river. Every listing is treated as a registered parcel with a number, a ledger of facts and an official stamp.

This is the opposite of the generic real-estate template (white cards, blue buttons, rounded corners, drop shadows, stock gradient hero). If a screen starts to look like that, it is wrong.

## 1. Principles

1. **Paper, not glass.** Flat surfaces, hairline borders, no shadows, no blur, no glow.
2. **Ledger over cards.** Information is shown as rows with labels and values, like an official document. Listing grids share borders like cells of a cadastral sheet instead of floating cards with gaps.
3. **Numbers are first-class.** Prices, m², parcel numbers and coordinates are set in monospace and aligned. They are what buyers scan.
4. **One loud colour.** Terracotta (`crijep`) is the only attention colour: main action, price, map pins. Everything else is ink, paper and green.
5. **Local, honest, calm.** Real place names, real units (KM, m², dunum where relevant), plain Bosnian copy. No marketing exclamation marks.

## 2. Colour tokens

Only these colours exist. Use the token name, never the hex in components.

| Token | Hex | Use |
|---|---|---|
| `papir` | `#F3EEE3` | Page background |
| `papir-2` | `#E9E2D2` | Raised areas, table header, input background on hover, alternate rows |
| `papir-3` | `#DDD4C0` | Pressed states, image placeholder hatch lines |
| `linija` | `#CFC6B2` | All borders and dividers (1px) |
| `tinta` | `#1F2421` | Primary text, headings, primary icons |
| `tinta-2` | `#5A5F57` | Secondary text, labels, metadata |
| `tinta-3` | `#8A8C80` | Placeholders, disabled text |
| `crijep` | `#B5482B` | Primary buttons, prices, map pins, active filter, links on hover |
| `crijep-tamni` | `#8E3720` | Hover/pressed of `crijep` |
| `vranica` | `#2F4A3A` | Links, focus rings, "Uknjiženo" stamp, success |
| `vrbas` | `#3E6E7A` | Informational notes, map water accent, secondary data highlights |
| `greska` | `#9B2226` | Errors only, always paired with an icon and text |
| `upozorenje` | `#A4741A` | Warnings only (e.g. listing expires soon) |
| `na-crijep` | `#FFFFFF` | Text and icons on a `crijep` fill |

### Dark mode: "Noćni katastar"

| Token | Dark hex |
|---|---|
| `papir` | `#171A18` |
| `papir-2` | `#1F2320` |
| `papir-3` | `#2A2F2B` |
| `linija` | `#353B36` |
| `tinta` | `#ECE6D8` |
| `tinta-2` | `#B3AE9F` |
| `tinta-3` | `#7D7A6E` |
| `crijep` | `#D2674A` |
| `crijep-tamni` | `#E07E62` |
| `vranica` | `#7FA88E` |
| `vrbas` | `#7DB0BC` |
| `greska` | `#E0645F` |
| `upozorenje` | `#D9A441` |
| `na-crijep` | `#171A18` |

Text on a `crijep` fill always uses the token `na-crijep`: `#FFFFFF` in light, `#171A18` in dark (white on the lighter dark-mode terracotta fails contrast).

Contrast: `tinta` and `tinta-2` on `papir` pass WCAG AA for body text. `crijep` on `papir` passes AA for text 16px and up. `na-crijep` on `crijep` passes AA in both themes. Never put `tinta-3` on anything other than placeholders or disabled states.

### Theme switcher

Users choose **Svijetla**, **Tamna** or **Prema sistemu** (default).

- Control: `ThemeSwitcher`, a 3-option square segmented radio group in the header (sun, moon, monitor icons, 40px squares, each with `aria-label` and `title`). Selected option is `tinta` fill with `papir` icon. On mobile it lives in the account/menu sheet as a labelled 3-option row.
- Storage: a cookie `theme` with value `light`, `dark` or `system`, 1 year, `SameSite=Lax`. Not localStorage, so the server can render the right theme.
- No flash: a small inline script in `<head>` reads the cookie before the first paint and sets `data-theme="light"` or `data-theme="dark"` on `<html>`. For `system` it sets no attribute and the `prefers-color-scheme` media query decides. The cookie is not read with `cookies()` in the root layout, because with `cacheComponents` that would make every route dynamic.
- Also set `<meta name="color-scheme" content="light dark">` and `color-scheme` on `:root` so native form controls and scrollbars match.
- Switching is instant (only a 180ms background/colour transition), no reload. Leaflet tiles get an extra `invert(1) hue-rotate(180deg)` in dark mode on top of the muted filter.

## 3. Typography

All three fonts are loaded with `next/font/google` with the `latin` and `latin-ext` subsets, so č ć đ š ž render correctly.

| Role | Font | Notes |
|---|---|---|
| Display / headings | **Fraunces** | Variable serif. Use optical size axis. Weight 500–600. Slight negative tracking on large sizes. |
| UI / body | **Schibsted Grotesk** | Weight 400 body, 500 labels, 600 buttons. |
| Numbers / codes | **JetBrains Mono** | Prices, m², parcel numbers, coordinates, dates in tables. Always `font-variant-numeric: tabular-nums`. |

### Scale (rem, base 16px)

| Token | Size / line-height | Font | Use |
|---|---|---|---|
| `text-display` | 3.5 / 1.05 | Fraunces 500 | Home hero only |
| `text-h1` | 2.5 / 1.1 | Fraunces 500 | Page titles, listing title |
| `text-h2` | 1.75 / 1.2 | Fraunces 500 | Section titles |
| `text-h3` | 1.25 / 1.3 | Fraunces 600 | Card titles, dialog titles |
| `text-body` | 1 / 1.55 | Schibsted | Default |
| `text-small` | 0.875 / 1.45 | Schibsted | Metadata, helper text |
| `text-label` | 0.75 / 1.3, uppercase, tracking 0.08em | Schibsted 500 | Field labels, ledger labels, table headers |
| `text-price` | 1.5 / 1.1 | JetBrains Mono 600 | Prices |
| `text-mono` | 0.875 / 1.4 | JetBrains Mono 400 | Codes, coordinates, m² |

Mobile: `display` drops to 2.25, `h1` to 1.875, `h2` to 1.5.

## 4. Space, shape, elevation

- Spacing scale: Tailwind default 4px steps. Page gutters 16px mobile, 32px tablet, 48px desktop. Max content width 1240px.
- **Radius:** `0` everywhere, except inputs, buttons and tags which get `2px`. Avatars are the only circles.
- **Borders:** always `1px solid linija`. A heavy rule (`2px solid tinta`) is used only above page titles and at the top of the site header, like the top line of an official form.
- **Elevation:** no `box-shadow` anywhere. A raised element uses `papir-2` background plus a border. Dialogs sit on a `tinta` overlay at 40% opacity.
- **Focus:** `outline: 2px solid vranica; outline-offset: 2px` on every focusable element. Never remove focus outlines.

## 5. Signature elements

These make the product recognisable. Use them consistently.

1. **Parcel number.** Every listing has a public number shown as `br. 00127` in mono, plus its cadastral-style location line: `k.o. Bugojno · Čipuljić`. It appears on cards, the detail page and share images.
2. **Ledger rows (`DataRow`).** Label left in `text-label`, value right in `text-mono`, joined by a dotted leader line (`border-bottom: 1px dotted linija` on a flex spacer). Used for all listing facts.
3. **Stamp (`Stamp`).** A rectangular rubber-stamp badge: uppercase mono text, 2px double border in the stamp colour, rotated `-3deg`, 85% opacity. Variants: `UKNJIŽENO` (vranica), `PRODANO` (crijep), `NOVO` (vrbas), `ISTIČE` (upozorenje). Never more than one stamp per card.
4. **Coordinates strip.** The site header has a thin top strip with the selected municipality's coordinates in mono, e.g. `44.0567° N · 17.4508° E · BUGOJNO`. It updates with the municipality filter.
5. **Cadastral hatch.** Missing images and map loading states show a 45° hatch (`repeating-linear-gradient` of `papir-3` 1px lines every 8px on `papir-2`). This is the only pattern allowed.
6. **Muted map.** OpenStreetMap tiles get `filter: grayscale(1) sepia(.25) contrast(.95)` so the map looks like a printed survey. Pins are **small squares** (14px, `crijep` fill, 2px `papir` border) like parcel markers, not teardrops. Approximate locations are a dashed `crijep` circle instead of a pin.
7. **Sheet grid.** Listing grids use `gap-px` on a `linija` background so cells share 1px borders like a cadastral sheet.

## 6. Components

All live in `src/components/ui/`. Build them in Phase 1 before any feature work.

| Component | Spec |
|---|---|
| `Button` | Variants: `primary` (crijep fill, na-crijep text, hover crijep-tamni), `secondary` (transparent, 1px tinta border, tinta text, hover papir-2), `ghost` (text only, underline on hover), `danger` (greska border and text). Sizes `sm` 32px, `md` 40px, `lg` 48px tall. Radius 2px. Label weight 600. Loading state replaces label with a 3-dot mono `···` animation and disables the button. |
| `Input`, `Textarea`, `Select` | 44px tall, papir background, 1px linija border, radius 2px, label above in `text-label`, helper text below in `text-small tinta-2`, error text in greska with icon. Number inputs show a unit suffix (`KM`, `m²`) in mono inside the field. |
| `Checkbox`, `Radio` | Square 18px, 1px tinta border, checked fill vranica with papir check. Radios are also square with inner square dot. |
| `SegmentedControl` | Row of joined buttons sharing borders, active segment tinta fill with papir text. Used for property type and grid/map toggle. |
| `Stamp` | See signature elements. |
| `DataRow` / `Ledger` | See signature elements. A `Ledger` is a list of `DataRow`s with a `text-label` heading. |
| `PriceTag` | `text-price` in crijep, `KM` suffix in smaller mono tinta-2. Optional line below: `Cijena po dogovoru` or price per m² in `text-mono tinta-2`. |
| `ListingCard` | Image 4:3, no radius. Below: parcel number + municipality line in mono, title in `text-h3` (2 lines max), PriceTag, then 3 inline facts (`84 m² · 3 sobe · 2. sprat`) in mono. Optional Stamp overlapping the top-left image corner. Favourite button top-right as a square ghost icon button on papir. Whole card is a link; hover shows papir-2 background and title underline. |
| `ListingRow` | Horizontal variant for dashboard and map side-list: thumbnail 120px, facts in a ledger, status stamp, actions on the right. |
| `FilterBar` | Desktop: sticky left column 280px with grouped fields under `text-label` headings separated by linija rules. Mobile: a full-screen sheet opened by a `Filteri (3)` button. Active filters appear as removable `Tag`s above results. |
| `Tag` | Inline, 1px linija border, radius 2px, `text-small`. Removable tags have a × button. |
| `Pagination` | Mono page numbers in a bordered row, current page tinta fill. Plus `Prikazano 1–24 od 312` in mono. |
| `Gallery` | Main image 4:3 plus a strip of thumbnails. Fullscreen lightbox on tinta background with mono counter `03 / 12`. Keyboard arrows and swipe. |
| `EmptyState` | Cadastral hatch block, `text-h3` title, one line of help, one action. |
| `Toast` | Bottom-left on desktop, top on mobile. papir-2 background, 1px border, left 4px colour bar in status colour. Auto-dismiss 5s. |
| `Dialog` | Max 520px, papir background, 2px tinta top rule, title in `text-h3`, actions right-aligned. |
| `Stepper` | For the new-listing form: numbered steps in mono `01 Osnovno — 02 Lokacija — ...`, current step crijep, done steps vranica with check. |
| `ThemeSwitcher` | See §2 Theme switcher. Client component, writes the cookie and updates `data-theme` on `<html>` immediately. |
| `Skeleton` | Cadastral hatch blocks in the shape of content, no shimmer. |

## 7. Iconography and imagery

- Icons: **Lucide**, stroke width 1.5, size 18 or 20, colour inherits text. No filled icons, no emoji in UI.
- Photos: always `object-cover`, 4:3 in grids, no radius, no overlays or gradients on top of photos. Text never sits on top of a photo except the Stamp.
- Home hero: no stock photo. Use the interactive `CantonMap`: a stylised cadastral map of the canton built from real municipality outlines (SVG, linija strokes on papir with the hatch pattern, municipality names in mono label style, Vrbas river in vrbas), with the search form beside it. The selected or hovered municipality fills with `crijep` at 16% opacity and a 1.5px `crijep` outline.

### The four maps

| Map | Where | Interaction | Built with |
|---|---|---|---|
| `CantonMap` | Home hero | Hover/focus to see counts, click to open a municipality | Static SVG paths |
| `ListingsMap` | `/nekretnine` map view | Pan, zoom, clustered square pins, hover syncs with list | Leaflet |
| `LocationMap` | Listing detail | Pan, zoom (wheel only after click), pin or approximate circle | Leaflet |
| `LocationPicker` | New listing step 02 | Click to place, drag, arrow keys, "Koristi moju lokaciju" | Leaflet |

## 8. Motion

- Durations 120ms (hover, press) and 180ms (dialogs, sheets). Easing `cubic-bezier(.2,.0,.0,1)`.
- Allowed: opacity, small translate (max 8px), background colour. Not allowed: scale bounces, parallax, spring physics, animated gradients.
- Respect `prefers-reduced-motion`: disable all transitions except opacity.

## 9. Voice and copy

- Bosnian, ijekavica, Latin script. Formal "Vi" in system messages, but short and plain.
- Buttons are verbs: `Objavi oglas`, `Sačuvaj`, `Prikaži broj telefona`, `Označi kao prodano`.
- Numbers formatted with Bosnian locale: `185.000 KM`, `84,5 m²`, dates `27. 10. 2026.`
- Errors say what happened and what to do: `Lozinka mora imati najmanje 8 znakova.`
- 404 page title: `Parcela nije pronađena`.

## 10. Tailwind v4 tokens

Put this in `src/app/globals.css`. Components use classes like `bg-papir`, `text-tinta-2`, `border-linija`, `font-display`, `font-mono`.

```css
@import "tailwindcss";

@theme {
  --color-papir: #F3EEE3;
  --color-papir-2: #E9E2D2;
  --color-papir-3: #DDD4C0;
  --color-linija: #CFC6B2;
  --color-tinta: #1F2421;
  --color-tinta-2: #5A5F57;
  --color-tinta-3: #8A8C80;
  --color-crijep: #B5482B;
  --color-crijep-tamni: #8E3720;
  --color-vranica: #2F4A3A;
  --color-vrbas: #3E6E7A;
  --color-greska: #9B2226;
  --color-upozorenje: #A4741A;
  --color-na-crijep: #FFFFFF;

  --font-display: var(--font-fraunces), Georgia, serif;
  --font-sans: var(--font-schibsted), system-ui, sans-serif;
  --font-mono: var(--font-jetbrains), ui-monospace, monospace;

  --radius-xs: 2px;
}

@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *), @media (prefers-color-scheme: dark) { &:where(:root:not([data-theme="light"]), :root:not([data-theme="light"]) *) });

:root {
  color-scheme: light dark;
}

:root[data-theme="light"] {
  color-scheme: light;
}

:root[data-theme="dark"] {
  color-scheme: dark;
  --color-papir: #171A18;
  --color-papir-2: #1F2320;
  --color-papir-3: #2A2F2B;
  --color-linija: #353B36;
  --color-tinta: #ECE6D8;
  --color-tinta-2: #B3AE9F;
  --color-tinta-3: #7D7A6E;
  --color-crijep: #D2674A;
  --color-crijep-tamni: #E07E62;
  --color-vranica: #7FA88E;
  --color-vrbas: #7DB0BC;
  --color-greska: #E0645F;
  --color-upozorenje: #D9A441;
  --color-na-crijep: #171A18;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-papir: #171A18;
    --color-papir-2: #1F2320;
    --color-papir-3: #2A2F2B;
    --color-linija: #353B36;
    --color-tinta: #ECE6D8;
    --color-tinta-2: #B3AE9F;
    --color-tinta-3: #7D7A6E;
    --color-crijep: #D2674A;
    --color-crijep-tamni: #E07E62;
    --color-vranica: #7FA88E;
    --color-vrbas: #7DB0BC;
    --color-greska: #E0645F;
    --color-upozorenje: #D9A441;
    --color-na-crijep: #171A18;
  }
}
```

Components never use `dark:` variants for colours: every colour comes from a token, and the tokens switch. The `dark:` variant exists only for the rare non-colour difference (e.g. the extra map tile filter).

## 11. Anti-patterns (never do these)

- Box shadows, glassmorphism, blur, glow, gradients (except the hatch pattern).
- Rounded cards, pill buttons, `rounded-xl`/`rounded-2xl`/`rounded-full` on anything but avatars.
- Blue as a primary colour, purple gradients, default Tailwind palette colours (`bg-blue-500`, `text-gray-600`, ...).
- Inter, Roboto, Poppins, Montserrat or any font not listed above.
- Floating cards with gaps and shadows in a grid.
- Big stock-photo hero with text on top.
- Emoji in UI copy, exclamation marks in system messages, "🔥 Hot deal" style badges.
- Spinners. Use the `···` button state or hatch skeletons.
- Centering everything. Layouts are left-aligned like a document.

A visual reference of these tokens and components is in `docs/design-preview.html`. Open it in a browser.
