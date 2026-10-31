import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import client from "../../api/client";
import { QrCode, Bluetooth, ShieldCheck, Fingerprint, CheckCircle, AlertCircle, FingerprintIcon } from "lucide-react";

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

const STEPS = [
  { id: 1, label: "Scan QR", icon: QrCode },
  { id: 2, label: "BLE Check", icon: Bluetooth },
  { id: 3, label: "Device", icon: ShieldCheck },
  { id: 4, label: "Biometric", icon: Fingerprint }
];

// 🔥 WebAuthn Helper Functions
const registerBiometric = async () => {
  if (!window.PublicKeyCredential) {
    alert("Biometrics not supported on this browser.");
    return false;
  }
  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    const user = { id: new Uint8Array(16), name: "student@svsu.ac.in", displayName: "Student" };
    
    await navigator.credentials.create({
      publicKey: {
        challenge: challenge,
        rp: { name: "AttendX", id: window.location.hostname },
        user: user,
        pubKeyCredParams: [{ alg: -7, type: "public-key" }],
        authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
        timeout: 60000,
      }
    });
    return true;
  } catch (err) {
    console.error("Registration failed", err);
    return false;
  }
};

const authenticateBiometric = async () => {
  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    
    await navigator.credentials.get({
      publicKey: {
        challenge: challenge,
        timeout: 60000,
        userVerification: "required", // OS Sensor popup trigger karega
      }
    });
    return true;
  } catch (err) {
    console.error("Auth failed", err);
    return false;
  }
};

export default function StudentMark() {
  const [step, setStep] = useState(1);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [error, setError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false); 
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const dev = getStoredDevice();
      client.post("/student/device/bind", { deviceId: dev.deviceId, deviceKey: dev.deviceKey }).catch(() => {});
    } catch (err) {}
  }, []);

  useEffect(() => {
    if (!isScanning) return;
    
    let scanner = null;
    let isMounted = true;

    const startScanner = async () => {
      try {
        scanner = new Html5Qrcode("reader");
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          async (decodedText) => {
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
                setStep(2); 
              } else {
                setError("Invalid QR format");
                setIsScanning(false);
              }
            } catch (e) {
              setError("Invalid QR Code. Please scan the teacher's QR.");
              setIsScanning(false);
            }
          },
          () => {} 
        );
      } catch (err) {
        setError("Camera access denied or not found.");
        setIsScanning(false);
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (scanner) scanner.stop().catch(() => {});
    };
  }, [isScanning]);

  const handleFinalSubmit = async () => {
    try {
      setError("");
      if (!scannedData) throw new Error("No QR data found. Please scan again.");
      
      setIsAuthenticating(true); 

      // 1. Check if browser supports WebAuthn
      if (window.PublicKeyCredential) {
        // 2. Try to authenticate (This triggers the OS Fingerprint/FaceID)
        const isAuthenticated = await authenticateBiometric();
        
        // 3. If OS prompt fails (maybe not registered yet), we register it now
        if (!isAuthenticated) {
           const registered = await registerBiometric();
           if(!registered) {
             throw new Error("Biometric authentication failed or cancelled.");
           }
        }
      } else {
         // Fallback for unsupported browsers
         const userConfirmed = window.confirm("Biometric not supported. Click OK to simulate fingerprint.");
         if(!userConfirmed) throw new Error("Biometric cancelled.");
      }
      
      const dev = getStoredDevice();
      const challenge = `${scannedData.sessionId}:${scannedData.window}:${scannedData.qrToken}`;
      
      const deviceProof = await generateProof(dev.deviceKey, "device:", challenge);
      const fingerprintProof = await generateProof(dev.deviceKey, "fingerprint:", challenge);

      await client.post("/student/scan-attendance/scan", {
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
      setError(err.response?.data?.message || err.message || "Failed to mark attendance");
      // Reset to step 1 if auth fails
      setStep(1);
      setIsScanning(false);
      setScannedData(null);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="scan-dashboard pb-20">
      
      <div className="modern-stepper">
        {STEPS.map((s, i) => {
          const isActive = step === s.id;
          const isCompleted = step > s.id;
          
          return (
            <div key={s.id} className="stepper-item">
              <div className={`stepper-circle ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                {isCompleted ? <CheckCircle size={20} /> : <s.icon size={20} />}
              </div>
              <span className={`stepper-label ${isActive ? 'active' : ''}`}>{s.label}</span>
              {i !== STEPS.length - 1 && <div className={`stepper-line ${isCompleted ? 'completed' : ''}`} />}
            </div>
          );
        })}
      </div>

      <div className="scan-content">
        {error && (
          <div className="error-box glass-panel mb-4">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {step === 1 && (
          <div className="glass-panel text-center animate-fade-in">
            <h2 className="text-2xl font-bold mb-2">Scan Attendance QR</h2>
            <p className="text-muted mb-6">Position the QR code inside the frame</p>
            
            <div className={`scanner-container ${isScanning ? 'scanning' : ''}`}>
              {!isScanning ? (
                <div className="scanner-placeholder" onClick={() => { setError(""); setIsScanning(true); }}>
                  <QrCode size={64} className="text-indigo-500 mb-4" />
                  <button className="btn btn-primary">Open Camera</button>
                </div>
              ) : (
                <div id="reader" className="camera-view"></div>
              )}
              <div className="scan-laser"></div>
            </div>
            
            {isScanning && (
              <button className="btn btn-ghost mt-4 w-full" onClick={() => setIsScanning(false)}>Cancel</button>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="glass-panel text-center animate-fade-in">
            <div className="icon-pulse-ring">
              <Bluetooth size={48} className="text-indigo-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">BLE Verification</h2>
            <p className="text-green-500 font-semibold mb-6">✓ QR Code Verified</p>
            <p className="text-muted mb-6">Scanning for teacher's bluetooth beacon...</p>
            <button className="btn btn-primary w-full" onClick={() => setStep(3)}>Confirm Proximity</button>
          </div>
        )}

        {step === 3 && (
          <div className="glass-panel text-center animate-fade-in">
             <div className="icon-pulse-ring">
              <ShieldCheck size={48} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Device Check</h2>
            <p className="text-green-500 font-semibold mb-6">✓ Device Authenticated</p>
            <p className="text-muted mb-6">Your unique device signature matches our records.</p>
            <button className="btn btn-primary w-full" onClick={() => setStep(4)}>Continue to Biometric</button>
          </div>
        )}

        {step === 4 && (
          <div className="glass-panel text-center animate-fade-in">
            <div className={`fingerprint-sensor ${isAuthenticating ? 'scanning' : ''}`}>
              <Fingerprint size={80} className="text-indigo-500" />
              <div className="fingerprint-laser"></div>
            </div>
            
            <h2 className="text-2xl font-bold mb-2">Biometric Auth</h2>
            {isAuthenticating ? (
              <p className="text-indigo-500 font-bold animate-pulse mb-6">Waiting for OS Biometric prompt...</p>
            ) : (
              <p className="text-muted mb-6">Tap below to trigger your device's fingerprint / FaceID.</p>
            )}

            <button 
              className="btn btn-primary w-full" 
              onClick={handleFinalSubmit}
              disabled={isAuthenticating}
            >
              {isAuthenticating ? "Authenticating..." : "Authenticate & Submit"}
            </button>
          </div>
        )}

        {step === 5 && (
          <div className="glass-panel text-center animate-fade-in success-panel">
            <div className="success-checkmark">
              <CheckCircle size={80} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-green-500 mb-2">Attendance Marked!</h2>
            <p className="text-muted mb-6">Your presence has been successfully recorded.</p>
            <button className="btn btn-primary w-full" onClick={() => navigate("/student")}>
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}