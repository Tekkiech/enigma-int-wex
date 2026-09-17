// Chart color tokens - not hand-picked. The categorical order below is the
// dataviz skill's validated default 8-hue set with slot 2 swapped for this
// site's own accent (oklch(0.55 0.19 35) -> #c83406), re-validated with
// scripts/validate_palette.js before shipping (worst adjacent CVD deltaE
// unchanged at 9.1, normal-vision floor 19.6 - the swap didn't touch the
// pair that sets either bound). Order is the CVD-safety mechanism: never
// reassign a slot per-chart, never cycle past 8.
export const CATEGORICAL = [
  '#2a78d6', // 1 blue
  '#c83406', // 2 accent (site's burnt-orange, in the default's orange slot)
  '#1baf7a', // 3 aqua
  '#eda100', // 4 yellow
  '#e87ba4', // 5 magenta
  '#008300', // 6 green
  '#4a3aa7', // 7 violet
  '#e34948', // 8 red
];

// Single-hue sequential ramp for magnitude (revenue trend, category
// breakdown) - light -> dark, same blue family as categorical slot 1.
export const SEQUENTIAL_BLUE = {
  100: '#cde2fb',
  300: '#6da7ec',
  500: '#256abf',
  700: '#0d366b',
};

// Chart chrome, pulled from this app's own design tokens (styles.css) so
// the dashboard reads as part of the site, not a bolted-on library demo.
export const CHROME = {
  surface: '#ffffff',
  ink: '#0b0b0b',
  textDim: '#636363',
  line: '#cecece',
  lineSoft: '#d7d7d7',
};

export function personaColor(personaIndex) {
  return CATEGORICAL[personaIndex % CATEGORICAL.length];
}
