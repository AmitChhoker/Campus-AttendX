import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../../api/client";
import { ChevronLeft, Calendar, Clock, User } from "lucide-react";

export default function SubjectDetail() {
  const { id } = useParams(); // URL se subject ID
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get(`/student/subject/${id}`)
      .then(res => setData(res.data.data))
      .catch(() => alert("Failed to load subject details"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loader-full">Loading...</div>;
  if (!data) return <div className="error-box">Subject data not found</div>;

  const { subject, attendance, history } = data;
  const isRisk = attendance.percentage < 75;

  return (
    <div className="stack pb-20">
      {/* Header */}
      <div className="page-head">
        <button className="btn btn-ghost sm" onClick={() => navigate(-1)}>
          <ChevronLeft size={16} /> Back
        </button>
      </div>

      <div className="card">
        <h2 className="m-0">{subject.name} ({subject.code})</h2>
        <p className="muted">{subject.course} · {subject.branch} · Sem {subject.semester}</p>

        <div className="kv-grid mt">
          <div className="kv"><p className="small muted">Faculty</p><p className="kv-val">{subject.faculty}</p></div>
          <div className="kv"><p className="small muted">Type</p><p className="kv-val" style={{textTransform:'capitalize'}}>{subject.type} · {subject.credits} credit</p></div>
        </div>
      </div>

      {/* Overall Attendance */}
      <div className={`card ${isRisk ? 'risk' : 'safe'}`} style={{ borderLeft: `4px solid ${isRisk ? 'var(--red)' : 'var(--emerald)'}` }}>
        <h3 className="card-title m-0">ATTENDANCE</h3>
        
        <div className="center-text mt">
          <h1 className={isRisk ? "text-red-500" : "text-green-500"} style={{ fontSize: "3rem", margin: "0" }}>
            {attendance.percentage}%
          </h1>
          <p className="muted font-bold">{attendance.present} / {attendance.totalClasses} classes attended</p>
          
          <div className="progress mt" style={{ height: "10px" }}>
            <div className="progress-bar" style={{ width: `${attendance.percentage}%`, background: isRisk ? 'var(--red)' : 'var(--emerald)' }}></div>
          </div>

          {isRisk && (
            <p className="mt text-red-500 font-bold">
              ⚠ Need {attendance.neededToReach75} more classes to reach 75%
            </p>
          )}
        </div>
      </div>

      {/* Session History (Day-wise) */}
      <div className="card">
        <h3 className="card-title">SESSION HISTORY</h3>
        {history.length === 0 && <p className="muted center-text">No sessions conducted yet.</p>}
        
        <div className="stack">
          {history.map((h, i) => {
            const dateObj = new Date(h.date);
            const dateStr = dateObj.toLocaleDateString("en-GB", { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
            const timeStr = dateObj.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={i} className="list-row" style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "1rem" }}>
                <div>
                  <h4 className="m-0" style={{ color: h.status === "present" ? "var(--emerald)" : "var(--red)" }}>
                    {h.status === "present" ? "✓" : "✗"} {timeStr}
                  </h4>
                  <p className="small muted mt">{h.type} · {subject.credits} credit</p>
                  <p className="small muted">{h.faculty}</p>
                </div>
                <div className="right-align">
                   <span className={`pill ${h.status === "present" ? "pill-approved" : "pill-rejected"}`}>
                     {h.status === "present" ? "Present" : "Absent"}
                   </span>
                   <p className="small muted mt">{dateStr}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}