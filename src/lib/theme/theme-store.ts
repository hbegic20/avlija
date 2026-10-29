import {
  applyThemeToDocument,
  readThemeCookie,
  writeThemeCookie,
  type ThemePreference,
} from "./theme";

const themeChangeEvent = "avlija:theme-change";

export function subscribeToTheme(onChange: () => void): () => void {
  window.addEventListener(themeChangeEvent, onChange);
  return () => window.removeEventListener(themeChangeEvent, onChange);
}

export function getThemeSnapshot(): ThemePreference {
  return readThemeCookie(document.cookie);
}

export function getServerThemeSnapshot(): ThemePreference {
  return "system";
}

export function setThemePreference(preference: ThemePreference): void {
  writeThemeCookie(preference);
  applyThemeToDocument(preference);
  window.dispatchEvent(new Event(themeChangeEvent));
}
