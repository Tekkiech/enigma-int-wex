// Thin fetch wrapper around the public DummyJSON products API
// (https://dummyjson.com/docs/products), scoped to a single category. The
// groceries category only has ~27 products, so the app fetches all of them
// once and does search/filter/sort client-side rather than paging.

const BASE_URL = 'https://dummyjson.com';

export async function fetchGroceries() {
  const response = await fetch(`${BASE_URL}/products/category/groceries?limit=0`);
  if (!response.ok) {
    throw new Error(`DummyJSON request failed (${response.status}): /products/category/groceries`);
  }
  const data = await response.json();
  return data.products;
}
