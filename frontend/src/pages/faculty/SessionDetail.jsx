import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import client from "../../api/client";
import { useToast } from "../../context/ToastContext"; // <-- Toast import kiya

export default function FacultySessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToast();
  
  const [session, setSession] = useState(null);
  const [qrPayload, setQrPayload] = useState("");
  const [countdown, setCountdown] = useState(30);

  // Fetch Session Details (Sahi API path)
  useEffect(() => {
    client.get(`/attendance-sessions/${id}`)
      .then(res => setSession(res.data.data))
      .catch(() => error("Session not found"));
  }, [id]);

  // Fetch Dynamic QR Payload every 30s (Sahi API path)
  useEffect(() => {
    const fetchQr = () => {
      client.get(`/attendance-sessions/${id}/qr`).then(res => {
        setQrPayload(JSON.stringify(res.data.data));
        setCountdown(30);
      }).catch(err => console.log("Session might be closed."));
    };

    fetchQr(); // Initial fetch
    const interval = setInterval(fetchQr, 30000); // Refresh every 30s
    const timer = setInterval(() => setCountdown(c => (c > 0 ? c - 1 : 0)), 1000);

    return () => { clearInterval(interval); clearInterval(timer); };
  }, [id]);

  // End Session API (PATCH method aur sahi path)
  const endSession = async () => {
    if (!window.confirm("Are you sure you want to end this session for all students?")) return;
    try {
      await client.patch(`/attendance-sessions/${id}/close`);
      success("Session ended successfully");
      navigate("/faculty/sessions"); // Wapas list par
    } catch (err) {
      error("Failed to end session");
    }
  };

  if (!session) return <div className="loader-full">Loading...</div>;

  return (
    <div className="stack">
      <div className="card">
        <div className="row-between">
          <h2>{session.subject?.subjectName || "Active Session"}</h2>
          <span className={`pill ${session.status === 'active' ? 'pill-approved' : 'pill-rejected'}`}>
            [{session.status}]
          </span>
        </div>
        <p className="muted">{session.subject?.subjectCode} · {session.subject?.branch} · Sem {session.subject?.semester}</p>
      </div>

      {session.status === "active" ? (
        <>
          <div className="card center-text">
            <h3 className="card-title">DYNAMIC QR CODE</h3>
            <div style={{ background: "white", padding: "1rem", display: "inline-block", borderRadius: "12px" }}>
              {qrPayload ? <QRCodeSVG value={qrPayload} size={250} /> : "Generating..."}
            </div>
            <p className="muted mt">Refreshes in {countdown}s</p>
          </div>

          <button className="btn btn-danger full big" onClick={endSession}>
            END SESSION
          </button>
        </>
      ) : (
        <div className="card center-text">
          <h3 className="text-red-500">This session has ended.</h3>
        </div>
      )}
    </div>
  );
}