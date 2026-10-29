import { useEffect, useState } from "react";
import client from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { AlertTriangle, FileText, Send } from "lucide-react";

export default function FacultyReports() {
  const { error, success } = useToast();
  const [activeTab, setActiveTab] = useState("monthly");
  
  const [subjects, setSubjects] = useState([]);
  const [uniqueCourses, setUniqueCourses] = useState([]); // Courses list
  
  const [selectedCourse, setSelectedCourse] = useState("");
  const [subjectId, setSubjectId] = useState("");
  
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. Fetch Subjects and extract Courses
  useEffect(() => {
    client.get("/subjects/my-submissions")
      .then((r) => {
        const approved = (r.data.data || []).filter((s) => s.status === "approved");
        setSubjects(approved);
        
        // Extract unique courses
        const courses = [...new Set(approved.map(s => s.course))];
        setUniqueCourses(courses);
        if (courses.length > 0) setSelectedCourse(courses[0]);
      })
      .catch(() => error("Failed to load subjects"));
  }, []);

  // 2. Filter subjects based on selected course
  const filteredSubjects = subjects.filter(s => s.course === selectedCourse);

  // Auto-select first subject when course changes
  useEffect(() => {
    if (filteredSubjects.length > 0) {
      setSubjectId(filteredSubjects[0]._id);
    } else {
      setSubjectId("");
    }
  }, [selectedCourse, subjects]);

  // 3. Generate Report
  const generateMonthly = async () => {
    if (!subjectId) return error("Please select a subject");
    setLoading(true);
    try {
      const r = await client.get("/attendance-sessions/reports/monthly", {
        params: { subjectId, month, year }
      });
      setReport(r.data.data);
      success("Report generated");
    } catch (e) {
      error(e.response?.data?.message || "Failed to generate report");
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  // 4. Download CSV
  const download = async () => {
    try {
      const r = await client.get("/attendance-sessions/reports/monthly/download", {
        params: { subjectId, month, year },
        responseType: "blob"
      });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance_${month + 1}_${year}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      error("Download failed");
    }
  };

  // 5. Send Warnings
  const sendWarnings = async () => {
    if (!subjectId) return error("Select a subject first");
    if (!window.confirm("Send warning emails to all students below 75%?")) return;
    
    setLoading(true);
    try {
      // Backend route check karein: /attendance-sessions/reports/send-bulk
      const r = await client.post("/attendance-sessions/reports/send-bulk", { subjectId });
      success(r.data.message || "Warnings sent successfully!");
    } catch (err) {
      error(err.response?.data?.message || "Failed to send warnings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stack">
      <div className="page-head"><h2>Reports & Analytics</h2></div>

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
          {/* Course Select */}
          <label className="field">
            <span>Course</span>
            <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
              {uniqueCourses.length === 0 && <option value="">No courses found</option>}
              {uniqueCourses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          {/* Subject Select (Filtered) */}
          <label className="field">
            <span>Select Subject</span>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              {filteredSubjects.length === 0 && <option value="">No subjects in this course</option>}
              {filteredSubjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.subjectName} ({s.subjectCode} - {s.branch})
                </option>
              ))}
            </select>
          </label>

          {activeTab === "monthly" && (
            <>
              <label className="field">
                <span>Month</span>
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                  {[...Array(12)].map((_, i) => (
                    <option key={i} value={i}>{new Date(0, i).toLocaleString("en", { month: "long" })}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Year</span>
                <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
              </label>
            </>
          )}
        </div>

        <div className="row-gap mt">
          {activeTab === "monthly" ? (
            <>
              <button className="btn btn-primary" onClick={generateMonthly} disabled={loading}>
                {loading ? "Generating..." : "Generate Report"}
              </button>
              {report && report.students.length > 0 && <button className="btn btn-ghost" onClick={download}>Download CSV</button>}
            </>
          ) : (
            <div className="warning-box">
              <p className="muted small mb-2">
                This will send an automated email and SMS to all students who have less than 75% attendance.
              </p>
              <button className="btn btn-danger full" onClick={sendWarnings} disabled={loading || !subjectId}>
                <Send size={18} /> {loading ? "Sending..." : "Send Warning Alerts"}
              </button>
            </div>
          )}
        </div>
      </div>

      {activeTab === "monthly" && report && (
        <div className="table-wrap mt">
          <div className="row-between" style={{ padding: "1rem", borderBottom: "1px solid var(--border)" }}>
            <h3 className="m-0">{report.subject?.name} Report</h3>
            <span className="pill pill-pending">Total Classes: {report.totalClassesConducted}</span>
          </div>
          
          {report.totalClassesConducted === 0 ? (
             <div className="center-text" style={{ padding: "2rem" }}>
               <p className="muted">No classes were conducted for this subject in the selected month.</p>
             </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Roll No</th><th>Name</th><th>Conducted</th>
                  <th>Present</th><th>Percentage</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {report.students.map((s) => (
                  <tr key={s.studentId}>
                    <td>{s.registrationNumber}</td>
                    <td>{s.name}</td>
                    <td>{s.classesConducted}</td>
                    <td>{s.present}</td>
                    <td style={{ fontWeight: "bold", color: s.attendancePercentage < 75 ? "var(--red)" : "var(--emerald)" }}>
                      {s.attendancePercentage === null ? "—" : `${s.attendancePercentage}%`}
                    </td>
                    <td>
                      {s.attendancePercentage !== null && s.attendancePercentage < 75 ? (
                        <span className="pill pill-rejected">Low</span>
                      ) : (
                        <span className="pill pill-approved">OK</span>
                      )}
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