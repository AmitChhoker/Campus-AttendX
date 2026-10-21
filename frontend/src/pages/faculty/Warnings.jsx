import { useState } from "react";
import client from "../../api/client";
import { useToast } from "../../context/ToastContext";

export default function FacultyWarnings() {
  const { success, error } = useToast();
  const [form, setForm] = useState({ course: "B.TECH", branch: "CE", semester: 7 });
  const [loading, setLoading] = useState(false);

  const sendBulk = async (e) => {
    e.preventDefault();
    if (!window.confirm("Send report cards to ALL students in this class?")) return;
    
    setLoading(true);
    try {
      const r = await client.post("/attendance-sessions/reports/send-bulk", form);
      success(r.data.message);
    } catch (err) {
      error(err.response?.data?.message || "Failed to send");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stack">
      <div className="page-head"><h2>Send Attendance Warnings</h2></div>
      <div className="card">
        <p className="muted">Send report cards via Email and SMS to students with less than 75% attendance.</p>
        
        <form onSubmit={sendBulk} className="form grid-2 mt">
          <label className="field">
            <span>Course</span>
            <select value={form.course} onChange={(e) => setForm({...form, course: e.target.value})}>
              <option>B.TECH</option><option>BCA</option><option>DIPLOMA</option>
            </select>
          </label>
          <label className="field">
            <span>Branch</span>
            <select value={form.branch} onChange={(e) => setForm({...form, branch: e.target.value})}>
              <option>CE</option><option>AI/ML</option><option>ECE</option><option>ME</option>
            </select>
          </label>
          <label className="field">
            <span>Semester</span>
            <input type="number" value={form.semester} onChange={(e) => setForm({...form, semester: e.target.value})} />
          </label>
          <div className="span-2 mt">
            <button className="btn btn-danger full" disabled={loading}>
              {loading ? "Sending..." : "Send Warning Reports to Class"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}