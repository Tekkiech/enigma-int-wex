// Colors used across the metrics charts, picked to be easy to tell apart
// (including for colorblind readers) and kept in this order everywhere.
export const CATEGORICAL = [
  '#2a78d6', // blue
  '#c83406', // orange (matches the site's accent color)
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#e87ba4', // pink
  '#008300', // green
  '#4a3aa7', // purple
  '#e34948', // red
];

// One color, light to dark - used for charts where bigger = darker.
export const SEQUENTIAL_BLUE = {
  100: '#cde2fb',
  300: '#6da7ec',
  500: '#256abf',
  700: '#0d366b',
};

// Matches the site's own colors (from styles.css), so the charts look
// like part of the site instead of a plain library default.
export const CHROME = {
  surface: '#ffffff',
  ink: '#0b0b0b',
  textDim: '#636363',
  line: '#cecece',
  lineSoft: '#d7d7d7',
};
