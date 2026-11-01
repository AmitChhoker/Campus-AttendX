import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../api/client";
import { useToast } from "../context/ToastContext";
import { Phone, ShieldCheck, Mail, ChevronLeft, KeyRound } from "lucide-react";

export default function Recover() {
  const { success, error } = useToast();
  const navigate = useNavigate();
  
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState(1);
  const [masked, setMasked] = useState("");
  const [loading, setLoading] = useState(false);

  const requestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await client.post("/recovery/request-otp", { phone });
      success("OTP sent successfully!");
      setStage(2);
    } catch (err) {
      error(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await client.post("/recovery/verify-otp", { phone, otp });
      setMasked(res.data.emailId);
      setStage(3);
      success("OTP verified successfully!");
    } catch (err) {
      error(err.response?.data?.error || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page modern-auth-bg">
      <div className="auth-card glass-panel text-center">
        
        {/* Back Button */}
        <button 
          className="btn btn-ghost sm mb-4 mx-auto" 
          onClick={() => navigate("/login")}
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <ChevronLeft size={16} /> Back to Login
        </button>

        <div className="auth-icon-wrapper mx-auto mb-3">
          {stage === 1 && <Phone size={32} />}
          {stage === 2 && <ShieldCheck size={32} />}
          {stage === 3 && <Mail size={32} />}
        </div>

        <h2 className="text-2xl font-bold text-gray-800 m-0">Account Recovery</h2>
        <p className="text-gray-500 mt-1 mb-6">
          {stage === 1 && "Enter your registered phone number."}
          {stage === 2 && "Enter the 6-digit OTP sent to your phone."}
          {stage === 3 && "We found your account!"}
        </p>

        {/* STEP 1: Phone Number */}
        {stage === 1 && (
          <form onSubmit={requestOtp} className="form text-left">
            <label className="field">
              <span>Registered Phone Number</span>
              <div className="input-wrap">
                <Phone size={18} className="text-gray-400" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="text-gray-800 font-medium"
                />
              </div>
            </label>
            <button className="btn btn-primary full big mt-2" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* STEP 2: Verify OTP */}
        {stage === 2 && (
          <form onSubmit={verify} className="form text-left animate-fade-in">
            <label className="field">
              <span>Enter 6-Digit OTP</span>
              <div className="input-wrap">
                <KeyRound size={18} className="text-gray-400" />
                <input
                  type="text"
                  required
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="text-gray-800 font-bold tracking-[0.5em] text-center"
                />
              </div>
            </label>
            <button className="btn btn-primary full big mt-2" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}

        {/* STEP 3: Success Screen */}
        {stage === 3 && (
          <div className="animate-fade-in">
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl mb-4">
              <p className="m-0 text-sm font-medium">Your registered account email is:</p>
              <h3 className="m-0 text-xl font-bold mt-1 tracking-wide">{masked}</h3>
            </div>
            <p className="text-gray-500 text-sm mt-4">
              For security reasons, please contact the <strong>Admin</strong> to reset your password.
            </p>
            <Link to="/login" className="btn btn-primary full mt-4">
              Go to Login
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}