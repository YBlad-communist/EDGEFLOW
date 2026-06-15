import axios from "axios";

const client = axios.create({
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes("/auth/")) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => client(originalRequest));
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        await client.post("/api/auth/refresh");
        processQueue(null);
        return client(originalRequest);
      } catch {
        processQueue(error);
        window.location.href = "/login";
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export async function api(path, options = {}) {
  const headers = {};
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (options.headers) Object.assign(headers, options.headers);
  try {
    const response = await client({
      method: options.method || "GET",
      url: path,
      data: options.body,
      headers,
    });
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.error || err.message || "Request failed");
  }
}

export default client;
