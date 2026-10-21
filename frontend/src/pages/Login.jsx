import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { GraduationCap, Mail, Lock } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const { error } = useToast();
  const navigate = useNavigate();
  const [emailId, setEmailId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(emailId.trim().toLowerCase(), password);
      if (!user) throw new Error("Login failed");
      navigate(`/${user.role}`);
    } catch (err) {
      error(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <GraduationCap size={32} />
          <h1>AttendX</h1>
          <p>Sign in to your campus attendance account</p>
        </div>
        <form onSubmit={submit} className="form">
          <label className="field">
            <span>Email</span>
            <div className="input-wrap">
              <Mail size={16} />
              <input
                type="email"
                required
                value={emailId}
                onChange={(e) => setEmailId(e.target.value)}
                placeholder="you@svsu.ac.in"
                autoComplete="email"
              />
            </div>
          </label>

          <label className="field">
            <span>Password</span>
            <div className="input-wrap">
              <Lock size={16} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </label>

          <button className="btn btn-primary full" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
        
        {/* Yahan Register Link add kiya gaya hai */}
        <div className="auth-foot" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link to="/recover">Forgot password?</Link>
          <div>
            New student? <Link to="/register" style={{ fontWeight: 'bold' }}>Register here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}