import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import client from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { 
  LogOut, User, Mail, Phone, BookOpen, ShieldCheck, Lock, 
  GraduationCap, Building, RefreshCw, KeyRound 
} from "lucide-react";

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
      await refresh(); 
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
    <div className="stack pb-20 max-w-2xl mx-auto">
      
      <div className="page-head mb-6">
        <h2 className="text-3xl font-bold text-gray-800">My Profile</h2>
        <p className="muted mt-1">Manage your personal information and security.</p>
      </div>

      {/* Profile Info Card */}
      <div className="card glass-panel text-center py-8">
        <div className="avatar mx-auto mb-4" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
          {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
        </div>
        <h3 className="text-2xl font-bold m-0 text-indigo-900">{user?.firstName} {user?.lastName}</h3>
        <p className="text-gray-500 font-medium mt-1">{user?.emailId}</p>
        
        <div className="flex justify-center gap-2 mt-4">
          <span className="pill pill-approved flex items-center gap-1">
            <ShieldCheck size={14} /> STUDENT
          </span>
          <span className="pill pill-pending">
            {user?.department || "SFET"}
          </span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-2 gap-4 mt-2">
        <div className="card flex items-center gap-4">
          <div className="icon-box bg-indigo-50 text-indigo-600"><GraduationCap size={20} /></div>
          <div>
            <p className="small muted m-0">Course & Branch</p>
            <strong className="text-gray-800">{user?.course} - {user?.branch}</strong>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="icon-box bg-emerald-50 text-emerald-600"><BookOpen size={20} /></div>
          <div>
            <p className="small muted m-0">Current Semester</p>
            <strong className="text-gray-800">Semester {user?.semester}</strong>
          </div>
        </div>
      </div>

      {/* Update Academic Profile Form */}
      <div className="card mt-4">
        <div className="border-b pb-4 mb-4">
          <h3 className="m-0 font-bold text-gray-800 flex items-center gap-2">
            <RefreshCw size={18} className="text-indigo-500" /> Update Academic Profile
          </h3>
          <p className="small muted mt-1">Advance your semester or update phone number.</p>
        </div>

        <form onSubmit={handleUpdateProfile} className="form">
          <div className="grid grid-2 gap-4">
            <label className="field">
              <span>Current Semester</span>
              <select value={semester} onChange={(e) => setSemester(e.target.value)}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Phone Number (For OTP)</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </label>
          </div>

          <div className="bg-yellow-50 text-yellow-700 p-3 rounded-lg text-sm mt-2 border border-yellow-200">
            ⚠️ Note: If you move to a new semester, your old data will be saved in the Previous Semesters tab.
          </div>

          <button className="btn btn-primary mt-2 w-fit" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Security / Password Reset Section */}
      <div className="card mt-4">
        <div className="row-between border-b pb-4 mb-4">
          <div>
            <h3 className="m-0 font-bold text-gray-800 flex items-center gap-2">
              <Lock size={18} className="text-indigo-500" /> Security
            </h3>
            <p className="small muted mt-1">Change your login password via OTP.</p>
          </div>
          {!showPasswordForm && (
            <button className="btn btn-primary sm" onClick={() => setShowPasswordForm(true)}>
              Change Password
            </button>
          )}
        </div>

        {showPasswordForm && (
          <form onSubmit={handleResetPassword} className="form animate-fade-in">
            <label className="field">
              <span>Registered Phone</span>
              <div className="row-gap">
                <input value={phone} disabled className="bg-gray-100" />
                <button type="button" className="btn btn-secondary sm" onClick={handleSendOtp} disabled={otpLoading || otpSent}>
                  {otpLoading ? "Sending..." : otpSent ? "OTP Sent" : "Send OTP"}
                </button>
              </div>
            </label>

            {otpSent && (
              <div className="animate-fade-in grid grid-2 gap-4 mt-2">
                <label className="field">
                  <span>Enter 6-Digit OTP</span>
                  <input 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)} 
                    required 
                    maxLength="6" 
                    placeholder="123456"
                  />
                </label>
                <label className="field">
                  <span>New Password</span>
                  <input 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    required 
                    minLength="6" 
                    placeholder="••••••••"
                  />
                </label>
                <div className="span-2 flex gap-2 mt-2">
                  <button type="button" className="btn btn-ghost flex-1" onClick={() => setShowPasswordForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-danger flex-1" disabled={loading}>
                    {loading ? "Updating..." : "Reset Password"}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>

      {/* Logout Action Card */}
      <div className="card mt-4 border-red-100 bg-red-50">
        <div className="row-between">
          <div>
            <h3 className="m-0 font-bold text-red-700 flex items-center gap-2">
              <LogOut size={18} /> Account Actions
            </h3>
            <p className="small text-red-500 mt-1">Safely log out from this device.</p>
          </div>
          <button onClick={handleLogout} className="btn btn-danger shadow-sm">
            Logout
          </button>
        </div>
      </div>

    </div>
  );
}