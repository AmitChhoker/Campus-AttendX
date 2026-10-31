import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import { Users, BookOpen, Activity, PlayCircle, ChevronRight, ChevronLeft } from "lucide-react";

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const [activeSession, setActiveSession] = useState(null);
  const [todayClasses, setTodayClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get("/attendance-sessions/my-sessions"),
      client.get("/subjects/my-submissions")
    ]).then(([sessRes, subRes]) => {
      const all = sessRes.data?.data || [];
      setActiveSession(all.find(s => s.status === "active"));
      setTodayClasses(all.filter(s => new Date(s.startedAt).toDateString() === new Date().toDateString()));
      setSubjects((subRes.data?.data || []).filter(s => s.status === "approved"));
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loader-full">Loading Dashboard...</div>;

  return (
    <div className="stack pb-20">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div>
          <h2 className="m-0 text-white">Welcome back, Professor!</h2>
          <p className="text-indigo-100 mt-1">Here is what's happening today.</p>
        </div>
        <Activity size={48} className="text-white opacity-50" />
      </div>

      {/* Stats */}
      <div className="grid grid-3">
        <div className="card stat-modern">
          <div className="stat-icon bg-indigo"><BookOpen size={24} /></div>
          <div><h3 className="m-0">{todayClasses.length}</h3><p className="muted small">Today's Classes</p></div>
        </div>
        <div className="card stat-modern">
          <div className="stat-icon bg-green"><Users size={24} /></div>
          <div><h3 className="m-0">{subjects.length}</h3><p className="muted small">Approved Subjects</p></div>
        </div>
        <div className="card stat-modern">
          <div className={`stat-icon ${activeSession ? 'bg-red pulse' : 'bg-gray'}`}><Activity size={24} /></div>
          <div><h3 className="m-0">{activeSession ? "Live" : "Offline"}</h3><p className="muted small">Status</p></div>
        </div>
      </div>

      {/* Active Session */}
      {activeSession && (
        <div className="active-session-banner-modern cursor-pointer" onClick={() => navigate(`/faculty/session/${activeSession._id}`)}>
          <div className="flex items-center gap-4">
            <div className="live-pulse-dot"></div>
            <div>
              <h3 className="m-0 text-white">{activeSession.subject?.subjectName}</h3>
              <p className="text-indigo-100 small mt-1">Session is currently live. Click to view feed.</p>
            </div>
          </div>
          <ChevronRight size={24} className="text-white" />
        </div>
      )}

      <div className="grid grid-2">
        {/* Today's Classes */}
        <div className="card">
          <div className="row-between mb-2">
            <h3 className="card-title m-0">Today's Classes</h3>
            <button className="btn btn-ghost sm" onClick={() => navigate("/faculty/sessions")}>View All</button>
          </div>
          {todayClasses.length === 0 ? (
            <p className="muted center-text py-4">No classes taken today.</p>
          ) : (
            <ul className="list scroll-feed" style={{ maxHeight: '200px' }}>
              {todayClasses.map(sess => (
                <li key={sess._id} className="list-row hover-card" onClick={() => navigate(`/faculty/session/${sess._id}`)} style={{ cursor: 'pointer' }}>
                  <div>
                    <strong>{sess.subject?.subjectName}</strong>
                    <p className="small muted m-0">{new Date(sess.startedAt).toLocaleTimeString()}</p>
                  </div>
                  <span className={`pill ${sess.status === 'active' ? 'pill-approved' : 'pill-pending'}`}>{sess.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick Start */}
        <div className="card center-text flex flex-col justify-center">
           <PlayCircle size={48} className="mx-auto text-indigo mb-4" />
           <h3>Ready to take attendance?</h3>
           <p className="muted small mb-4">Start a new session for your approved subjects.</p>
           <button onClick={() => navigate("/faculty/sessions")} className="btn btn-primary">Start New Session</button>
        </div>
      </div>
    </div>
  );
}