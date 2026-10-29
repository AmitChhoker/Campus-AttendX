import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../../api/client";
import Modal from "../../components/Modal"; // Apne Modal ka path check kar lein

export default function FacultyCourseDetail() {
  const { id } = useParams(); // Subject ID
  const nav = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Session Details Modal States
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    Promise.all([
      client.get("/attendance-sessions/my-sessions"),
      client.get("/subjects/my-submissions")
    ]).then(([sessRes, subRes]) => {
      const allSessions = sessRes.data.data || [];
      const allSubjects = subRes.data.data || [];

      const currentSub = allSubjects.find(s => s._id === id);
      setSubject(currentSub);

      const subSessions = allSessions.filter(s => s.subject?._id === id);
      setSessions(subSessions);
    }).finally(() => setLoading(false));
  }, [id]);

  // Fetch Details on "View Details" click
  const handleViewDetails = async (sessionId) => {
    setSelectedSession(sessionId);
    setShowModal(true);
    setSessionDetails(null); // Reset previous
    try {
      const res = await client.get(`/attendance-sessions/${sessionId}/summary`);
      setSessionDetails(res.data.data);
    } catch (err) {
      alert("Failed to load session details");
      setShowModal(false);
    }
  };

  if (loading) return <div className="loader-full">Loading...</div>;

  return (
    <div className="stack">
      <button className="btn btn-ghost sm" style={{ width: 'fit-content' }} onClick={() => nav(-1)}>← Back</button>
      
      <div className="card">
        <h2>{subject?.subjectName} History</h2>
        <p className="muted">
          Total Sessions Conducted: {sessions.length} / {subject?.totalPlannedClasses || 'N/A'} <br/>
          Type: {subject?.type} · Credits: {subject?.credits}
        </p>
      </div>

      <div className="card">
        <h3 className="card-title">Session Log</h3>
        <ul className="list">
          {sessions.length === 0 && <p className="muted center-text">No sessions found.</p>}
          
          {sessions.map(sess => (
            <li key={sess._id} className="list-row">
              <div>
                <strong>{new Date(sess.startedAt).toLocaleDateString("en-GB", { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                <p className="small muted">{new Date(sess.startedAt).toLocaleTimeString()} · {sess.status}</p>
              </div>
              <button 
                className="btn btn-ghost sm"
                onClick={() => handleViewDetails(sess._id)}
              >
                View Details
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* MODAL FOR SESSION DETAILS */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Session Details">
        {!sessionDetails ? (
          <p className="center-text">Loading details...</p>
        ) : (
          <div className="stack">
            <div className="card" style={{ background: "var(--surface-2)" }}>
              <p><strong>Date:</strong> {new Date(sessionDetails.session.startedAt).toLocaleString()}</p>
              <p><strong>Total Students:</strong> {sessionDetails.summary.totalStudents}</p>
              <p className="text-green-500"><strong>Present:</strong> {sessionDetails.summary.present}</p>
              <p className="text-red-500"><strong>Absent:</strong> {sessionDetails.summary.absent}</p>
            </div>

            <div>
              <h4 className="text-green-500 mb-2">Present Students ({sessionDetails.presentStudents.length})</h4>
              <ul className="list" style={{ maxHeight: "150px", overflowY: "auto" }}>
                {sessionDetails.presentStudents.length === 0 && <li className="muted small">None</li>}
                {sessionDetails.presentStudents.map(s => (
                  <li key={s.studentId} className="list-row" style={{ padding: "0.5rem", background: "transparent" }}>
                    <span>{s.name}</span> <span className="muted small">{s.registrationNumber}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-red-500 mb-2">Absent Students ({sessionDetails.absentStudents.length})</h4>
              <ul className="list" style={{ maxHeight: "150px", overflowY: "auto" }}>
                {sessionDetails.absentStudents.length === 0 && <li className="muted small">None</li>}
                {sessionDetails.absentStudents.map(s => (
                  <li key={s.studentId} className="list-row" style={{ padding: "0.5rem", background: "transparent" }}>
                    <span>{s.name}</span> <span className="muted small">{s.registrationNumber}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}