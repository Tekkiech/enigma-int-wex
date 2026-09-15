/*
  One colour per OS, shared by the chart, map and table so the same
  colour always means the same OS across all three. Sampled from the
  live Evidence Hub's own theme-accent palette (the set used on its
  "Evidence by Theme" cards), not an invented scheme.
*/
export const OS_COLORS = {
  Android: '#f25c29',
  Windows: '#00478a',
  iOS: '#8f3e8d',
  'OS X': '#ed1163',
  macOS: '#33a38c',
  Linux: '#3860be',
  'Chrome OS': '#231f20',
};

export const NO_DATA_COLOR = '#d9d7d2';

export function colorFor(os) {
  return OS_COLORS[os] || NO_DATA_COLOR;
}
