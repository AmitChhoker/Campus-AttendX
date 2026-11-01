import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import client from "../../api/client";
import { QrCode, Bluetooth, ShieldCheck, Fingerprint, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

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
  { id: 1, label: "Scan", icon: QrCode },
  { id: 2, label: "BLE", icon: Bluetooth },
  { id: 3, label: "Device", icon: ShieldCheck },
  { id: 4, label: "Biometric", icon: Fingerprint }
];

export default function StudentMark() {
  const [step, setStep] = useState(1);
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [error, setError] = useState("");
  
  // 🔥 Fingerprint Press State
  const [isPressing, setIsPressing] = useState(false);
  const [pressProgress, setPressProgress] = useState(0);
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
      setIsCameraLoading(true);
      setError("");
      try {
        scanner = new Html5Qrcode("reader");
        await scanner.start(
          { facingMode: "environment" },
          { fps: 15, qrbox: { width: 250, height: 250 } },
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
      } finally {
        setIsCameraLoading(false);
      }
    };
    
    setTimeout(startScanner, 100);

    return () => {
      isMounted = false;
      if (scanner) scanner.stop().catch(() => {});
    };
  }, [isScanning]);

  // 🔥 FINGERPRINT HOLD LOGIC
  const startPress = () => {
    if (isAuthenticating) return;
    setIsPressing(true);
    setPressProgress(0);
    setError("");

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setPressProgress(currentProgress);
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        executeBiometricAuth();
      }
    }, 100); // 1 second hold required

    // Save interval ID to clear it if user releases early
    window.pressInterval = interval;
  };

  const endPress = () => {
    if (isAuthenticating) return;
    setIsPressing(false);
    setPressProgress(0);
    if (window.pressInterval) {
      clearInterval(window.pressInterval);
    }
  };

  const executeBiometricAuth = async () => {
    setIsAuthenticating(true);
    setIsPressing(false);

    try {
      // Fake delay for visual effect
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Generate Proofs & Submit
      const dev = getStoredDevice();
      const challengeString = `${scannedData.sessionId}:${scannedData.window}:${scannedData.qrToken}`;
      
      const deviceProof = await generateProof(dev.deviceKey, "device:", challengeString);
      const fingerprintProof = await generateProof(dev.deviceKey, "fingerprint:", challengeString);

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
      setError(err.response?.data?.message || err.message || "Failed to mark attendance. Please try again.");
      // Agar backend error de, toh step 4 par hi rahein
    } finally {
      setIsAuthenticating(false);
      setPressProgress(0);
    }
  };

  return (
    <div className="mark-container pb-20">
      <div className="modern-stepper-wrapper">
        {STEPS.map((s, i) => {
          const isActive = step === s.id;
          const isCompleted = step > s.id;
          return (
            <div key={s.id} className="modern-step">
              <div className={`step-circle ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                {isCompleted ? <CheckCircle size={18} /> : <s.icon size={18} />}
              </div>
              <span className={`step-text ${isActive ? 'active' : ''}`}>{s.label}</span>
              {i !== STEPS.length - 1 && (
                <div className={`step-line ${isCompleted ? 'completed' : ''}`} />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="error-banner animate-slide-down">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="mark-content-area">
        {step === 1 && (
          <div className="mark-card animate-fade-in">
            <div className="mark-header">
              <h2>Scan Attendance QR</h2>
              <p>Point your camera at the teacher's screen</p>
            </div>
            
            <div className={`camera-wrapper ${isScanning ? 'active' : ''}`}>
              {!isScanning ? (
                <div className="camera-placeholder" onClick={() => setIsScanning(true)}>
                  <div className="scan-icon-box"><QrCode size={48} /></div>
                  <button className="btn btn-primary mt-4">Open Camera</button>
                </div>
              ) : (
                <>
                  {isCameraLoading && (
                    <div className="camera-loading">
                      <Loader2 size={32} className="animate-spin text-indigo-500" />
                      <p>Starting Camera...</p>
                    </div>
                  )}
                  <div id="reader" className="camera-feed"></div>
                  <div className="scan-laser"></div>
                </>
              )}
            </div>
            
            {isScanning && (
              <button className="btn btn-ghost full mt-4" onClick={() => setIsScanning(false)}>
                Cancel
              </button>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="mark-card text-center animate-fade-in">
            <div className="success-icon-box bg-blue-100 text-blue-600">
              <Bluetooth size={48} />
            </div>
            <h2 className="text-2xl font-bold mt-4">BLE Verification</h2>
            <p className="text-green-500 font-semibold mt-1 mb-6">✓ QR Code Verified</p>
            <button className="btn btn-primary full" onClick={() => setStep(3)}>
              Confirm Proximity
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="mark-card text-center animate-fade-in">
            <div className="success-icon-box bg-emerald-100 text-emerald-600">
              <ShieldCheck size={48} />
            </div>
            <h2 className="text-2xl font-bold mt-4">Device Check</h2>
            <p className="text-green-500 font-semibold mt-1 mb-6">✓ Device Authenticated</p>
            <button className="btn btn-primary full" onClick={() => setStep(4)}>
              Continue to Biometric
            </button>
          </div>
        )}

        {/* 🔥 STEP 4: SIMPLE PRESS & HOLD FINGERPRINT */}
        {step === 4 && (
          <div className="mark-card text-center animate-fade-in">
            <h2 className="text-2xl font-bold mt-2">Biometric Auth</h2>
            
            <p className="text-muted mt-2 mb-6">
              {isAuthenticating ? "Verifying Fingerprint..." : "Press and hold the sensor below"}
            </p>

            <div 
              className={`fingerprint-sensor-btn ${isAuthenticating ? 'scanning' : ''} ${isPressing ? 'pressing' : ''}`}
              onMouseDown={startPress}
              onMouseUp={endPress}
              onMouseLeave={endPress}
              onTouchStart={startPress}
              onTouchEnd={endPress}
            >
              <Fingerprint 
                size={80} 
                className={isAuthenticating || isPressing ? "text-emerald-500" : "text-indigo-500"} 
              />
              
              {/* Progress circle overlay during press */}
              {isPressing && (
                <div 
                  className="press-progress-ring" 
                  style={{ background: `conic-gradient(#10b981 ${pressProgress}%, transparent 0)` }}
                ></div>
              )}

              {isAuthenticating && <div className="fp-laser"></div>}
            </div>

            <p className="text-xs text-gray-400 mt-6 font-bold">
              {isAuthenticating ? "Please wait..." : isPressing ? "Keep holding..." : "Touch & Hold to Scan"}
            </p>
          </div>
        )}

        {step === 5 && (
          <div className="mark-card text-center animate-fade-in">
            <div className="success-icon-box bg-emerald-100 text-emerald-500 pop-animation">
              <CheckCircle size={64} />
            </div>
            <h2 className="text-2xl font-bold text-emerald-600 mt-4">Attendance Marked!</h2>
            <p className="text-muted mt-2 mb-6">Your presence has been successfully recorded.</p>
            <button className="btn btn-primary full" onClick={() => navigate("/student")}>
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}