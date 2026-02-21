const API_BASE_URL = "http://localhost:5000/api/inventory";

async function handleResponse(response) {
  if (!response.ok) {
    let message = "Request failed";
    try {
      const body = await response.json();
      message = body.message || message;
    } catch {
      message = (await response.text()) || message;
    }
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
}

function withQuery(path, query = {}) {
  const url = new URL(`${API_BASE_URL}${path}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

export function getItems(query = {}) {
  return fetch(withQuery("/items", query)).then(handleResponse);
}

export function createItem(payload) {
  return fetch(`${API_BASE_URL}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(handleResponse);
}

export function updateItem(id, payload) {
  return fetch(`${API_BASE_URL}/items/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(handleResponse);
}

export function getBorrowed(query = {}) {
  return fetch(withQuery("/borrowed", query)).then(handleResponse);
}

export function createBorrowed(payload) {
  return fetch(`${API_BASE_URL}/borrowed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(handleResponse);
}

export function returnBorrowed(id) {
  return fetch(`${API_BASE_URL}/borrowed/${id}/return`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  }).then(handleResponse);
}

export function getStats() {
  return fetch(`${API_BASE_URL}/stats`).then(handleResponse);
}

export function getCategories() {
  return fetch(`${API_BASE_URL}/categories`).then(handleResponse);
}

export function createCategory(payload) {
  return fetch(`${API_BASE_URL}/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(handleResponse);
}

export function updateCategory(id, payload) {
  return fetch(`${API_BASE_URL}/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(handleResponse);
}

export function deleteCategory(id) {
  return fetch(`${API_BASE_URL}/categories/${id}`, { method: "DELETE" }).then(handleResponse);
}
