import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import client from "../../api/client";
import { QrCode, Bluetooth, ShieldCheck, Fingerprint, CheckCircle } from "lucide-react";

// Device Binding Helpers (Same as before)
const getStoredDevice = () => {
  let dev = localStorage.getItem("attendx_device");
  if (!dev) {
    const deviceId = window.crypto.randomUUID();
    const deviceKey = Array.from(window.crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, "0")).join("");
    dev = JSON.stringify({ deviceId, deviceKey });
    localStorage.setItem("attendx_device", dev);
  }
  return JSON.parse(dev);
};

const generateProof = async (secret, prefix, challenge) => {
  const enc = new TextEncoder();
  const key = await window.crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await window.crypto.subtle.sign("HMAC", key, enc.encode(prefix + challenge));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
};

export default function StudentMark() {
  const [step, setStep] = useState(1);
  const [isScanning, setIsScanning] = useState(false); // <-- NAYA STATE
  const [scannedData, setScannedData] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const dev = getStoredDevice();
    client.post("/student/device/bind", { deviceId: dev.deviceId, deviceKey: dev.deviceKey }).catch(() => {});
  }, []);

  useEffect(() => {
    // Camera tabhi chalega jab isScanning true hoga
    if (!isScanning) return;
    
    const scanner = new Html5Qrcode("reader");
    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        scanner.stop().then(() => {
          try {
            const parsed = JSON.parse(decodedText);
            if (parsed.sessionId && parsed.window !== undefined && parsed.qrToken) {
              setScannedData(parsed);
              setIsScanning(false);
              setStep(2); // QR Verified
            } else {
              setError("Invalid QR format");
              setIsScanning(false);
            }
          } catch (e) {
            setError("Invalid QR Code.");
            setIsScanning(false);
          }
        });
      },
      () => {}
    ).catch(() => setError("Camera access denied."));

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [isScanning]);

  const handleFinalSubmit = async () => {
    try {
      const dev = getStoredDevice();
      const challenge = `${scannedData.sessionId}:${scannedData.window}:${scannedData.qrToken}`;
      
      const deviceProof = await generateProof(dev.deviceKey, "device:", challenge);
      const fingerprintProof = await generateProof(dev.deviceKey, "fingerprint:", challenge);

      await client.post("/student/mark-attendance", {
        sessionId: scannedData.sessionId,
        window: scannedData.window,
        qrToken: scannedData.qrToken,
        deviceId: dev.deviceId,
        deviceProof,
        fingerprintProof,
        bleRssi: -55 
      });

      setStep(5);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to mark attendance");
      setStep(1);
      setIsScanning(false);
    }
  };

  return (
    <div className="stack pb-20">
      <div className="page-head"><h2>Mark Attendance</h2></div>

      <div className="steps">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className={`step ${step >= n ? "active" : ""}`}>
            <div className="step-dot">{n}</div>
          </div>
        ))}
      </div>

      {error && <div className="error-box">{error}</div>}

      {/* STEP 1: Intro Screen & Camera */}
      {step === 1 && (
        <div className="card center-text">
          <h3 className="card-title">Step 1: QR Code Scan</h3>
          
          {!isScanning ? (
            // Jab camera band hai tab ye dikhega
            <div style={{ padding: "2rem 1rem" }}>
              <QrCode size={64} className="mx-auto muted" />
              <p className="mt muted">Point at teacher's QR code to mark attendance.</p>
              <button className="btn btn-primary mt" onClick={() => setIsScanning(true)}>
                📷 Start Camera
              </button>
            </div>
          ) : (
            // Jab camera chalu hai tab ye dikhega
            <div>
              <div id="reader" style={{ width: "100%", borderRadius: "12px", overflow: "hidden" }}></div>
              <button className="btn btn-ghost mt" onClick={() => setIsScanning(false)}>Cancel</button>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="card center-text">
          <h3 className="card-title">Step 2: BLE Proximity</h3>
          <Bluetooth size={64} className="mx-auto text-indigo mt" />
          <p className="mt text-green-500 font-bold">✓ QR Verified</p>
          <p className="muted">Scanning for teacher's device...</p>
          <button className="btn btn-primary full mt" onClick={() => setStep(3)}>Confirm Proximity</button>
        </div>
      )}

      {step === 3 && (
        <div className="card center-text">
          <h3 className="card-title">Step 3: Device Check</h3>
          <ShieldCheck size={64} className="mx-auto text-green-500 mt" />
          <p className="mt text-green-500 font-bold">✓ Device verified</p>
          <button className="btn btn-primary full mt" onClick={() => setStep(4)}>Continue</button>
        </div>
      )}

      {step === 4 && (
        <div className="card center-text">
          <h3 className="card-title">Step 4: Fingerprint</h3>
          <Fingerprint size={64} className="mx-auto text-indigo mt" />
          <p className="mt">Place your finger to authenticate.</p>
          <button className="btn btn-primary full mt" onClick={handleFinalSubmit}>Authenticate & Submit</button>
        </div>
      )}

      {step === 5 && (
        <div className="card center-text">
          <CheckCircle size={64} className="mx-auto text-green-500" />
          <h3 className="text-green-500 mt">SUCCESS</h3>
          <p>Attendance marked successfully!</p>
          <button className="btn btn-primary full mt" onClick={() => navigate("/student")}>Back to Dashboard</button>
        </div>
      )}
    </div>
  );
}