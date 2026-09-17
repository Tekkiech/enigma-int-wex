// Aggregation over the synthetic order-history dataset - see
// task4-vuejs/analytics/ for how it's generated. Imported directly as JSON
// (Parcel inlines it at build time) rather than fetched at runtime: it's a
// static demo dataset, not something that changes between page loads.
import records from '../../analytics/synthetic-orders.json';

const MONTH_LABEL = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short' });

export function allRecords() {
  return records;
}

export function personaList() {
  return [...new Set(records.map((r) => r.persona))].sort();
}

export function filterByPersona(list, persona) {
  return persona === 'all' ? list : list.filter((r) => r.persona === persona);
}

export function computeKpis(list) {
  const revenue = list.reduce((sum, r) => sum + r.lineTotal, 0);
  const orderIds = new Set(list.map((r) => r.orderId));
  const outlierCount = list.filter((r) => r.isOutlier).length;
  return {
    revenue,
    orderCount: orderIds.size,
    avgOrderValue: orderIds.size ? revenue / orderIds.size : 0,
    outlierRate: list.length ? outlierCount / list.length : 0,
  };
}

// One point per calendar month across the dataset's full span, in order -
// including months with zero activity for the current filter, so a line
// chart doesn't silently skip a persona's quiet months.
export function monthlySeries(list) {
  const allMonths = [...new Set(records.map((r) => r.date.slice(0, 7)))].sort();
  const byMonth = new Map(allMonths.map((month) => [month, { revenue: 0, orders: new Set() }]));

  for (const r of list) {
    const month = r.date.slice(0, 7);
    const bucket = byMonth.get(month);
    bucket.revenue += r.lineTotal;
    bucket.orders.add(r.orderId);
  }

  return allMonths.map((month) => ({
    month,
    label: MONTH_LABEL.format(new Date(`${month}-01T00:00:00`)),
    revenue: byMonth.get(month).revenue,
    orderCount: byMonth.get(month).orders.size,
  }));
}

// Top N categories by revenue, everything past that folded into "Other" -
// a magnitude comparison across ~24 categories reads as a leaderboard, not
// as 24 identities, so this stays a sequential (one-hue) bar chart rather
// than a categorical one - see chartTokens.js.
export function categoryBreakdown(list, topN = 8) {
  const totals = new Map();
  for (const r of list) totals.set(r.category, (totals.get(r.category) || 0) + r.lineTotal);

  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, topN);
  const rest = sorted.slice(topN).reduce((sum, [, revenue]) => sum + revenue, 0);

  const rows = top.map(([category, revenue]) => ({ category, revenue }));
  if (rest > 0) rows.push({ category: 'Other', revenue: rest });
  return rows;
}

// Always computed against the full dataset, independent of the persona
// filter - filtering this chart down to one persona would just draw a
// single bar, which defeats its point (comparing personas against each
// other).
export function personaBreakdown() {
  const totals = new Map();
  for (const r of records) totals.set(r.persona, (totals.get(r.persona) || 0) + r.lineTotal);
  return [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([persona, revenue]) => ({ persona, revenue }));
}

export function outlierSample(list, limit = 8) {
  return list
    .filter((r) => r.isOutlier)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}
