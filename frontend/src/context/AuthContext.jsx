import { createContext, useContext, useEffect, useState } from "react";
import client from "../api/client";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // AuthContext.jsx mein ye hona chahiye
const refresh = async () => {
    try {
        const res = await client.get("/auth/me");
        setUser(res.data.user);
    } catch (err) {
        setUser(null);
    }
};

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, []);

 // login function
const login = async (email, password) => {
    // 1. Request bhejein
    const res = await client.post("/auth/login", { emailId: email, password });
    
    // 2. Token ko LocalStorage mein save karein
    if (res.data.token) {
        localStorage.setItem("token", res.data.token);
    }

    // 3. User state update karein
    setUser(res.data.user);
};

// logout function
const logout = async () => {
    try {
        await client.post("/auth/logout");
    } catch (err) {}
    // 🔥 Logout par token remove karein
    localStorage.removeItem("token");
    setUser(null);
};

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}