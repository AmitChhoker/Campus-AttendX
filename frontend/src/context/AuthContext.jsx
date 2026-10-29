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

  const login = async (email, password) => {
    await client.post("/auth/login", { emailId: email, password });
    await refresh(); // User data fetch karne ke liye
};

  const logout = async () => {
    try {
      await client.post("/auth/logout");
    } catch {}
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}