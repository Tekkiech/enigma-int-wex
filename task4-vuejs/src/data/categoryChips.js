// DummyJSON categories don't carry their own sub-categories, only a
// free-text `tags` array per product — and that array's shape varies by
// category (groceries products are tagged just ["fruits"]; a furniture
// product is tagged ["furniture", "beds"], repeating the category name
// as a generic first tag). This derives a small set of filter chips from
// whatever category's products are handed to it, rather than hardcoding
// a tag map per category.
function titleCase(tag) {
  return tag.replace(/\b\w/g, (c) => c.toUpperCase());
}

const MAX_CHIPS = 7;

export function buildCategoryChips(products) {
  const total = products.length;
  const tagFrequency = {};
  for (const product of products) {
    for (const tag of product.tags || []) tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
  }

  // A tag that shows up on most products in this category describes the
  // category itself, not a useful sub-filter — drop it before picking chips.
  const genericTags = new Set(Object.keys(tagFrequency).filter((tag) => tagFrequency[tag] > total * 0.5));

  function specificTag(product) {
    const specific = (product.tags || []).filter((tag) => !genericTags.has(tag));
    return specific.length ? specific[specific.length - 1] : null;
  }

  const chipCounts = {};
  for (const product of products) {
    const tag = specificTag(product);
    if (tag) chipCounts[tag] = (chipCounts[tag] || 0) + 1;
  }

  const topTags = Object.entries(chipCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_CHIPS)
    .map(([tag]) => tag);
  const topTagSet = new Set(topTags);
  const hasOverflow = Object.keys(chipCounts).length > topTags.length;

  const chips = ['All', ...topTags.map(titleCase)];
  if (hasOverflow) chips.push('Other');

  function classify(product) {
    const tag = specificTag(product);
    return tag && topTagSet.has(tag) ? titleCase(tag) : 'Other';
  }

  return { chips, classify };
}
