/*
  Shared lazy fetch for the per-country dataset, used by the map, table
  and trend (for its legend drill-down) pages. Memoized per page load so
  navigating between features that both need it only fetches once.
*/
let worldOsSharePromise = null;

export function loadWorldOsShare() {
  if (!worldOsSharePromise) {
    // Parcel resolves a dynamic JSON import to the parsed data directly,
    // not ESM-wrapped with a `default` key (unlike a static import).
    worldOsSharePromise = import('./world-os-share.json').then((mod) => mod.default ?? mod);
  }
  return worldOsSharePromise;
}
