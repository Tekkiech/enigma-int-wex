// Every function here calls the Flask API. `credentials: 'include'`
// sends our login cookie along with each request.
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

// Gets every product in one go - there aren't that many, so searching
// and filtering just happens in the browser instead of on the server.
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

// Gets the fake shopper data for the /metrics page.
export function fetchMetricsOrders() {
  return request('/api/metrics/orders');
}

// What else gets bought alongside this product, real orders and fake
// shoppers combined.
export function fetchFrequentlyBoughtTogether(productId) {
  return request(`/api/products/${productId}/frequently-bought-together`);
}
