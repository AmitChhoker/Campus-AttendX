import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../../api/client";
import Loader from "../../components/Loader";
import Modal from "../../components/Modal";
import { useToast } from "../../context/ToastContext";
import { Plus } from "lucide-react";

export default function FacultySessions() {
  const { success, error } = useToast();
  const [sessions, setSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStart, setShowStart] = useState(false);
  const [subjectId, setSubjectId] = useState("");

  // frontend/src/pages/faculty/Sessions.jsx ke andar
const load = async () => {
    try {
      const [a, b] = await Promise.all([
        client.get("/attendance-sessions/my-sessions"),
        client.get("/subjects/my-submissions")
      ]);
      setSessions(a.data.data || []);
      
      // Ye line check karti hai ki subject approved hai ya nahi
      setSubjects((b.data.data || []).filter((s) => s.status === "approved"));
    } finally {
      setLoading(false);
    }
};

  useEffect(() => { load(); }, []);

  const startSession = async () => {
    if (!subjectId) return error("Select a subject");
    try {
      const r = await client.post("/attendance-sessions", { subjectId });
      success("Session started");
      setShowStart(false);
      load();
    } catch (err) {
      error(err.response?.data?.message || "Failed");
    }
  };

  if (loading) return <Loader full />;

  return (
    <div className="stack">
      <div className="page-head">
        <h2>Attendance Sessions</h2>
        <button className="btn btn-primary" onClick={() => setShowStart(true)}>
          <Plus size={16} /> Start Session
        </button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Subject</th><th>Started</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s._id}>
                <td>{s.subject?.subjectName} ({s.subject?.subjectCode})</td>
                <td className="muted small">{new Date(s.startedAt).toLocaleString()}</td>
                <td><span className={`pill pill-${s.status}`}>{s.status}</span></td>
                <td>
                  <Link className="btn btn-ghost sm" to={`/faculty/sessions/${s._id}`}>Open</Link>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr><td colSpan={4} className="center muted">No sessions yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={showStart} onClose={() => setShowStart(false)} title="Start New Session">
        {subjects.length === 0 ? (
          <p className="muted">You have no approved subjects. Submit one first.</p>
        ) : (
          <>
            <label className="field"><span>Select Subject</span>
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                <option value="">— pick a subject —</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.subjectName} ({s.subjectCode})
                  </option>
                ))}
              </select>
            </label>
            <button className="btn btn-primary mt" onClick={startSession}>Start Session</button>
          </>
        )}
      </Modal>
    </div>
  );
}