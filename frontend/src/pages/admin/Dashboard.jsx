import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../../api/client";
import Loader from "../../components/Loader";
import { Users, BookOpen, Activity, CalendarCheck } from "lucide-react";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    client
      .get("/admin/dashboard")
      .then((res) => setData(res.data.data))
      .catch((e) =>
        setErr(e.response?.data?.message || "Failed to load dashboard")
      );
  }, []);

  if (err) return <div className="error-box">{err}</div>;
  if (!data) return <Loader full />;

  const o = data.overview;
  const u = data.users;
  const s = data.subjects;
  const t = data.todayAttendance;

  return (
    <div className="stack">
      <section className="grid grid-4">
        <Stat icon={Users} label="Students" value={o.totalStudents} tone="indigo" />
        <Stat icon={Users} label="Faculty" value={o.totalFaculty} tone="cyan" />
        <Stat icon={BookOpen} label="Subjects" value={o.totalSubjects} tone="violet" />
        <Stat icon={CalendarCheck} label="Today Sessions" value={o.todaySessions} tone="emerald" />
      </section>

      <section className="grid grid-2">
        <div className="card">
          <h3 className="card-title">Today's Attendance</h3>
          <div className="kv-grid">
            <KV label="Total Students" value={t.totalStudents} />
            <KV label="Present" value={t.present} tone="green" />
            <KV label="Absent" value={t.absent} tone="red" />
            <KV label="Attendance %" value={`${t.attendancePercentage}%`} />
          </div>
          <div className="progress">
            <div
              className="progress-bar"
              style={{ width: `${Math.min(100, t.attendancePercentage)}%` }}
            />
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Subject Approvals</h3>
          <div className="kv-grid">
            <KV label="Approved" value={s.approved} tone="green" />
            <KV label="Pending" value={s.pending} tone="orange" />
            <KV label="Rejected" value={s.rejected} tone="red" />
            <KV label="Active" value={s.active} tone="cyan" />
          </div>
          {s.pending > 0 && (
            <Link className="btn btn-primary mt" to="/admin/subjects?status=pending">
              Review {s.pending} pending
            </Link>
          )}
        </div>
      </section>

      <section className="grid grid-2">
        <div className="card">
          <h3 className="card-title">Recent Sessions</h3>
          <ul className="list">
            {data.recentSessions.length === 0 && <li className="muted">No sessions yet</li>}
            {data.recentSessions.map((r) => (
              <li key={r.sessionId} className="list-row">
                <Activity size={16} className="tone-indigo" />
                <div>
                  <strong>{r.subject?.name || "Unknown"}</strong>
                  <div className="muted small">
                    {r.faculty?.name} · {new Date(r.startedAt).toLocaleString()}
                  </div>
                </div>
                <span className={`pill pill-${r.status}`}>{r.status}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h3 className="card-title">Recent Subject Submissions</h3>
          <ul className="list">
            {data.recentSubjects.map((r) => (
              <li key={r.id} className="list-row">
                <BookOpen size={16} className="tone-violet" />
                <div>
                  <strong>{r.subjectName}</strong>
                  <div className="muted small">
                    {r.course} · {r.branch} · Sem {r.semester}
                  </div>
                </div>
                <span className={`pill pill-${r.status}`}>{r.status}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }) {
  return (
    <div className={`card stat stat-${tone}`}>
      <Icon size={22} />
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function KV({ label, value, tone }) {
  return (
    <div className="kv">
      <div className="muted small">{label}</div>
      <div className={`kv-val ${tone ? `tone-${tone}` : ""}`}>{value}</div>
    </div>
  );
}