import axios from "axios";

// Automatically use Localhost if running locally, Render if live
const API_URL = import.meta.env.PROD 
  ? "https://campus-attendx-backend.onrender.com/api" 
  : "http://localhost:4000/api"; // <-- Apna backend port yahan daalein (4000)

const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
    withCredentials: true, // <-- Cookies ke liye zaroori
    headers: { "Content-Type": "application/json" },
});

// ... baaki interceptor code same rahega ...
export default client;