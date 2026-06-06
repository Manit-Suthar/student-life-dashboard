const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/study` : "http://localhost:5000/api/study";

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  // Delete operations typically return 204 No Content
  if (response.status === 204) return null;
  return response.json();
}

export async function getMaterials() {
  const response = await fetch(API_BASE_URL, {
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    }
  });
  return handleResponse(response);
}

export async function addMaterial(data) {
  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function updateMaterial(id, data) {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function deleteMaterial(id) {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    }
  });
  return handleResponse(response);
}
