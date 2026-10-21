import { useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import { useToast } from "../context/ToastContext";

export default function Recover() {
  const { success, error } = useToast();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState(1);
  const [masked, setMasked] = useState("");

  const requestOtp = async (e) => {
    e.preventDefault();
    try {
      await client.post("/recovery/request-otp", { phone });
      success("OTP sent to your phone");
      setStage(2);
    } catch (err) {
      error(err.response?.data?.error || "Failed");
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    try {
      const res = await client.post("/recovery/verify-otp", { phone, otp });
      setMasked(res.data.emailId);
      setStage(3);
      success("OTP verified");
    } catch (err) {
      error(err.response?.data?.error || "Failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Account Recovery</h2>
        {stage === 1 && (
          <form onSubmit={requestOtp} className="form">
            <label className="field">
              <span>Phone Number</span>
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
              />
            </label>
            <button className="btn btn-primary full">Send OTP</button>
          </form>
        )}
        {stage === 2 && (
          <form onSubmit={verify} className="form">
            <label className="field">
              <span>Enter OTP</span>
              <input
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit code"
              />
            </label>
            <button className="btn btn-primary full">Verify</button>
          </form>
        )}
        {stage === 3 && (
          <div className="center-text">
            <p>Your account email:</p>
            <strong>{masked}</strong>
            <p className="muted">Contact admin to reset the password.</p>
          </div>
        )}
        <div className="auth-foot">
          <Link to="/login">← Back to login</Link>
        </div>
      </div>
    </div>
  );
}