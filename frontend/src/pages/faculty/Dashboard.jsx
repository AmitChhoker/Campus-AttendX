import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../../api/client";

export default function FacultyDashboard() {
  const [activeSession, setActiveSession] = useState(null);
  const [todayClasses, setTodayClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Sessions and Subjects simultaneously
    Promise.all([
      client.get("/attendance-sessions/my-sessions"),
      client.get("/subjects/my-submissions")
    ]).then(([sessRes, subRes]) => {
      const allSessions = sessRes.data.data || [];
      
      // 1. Find Active Session
      const active = allSessions.find(s => s.status === "active");
      setActiveSession(active);

      // 2. Filter Today's Classes
      const todayStr = new Date().toDateString();
      const today = allSessions.filter(s => new Date(s.startedAt).toDateString() === todayStr);
      setTodayClasses(today);

      // 3. Get Approved Subjects
      setSubjects((subRes.data.data || []).filter(s => s.status === "approved"));
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loader-full">Loading...</div>;

  // Calculate total students present today (approximate based on available data)
  const presentToday = todayClasses.reduce((acc, curr) => acc + (curr.presentCount || 0), 0);

  return (
    <div className="stack">
      <div className="card">
        <h3 className="card-title">TODAY'S OVERVIEW</h3>
        <div className="stat-row">
          <div className="stat-box"><h2>{todayClasses.length}</h2><p>Classes</p></div>
          <div className="stat-box"><h2>{presentToday}</h2><p>Present</p></div>
          <div className="stat-box live"><h2>{activeSession ? "Live" : "Offline"}</h2><p>Status</p></div>
        </div>
      </div>

      {activeSession && (
        <Link to={`/faculty/session/${activeSession._id}`} className="active-session-banner">
          <span className="pulse-dot"></span>
          <div>
            <h3>{activeSession.subject?.subjectName} · Live Now</h3>
            <p>Tap to resume live session →</p>
          </div>
        </Link>
      )}

      <div className="card">
        <h3 className="card-title">TODAY'S CLASSES</h3>
        <ul className="list">
          {todayClasses.length === 0 && <p className="muted center-text">No classes taken today.</p>}
          {todayClasses.map(sess => (
            <li key={sess._id} className="list-row">
              <div>
                <strong>{sess.subject?.subjectName}</strong>
                <span className="muted small"> · {new Date(sess.startedAt).toLocaleTimeString()}</span>
              </div>
              <span className={`pill pill-${sess.status === 'active' ? 'approved' : 'pending'}`}>
                {sess.status}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Link to="/faculty/session/start" className="btn btn-primary full big">
        + START NEW SESSION
      </Link>

      <div className="card">
        <h3 className="card-title">YOUR COURSES [{subjects.length}]</h3>
        {subjects.length === 0 && <p className="muted center-text">No approved subjects yet.</p>}
        <div className="grid grid-2 mt">
          {subjects.slice(0, 4).map(sub => (
            <Link to="/faculty/courses" key={sub._id} className="course-card block" style={{ background: 'var(--surface-2)', padding: '1rem', borderRadius: '8px', textDecoration: 'none', color: 'inherit' }}>
              <h4 className="m-0">🎓 {sub.subjectName}</h4>
              <p className="small muted mt">{sub.branch} · Sem {sub.semester}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}