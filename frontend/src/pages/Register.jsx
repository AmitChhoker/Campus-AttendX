import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../api/client";
import { useToast } from "../context/ToastContext";
import { GraduationCap, Eye, EyeOff, User, Mail, Lock, Phone, BookOpen } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false); // 🔥 Eye Toggle State

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    emailId: "",
    password: "",
    phone: "",
    registrationNumber: "",
    department: "SFET",
    course: "B.TECH",
    branch: "CE",
    batch: 2021,
    semester: 1,
    role: "student"
  });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await client.post("/auth/register", form);
      success("Registration successful! Please login.");
      navigate("/login");
    } catch (err) {
      error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="auth-page modern-auth-bg py-10">
      <div className="auth-card glass-panel" style={{ maxWidth: "700px" }}>
        <div className="auth-brand text-center mb-6">
          <div className="auth-icon-wrapper mx-auto mb-3">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Create Account</h1>
          <p className="text-gray-500 mt-1">Join AttendX to track your attendance</p>
        </div>

        <form onSubmit={submit} className="form grid-2">
          
          {/* Section: Personal Info */}
          <div className="span-2 auth-section-title">
            <User size={16} /> Personal Information
          </div>

          <label className="field">
            <span>First Name</span>
            <input required name="firstName" value={form.firstName} onChange={handleChange} placeholder="Rahul" className="bg-gray-50" />
          </label>
          
          <label className="field">
            <span>Last Name</span>
            <input required name="lastName" value={form.lastName} onChange={handleChange} placeholder="Sharma" className="bg-gray-50" />
          </label>

          <label className="field span-2">
            <span>College Email</span>
            <div className="input-wrap bg-gray-50">
              <Mail size={16} className="text-gray-400" />
              <input required type="email" name="emailId" value={form.emailId} onChange={handleChange} placeholder="rahul@svsu.ac.in" />
            </div>
          </label>

          <label className="field">
            <span>Password</span>
            <div className="input-wrap bg-gray-50">
              <Lock size={16} className="text-gray-400" />
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                name="password" 
                value={form.password} 
                onChange={handleChange} 
                placeholder="Strong password" 
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <label className="field">
            <span>Phone Number</span>
            <div className="input-wrap bg-gray-50">
              <Phone size={16} className="text-gray-400" />
              <input required name="phone" value={form.phone} onChange={handleChange} placeholder="10-digit number" />
            </div>
          </label>

          {/* Section: Academic Info */}
          <div className="span-2 auth-section-title mt-4">
            <BookOpen size={16} /> Academic Details
          </div>

          <label className="field">
            <span>Roll Number</span>
            <input required name="registrationNumber" value={form.registrationNumber} onChange={handleChange} placeholder="CS21B001" className="bg-gray-50" />
          </label>

          <label className="field">
            <span>Department</span>
            <input disabled name="department" value={form.department} className="bg-gray-100 cursor-not-allowed" />
          </label>

          <label className="field">
            <span>Course</span>
            <select name="course" value={form.course} onChange={handleChange} className="bg-gray-50">
              <option value="B.TECH">B.TECH</option>
              <option value="BCA">BCA</option>
              <option value="DIPLOMA">DIPLOMA</option>
            </select>
          </label>

          <label className="field">
            <span>Branch</span>
            <select name="branch" value={form.branch} onChange={handleChange} className="bg-gray-50">
              <option value="CE">CE</option>
              <option value="AI/ML">AI/ML</option>
              <option value="ECE">ECE</option>
              <option value="ME">ME</option>
            </select>
          </label>

          <label className="field">
            <span>Batch (Year)</span>
            <input required type="number" name="batch" value={form.batch} onChange={handleChange} min="2000" max="2100" className="bg-gray-50" />
          </label>

          <label className="field">
            <span>Semester</span>
            <input required type="number" name="semester" value={form.semester} onChange={handleChange} min="1" max="8" className="bg-gray-50" />
          </label>

          <div className="span-2 mt-4">
            <button className="btn btn-primary full big shadow-lg hover:scale-[1.02] transition-transform" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </div>
        </form>

        <div className="auth-foot mt-6 text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-indigo-600 font-bold hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}