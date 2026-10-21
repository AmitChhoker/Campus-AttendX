import { useEffect, useState } from "react";
import client from "../../api/client";
import Loader from "../../components/Loader";

export default function StudentAttendance() {
  const [data, setData] = useState(null);

  useEffect(() => {
    client.get("/student/attendance").then((r) => setData(r.data.data));
  }, []);

  if (!data) return <Loader full />;

  const m = data.monthlyAttendance;
  const s = data.semesterAttendance;

  return (
    <div className="stack">
      <div className="page-head"><h2>My Attendance</h2></div>

      <div className="grid grid-2">
        <div className="card">
          <h3 className="card-title">This Month</h3>
          <div className="kv-grid">
            <KV label="Classes" value={m.classesConducted} />
            <KV label="Attended" value={m.classesAttended} />
            <KV label="Missed" value={m.classesMissed} />
            <KV label="%" value={`${m.attendancePercentage}%`} />
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">This Semester</h3>
          <div className="kv-grid">
            <KV label="Classes" value={s.classesConducted} />
            <KV label="Attended" value={s.classesAttended} />
            <KV label="Missed" value={s.classesMissed} />
            <KV label="%" value={`${s.attendancePercentage}%`} />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Subject-wise</h3>
        <ul className="list">
          {data.subjectWiseAttendance.map((sw) => (
            <li key={sw.subject.id} className="list-row">
              <div style={{ flex: 1 }}>
                <strong>{sw.subject.name}</strong>
                <div className="muted small">{sw.subject.code}</div>
                <div className="progress mt">
                  <div
                    className="progress-bar"
                    style={{ width: `${sw.semester.attendancePercentage}%` }}
                  />
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="kv-val">{sw.semester.attendancePercentage}%</div>
                <div className="muted small">
                  {sw.semester.classesAttended}/{sw.semester.classesConducted}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3 className="card-title">History</h3>
        <ul className="list">
          {data.attendanceHistory.map((h) => (
            <li key={h.sessionId} className="list-row">
              <div>
                <strong>{h.subject?.name}</strong>
                <div className="muted small">
                  {new Date(h.classDate).toLocaleString()}
                </div>
              </div>
              <span className={`pill ${h.attendanceStatus === "present" ? "pill-approved" : "pill-rejected"}`}>
                {h.attendanceStatus}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function KV({ label, value }) {
  return (
    <div className="kv">
      <div className="muted small">{label}</div>
      <div className="kv-val">{value}</div>
    </div>
  );
}