const themeCookieName = "theme";
const themeCookieMaxAgeSeconds = 60 * 60 * 24 * 365;

export const themeChoices = ["light", "dark"] as const;
export type ThemeChoice = (typeof themeChoices)[number];
export type ThemePreference = ThemeChoice | "system";

function parseThemePreference(value: string | undefined | null): ThemePreference {
  return value === "light" || value === "dark" ? value : "system";
}

export function readThemeCookie(cookieHeader: string): ThemePreference {
  const match = cookieHeader.match(new RegExp(`(?:^|; )${themeCookieName}=([^;]*)`));
  return parseThemePreference(match?.[1]);
}

export function applyThemeToDocument(preference: ThemePreference): void {
  const root = document.documentElement;
  if (preference === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", preference);
  }
}

export function writeThemeCookie(preference: ThemePreference): void {
  document.cookie = `${themeCookieName}=${preference}; path=/; max-age=${themeCookieMaxAgeSeconds}; SameSite=Lax`;
}

export const themeBootScript = `(function(){try{var m=document.cookie.match(/(?:^|; )${themeCookieName}=(light|dark)(?:;|$)/);if(m)document.documentElement.setAttribute("data-theme",m[1])}catch(e){}})()`;
