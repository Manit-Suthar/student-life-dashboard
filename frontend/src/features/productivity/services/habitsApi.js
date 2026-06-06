const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/habits` : "http://localhost:5000/api/habits";

async function handleResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Server error");
  }
  if (response.status === 204) return null;
  return response.json();
}

const getHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token, authorization denied");
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
};

export const fetchHabits = async () => {
  const response = await fetch(API_BASE_URL, { headers: getHeaders() });
  return handleResponse(response);
};

export const addHabit = async (habitData) => {
  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(habitData),
  });
  return handleResponse(response);
};

export const updateHabit = async (id, habitData) => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(habitData),
  });
  return handleResponse(response);
};

export const deleteHabit = async (id) => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse(response);
};
