import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../../api/client";
import Loader from "../../components/Loader";
import { CalendarCheck, BookOpen, Plus, Play } from "lucide-react";

export default function FacultyDashboard() {
  const [sessions, setSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [sess, subs] = await Promise.all([
        client.get("/attendance-sessions/my-sessions"),
        client.get("/subjects/my-submissions")
      ]);
      setSessions(sess.data.data || []);
      setSubjects(subs.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Loader full />;

  const active = sessions.find((s) => s.status === "active");
  const today = sessions.filter((s) => {
    const d = new Date(s.startedAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const approved = subjects.filter((s) => s.status === "approved");

  return (
    <div className="stack">
      {active && (
        <Link to={`/faculty/sessions/${active._id}`} className="card active-banner">
          <span className="pulse" />
          <div>
            <strong>Active Session</strong>
            <div className="muted small">
              {active.subject?.subjectName} · {active.subject?.subjectCode}
            </div>
          </div>
          <Play size={20} />
        </Link>
      )}
      
      {/* <Link to="/faculty/warnings" className="btn btn-danger">
        ⚠️ Send Warning Reports
      </Link> */}

      <div className="grid grid-3">
        <Stat icon={CalendarCheck} label="Today's Sessions" value={today.length} tone="indigo" />
        <Stat icon={BookOpen} label="Approved Subjects" value={approved.length} tone="emerald" />
        <Stat icon={Play} label="Total Sessions" value={sessions.length} tone="cyan" />
      </div>

      <div className="card">
        <div className="row-between">
          <h3 className="card-title m-0">Quick Actions</h3>
        </div>
        <div className="row-gap mt">
          <Link to="/faculty/subjects/new" className="btn btn-primary">
            <Plus size={16} /> New Subject
          </Link>
          <Link to="/faculty/subjects" className="btn btn-ghost">
            View My Subjects
          </Link>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Recent Sessions</h3>
        <ul className="list">
          {sessions.slice(0, 5).map((s) => (
            <li key={s._id} className="list-row">
              <CalendarCheck size={16} className="tone-indigo" />
              <div>
                <strong>{s.subject?.subjectName}</strong>
                <div className="muted small">
                  {new Date(s.startedAt).toLocaleString()}
                </div>
              </div>
              <span className={`pill pill-${s.status}`}>{s.status}</span>
              <Link className="btn btn-ghost sm" to={`/faculty/sessions/${s._id}`}>Open</Link>
            </li>
          ))}
          {sessions.length === 0 && <li className="muted">No sessions yet</li>}
        </ul>
      </div>
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