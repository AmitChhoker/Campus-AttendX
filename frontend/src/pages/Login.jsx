import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GraduationCap, Mail, Lock } from "lucide-react";

export default function Login() {
  const { login } = useAuth(); // Context se login function liya
  const navigate = useNavigate();
  
  const [emailId, setEmailId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(emailId, password);
      window.location.href = "/"; // <-- Ye perfect hai
    } catch (error) {
      alert(error.response?.data?.message || "Login failed.");
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
              />
            </div>
          </label>

          <button type="submit" className="btn btn-primary full" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
        
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