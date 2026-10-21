import { createContext, useContext, useState, useCallback } from "react";
import { X } from "lucide-react";

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((type, message, duration = 3500) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, duration);
  }, []);

  const api = {
    success: (m, d) => push("success", m, d),
    error: (m, d) => push("error", m, d),
    info: (m, d) => push("info", m, d)
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span>{t.message}</span>
            <button
              className="toast-close"
              onClick={() =>
                setToasts((x) => x.filter((i) => i.id !== t.id))
              }
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}