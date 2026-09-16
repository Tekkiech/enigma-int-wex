// DummyJSON's groceries category doesn't carry its own sub-categories, only
// a free-text `tags` array per product. This maps those tags onto a small,
// fixed set of aisle-style chips for the category filter row.
const TAG_TO_CHIP = {
  fruits: 'Fruits',
  vegetables: 'Vegetables',
  dairy: 'Dairy',
  meat: 'Meat & Seafood',
  seafood: 'Meat & Seafood',
  beverages: 'Beverages',
  coffee: 'Beverages',
};

const FALLBACK_CHIP = 'Pantry';

export const CHIPS = ['All', 'Fruits', 'Vegetables', 'Dairy', 'Meat & Seafood', 'Beverages', 'Pantry'];

export function chipForProduct(product) {
  for (const tag of product.tags || []) {
    if (TAG_TO_CHIP[tag]) return TAG_TO_CHIP[tag];
  }
  return FALLBACK_CHIP;
}
