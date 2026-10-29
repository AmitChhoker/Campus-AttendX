import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import client from "../../api/client";
import { QrCode, Bluetooth, ShieldCheck, Fingerprint, CheckCircle, AlertCircle } from "lucide-react";

// 1. Device Helpers
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

// 2. HMAC Proof Generator
const generateProof = async (secret, prefix, challenge) => {
  const enc = new TextEncoder();
  const key = await window.crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await window.crypto.subtle.sign("HMAC", key, enc.encode(prefix + challenge));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
};

export default function StudentMark() {
  const [step, setStep] = useState(1);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Bind Device on Mount
  useEffect(() => {
    try {
      const dev = getStoredDevice();
      client.post("/student/device/bind", { deviceId: dev.deviceId, deviceKey: dev.deviceKey })
        .then(() => console.log("Device bound successfully"))
        .catch((err) => console.log("Device bind note:", err.response?.data?.message));
    } catch (err) {
      console.error("Device bind error", err);
    }
  }, []);

  // QR Scan Logic
  useEffect(() => {
    if (!isScanning) return;
    
    let scanner = null;
    let isMounted = true;

    const startScanner = async () => {
      try {
        scanner = new Html5Qrcode("reader");
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            // 🔥 FIX: Scanner ko pehle stop karein, uske baad hi step change karein
            if (scanner) {
              await scanner.stop();
              await scanner.clear();
              scanner = null;
            }
            if (!isMounted) return;

            try {
              const parsed = JSON.parse(decodedText);
              if (parsed.sessionId && parsed.window !== undefined && parsed.qrToken) {
                setScannedData(parsed);
                setIsScanning(false);
                setError("");
                setStep(2); // QR Scanned successfully
              } else {
                setError("Invalid QR format");
                setIsScanning(false);
              }
            } catch (e) {
              setError("Invalid QR Code. Please scan the teacher's QR.");
              setIsScanning(false);
            }
          },
          () => {} // ignore scan errors
        );
      } catch (err) {
        setError("Camera access denied or not found.");
        setIsScanning(false);
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (scanner) {
        scanner.stop().catch(() => {});
      }
    };
  }, [isScanning]);

  // Final Submit
  const handleFinalSubmit = async () => {
    try {
      setError("");
      if (!scannedData) throw new Error("No QR data found. Please scan again.");
      
      const dev = getStoredDevice();
      const challenge = `${scannedData.sessionId}:${scannedData.window}:${scannedData.qrToken}`;
      
      // Generate Proofs
      const deviceProof = await generateProof(dev.deviceKey, "device:", challenge);
      const fingerprintProof = await generateProof(dev.deviceKey, "fingerprint:", challenge);

      // Send to Backend
      await client.post("/student/scan-attendance/scan", {
        sessionId: scannedData.sessionId,
        window: scannedData.window,
        qrToken: scannedData.qrToken,
        deviceId: dev.deviceId,
        deviceProof,
        fingerprintProof,
        bleRssi: -55 // Mock BLE signal
      });

      setStep(5); // Success
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to mark attendance");
      setStep(1);
      setIsScanning(false);
      setScannedData(null);
    }
  };

  return (
    <div className="stack pb-20">
      <div className="page-head"><h2>Mark Attendance</h2></div>

      {/* Progress Steps */}
      <div className="steps">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className={`step ${step >= n ? "active" : ""}`}>
            <div className="step-dot">{n}</div>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-box flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: QR SCAN */}
      {step === 1 && (
        <div className="card center-text">
          <h3 className="card-title">Step 1: QR Code Scan</h3>
          {!isScanning ? (
            <div style={{ padding: "2rem 1rem" }}>
              <QrCode size={64} className="mx-auto muted" />
              <p className="mt muted">Point at teacher's QR code.</p>
              <button className="btn btn-primary mt" onClick={() => { setError(""); setIsScanning(true); }}>
                📷 Start Camera
              </button>
            </div>
          ) : (
            <div>
              <div id="reader" style={{ width: "100%", borderRadius: "12px", overflow: "hidden" }}></div>
              <button className="btn btn-ghost mt" onClick={() => setIsScanning(false)}>Cancel</button>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: BLE (Simulated) */}
      {step === 2 && (
        <div className="card center-text">
          <h3 className="card-title">Step 2: BLE Proximity</h3>
          <Bluetooth size={64} className="mx-auto text-indigo mt" />
          <p className="mt text-green-500 font-bold">✓ QR Verified</p>
          <p className="muted">Scanning for teacher's device...</p>
          <button className="btn btn-primary full mt" onClick={() => setStep(3)}>Confirm Proximity</button>
        </div>
      )}

      {/* STEP 3: DEVICE */}
      {step === 3 && (
        <div className="card center-text">
          <h3 className="card-title">Step 3: Device Check</h3>
          <ShieldCheck size={64} className="mx-auto text-green-500 mt" />
          <p className="mt text-green-500 font-bold">✓ Device verified</p>
          <button className="btn btn-primary full mt" onClick={() => setStep(4)}>Continue</button>
        </div>
      )}

      {/* STEP 4: FINGERPRINT */}
      {step === 4 && (
        <div className="card center-text">
          <h3 className="card-title">Step 4: Fingerprint</h3>
          <Fingerprint size={64} className="mx-auto text-indigo mt" />
          <p className="mt">Place your finger to authenticate.</p>
          <button className="btn btn-primary full mt" onClick={handleFinalSubmit}>Authenticate & Submit</button>
        </div>
      )}

      {/* STEP 5: SUCCESS */}
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