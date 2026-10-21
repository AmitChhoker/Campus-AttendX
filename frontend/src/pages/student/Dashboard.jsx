import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../../api/client";
import Loader from "../../components/Loader";
import { ScanLine } from "lucide-react";

export default function StudentDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    client.get("/student/dashboard").then((r) => setData(r.data.data));
  }, []);

  if (!data) return <Loader full />;

  const a = data.attendance;
  const status =
    a.attendancePercentage >= 75 ? "safe" :
    a.attendancePercentage >= 60 ? "warn" : "risk";

  return (
    <div className="stack">
      <div className={`card hero hero-${status}`}>
        <div className="muted small">Current Semester · Sem {data.profile.semester}</div>
        <div className="hero-pct">{a.attendancePercentage}%</div>
        <div className="muted">
          {a.classesAttended} / {a.totalClassesConducted} classes
        </div>
        <div className="progress mt">
          <div className="progress-bar" style={{ width: `${a.attendancePercentage}%` }} />
        </div>
        <p className="small mt">
          {a.attendancePercentage < 75
            ? `⚠ Attend more to reach 75%`
            : `✓ You are safe`}
        </p>
      </div>

      <Link to="/student/scan" className="btn btn-primary full big">
        <ScanLine size={20} /> Mark Today's Attendance
      </Link>

      <div className="card">
        <h3 className="card-title">Subjects</h3>
        <div className="grid grid-2">
          {data.subjectSummary.map((s) => (
            <div key={s.subjectId} className="card sub-card">
              <div className="row-between">
                <strong>{s.subjectName}</strong>
                <span className={`pill ${s.attendancePercentage >= 75 ? "pill-approved" : "pill-rejected"}`}>
                  {s.attendancePercentage}%
                </span>
              </div>
              <div className="muted small">{s.subjectCode}</div>
              <div className="progress mt">
                <div className="progress-bar" style={{ width: `${s.attendancePercentage}%` }} />
              </div>
              <div className="muted small mt">
                {s.classesAttended} / {s.totalClassesConducted} attended
              </div>
            </div>
          ))}
          {data.subjectSummary.length === 0 && (
            <div className="muted">No approved subjects yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}