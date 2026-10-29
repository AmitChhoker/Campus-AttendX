import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import client from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { LogOut } from "lucide-react"; // <-- Icon import kiya

export default function StudentProfile() {
  const { user, logout, refresh } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  // States
  const [semester, setSemester] = useState(user?.semester || 1);
  const [phone, setPhone] = useState(user?.phone || "");
  const [loading, setLoading] = useState(false);

  // Password Reset States
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  // 1. Update Profile (Semester/Phone)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await client.put("/student/profile", { semester: Number(semester), phone });
      await refresh(); // Context update karein taaki naya data sab jagah dikhe
      success("Profile updated! Your semester has been advanced.");
    } catch (err) {
      error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // 2. Send OTP for Password Reset
  const handleSendOtp = async () => {
    if (!phone) return error("Please enter phone number first");
    setOtpLoading(true);
    try {
      await client.post("/auth/send-otp", { phone });
      setOtpSent(true);
      success("OTP sent to your phone!");
    } catch (err) {
      error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  // 3. Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await client.post("/auth/reset-password", { phone, otp, newPassword });
      success("Password updated! Logging you out...");
      setTimeout(async () => {
        await logout();
        navigate("/login");
      }, 2000);
    } catch (err) {
      error(err.response?.data?.message || "Failed to reset password");
      setLoading(false);
    }
  };

  // 4. Manual Logout
  const handleLogout = async () => {
    if(window.confirm("Are you sure you want to logout?")) {
      await logout();
      navigate("/login");
    }
  };

  return (
    <div className="stack pb-20">
      <div className="page-head"><h2>Profile & Settings</h2></div>

      {/* User Info Card */}
      <div className="card center-text">
        <div className="avatar" style={{ width: 80, height: 80, fontSize: "2rem", margin: "0 auto" }}>
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
        <h3 className="mt">{user?.firstName} {user?.lastName}</h3>
        <p className="muted">{user?.emailId}</p>
        <span className="pill pill-approved mt">STUDENT</span>
      </div>

      {/* Profile Update Form */}
      <div className="card">
        <h3 className="card-title">Update Academic Profile</h3>
        <form onSubmit={handleUpdateProfile} className="form">
          <label className="field">
            <span>Current Semester</span>
            <select value={semester} onChange={(e) => setSemester(e.target.value)}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
            <p className="muted small mt-1">If you move to a new semester, your old data will be saved in Previous Semesters tab.</p>
          </label>

          <label className="field">
            <span>Phone Number (For OTP)</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </label>

          <button className="btn btn-primary" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Password Reset Form */}
      <div className="card">
        <div className="row-between">
          <h3 className="card-title m-0">Security</h3>
          <button className="btn btn-ghost sm" onClick={() => setShowPasswordForm(!showPasswordForm)}>
            {showPasswordForm ? "Cancel" : "Change Password"}
          </button>
        </div>

        {showPasswordForm && (
          <form onSubmit={handleResetPassword} className="form mt">
            <label className="field">
              <span>Registered Phone</span>
              <div className="row-gap">
                <input value={phone} disabled />
                <button type="button" className="btn btn-primary sm" onClick={handleSendOtp} disabled={otpLoading || otpSent}>
                  {otpLoading ? "Sending..." : otpSent ? "OTP Sent" : "Send OTP"}
                </button>
              </div>
            </label>

            {otpSent && (
              <>
                <label className="field">
                  <span>Enter 6-Digit OTP</span>
                  <input value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength="6" />
                </label>
                <label className="field">
                  <span>New Password</span>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength="6" />
                </label>
                <button className="btn btn-danger mt" disabled={loading}>
                  {loading ? "Updating..." : "Reset Password"}
                </button>
              </>
            )}
          </form>
        )}
      </div>

      {/* Logout Button Card */}
      <div className="card">
        <h3 className="card-title">Account Actions</h3>
        <button className="btn btn-danger full mt-2" onClick={handleLogout}>
          <LogOut size={18} /> Logout from this device
        </button>
      </div>
      
    </div>
  );
}