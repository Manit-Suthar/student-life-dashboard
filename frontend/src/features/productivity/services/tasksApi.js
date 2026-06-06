const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/tasks` : "http://localhost:5000/api/tasks";

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

export const fetchTasks = async () => {
  const response = await fetch(API_BASE_URL, { headers: getHeaders() });
  return handleResponse(response);
};

export const addTask = async (taskData) => {
  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(taskData),
  });
  return handleResponse(response);
};

export const updateTask = async (id, taskData) => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(taskData),
  });
  return handleResponse(response);
};

export const deleteTask = async (id) => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse(response);
};
