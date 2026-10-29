import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../../api/client";

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    client.get("/student/dashboard")
      .then((res) => {
        setData(res.data.data);
        setError(null);
      })
      .catch((err) => {
        // Ab koi dummy data nahi aayega. Agar error aaya, toh saaf message dikhega.
        setError(err.response?.data?.message || "Failed to load dashboard. Please login again.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loader-full">Loading...</div>;
  if (error) return <div className="error-box">{error}</div>;
  if (!data) return <div className="error-box">No data available.</div>;

  const overall = data.attendance.attendancePercentage;
  const isRisk = overall < 75;

  // Dynamic calculation for Safe, Warn, Risk based on real subjects
  const safeCount = data.subjectSummary.filter(s => s.attendancePercentage >= 75).length;
  const warnCount = data.subjectSummary.filter(s => s.attendancePercentage >= 65 && s.attendancePercentage < 75).length;
  const riskCount = data.subjectSummary.filter(s => s.attendancePercentage < 65).length;

  return (
    <div className="stack pb-20">
      <div className={`hero-card ${isRisk ? 'risk' : 'safe'}`}>
        <div className="row-between">
          <h3>CURRENT SEMESTER · Sem {data.profile.semester}</h3>
          <span className={`pill ${isRisk ? 'pill-rejected' : 'pill-approved'}`}>
            {isRisk ? "⚠ Risk" : "✓ Safe"}
          </span>
        </div>
        <div className="hero-percent">{overall}%</div>
        <p>{data.attendance.classesAttended} / {data.attendance.totalClassesConducted} credits</p>
        <div className="progress mt">
          <div className="progress-bar" style={{ width: `${overall}%` }}></div>
        </div>
        {isRisk && (
          <p className="mt text-red-500 font-bold">
            ⚡ Attend more to reach 75%
          </p>
        )}
      </div>

      <div className="grid grid-3 mt">
        <div className="card center-text">
          <h3 className="text-green-500">🟢 Safe</h3>
          <p className="font-bold text-xl">{safeCount}</p>
        </div>
        <div className="card center-text">
          <h3 className="text-yellow-500">🟡 Warn</h3>
          <p className="font-bold text-xl">{warnCount}</p>
        </div>
        <div className="card center-text">
          <h3 className="text-red-500">🔴 Risk</h3>
          <p className="font-bold text-xl">{riskCount}</p>
        </div>
      </div>

      <Link to="/student/mark" className="btn btn-primary full big mt">
        MARK TODAY'S ATTENDANCE →
      </Link>

      <div className="card mt">
        <h3 className="card-title">CURRENT SUBJECTS · Sem {data.profile.semester} [{data.subjectSummary.length}]</h3>
        <div className="stack">
          
          {data.subjectSummary.length === 0 && (
            <p className="muted">No classes have been conducted yet.</p>
          )}
          
          {data.subjectSummary.map(sub => (
            // Card ko Link banaya taaki click karne par details khulein
            <Link 
              to={`/student/subject/${sub.subjectId}`} 
              key={sub.subjectId}
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <div className={`subject-card ${sub.attendancePercentage < 75 ? 'risk' : 'safe'}`}>
                <div className="row-between">
                  <h4>{sub.attendancePercentage < 75 ? '🔴' : '🟢'} {sub.subjectName}</h4>
                  <strong>{sub.attendancePercentage}%</strong>
                </div>
                <p className="small muted">{sub.classesAttended} / {sub.totalClassesConducted} credits</p>
                <div className="progress mt">
                  <div className="progress-bar" style={{ width: `${sub.attendancePercentage}%` }}></div>
                </div>
              </div>
            </Link>
          ))}
          
        </div>
      </div>
    </div>
  );
}