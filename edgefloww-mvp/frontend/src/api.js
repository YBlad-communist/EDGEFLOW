const API = "";
let token = localStorage.getItem("eftoken") || null;

export function setToken(t) { token = t; localStorage.setItem("eftoken", t); }
export function getToken() { return token; }
export function clearToken() { token = null; localStorage.removeItem("eftoken"); }

export async function api(path, options = {}) {
  const headers = { "Content-Type": options.body instanceof FormData ? undefined : "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers: headers["Content-Type"] === undefined ? { Authorization: headers["Authorization"] } : headers });
  if (res.status === 401 && !path.includes("/auth/")) { clearToken(); window.location.href = "/login"; throw new Error("Session expired"); }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}
