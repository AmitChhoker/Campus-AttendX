import axios from "axios";

const client = axios.create({
  baseURL: "http://localhost:4000/api", // Aapka backend URL
  withCredentials: true, 
});

// 🔥 Ye interceptor har request me token attach karega
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;