// Thin fetch wrapper around the public DummyJSON products API
// (https://dummyjson.com/docs/products). The whole catalogue is only ~194
// products across 24 categories, so the app fetches everything once and
// does browsing/search/filter/sort client-side rather than paging.

const BASE_URL = 'https://dummyjson.com';

export async function fetchAllProducts() {
  const response = await fetch(`${BASE_URL}/products?limit=0`);
  if (!response.ok) {
    throw new Error(`DummyJSON request failed (${response.status}): /products`);
  }
  const data = await response.json();
  return data.products;
}
