import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import client from "../../api/client";
import Loader from "../../components/Loader";
import { ChevronLeft, Users, CheckCircle, XCircle, StopCircle, RefreshCw } from "lucide-react";

export default function FacultySessionDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  
  const [session, setSession] = useState(null);
  const [qrPayload, setQrPayload] = useState("");
  const [summary, setSummary] = useState(null);
  const [countdown, setCountdown] = useState(15);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Session Details (Once)
  const loadSession = async () => {
    try {
      const res = await client.get(`/attendance-sessions/${id}`);
      setSession(res.data.data);
    } catch (err) {
      alert("Session not found");
      nav("/faculty/sessions");
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Dynamic QR (Every 15s)
  const fetchQr = async () => {
    if (session?.status !== "active") return;
    try {
      const res = await client.get(`/attendance-sessions/${id}/qr`);
      setQrPayload(JSON.stringify(res.data.data));
      setCountdown(15);
    } catch (err) {}
  };

  // 3. Fetch Live Attendance Summary (Every 3s)
  const fetchSummary = async () => {
    try {
      const res = await client.get(`/attendance-sessions/${id}/summary`);
      setSummary(res.data.data);
    } catch (err) {}
  };

  useEffect(() => {
    loadSession();
    fetchSummary();
  }, [id]);

  useEffect(() => {
    if (session?.status !== "active") return;
    
    fetchQr();
    fetchSummary();

    const qrInterval = setInterval(fetchQr, 15000);
    const summaryInterval = setInterval(fetchSummary, 3000); // Har 3 sec me live update
    const timerInterval = setInterval(() => setCountdown(c => (c > 0 ? c - 1 : 0)), 1000);

    return () => {
      clearInterval(qrInterval);
      clearInterval(summaryInterval);
      clearInterval(timerInterval);
    };
  }, [session?.status]);

  const endSession = async () => {
    if (!window.confirm("Are you sure you want to end this session?")) return;
    try {
      await client.patch(`/attendance-sessions/${id}/close`);
      setSession({ ...session, status: "closed" }); // UI update without page reload
      fetchSummary(); // Final fetch
    } catch (err) {
      alert("Failed to end session");
    }
  };

  if (loading) return <Loader full />;
  if (!session) return <div className="error-box">Session not found</div>;

  return (
    <div className="stack pb-20">
      {/* Header & Back Button */}
      <div className="row-between">
        {/* 🔥 Yahan nav(-1) kar diya gaya hai */}
        <button className="btn btn-ghost sm" onClick={() => nav(-1)}>
          <ChevronLeft size={18} /> Back
        </button>
        <span className={`pill ${session.status === 'active' ? 'pill-approved' : 'pill-rejected'}`}>
          {session.status.toUpperCase()}
        </span>
      </div>

      <div className="card">
        <h2 className="m-0">{session.subject?.subjectName}</h2>
        <p className="muted mt-1">{session.subject?.subjectCode} · {session.subject?.branch} · Sem {session.subject?.semester}</p>
      </div>

      {/* Main Grid: QR Left, Live Feed Right */}
      <div className="session-grid">
        
        {/* LEFT: QR Code Section */}
        <div className="card center-text qr-modern-card">
          {session.status === "active" ? (
            <>
              <h3 className="card-title text-indigo">Scan to Mark Attendance</h3>
              <div className="qr-glow-wrapper">
                {qrPayload ? (
                  <QRCodeSVG value={qrPayload} size={220} level="H" includeMargin />
                ) : (
                  <div className="qr-loading">Generating QR...</div>
                )}
              </div>
              <div className="row-between mt-4" style={{ padding: '0 1rem' }}>
                <span className="muted small flex items-center gap-1">
                  <RefreshCw size={14} className="animate-spin" /> Auto-refreshes
                </span>
                <span className="pill pill-pending font-bold">{countdown}s</span>
              </div>
              
              <button className="btn btn-danger w-full mt-4" onClick={endSession}>
                <StopCircle size={18} /> End Session
              </button>
            </>
          ) : (
            <div className="center-text py-8">
              <XCircle size={64} className="mx-auto text-red-500 mb-4" />
              <h3 className="text-xl font-bold">Session Ended</h3>
              <p className="muted mt-2">This attendance session is now closed.</p>
            </div>
          )}
        </div>

        {/* RIGHT: Live Stats & Feed */}
        <div className="card">
          <h3 className="card-title">Live Attendance Stats</h3>
          
          <div className="stat-row mb-4">
            <div className="stat-box">
              <h2 className="text-indigo">{summary?.summary?.totalStudents || 0}</h2>
              <p>Total</p>
            </div>
            <div className="stat-box live">
              <h2>{summary?.summary?.present || 0}</h2>
              <p>Present</p>
            </div>
            <div className="stat-box">
              <h2 className="text-red-500">{summary?.summary?.absent || 0}</h2>
              <p>Absent</p>
            </div>
          </div>

          {/* Present Students List */}
          <div className="live-feed-container mt-4">
            <h4 className="flex items-center gap-2 mb-2 text-green-500">
              <CheckCircle size={18} /> Present Students ({summary?.presentStudents?.length || 0})
            </h4>
            <ul className="list scroll-feed">
              {summary?.presentStudents?.length === 0 && <li className="muted center-text py-4">Waiting for students to scan...</li>}
              {summary?.presentStudents?.map(s => (
                <li key={s.studentId} className="list-row present-row">
                  <div className="flex items-center gap-2">
                    <div className="avatar-sm">{s.name.charAt(0)}</div>
                    <div>
                      <strong>{s.name}</strong>
                      <p className="small muted m-0">{s.registrationNumber}</p>
                    </div>
                  </div>
                  <span className="pill pill-approved">Present</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Absent Students List (Show only after session ends) */}
          {session.status !== "active" && summary?.absentStudents?.length > 0 && (
            <div className="live-feed-container mt-4 border-t pt-4">
              <h4 className="flex items-center gap-2 mb-2 text-red-500">
                <XCircle size={18} /> Absent Students ({summary?.absentStudents?.length || 0})
              </h4>
              <ul className="list scroll-feed">
                {summary?.absentStudents?.map(s => (
                  <li key={s.studentId} className="list-row absent-row">
                     <div className="flex items-center gap-2">
                      <div className="avatar-sm bg-red-100 text-red-500">{s.name.charAt(0)}</div>
                      <div>
                        <strong>{s.name}</strong>
                        <p className="small muted m-0">{s.registrationNumber}</p>
                      </div>
                    </div>
                    <span className="pill pill-rejected">Absent</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}