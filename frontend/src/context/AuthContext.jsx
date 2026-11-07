import { createContext, useContext, useEffect, useState } from "react";
import client from "../api/client";
// 🔥 Device utils import karna zaroori hai
import { 
  getStoredDevice, 
  generateDeviceId, 
  generateDeviceKey, 
  storeDevice 
} from "../utils/deviceBinding";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  // Login function
  const login = async (email, password) => {
    // 1. Request bhejein
    const res = await client.post("/auth/login", { emailId: email, password });
    
    // 2. Token ko LocalStorage mein save karein
    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
    }

    // 3. User state update karein
    setUser(res.data.user);

    // 🔥 4. AUTO DEVICE BINDING (Only for Students)
    if (res.data.user.role === "student") {
      try {
        let dev = getStoredDevice();
        
        // Agar localStorage me device nahi hai, toh naya generate karein
        if (!dev) {
          dev = {
            deviceId: generateDeviceId(),
            deviceKey: generateDeviceKey()
          };
          storeDevice(dev);
        }

        // Backend ko bind request bhejein (Overwrite logic backend me laga hua hai)
        await client.post("/student/device/bind", { 
          deviceId: dev.deviceId, 
          deviceKey: dev.deviceKey 
        });
        
        console.log("✅ Device auto-bound successfully on login");
      } catch (err) {
        console.error("❌ Auto device bind failed:", err);
      }
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await client.post("/auth/logout");
    } catch (err) {}
    
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}