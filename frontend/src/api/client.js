import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  withCredentials: true, // Cookies ke liye rakhein (backup)
  headers: { "Content-Type": "application/json" },
});

// 🔥 Request Interceptor: Har request ke saath Token bhejne ke liye
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ... baaki error interceptor code same rahega ...
export default client;