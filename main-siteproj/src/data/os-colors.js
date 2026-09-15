/*
  One colour per OS, shared by the chart, map and table so the same
  colour always means the same OS across all three. Values live as CSS
  custom properties in styles.css (--os-*) so the palette swaps with the
  light/dark theme automatically; this just reads them back into JS.
*/
const CSS_VAR_BY_OS = {
  Android: '--os-android',
  Windows: '--os-windows',
  iOS: '--os-ios',
  'OS X': '--os-osx',
  macOS: '--os-macos',
  Linux: '--os-linux',
  'Chrome OS': '--os-chromeos',
};

const FALLBACK_BY_OS = {
  Android: '#7ec699',
  Windows: '#6ca0dc',
  iOS: '#c9a0dc',
  'OS X': '#e88ba0',
  macOS: '#6dcfcf',
  Linux: '#e8c468',
  'Chrome OS': '#d9d5cc',
};

export const OS_NAMES = Object.keys(CSS_VAR_BY_OS);

export function cssVar(name, fallback) {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export function colorFor(os) {
  const varName = CSS_VAR_BY_OS[os];
  if (!varName) return cssVar('--os-none', '#3a3733');
  return cssVar(varName, FALLBACK_BY_OS[os]);
}

export function noDataColor() {
  return cssVar('--os-none', '#3a3733');
}
