// Composite "field-order" values for the sort dropdown, mapped to the
// sortBy/order query params DummyJSON's /products endpoints accept.
export const SORT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'title-asc', label: 'Name (A–Z)' },
  { value: 'title-desc', label: 'Name (Z–A)' },
  { value: 'price-asc', label: 'Price (low to high)' },
  { value: 'price-desc', label: 'Price (high to low)' },
  { value: 'rating-desc', label: 'Rating (highest first)' },
];

export function parseSortValue(value) {
  if (!value || value === 'default') return { sortBy: '', order: 'asc' };
  const [sortBy, order] = value.split('-');
  return { sortBy, order };
}

export function serializeSortValue(sortBy, order) {
  if (!sortBy) return 'default';
  return `${sortBy}-${order}`;
}
