import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import client from "../../api/client";
import { useToast } from "../../context/ToastContext";
import {
  getStoredDevice,
  storeDevice,
  generateDeviceId,
  generateDeviceKey,
  generateProof,
  DEVICE_PROOF_PREFIX,
  FINGERPRINT_PROOF_PREFIX
} from "../../utils/deviceBinding";
import {
  Fingerprint,
  Bluetooth,
  QrCode,
  ShieldCheck,
  CheckCircle,
  AlertCircle
} from "lucide-react";

const STEP_LABELS = [
  { label: "Scan QR", icon: QrCode },
  { label: "BLE Proximity", icon: Bluetooth },
  { label: "Device Verify", icon: ShieldCheck },
  { label: "Fingerprint", icon: Fingerprint }
];

// =====================================================
// 🔐 WebAuthn Helpers (Real Fingerprint Sensor)
// =====================================================
const webauthnSupported = () =>
  typeof window !== "undefined" && typeof window.PublicKeyCredential === "function";

const registerBiometricCredential = async (deviceId) => {
  if (!webauthnSupported()) throw new Error("Biometric not supported on this browser/device.");
  
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: window.crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: "AttendX" },
      user: {
        id: window.crypto.getRandomValues(new Uint8Array(16)),
        name: deviceId,
        displayName: "Student"
      },
      pubKeyCredParams: [{ alg: -7, type: "public-key" }],
      authenticatorSelection: {
        authenticatorAttachment: "platform", // Forces phone's built-in sensor
        userVerification: "required"         // Forces Fingerprint / Face ID
      },
      timeout: 60000,
      attestation: "none"
    }
  });
  
  const credId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
  localStorage.setItem("attendx_biometric_cred", credId);
  return credId;
};

const authenticateWithBiometric = async (deviceId) => {
  if (!webauthnSupported()) throw new Error("Biometric not supported on this browser/device.");
  
  let credIdB64 = localStorage.getItem("attendx_biometric_cred");
  if (!credIdB64) credIdB64 = await registerBiometricCredential(deviceId);

  const credId = Uint8Array.from(atob(credIdB64), c => c.charCodeAt(0));

  try {
    return await navigator.credentials.get({
      publicKey: {
        challenge: window.crypto.getRandomValues(new Uint8Array(32)),
        timeout: 60000,
        userVerification: "required",
        allowCredentials: [{ id: credId, type: "public-key", transports: ["internal"] }]
      }
    });
  } catch (err) {
    if (err.name === "NotAllowedError") throw new Error("Biometric cancelled or timed out.");
    // Stale credential (e.g. user re-enrolled fingerprint in OS settings) → re-register
    localStorage.removeItem("attendx_biometric_cred");
    const newCredIdB64 = await registerBiometricCredential(deviceId);
    const newCredId = Uint8Array.from(atob(newCredIdB64), c => c.charCodeAt(0));
    return await navigator.credentials.get({
      publicKey: {
        challenge: window.crypto.getRandomValues(new Uint8Array(32)),
        timeout: 60000,
        userVerification: "required",
        allowCredentials: [{ id: newCredId, type: "public-key", transports: ["internal"] }]
      }
    });
  }
};

// =====================================================
// Component
// =====================================================
export default function StudentScan() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const scannerRef = useRef(null);

  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState("Point the camera at your teacher's QR code.");
  const [deviceBound, setDeviceBound] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 1. Bind Device
  useEffect(() => {
    (async () => {
      let dev = getStoredDevice();
      if (!dev) {
        dev = { deviceId: generateDeviceId(), deviceKey: generateDeviceKey() };
        storeDevice(dev);
      }

      try {
        await client.post("/student/device/bind", {
          deviceId: dev.deviceId,
          deviceKey: dev.deviceKey
        });
        setDeviceBound(true);
        setErrorMsg("");
      } catch (err) {
        const msg = err.response?.data?.message || "Device binding failed.";
        setErrorMsg(msg);
        toastError(msg);
        if (err.response?.status === 401) {
          localStorage.clear();
          navigate("/login");
        }
      }
    })();
  }, [navigate]);

  // Cleanup Scanner
  useEffect(() => () => { stopScanner(); }, []);

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch {}
  };

  const startScanner = async () => {
    if (!deviceBound) {
      return setErrorMsg("Please fix the device binding error above before scanning.");
    }
    setStarted(true);
    setStep(0);
    setErrorMsg("");
    setMessage("Scanning for QR code…");

    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (decoded) => {
          await stopScanner();
          handleQrScanned(decoded);
        },
        () => {}
      );
    } catch (e) {
      setErrorMsg("Camera access failed");
      setStarted(false);
    }
  };

  // 2. QR Scanned
  const handleQrScanned = (decoded) => {
    let qrPayload;
    try { qrPayload = JSON.parse(decoded); } catch {
      setErrorMsg("Invalid QR code format");
      setStarted(false);
      return;
    }

    const { sessionId, window: qrWindow, qrToken } = qrPayload;
    if (!sessionId || qrWindow === undefined || !qrToken) {
      setErrorMsg("Incomplete QR payload");
      setStarted(false);
      return;
    }

    setScannedData(qrPayload);
    setStep(1);
    setMessage("QR Verified. Proceed to BLE.");
  };

  // 3. Fingerprint + Submit (Triggers OS Prompt)
  const handleFingerprint = async () => {
    if (isAuthenticating || !scannedData) return;
    setErrorMsg("");
    setIsAuthenticating(true);

    try {
      const dev = getStoredDevice();
      if (!dev) throw new Error("Device not bound. Refresh and try again.");

      // 🔥 Triggers real phone biometric prompt
      await authenticateWithBiometric(dev.deviceId);

      const challenge = `${scannedData.sessionId}:${scannedData.window}:${scannedData.qrToken}`;
      
      const deviceProof = await generateProof(dev.deviceKey, DEVICE_PROOF_PREFIX, challenge);
      const fingerprintProof = await generateProof(dev.deviceKey, FINGERPRINT_PROOF_PREFIX, challenge);

      // Submit to backend (REQUIRE_BLE=false, so no BLE params needed)
      const r = await client.post("/student/scan-attendance/scan", {
        sessionId: scannedData.sessionId,
        window: scannedData.window,
        qrToken: scannedData.qrToken,
        deviceId: dev.deviceId,
        deviceProof,
        fingerprintProof
      });

      success(r.data.message || "Attendance marked!");
      setStep(4);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to mark attendance.";
      setErrorMsg(msg);
      toastError(msg);
      
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate("/login");
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="stack">
      <div className="page-head">
        <h2>Mark Attendance</h2>
      </div>

      {/* Stepper */}
      <div className="steps">
        {STEP_LABELS.map((s, i) => (
          <div key={i} className={`step ${step >= i ? "active" : ""}`}>
            <div className="step-dot"><s.icon size={14} /></div>
            <div className="step-label">{s.label}</div>
          </div>
        ))}
      </div>

      {errorMsg && (
        <div className="error-box glass-panel mb-4" style={{ display: "flex", gap: 8, alignItems: "center", color: "red" }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="card center-text">
        {/* Step 0 – Not Started */}
        {!started && step === 0 && (
          <>
            <p>{message}</p>
            <button className="btn btn-primary mt" onClick={startScanner}>
              📷 Start Camera
            </button>
          </>
        )}

        {/* Step 0/1 – Scanning */}
        {started && step <= 1 && (
          <>
            <div id="qr-reader" style={{ width: "100%", maxWidth: 420, margin: "0 auto" }} />
            <p className="muted mt">{message}</p>
          </>
        )}

        {/* Step 2 – BLE Verification (Mocked since BLE is OFF) */}
        {step === 1 && (
          <div className="animate-fade-in mt-4">
            <Bluetooth size={48} className="text-indigo-500 mx-auto" />
            <h2 className="text-2xl font-bold mb-2">BLE Proximity</h2>
            <p className="text-green-500 font-semibold mb-6">✓ QR Code Verified</p>
            <button className="btn btn-primary w-full" onClick={() => setStep(2)}>
              Confirm Proximity
            </button>
          </div>
        )}

        {/* Step 3 – Device Verification */}
        {step === 2 && (
          <div className="animate-fade-in mt-4">
            <ShieldCheck size={48} className="text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold mb-2">Device Check</h2>
            <p className="text-green-500 font-semibold mb-6">✓ Device Authenticated</p>
            <button className="btn btn-primary w-full" onClick={() => setStep(3)}>
              Continue to Biometric
            </button>
          </div>
        )}

        {/* Step 4 – Real Biometric */}
        {step === 3 && (
          <div className="animate-fade-in mt-4">
            <button
              type="button"
              onClick={handleFingerprint}
              disabled={isAuthenticating}
              style={{ background: "none", border: "none", cursor: isAuthenticating ? "default" : "pointer", padding: 12, margin: "0 auto" }}
            >
              <Fingerprint size={80} className={isAuthenticating ? "text-emerald-500" : "text-indigo-500"} />
            </button>
            <h2 className="text-2xl font-bold mb-2">Biometric Auth</h2>
            {isAuthenticating ? (
              <p className="text-indigo-500 font-bold animate-pulse mb-6">Waiting for phone's fingerprint sensor…</p>
            ) : (
              <p className="text-muted mb-6">Tap the fingerprint icon to use your phone's sensor.</p>
            )}
            <button
              className="btn btn-primary w-full"
              onClick={handleFingerprint}
              disabled={isAuthenticating}
            >
              {isAuthenticating ? "Authenticating…" : "Authenticate & Submit"}
            </button>
          </div>
        )}

        {/* Step 5 – Success */}
        {step === 4 && (
          <div className="animate-fade-in success-panel mt-4">
            <CheckCircle size={80} className="text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-green-500 mb-6 mt-4">Attendance Marked!</h2>
            <button className="btn btn-primary w-full" onClick={() => navigate("/student")}>
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}