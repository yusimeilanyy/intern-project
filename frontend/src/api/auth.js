const API_BASE = "/api";

async function safeJson(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { message: text };
  }
}

export async function login(identifier, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });

  const data = await safeJson(res);

  if (!res.ok) {
    throw new Error(data?.message || `Login gagal (${res.status})`);
  }
  return data; // { token, user }
}

export async function me() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const data = await safeJson(res);

  if (!res.ok) throw new Error(data?.message || `Request gagal (${res.status})`);
  return data; // { user }
}

export function logout() {
  localStorage.removeItem("token");
}
