import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../../api/client";
import Loader from "../../components/Loader";

export default function AdminAttendanceDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    client.get(`/admin/attendance/sessions/${id}`).then((r) => setData(r.data.data));
  }, [id]);

  if (!data) return <Loader full />;
  const { session, summary, students } = data;

  return (
    <div className="stack">
      <button className="btn btn-ghost sm" onClick={() => nav(-1)}>← Back</button>
      <div className="card">
        <h2 className="m-0">{session.subject.name}</h2>
        <p className="muted">{session.subject.code} · {session.faculty.name}</p>
        <div className="kv-grid mt">
          <KV label="Total" value={summary.totalStudents} />
          <KV label="Present" value={summary.present} />
          <KV label="Absent" value={summary.absent} />
          <KV label="Percentage" value={`${summary.attendancePercentage}%`} />
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Roll</th><th>Name</th><th>Status</th><th>Marked At</th></tr></thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.studentId}>
                <td>{s.registrationNumber}</td>
                <td>{s.name}</td>
                <td>
                  <span className={`pill ${s.status === "present" ? "pill-approved" : "pill-rejected"}`}>
                    {s.status}
                  </span>
                </td>
                <td className="muted small">
                  {s.markedAt ? new Date(s.markedAt).toLocaleTimeString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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