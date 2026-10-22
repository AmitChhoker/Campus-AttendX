import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 60000, // 60 seconds (Render cold start ke liye)
});
// Auto-refresh access token on 401 (once)
let refreshing = null;

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const url = original?.url || "";

    const shouldSkip =
      url.includes("/auth/login") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/me") ||
      url.includes("/recovery") ||
      original._retry;

    if (
      err.response?.status === 401 &&
      !shouldSkip
    ) {
      original._retry = true;
      try {
        if (!refreshing) {
          refreshing = client
            .post("/auth/refresh")
            .finally(() => {
              refreshing = null;
            });
        }
        await refreshing;
        return client(original);
      } catch {
        // fall through
      }
    }

    return Promise.reject(err);
  }
);

export default client;