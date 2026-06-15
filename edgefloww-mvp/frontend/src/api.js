const API = "";

export function setToken(t) { localStorage.setItem("eftoken", t); }
export function getToken() { return localStorage.getItem("eftoken"); }
export function clearToken() { localStorage.removeItem("eftoken"); }

export async function api(path, options = {}) {
  const token = getToken();
  const headers = {};
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (options.headers) Object.assign(headers, options.headers);
  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (res.status === 401 && !path.includes("/auth/")) {
    clearToken();
    window.location.href = "/login";
    throw new Error("Session expired");
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}
