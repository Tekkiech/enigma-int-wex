// Helper functions that turn the raw order records into the numbers each
// chart on the metrics page needs. They all just take an array of
// records and return something simpler - no state is kept in here.

const MONTH_LABEL = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short' });

export function personaList(records) {
  return [...new Set(records.map((r) => r.persona))].sort();
}

export function filterByPersona(records, persona) {
  return persona === 'all' ? records : records.filter((r) => r.persona === persona);
}

export function computeKpis(records) {
  const revenue = records.reduce((sum, r) => sum + r.lineTotal, 0);
  const orderIds = new Set(records.map((r) => r.orderId));
  const outlierCount = records.filter((r) => r.isOutlier).length;
  return {
    revenue,
    orderCount: orderIds.size,
    avgOrderValue: orderIds.size ? revenue / orderIds.size : 0,
    outlierRate: records.length ? outlierCount / records.length : 0,
  };
}

// Revenue and order count for every month in the dataset. allRecords is
// used just to figure out which months exist, so a month with zero
// orders for the current filter still shows up as $0 instead of
// disappearing from the chart.
export function monthlySeries(records, allRecords) {
  const allMonths = [...new Set(allRecords.map((r) => r.date.slice(0, 7)))].sort();
  const byMonth = new Map(allMonths.map((month) => [month, { revenue: 0, orders: new Set() }]));

  for (const r of records) {
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

// Top categories by revenue, with everything past that grouped into "Other".
export function categoryBreakdown(records, topCount = 8) {
  const totals = new Map();
  for (const r of records) totals.set(r.category, (totals.get(r.category) || 0) + r.lineTotal);

  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, topCount);
  const restTotal = sorted.slice(topCount).reduce((sum, [, revenue]) => sum + revenue, 0);

  const rows = top.map(([category, revenue]) => ({ category, revenue }));
  if (restTotal > 0) rows.push({ category: 'Other', revenue: restTotal });
  return rows;
}

// Always uses every record, ignoring the persona filter - filtering this
// one down to a single persona would just leave one bar, which isn't
// useful for comparing personas against each other.
export function personaBreakdown(records) {
  const totals = new Map();
  for (const r of records) totals.set(r.persona, (totals.get(r.persona) || 0) + r.lineTotal);
  return [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([persona, revenue]) => ({ persona, revenue }));
}

export function outlierSample(records, limit = 8) {
  return records
    .filter((r) => r.isOutlier)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

// One row per city. A shopper's city never changes between orders, so
// this is really grouping by "which shoppers live here".
export function locationBreakdown(records) {
  const byCity = new Map();

  for (const r of records) {
    if (!byCity.has(r.city)) {
      byCity.set(r.city, {
        city: r.city,
        region: r.region,
        lat: r.lat,
        lng: r.lng,
        revenue: 0,
        orderIds: new Set(),
        personaCounts: new Map(),
      });
    }
    const city = byCity.get(r.city);
    city.revenue += r.lineTotal;
    city.orderIds.add(r.orderId);
    city.personaCounts.set(r.persona, (city.personaCounts.get(r.persona) || 0) + 1);
  }

  return [...byCity.values()]
    .map((city) => ({
      city: city.city,
      region: city.region,
      lat: city.lat,
      lng: city.lng,
      revenue: city.revenue,
      orderCount: city.orderIds.size,
      topPersona: [...city.personaCounts.entries()].sort((a, b) => b[1] - a[1])[0][0],
    }))
    .sort((a, b) => b.revenue - a.revenue);
}
