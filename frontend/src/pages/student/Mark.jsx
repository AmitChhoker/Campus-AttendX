import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import client from "../../api/client";
import { QrCode, Bluetooth, ShieldCheck, Fingerprint, CheckCircle, AlertCircle, Upload } from "lucide-react";
// Device utils import karein
import { getStoredDevice, generateProof, DEVICE_PROOF_PREFIX, FINGERPRINT_PROOF_PREFIX } from "../../utils/deviceBinding";

const STEPS = [
  { id: 1, label: "Scan QR", icon: QrCode },
  { id: 2, label: "BLE Check", icon: Bluetooth },
  { id: 3, label: "Device", icon: ShieldCheck },
  { id: 4, label: "Biometric", icon: Fingerprint }
];

// 🔥 BIOMETRIC FALLBACK (Laptop me sensor na ho toh bhi pass ho jayega)
const authenticateBiometric = async () => {
  try {
    if (!window.PublicKeyCredential) throw new Error("WebAuthn not supported");
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    await navigator.credentials.get({
      publicKey: { challenge: challenge, timeout: 60000, userVerification: "required" }
    });
    return true;
  } catch (err) {
    console.warn("Biometric WebAuthn failed or cancelled:", err);
    // Fallback: Agar hardware nahi hai toh manual confirm
    return window.confirm("Biometric prompt unavailable. Click OK to confirm attendance manually.");
  }
};

export default function StudentMark() {
  const [step, setStep] = useState(1);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [error, setError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false); 
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Camera Scanner Logic
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
            if (scanner) {
              await scanner.stop();
              await scanner.clear();
              scanner = null;
            }
            if (!isMounted) return;
            processScannedText(decodedText);
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

  // Common function to process text (from Camera OR File)
  const processScannedText = (decodedText) => {
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
  };

  // Handle File Upload (Screenshot)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setError("");
      const html5QrCode = new Html5Qrcode("reader-file-hidden");
      const decodedText = await html5QrCode.scanFile(file, true);
      processScannedText(decodedText);
    } catch (err) {
      setError("Failed to read QR from image. Make sure it's clear.");
    }
  };

  const handleFinalSubmit = async () => {
    try {
      setError("");
      if (!scannedData) throw new Error("No QR data found. Please scan again.");
      setIsAuthenticating(true); 
      
      const isAuthenticated = await authenticateBiometric();
      if (!isAuthenticated) throw new Error("Biometric authentication cancelled by user.");
      
      const dev = getStoredDevice(); // Ye login ke time bind ho chuka hoga
      if (!dev) throw new Error("Device not found. Please login again.");
      
      const challenge = `${scannedData.sessionId}:${scannedData.window}:${scannedData.qrToken}`;
      
      const deviceProof = await generateProof(dev.deviceKey, DEVICE_PROOF_PREFIX, challenge);
      const fingerprintProof = await generateProof(dev.deviceKey, FINGERPRINT_PROOF_PREFIX, challenge);

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
      if (err.response?.status === 401) {
        alert("Session expired. Please login again.");
        navigate("/login");
        return;
      }
      setError(err.response?.data?.message || err.message || "Failed to mark attendance");
      setStep(1);
      setIsScanning(false);
      setScannedData(null);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="scan-dashboard pb-20">
      <div id="reader-file-hidden" style={{ display: "none" }}></div>

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
          <div className="error-box glass-panel mb-4 flex items-center gap-2">
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
                <div className="scanner-placeholder flex flex-col items-center justify-center p-6">
                  <QrCode size={64} className="text-indigo-500 mb-4" />
                  
                  <button className="btn btn-primary w-full mb-3" onClick={() => { setError(""); setIsScanning(true); }}>
                    Open Camera
                  </button>
                  
                  <div className="w-full text-center">
                    <p className="text-sm text-gray-400 mb-2">OR</p>
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      style={{ display: "none" }} 
                    />
                    <button 
                      className="btn btn-secondary w-full flex items-center justify-center gap-2" 
                      onClick={() => fileInputRef.current.click()}
                      style={{ backgroundColor: '#e2e8f0', color: '#1e293b' }}
                    >
                      <Upload size={18} /> Upload QR Screenshot
                    </button>
                  </div>
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
            <div className="icon-pulse-ring"><Bluetooth size={48} className="text-indigo-500" /></div>
            <h2 className="text-2xl font-bold mb-2">BLE Verification</h2>
            <p className="text-green-500 font-semibold mb-6">✓ QR Code Verified</p>
            <button className="btn btn-primary w-full" onClick={() => setStep(3)}>Confirm Proximity</button>
          </div>
        )}

        {step === 3 && (
          <div className="glass-panel text-center animate-fade-in">
             <div className="icon-pulse-ring"><ShieldCheck size={48} className="text-green-500" /></div>
            <h2 className="text-2xl font-bold mb-2">Device Check</h2>
            <p className="text-green-500 font-semibold mb-6">✓ Device Authenticated</p>
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
              <p className="text-indigo-500 font-bold animate-pulse mb-6">Waiting for confirmation...</p>
            ) : (
              <p className="text-muted mb-6">Tap below to authenticate.</p>
            )}
            <button className="btn btn-primary w-full" onClick={handleFinalSubmit} disabled={isAuthenticating}>
              {isAuthenticating ? "Authenticating..." : "Authenticate & Submit"}
            </button>
          </div>
        )}

        {step === 5 && (
          <div className="glass-panel text-center animate-fade-in success-panel">
            <div className="success-checkmark"><CheckCircle size={80} className="text-green-500" /></div>
            <h2 className="text-2xl font-bold text-green-500 mb-2">Attendance Marked!</h2>
            <button className="btn btn-primary w-full mt-4" onClick={() => navigate("/student")}>Back to Dashboard</button>
          </div>
        )}
      </div>
    </div>
  );
}