import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GraduationCap, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { login, user } = useAuth(); 
  
  const [emailId, setEmailId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // 🔥 Eye Toggle State
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(emailId, password);
    } catch (error) {
      alert(error.response?.data?.message || "Invalid Credentials");
      setLoading(false);
    }
  };

  return (
    <div className="auth-page modern-auth-bg">
      <div className="auth-card glass-panel">
        <div className="auth-brand text-center mb-6">
          <div className="auth-icon-wrapper mx-auto mb-3">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
          <p className="text-gray-500 mt-1">Sign in to your AttendX account</p>
        </div>
        
        <form onSubmit={submit} className="form">
          <label className="field">
            <span>Email Address</span>
            <div className="input-wrap">
              <Mail size={18} className="text-gray-400" />
              <input 
                type="email" 
                required 
                value={emailId} 
                onChange={(e) => setEmailId(e.target.value)} 
                placeholder="you@svsu.ac.in" 
                className="text-gray-800 font-medium"
              />
            </div>
          </label>
          
          <label className="field">
            <span>Password</span>
            <div className="input-wrap">
              <Lock size={18} className="text-gray-400" />
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
                className="text-gray-800 font-medium"
              />
              {/* 🔥 Eye Icon Button */}
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          
          <button type="submit" className="btn btn-primary full big mt-2 shadow-lg hover:scale-[1.02] transition-transform" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
        
        <div className="auth-foot mt-6 text-center text-sm text-gray-600">
          <Link to="/recover" className="text-indigo-600 font-semibold hover:underline">Forgot password?</Link>
          <div className="mt-3">
            New student? <Link to="/register" className="text-indigo-600 font-bold hover:underline">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}