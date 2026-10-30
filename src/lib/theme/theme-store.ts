import { applyThemeToDocument, readThemeCookie, writeThemeCookie, type ThemeChoice } from "./theme";

const themeChangeEvent = "avlija:theme-change";
const darkSchemeQuery = "(prefers-color-scheme: dark)";

export function subscribeToTheme(onChange: () => void): () => void {
  const media = window.matchMedia(darkSchemeQuery);
  window.addEventListener(themeChangeEvent, onChange);
  media.addEventListener("change", onChange);
  return () => {
    window.removeEventListener(themeChangeEvent, onChange);
    media.removeEventListener("change", onChange);
  };
}

export function getThemeSnapshot(): ThemeChoice {
  const preference = readThemeCookie(document.cookie);
  if (preference !== "system") {
    return preference;
  }
  return window.matchMedia(darkSchemeQuery).matches ? "dark" : "light";
}

export function getServerThemeSnapshot(): ThemeChoice | undefined {
  return undefined;
}

export function setThemeChoice(choice: ThemeChoice): void {
  writeThemeCookie(choice);
  applyThemeToDocument(choice);
  window.dispatchEvent(new Event(themeChangeEvent));
}
