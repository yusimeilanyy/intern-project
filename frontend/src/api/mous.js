function getToken() {
  return localStorage.getItem("token");
}

async function api(path, options = {}) {
  const token = getToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) throw new Error(data?.message || `Request gagal (${res.status})`);
  return data;
}

export const mouApi = {
  list: (category, status = "all") =>
    api(`/api/mous?category=${category}&status=${status}`),

  create: (payload) =>
    api(`/api/mous`, { method: "POST", body: JSON.stringify(payload) }),

  update: (id, payload) =>
    api(`/api/mous/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  remove: (id) =>
    api(`/api/mous/${id}`, { method: "DELETE" }),
};