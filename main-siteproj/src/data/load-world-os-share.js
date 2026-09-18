// fetches the per-country dataset once and reuses it - the map, table,
// and trend page's legend drill-down all need this same data
let worldOsSharePromise = null;

export function loadWorldOsShare() {
  if (!worldOsSharePromise) {
    // a dynamic import of a JSON file resolves straight to the data,
    // no `.default` wrapper like a normal ESM import would have
    worldOsSharePromise = import('./world-os-share.json').then((mod) => mod.default ?? mod);
  }
  return worldOsSharePromise;
}
