import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { AlertTriangle, FileText, Send, ChevronLeft, Download } from "lucide-react";

export default function FacultyReports() {
  const { error, success } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("monthly");
  
  const [subjects, setSubjects] = useState([]);
  const [uniqueCourses, setUniqueCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [subjectId, setSubjectId] = useState("");
  
  // 🔥 FIX: Month ab 1-12 format mein hoga (Current month: new Date().getMonth() + 1)
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    client.get("/subjects/my-submissions").then((r) => {
      const approved = (r.data.data || []).filter((s) => s.status === "approved");
      setSubjects(approved);
      const courses = [...new Set(approved.map(s => s.course))];
      setUniqueCourses(courses);
      if (courses.length > 0) setSelectedCourse(courses[0]);
    }).catch(() => error("Failed to load subjects"));
  }, []);

  const filteredSubjects = subjects.filter(s => s.course === selectedCourse);

  useEffect(() => {
    if (filteredSubjects.length > 0) setSubjectId(filteredSubjects[0]._id);
    else setSubjectId("");
  }, [selectedCourse, subjects]);

  const generateMonthly = async () => {
    if (!subjectId) return error("Select a subject");
    setLoading(true);
    try {
      const r = await client.get("/attendance-sessions/reports/monthly", { params: { subjectId, month, year } });
      setReport(r.data.data);
      success("Report generated");
    } catch (e) {
      error(e.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  const download = async () => {
    try {
      const r = await client.get("/attendance-sessions/reports/monthly/download", {
        params: { subjectId, month, year }, responseType: "blob"
      });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement("a");
      a.href = url; a.download = `report.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { error("Download failed"); }
  };

  const sendWarnings = async () => {
    if (!subjectId) return error("Select a subject");
    if (!window.confirm("Send warnings to defaulters?")) return;
    setLoading(true);
    try {
      const r = await client.post("/attendance-sessions/reports/send-bulk", { subjectId });
      success(r.data.message || "Warnings sent!");
    } catch (err) { error("Failed to send warnings"); }
    finally { setLoading(false); }
  };

  return (
    <div className="stack pb-20">
      <div className="row-between mb-4">
        <button className="btn btn-ghost sm" onClick={() => navigate("/faculty")}>
          <ChevronLeft size={18} /> Back to Dashboard
        </button>
      </div>

      <h2 className="page-title">Reports & Analytics</h2>

      <div className="tabs">
        <button className={`tab ${activeTab === "monthly" ? "active" : ""}`} onClick={() => setActiveTab("monthly")}>
          <FileText size={16} /> Monthly Report
        </button>
        <button className={`tab ${activeTab === "warning" ? "active" : ""}`} onClick={() => setActiveTab("warning")}>
          <AlertTriangle size={16} /> Send Warnings
        </button>
      </div>

      <div className="card glass-panel">
        <div className="grid grid-3 gap-4">
          <label className="field"><span>Course</span>
            <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
              {uniqueCourses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="field"><span>Subject</span>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              {filteredSubjects.map((s) => <option key={s._id} value={s._id}>{s.subjectName}</option>)}
            </select>
          </label>
          {activeTab === "monthly" && (
            <label className="field"><span>Month/Year</span>
              <div className="row-gap">
                {/* 🔥 FIX: Value 1-12 set kiya */}
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleString("en", { month: "short" })}
                    </option>
                  ))}
                </select>
                <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ width: '80px' }} />
              </div>
            </label>
          )}
        </div>

        <div className="mt-4">
          {activeTab === "monthly" ? (
            <div className="row-gap">
              <button className="btn btn-primary" onClick={generateMonthly} disabled={loading}>Generate Report</button>
              {report && report.students?.length > 0 && <button className="btn btn-ghost" onClick={download}><Download size={16}/> CSV</button>}
            </div>
          ) : (
            <div className="warning-box bg-red-50 border-red-200 p-4 rounded-lg">
              <p className="text-red-700 small mb-2">Warning: This will email/SMS all students below 75% attendance.</p>
              <button className="btn btn-danger full" onClick={sendWarnings} disabled={loading || !subjectId}>
                <Send size={18} /> Send Alerts
              </button>
            </div>
          )}
        </div>
      </div>

      {activeTab === "monthly" && report && (
        <div className="table-wrap mt-4 animate-fade-in">
          <div className="p-4 border-b bg-gray-50 row-between">
            <h3 className="m-0">{report.subject?.name} Report</h3>
            <span className="pill pill-pending font-bold">Total: {report.totalClassesConducted}</span>
          </div>
          {report.totalClassesConducted === 0 ? (
             <p className="center-text muted p-8">No classes conducted this month.</p>
          ) : (
            <table className="table">
              <thead><tr><th>Roll No</th><th>Name</th><th>Present</th><th>%</th><th>Status</th></tr></thead>
              <tbody>
                {report.students?.map((s) => (
                  <tr key={s.studentId}>
                    <td>{s.registrationNumber}</td>
                    <td><strong>{s.name}</strong></td>
                    <td>{s.present} / {s.classesConducted}</td>
                    <td className={s.attendancePercentage < 75 ? "text-red-500 font-bold" : "text-green-500 font-bold"}>
                      {s.attendancePercentage}%
                    </td>
                    <td>
                      {s.attendancePercentage < 75 ? <span className="pill pill-rejected">Low</span> : <span className="pill pill-approved">OK</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}