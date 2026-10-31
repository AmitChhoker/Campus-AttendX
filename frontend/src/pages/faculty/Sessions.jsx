import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import Modal from "../../components/Modal";
import { useToast } from "../../context/ToastContext";
import { ChevronLeft, Plus, Calendar, Clock, BookOpen, Users, PlayCircle } from "lucide-react";

export default function FacultySessions() {
  const { success, error } = useToast();
  const navigate = useNavigate();
  
  const [sessions, setSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStart, setShowStart] = useState(false);
  const [subjectId, setSubjectId] = useState("");

  const load = async () => {
    try {
      const [a, b] = await Promise.all([
        client.get("/attendance-sessions/my-sessions"),
        client.get("/subjects/my-submissions")
      ]);
      // Safe fallback (taaki undefined par crash na ho)
      setSessions(a.data?.data || []); 
      setSubjects((b.data?.data || []).filter((s) => s.status === "approved"));
    } catch (err) {
      error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startSession = async () => {
    if (!subjectId) return error("Select a subject");
    try {
      const r = await client.post("/attendance-sessions", { subjectId });
      success("Session started!");
      setShowStart(false);
      navigate(`/faculty/session/${r.data.data.session._id}`);
    } catch (err) {
      error(err.response?.data?.message || "Failed to start session");
    }
  };

  // 🔥 Grouping Sessions by Subject
  const groupedSessions = (sessions || []).reduce((acc, session) => {
    const subId = session?.subject?._id;
    if (!subId) return acc;

    if (!acc[subId]) {
      acc[subId] = {
        subject: session.subject,
        sessions: []
      };
    }
    acc[subId].sessions.push(session);
    return acc;
  }, {});

  if (loading) return <div className="loader-full">Loading Sessions...</div>;

  return (
    <div className="stack pb-20">
      {/* Header & Back Button */}
      <div className="row-between mb-4">
        <button className="btn btn-ghost sm" onClick={() => navigate("/faculty")}>
          <ChevronLeft size={18} /> Back to Dashboard
        </button>
        <button className="btn btn-primary" onClick={() => setShowStart(true)}>
          <Plus size={16} /> Start New Session
        </button>
      </div>

      <div className="page-head">
        <h2>Course-wise Sessions</h2>
        <p className="muted">Overview of all attendance sessions taken so far.</p>
      </div>

      {/* Empty State */}
      {Object.keys(groupedSessions).length === 0 && (
        <div className="card center-text py-10">
          <Calendar size={64} className="mx-auto text-indigo-200 mb-4" />
          <h3>No Sessions Found</h3>
          <p className="muted mt-2">You haven't taken any attendance sessions yet.</p>
          <button className="btn btn-primary mt-4" onClick={() => setShowStart(true)}>
            Start Your First Session
          </button>
        </div>
      )}

      {/* Course-wise Session Cards */}
      <div className="grid grid-2">
        {Object.values(groupedSessions).map((group) => {
          const sub = group.subject;
          const subSessions = group.sessions;
          
          return (
            <div key={sub._id} className="card hover-lift">
              {/* Card Header: Subject Info */}
              <div className="row-between mb-4 pb-4 border-b">
                <div>
                  <h3 className="m-0 text-indigo-600 flex items-center gap-2">
                    <BookOpen size={20} /> {sub.subjectName}
                  </h3>
                  <p className="small muted mt-1">{sub.subjectCode} · {sub.branch} · Sem {sub.semester}</p>
                </div>
                <div className="center-text">
                  <h4 className="m-0 text-xl font-bold">{subSessions.length}</h4>
                  <p className="small muted m-0">Sessions</p>
                </div>
              </div>

              {/* Sessions List for this Subject */}
              <div className="scroll-feed" style={{ maxHeight: '200px' }}>
                <ul className="list">
                  {subSessions.map((sess) => (
                    <li 
                      key={sess._id} 
                      className="list-row session-item" 
                      onClick={() => navigate(`/faculty/session/${sess._id}`)}
                      style={{ cursor: 'pointer', border: '1px solid var(--border)', marginBottom: '8px' }}
                    >
                      <div>
                        <strong className="flex items-center gap-2">
                           {new Date(sess.startedAt).toLocaleDateString("en-GB", { weekday: 'short', day: 'numeric', month: 'short' })}
                        </strong>
                        <p className="small muted m-0 flex items-center gap-1 mt-1">
                          <Clock size={12}/> {new Date(sess.startedAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <span className={`pill ${sess.status === 'active' ? 'pill-approved' : 'pill-pending'}`}>
                        {sess.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Start Session Modal */}
      <Modal open={showStart} onClose={() => setShowStart(false)} title="Start New Session">
        {subjects.length === 0 ? (
          <div className="center-text py-4">
            <p className="muted">You have no approved subjects.</p>
            <button className="btn btn-primary mt-2" onClick={() => navigate("/faculty/courses")}>
              Go to My Courses
            </button>
          </div>
        ) : (
          <>
            <label className="field">
              <span>Select Approved Subject</span>
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                <option value="">— pick a subject —</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.subjectName} ({s.subjectCode})
                  </option>
                ))}
              </select>
            </label>
            <button className="btn btn-primary mt-4 full" onClick={startSession}>
              Start Session
            </button>
          </>
        )}
      </Modal>
    </div>
  );
}