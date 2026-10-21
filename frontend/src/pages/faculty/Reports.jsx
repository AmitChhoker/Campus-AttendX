import { useEffect, useState } from "react";
import client from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { AlertTriangle, FileText } from "lucide-react";

export default function FacultyReports() {
  const { error, success } = useToast();
  const [activeTab, setActiveTab] = useState("monthly"); // 'monthly' or 'warning'
  
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    client.get("/subjects/my-submissions").then((r) => {
      const approved = (r.data.data || []).filter((s) => s.status === "approved");
      setSubjects(approved);
      if (approved[0]) setSubjectId(approved[0]._id);
    });
  }, []);

  // --- Generate Monthly Report ---
  const generateMonthly = async () => {
    try {
      const r = await client.get("/attendance-sessions/reports/monthly", {
        params: { subjectId, month, year }
      });
      setReport(r.data.data);
    } catch (e) {
      error(e.response?.data?.message || "Failed");
    }
  };

  // --- Send Warning Reports ---
  const sendWarnings = async () => {
    if (!subjectId) return error("Select a subject first");
    if (!window.confirm("Send warning emails to all students below 75% in this subject?")) return;
    
    setLoading(true);
    try {
      const r = await client.post("/attendance-sessions/reports/send-bulk", { subjectId });
      success(r.data.message);
    } catch (err) {
      error(err.response?.data?.message || "Failed to send warnings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stack">
      <div className="page-head"><h2>Reports</h2></div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === "monthly" ? "active" : ""}`} onClick={() => setActiveTab("monthly")}>
          <FileText size={16} /> Monthly Attendance
        </button>
        <button className={`tab ${activeTab === "warning" ? "active" : ""}`} onClick={() => setActiveTab("warning")}>
          <AlertTriangle size={16} /> Send Warnings
        </button>
      </div>

      <div className="card">
        <div className="grid grid-3">
          <label className="field">
            <span>Subject</span>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>{s.subjectName} ({s.branch})</option>
              ))}
            </select>
          </label>

          {activeTab === "monthly" && (
            <>
              <label className="field"><span>Month</span>
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                  {[...Array(12)].map((_, i) => (
                    <option key={i} value={i}>{new Date(0, i).toLocaleString("en", { month: "long" })}</option>
                  ))}
                </select>
              </label>
              <label className="field"><span>Year</span>
                <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
              </label>
            </>
          )}
        </div>

        <div className="row-gap mt">
          {activeTab === "monthly" ? (
            <button className="btn btn-primary" onClick={generateMonthly}>Generate Report</button>
          ) : (
            <button className="btn btn-danger full" onClick={sendWarnings} disabled={loading}>
              <AlertTriangle size={18} /> {loading ? "Sending Emails..." : "Send Detention Warning Emails"}
            </button>
          )}
        </div>
      </div>

      {activeTab === "monthly" && report && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Roll No</th><th>Name</th><th>Conducted</th><th>Present</th><th>%</th><th>Status</th></tr>
            </thead>
            <tbody>
              {report.students.map((s) => (
                <tr key={s.studentId}>
                  <td>{s.registrationNumber}</td>
                  <td>{s.name}</td>
                  <td>{s.classesConducted}</td>
                  <td>{s.present}</td>
                  <td className={s.attendancePercentage < 75 ? "text-red-500 font-bold" : "text-green-500 font-bold"}>
                    {s.attendancePercentage === null ? "—" : `${s.attendancePercentage}%`}
                  </td>
                  <td>
                    {s.attendancePercentage !== null && s.attendancePercentage < 75
                      ? <span className="pill pill-rejected">Low</span>
                      : <span className="pill pill-approved">OK</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}