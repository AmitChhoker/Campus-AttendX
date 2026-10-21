import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import client from "../../api/client";
import Loader from "../../components/Loader";
import { useToast } from "../../context/ToastContext";

export default function FacultyActiveSession() {
  const { id } = useParams();
  const nav = useNavigate();
  const { success, error } = useToast();
  const [session, setSession] = useState(null);
  const [qr, setQr] = useState(null);
  const [summary, setSummary] = useState(null);
  const [countdown, setCountdown] = useState(20);
  const timerRef = useRef(null);
  const countRef = useRef(null);

  const loadSession = async () => {
    try {
      const r = await client.get(`/attendance-sessions/${id}`);
      setSession(r.data.data);
    } catch (e) {
      error("Session not found");
      nav("/faculty/sessions");
    }
  };

  const fetchQr = async () => {
    try {
      const r = await client.get(`/attendance-sessions/${id}/qr`);
      setQr(r.data.data);
      setCountdown(20);
    } catch (e) {
      // session probably closed
    }
  };

  const fetchSummary = async () => {
    try {
      const r = await client.get(`/attendance-sessions/${id}/summary`);
      setSummary(r.data.data);
    } catch {}
  };

  useEffect(() => {
    loadSession();
    fetchSummary();
  }, [id]);

  useEffect(() => {
    if (!session || session.status !== "active") return;
    fetchQr();
    timerRef.current = setInterval(fetchQr, 15000);
    const sumRef = setInterval(fetchSummary, 5000);
    return () => {
      clearInterval(timerRef.current);
      clearInterval(sumRef);
    };
  }, [session?.status]);

  useEffect(() => {
    if (!qr) return;
    countRef.current = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(countRef.current);
  }, [qr?.expiresAt]);

  const endSession = async () => {
    if (!confirm("End this session for all students?")) return;
    try {
      await client.patch(`/attendance-sessions/${id}/close`);
      success("Session ended");
      nav("/faculty/sessions");
    } catch (e) {
      error(e.response?.data?.message || "Failed");
    }
  };

  if (!session) return <Loader full />;

  const qrPayload = qr
    ? JSON.stringify({
        sessionId: qr.sessionId,
        window: qr.window,
        qrToken: qr.qrToken
      })
    : "";

  return (
    <div className="stack">
      <button className="btn btn-ghost sm" onClick={() => nav(-1)}>← Back</button>

      <div className="card center-text">
        <div className="row-between">
          <h2 className="m-0">{session.subject?.subjectName}</h2>
          <span className={`pill pill-${session.status}`}>{session.status}</span>
        </div>
        <p className="muted">{session.subject?.subjectCode} · {new Date(session.startedAt).toLocaleString()}</p>
      </div>

      {session.status === "active" && qr && (
        <>
          <div className="card qr-card">
            <QRCodeSVG value={qrPayload} size={280} level="M" includeMargin />
            <p className="muted small">Refreshes in {countdown}s</p>
          </div>

          <div className="grid grid-2">
            <div className="card">
              <h3 className="card-title">Live Summary</h3>
              <div className="kv-grid">
                <KV label="Total" value={summary?.summary?.totalStudents ?? "—"} />
                <KV label="Present" value={summary?.summary?.present ?? "—"} />
                <KV label="Absent" value={summary?.summary?.absent ?? "—"} />
                <KV label="%" value={summary ? `${summary.summary.attendancePercentage}%` : "—"} />
              </div>
            </div>

            <div className="card">
              <h3 className="card-title">Present Students</h3>
              <ul className="list scroll">
                {summary?.presentStudents?.map((s) => (
                  <li key={s.studentId} className="list-row">
                    <span>{s.name}</span>
                    <span className="muted small">{s.registrationNumber}</span>
                  </li>
                ))}
                {summary?.presentStudents?.length === 0 && (
                  <li className="muted">Waiting for students…</li>
                )}
              </ul>
            </div>
          </div>

          <button className="btn btn-danger full" onClick={endSession}>
            End Session for All
          </button>
        </>
      )}

      {session.status !== "active" && (
        <div className="card">
          <h3>Session ended</h3>
          <div className="kv-grid mt">
            <KV label="Total" value={summary?.summary?.totalStudents ?? "—"} />
            <KV label="Present" value={summary?.summary?.present ?? "—"} />
            <KV label="Absent" value={summary?.summary?.absent ?? "—"} />
          </div>
        </div>
      )}
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