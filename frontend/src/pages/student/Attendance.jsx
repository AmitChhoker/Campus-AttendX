import { useEffect, useState } from "react";
import client from "../../api/client";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function StudentAttendance() {
  const [activeTab, setActiveTab] = useState("current");
  const [currentData, setCurrentData] = useState(null);
  const [previousData, setPreviousData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Accordion state for previous semesters
  const [expandedSubject, setExpandedSubject] = useState(null);

  useEffect(() => {
    setLoading(true);
    if (activeTab === "current") {
      client.get("/student/dashboard").then(res => setCurrentData(res.data.data)).finally(() => setLoading(false));
    } else {
      if (!previousData) {
        client.get("/student/previous-semesters").then(res => setPreviousData(res.data.data)).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }
  }, [activeTab]);

  const toggleSubject = (semIndex, subIndex) => {
    const key = `${semIndex}-${subIndex}`;
    setExpandedSubject(expandedSubject === key ? null : key);
  };

  if (loading) return <div className="loader-full">Loading...</div>;

  return (
    <div className="stack pb-20">
      <div className="page-head"><h2>My Attendance</h2></div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === "current" ? "active" : ""}`} onClick={() => setActiveTab("current")}>
          Current Sem
        </button>
        <button className={`tab ${activeTab === "previous" ? "active" : ""}`} onClick={() => setActiveTab("previous")}>
          Previous Semesters
        </button>
      </div>

      {/* CURRENT SEMESTER */}
      {activeTab === "current" && currentData && (
        <div className="card">
          <h3 className="card-title">CURRENT SEMESTER · Sem {currentData.profile.semester}</h3>
          <p className="muted small">Overall: {currentData.attendance.attendancePercentage}% · {currentData.attendance.classesAttended}/{currentData.attendance.totalClassesConducted} credits</p>
          
          <div className="stack mt">
            {currentData.subjectSummary.length === 0 && <p className="muted">No classes conducted yet.</p>}
            {currentData.subjectSummary.map(sub => (
              <div key={sub.subjectId} className={`subject-card ${sub.attendancePercentage < 75 ? 'risk' : 'safe'}`}>
                <div className="row-between">
                  <h4>{sub.attendancePercentage < 75 ? '🔴' : '🟢'} {sub.subjectName}</h4>
                  <strong>{sub.attendancePercentage}%</strong>
                </div>
                <p className="small muted">{sub.classesAttended} / {sub.totalClassesConducted} credits</p>
                <div className="progress"><div className="progress-bar" style={{ width: `${sub.attendancePercentage}%` }}></div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PREVIOUS SEMESTERS (Complete Data) */}
      {activeTab === "previous" && previousData && (
        <div className="stack">
          {previousData.length === 0 && <div className="card center-text muted">No previous semester data found.</div>}
          
          {previousData.map((sem, semIndex) => (
            <div key={semIndex} className="card">
              <div className="row-between mb-2">
                <h3 className="m-0">Year ? · Sem {sem.semester} (Ended)</h3>
                <span className="pill pill-approved font-bold">{sem.overallPercentage}%</span>
              </div>
              <p className="muted small mb-2">Overall: {sem.totalPresent} / {sem.totalClasses} classes attended</p>
              
              <div className="stack mt">
                {sem.subjects.map((sub, subIndex) => {
                  const isExpanded = expandedSubject === `${semIndex}-${subIndex}`;
                  return (
                    <div key={subIndex} className="card" style={{ background: "#f8fafc", padding: "1rem" }}>
                      {/* Subject Header */}
                      <div 
                        className="row-between" 
                        style={{ cursor: "pointer" }} 
                        onClick={() => toggleSubject(semIndex, subIndex)}
                      >
                        <div>
                          <h4 className="m-0">{sub.subjectName}</h4>
                          <p className="small muted">{sub.present} / {sub.total} classes</p>
                        </div>
                        <div className="row-gap" style={{ alignItems: "center" }}>
                          <strong className={sub.percentage < 75 ? "text-red-500" : "text-green-500"}>
                            {sub.percentage}%
                          </strong>
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="progress mt">
                        <div className="progress-bar" style={{ width: `${sub.percentage}%`, background: sub.percentage < 75 ? 'var(--red)' : 'var(--emerald)' }}></div>
                      </div>

                      {/* Day-wise History (Accordion) */}
                      {isExpanded && (
                        <div className="mt" style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}>
                          <h5 className="muted small mb-2">Session History</h5>
                          {sub.history.length === 0 && <p className="small muted">No sessions found.</p>}
                          <ul className="list">
                            {sub.history.map((h, hIndex) => (
                              <li key={hIndex} className="list-row" style={{ background: "transparent", padding: "0.4rem 0" }}>
                                <span>{new Date(h.date).toLocaleDateString("en-GB", { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                <span className={`pill ${h.status === "present" ? "pill-approved" : "pill-rejected"}`}>
                                  {h.status === "present" ? "✓ Present" : "✗ Absent"}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}