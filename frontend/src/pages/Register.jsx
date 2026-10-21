import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../api/client";
import { useToast } from "../context/ToastContext";
import { GraduationCap } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

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
    role: "student" // Fixed role
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
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: "600px" }}>
        <div className="auth-brand">
          <GraduationCap size={32} />
          <h1>Student Registration</h1>
          <p>Create your AttendX account</p>
        </div>

        <form onSubmit={submit} className="form grid-2">
          <label className="field">
            <span>First Name</span>
            <input required name="firstName" value={form.firstName} onChange={handleChange} placeholder="Rahul" />
          </label>
          
          <label className="field">
            <span>Last Name</span>
            <input required name="lastName" value={form.lastName} onChange={handleChange} placeholder="Sharma" />
          </label>

          <label className="field span-2">
            <span>College Email (must end with @svsu.ac.in)</span>
            <input required type="email" name="emailId" value={form.emailId} onChange={handleChange} placeholder="rahul@svsu.ac.in" />
          </label>

          <label className="field">
            <span>Password</span>
            <input required type="password" name="password" value={form.password} onChange={handleChange} placeholder="Strong password" />
          </label>

          <label className="field">
            <span>Phone Number</span>
            <input required name="phone" value={form.phone} onChange={handleChange} placeholder="10-digit number" />
          </label>

          <label className="field">
            <span>Roll Number</span>
            <input required name="registrationNumber" value={form.registrationNumber} onChange={handleChange} placeholder="CS21B001" />
          </label>

          <label className="field">
            <span>Department</span>
            <input disabled name="department" value={form.department} />
          </label>

          <label className="field">
            <span>Course</span>
            <select name="course" value={form.course} onChange={handleChange}>
              <option value="B.TECH">B.TECH</option>
              <option value="BCA">BCA</option>
              <option value="DIPLOMA">DIPLOMA</option>
            </select>
          </label>

          <label className="field">
            <span>Branch</span>
            <select name="branch" value={form.branch} onChange={handleChange}>
              <option value="CE">CE</option>
              <option value="AI/ML">AI/ML</option>
              <option value="ECE">ECE</option>
              <option value="ME">ME</option>
            </select>
          </label>

          <label className="field">
            <span>Batch (Year)</span>
            <input required type="number" name="batch" value={form.batch} onChange={handleChange} min="2000" max="2100" />
          </label>

          <label className="field">
            <span>Semester</span>
            <input required type="number" name="semester" value={form.semester} onChange={handleChange} min="1" max="8" />
          </label>

          <div className="span-2 mt">
            <button className="btn btn-primary full" disabled={loading}>
              {loading ? "Registering…" : "Create Account"}
            </button>
          </div>
        </form>

        <div className="auth-foot">
          Already have an account? <Link to="/login" style={{ fontWeight: 'bold' }}>Login here</Link>
        </div>
      </div>
    </div>
  );
}