import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { ChevronLeft, Lock, User, Mail, Building, ShieldCheck } from "lucide-react";

export default function FacultyProfile() {
  const { success, error } = useToast();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    client.get("/faculty/settings/profile")
      .then(res => setProfile(res.data.data))
      .catch(() => error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      return error("New password and confirm password do not match");
    }
    
    setIsSubmitting(true);
    try {
      await client.patch("/faculty/settings/change-password", form);
      success("Password changed successfully. Please login again.");
      
      // Logout user after password change
      setTimeout(async () => {
        await client.post("/faculty/settings/logout");
        navigate("/login");
      }, 2000);
      
    } catch (err) {
      error(err.response?.data?.message || "Failed to change password");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="loader-full">Loading Profile...</div>;
  if (!profile) return <div className="error-box">Profile not found</div>;

  return (
    <div className="stack pb-20 max-w-2xl mx-auto">
      <div className="row-between mb-2">
        <button className="btn btn-ghost sm" onClick={() => navigate("/faculty")}>
          <ChevronLeft size={18} /> Back to Dashboard
        </button>
      </div>

      <div className="page-head mb-6">
        <h2 className="text-3xl font-bold text-gray-800">My Profile</h2>
        <p className="muted mt-1">Manage your personal information and security.</p>
      </div>

      {/* Profile Info Card */}
      <div className="card glass-panel text-center py-8">
        <div className="avatar mx-auto mb-4" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
          {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
        </div>
        <h3 className="text-2xl font-bold m-0 text-indigo-900">{profile.firstName} {profile.lastName}</h3>
        <p className="text-gray-500 font-medium mt-1">{profile.emailId}</p>
        
        <div className="flex justify-center gap-2 mt-4">
          <span className="pill pill-approved flex items-center gap-1">
            <ShieldCheck size={14} /> {profile.role.toUpperCase()}
          </span>
          <span className="pill pill-pending">
            {profile.department}
          </span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-2 gap-4">
        <div className="card flex items-center gap-4">
          <div className="icon-box bg-indigo-50 text-indigo-600"><Building size={20} /></div>
          <div>
            <p className="small muted m-0">Branch</p>
            <strong className="text-gray-800">{profile.branch || "N/A"}</strong>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="icon-box bg-green-50 text-green-600"><Mail size={20} /></div>
          <div>
            <p className="small muted m-0">Phone</p>
            <strong className="text-gray-800">{profile.phone || "N/A"}</strong>
          </div>
        </div>
      </div>

      {/* Security / Password Change Section */}
      <div className="card mt-4">
        <div className="row-between border-b pb-4 mb-4">
          <div>
            <h3 className="m-0 font-bold text-gray-800 flex items-center gap-2">
              <Lock size={18} className="text-indigo-500" /> Security
            </h3>
            <p className="small muted mt-1">Change your login password.</p>
          </div>
          {!showPasswordForm && (
            <button className="btn btn-primary sm" onClick={() => setShowPasswordForm(true)}>
              Change Password
            </button>
          )}
        </div>

        {showPasswordForm && (
          <form onSubmit={handlePasswordChange} className="form animate-fade-in">
            <div className="bg-yellow-50 text-yellow-700 p-3 rounded-lg text-sm mb-4 border border-yellow-200">
              ⚠️ Note: You can only change your password <strong>2 times</strong> in a month.
            </div>
            
            <label className="field">
              <span>Current Password</span>
              <input 
                type="password" 
                required 
                value={form.currentPassword} 
                onChange={e => setForm({...form, currentPassword: e.target.value})} 
              />
            </label>
            <label className="field">
              <span>New Password (Min 8 chars)</span>
              <input 
                type="password" 
                required 
                minLength={8}
                value={form.newPassword} 
                onChange={e => setForm({...form, newPassword: e.target.value})} 
              />
            </label>
            <label className="field">
              <span>Confirm New Password</span>
              <input 
                type="password" 
                required 
                value={form.confirmPassword} 
                onChange={e => setForm({...form, confirmPassword: e.target.value})} 
              />
            </label>
            
            <div className="flex gap-2 mt-4">
              <button type="button" className="btn btn-ghost flex-1" onClick={() => setShowPasswordForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}