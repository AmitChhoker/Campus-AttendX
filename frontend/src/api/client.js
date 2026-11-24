import axios from "axios";

// 🔥 FIX: localhost ki jagah Render ka URL daalein
// Agar aap Vercel par Environment Variable set karte hain toh VITE_API_URL use karein, warna direct Render ka link daalein.
const BASE_URL = import.meta.env.VITE_API_URL || "https://campus-attendx.onrender.com/api"; 
// Note: Apne Render dashboard se apna exact backend URL copy karke yahan daalein.

const client = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// 🔥 Token automatically attach karne ke liye
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;