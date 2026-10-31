import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import client from "../../api/client";
import { ChevronLeft, Users, CheckCircle, XCircle, StopCircle, RefreshCw } from "lucide-react";

export default function FacultySessionDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  
  const [session, setSession] = useState(null);
  const [qrPayload, setQrPayload] = useState("");
  const [summary, setSummary] = useState(null);
  const [countdown, setCountdown] = useState(15);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Session Details
  useEffect(() => {
    client.get(`/attendance-sessions/${id}`)
      .then(res => setSession(res.data.data))
      .catch(() => {
        alert("Session not found");
        nav("/faculty/sessions");
      })
      .finally(() => setLoading(false));
  }, [id]);

  // 2. Fetch QR & Summary
  useEffect(() => {
    const fetchQr = async () => {
      if (session?.status !== "active") return;
      try {
        const res = await client.get(`/attendance-sessions/${id}/qr`);
        setQrPayload(JSON.stringify(res.data.data));
        setCountdown(15);
      } catch (err) {}
    };

    const fetchSummary = async () => {
      try {
        const res = await client.get(`/attendance-sessions/${id}/summary`);
        setSummary(res.data.data);
      } catch (err) {}
    };

    if (session) {
      fetchSummary();
      if (session.status === "active") {
        fetchQr();
        const qrInt = setInterval(fetchQr, 15000);
        const sumInt = setInterval(fetchSummary, 3000);
        const timerInt = setInterval(() => setCountdown(c => (c > 0 ? c - 1 : 0)), 1000);
        return () => { clearInterval(qrInt); clearInterval(sumInt); clearInterval(timerInt); };
      }
    }
  }, [session?.status, id]);

  const endSession = async () => {
    if (!window.confirm("End this session?")) return;
    try {
      await client.patch(`/attendance-sessions/${id}/close`);
      setSession({ ...session, status: "closed" }); 
      setQrPayload("");
    } catch (err) {
      alert("Failed to end session");
    }
  };

  if (loading) return <div className="loader-full">Loading Session...</div>;
  if (!session) return <div className="error-box">Session not found</div>;

  return (
    <div className="stack pb-20">
      <div className="row-between">
        <button className="btn btn-ghost sm" onClick={() => nav("/faculty/sessions")}>
          <ChevronLeft size={18} /> Back to Sessions
        </button>
        <span className={`pill ${session.status === 'active' ? 'pill-approved' : 'pill-rejected'}`}>
          {session.status.toUpperCase()}
        </span>
      </div>

      <div className="card bg-gradient-to-r from-indigo-50 to-white">
        <h2 className="m-0 text-indigo-900">{session.subject?.subjectName}</h2>
        <p className="muted mt-1">{session.subject?.subjectCode} · {session.subject?.branch} · Sem {session.subject?.semester}</p>
      </div>

      <div className="session-grid">
        {/* LEFT: QR or Closed Status */}
        <div className="card center-text">
          {session.status === "active" ? (
            <>
              <h3 className="card-title text-indigo">Scan to Mark Attendance</h3>
              <div className="qr-glow-wrapper">
                {qrPayload ? <QRCodeSVG value={qrPayload} size={220} level="H" includeMargin /> : <div className="qr-loading">Generating...</div>}
              </div>
              <div className="row-between mt-4 px-4">
                <span className="muted small flex items-center gap-1"><RefreshCw size={14} className="animate-spin" /> Refreshes</span>
                <span className="pill pill-pending font-bold">{countdown}s</span>
              </div>
              <button className="btn btn-danger w-full mt-4" onClick={endSession}>
                <StopCircle size={18} /> End Session
              </button>
            </>
          ) : (
            <div className="py-8">
              <XCircle size={64} className="mx-auto text-red-500 mb-4" />
              <h3 className="text-xl font-bold">Session Closed</h3>
              <p className="muted mt-2">Attendance is no longer being accepted.</p>
            </div>
          )}
        </div>

        {/* RIGHT: Live Stats */}
        <div className="card">
          <h3 className="card-title">Attendance Summary</h3>
          <div className="stat-row mb-4">
            <div className="stat-box"><h2>{summary?.summary?.totalStudents || 0}</h2><p>Total</p></div>
            <div className="stat-box live"><h2>{summary?.summary?.present || 0}</h2><p>Present</p></div>
            <div className="stat-box"><h2 className="text-red-500">{summary?.summary?.absent || 0}</h2><p>Absent</p></div>
          </div>

          <div className="scroll-feed mt-4">
            <h4 className="flex items-center gap-2 mb-2 text-green-500">
              <CheckCircle size={18} /> Present ({summary?.presentStudents?.length || 0})
            </h4>
            <ul className="list">
              {(!summary?.presentStudents || summary.presentStudents.length === 0) && <li className="muted center-text py-2">Waiting for students...</li>}
              {summary?.presentStudents?.map(s => (
                <li key={s.studentId} className="list-row present-row">
                  <div><strong>{s.name}</strong> <span className="small muted">{s.registrationNumber}</span></div>
                  <span className="pill pill-approved">Present</span>
                </li>
              ))}
            </ul>

            {session.status !== "active" && summary?.absentStudents?.length > 0 && (
              <>
                <h4 className="flex items-center gap-2 mb-2 mt-4 text-red-500">
                  <XCircle size={18} /> Absent ({summary?.absentStudents?.length || 0})
                </h4>
                <ul className="list">
                  {summary?.absentStudents?.map(s => (
                    <li key={s.studentId} className="list-row absent-row">
                      <div><strong>{s.name}</strong> <span className="small muted">{s.registrationNumber}</span></div>
                      <span className="pill pill-rejected">Absent</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}