/**
 * Theme preference, stored on the device only.
 *
 * No cookie and no server state, so the choice never travels with a request.
 * That keeps theming consistent with the project's privacy-by-design principle:
 * the server learns nothing about the visitor, not even their colour scheme.
 */

export const THEME_KEY = "sigap.theme";

/** `system` means "follow prefers-color-scheme", and is the absence of a choice. */
export type ThemePreference = "system" | "dark" | "light";

/**
 * Bootstrap script, injected inline and run before first paint.
 *
 * This must stay dependency-free and synchronous. It reads the stored choice and
 * stamps `data-theme` on <html> before the browser paints, which is what stops
 * a flash of the wrong theme. Without it, the CSS default (dark) would render
 * first and then swap once React hydrated.
 *
 * `system` intentionally writes no attribute, so the CSS media query stays in
 * control rather than being overridden by a hardcoded value.
 */
export const THEME_BOOTSTRAP = `
(function () {
  try {
    var stored = localStorage.getItem('${THEME_KEY}');
    if (stored === 'dark' || stored === 'light') {
      document.documentElement.setAttribute('data-theme', stored);
    }
  } catch (e) {
    /* Storage blocked: fall through to the CSS default. */
  }
})();
`.trim();

/** Apply a preference to the document and persist it. */
export function applyTheme(preference: ThemePreference): void {
  const root = document.documentElement;

  if (preference === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", preference);
  }

  try {
    if (preference === "system") {
      localStorage.removeItem(THEME_KEY);
    } else {
      localStorage.setItem(THEME_KEY, preference);
    }
  } catch {
    // Preference simply will not survive a reload; the page still works.
  }
}

/** Read the stored preference. Returns `system` when nothing is stored. */
export function readTheme(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === "dark" || stored === "light" ? stored : "system";
  } catch {
    return "system";
  }
}
