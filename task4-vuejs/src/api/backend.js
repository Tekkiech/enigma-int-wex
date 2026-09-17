// The only file that knows the Flask API's shape - products and
// categories included. DummyJSON is only ever hit once, by
// server/seed.py; the running app never calls it directly, this module
// is the sole source of catalogue data as far as the frontend knows.
//
// Session-cookie auth, so every request needs `credentials: 'include'`
// (the API and the dev server are different origins) and the Flask side
// needs matching CORS_ORIGIN + supports_credentials.
//
// Hardcoded to localhost for now - this becomes an env-driven base URL
// once the backend has somewhere real to live (see server/README.md).
const API_BASE = 'http://localhost:5000';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.error || `Request to ${path} failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) return null;
  return response.json();
}

export function signup({ name, email, password }) {
  return request('/api/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) });
}

export function login({ email, password }) {
  return request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function logout() {
  return request('/api/auth/logout', { method: 'POST' });
}

export function fetchCurrentUser() {
  return request('/api/auth/me');
}

// The full catalogue in one call, same as the old DummyJSON layer - the
// dataset is small enough (~194 products) that browsing/search/filter/
// sort all still happen client-side against this rather than paging.
export function fetchAllProducts() {
  return request('/api/products');
}

export function fetchCart() {
  return request('/api/cart');
}

export function putCartItem(productId, quantity) {
  return request(`/api/cart/${productId}`, { method: 'PUT', body: JSON.stringify({ quantity }) });
}

export function deleteCartItem(productId) {
  return request(`/api/cart/${productId}`, { method: 'DELETE' });
}

export function fetchWishlist() {
  return request('/api/wishlist');
}

export function putWishlistItem(productId) {
  return request(`/api/wishlist/${productId}`, { method: 'PUT' });
}

export function deleteWishlistItem(productId) {
  return request(`/api/wishlist/${productId}`, { method: 'DELETE' });
}

export function placeOrder() {
  return request('/api/orders', { method: 'POST' });
}

export function fetchOrders() {
  return request('/api/orders');
}

export function submitReview(productId, { rating, comment }) {
  return request(`/api/products/${productId}/reviews`, { method: 'POST', body: JSON.stringify({ rating, comment }) });
}
