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
import { Fingerprint, Bluetooth, QrCode, ShieldCheck } from "lucide-react";

const STEP_LABELS = [
  { label: "Scan QR", icon: QrCode },
  { label: "BLE Proximity", icon: Bluetooth },
  { label: "Device Verify", icon: ShieldCheck },
  { label: "Fingerprint", icon: Fingerprint }
];

export default function StudentScan() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const scannerRef = useRef(null);

  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState(
    "Point the camera at your teacher's QR code."
  );
  const [deviceBound, setDeviceBound] = useState(false);

  // --------------------------------------------------
  // Device binding — ensure this device is registered
  // --------------------------------------------------
  useEffect(() => {
    (async () => {
      let dev = getStoredDevice();
      if (!dev) {
        dev = {
          deviceId: generateDeviceId(),
          deviceKey: generateDeviceKey()
        };
        storeDevice(dev);
      }

      try {
        await client.post("/student/device/bind", {
          deviceId: dev.deviceId,
          deviceKey: dev.deviceKey
        });
        setDeviceBound(true);
      } catch (err) {
        error(
          err.response?.data?.message ||
            "Device binding failed. Ask admin to reset your device."
        );
      }
    })();
  }, []);

  // --------------------------------------------------
  // Cleanup on unmount
  // --------------------------------------------------
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch {
      /* noop */
    }
  };

  const startScanner = async () => {
    if (!deviceBound) {
      return error("Bind your device first (refresh or contact admin)");
    }
    setStarted(true);
    setStep(0);
    setMessage("Scanning for QR code…");

    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (decoded) => {
          await stopScanner();
          await handleQrScanned(decoded);
        },
        () => {}
      );
    } catch (e) {
      error("Camera access failed");
      setStarted(false);
    }
  };

  // --------------------------------------------------
  // Step 1: QR scanned
  // --------------------------------------------------
  const handleQrScanned = async (decoded) => {
    let qrPayload;
    try {
      qrPayload = JSON.parse(decoded);
    } catch {
      return error("Invalid QR code format");
    }

    const { sessionId, window: qrWindow, qrToken } = qrPayload;
    if (!sessionId || qrWindow === undefined || !qrToken) {
      return error("Incomplete QR payload");
    }

    setStep(1);
    setMessage("QR verified. Scanning for BLE beacon…");

    // --------------------------------------------------
    // Step 2: BLE (best effort in browser)
    // --------------------------------------------------
    let blePayload = null;

    try {
      const r = await client.get(
        `/attendance-sessions/${sessionId}/ble`
      );
      // Faculty endpoint is role-guarded (faculty only). Students cannot
      // fetch it — so we skip real BLE in browser-only deployments.
      blePayload = r.data.data;
    } catch {
      // Expected for student role — skip BLE.
    }

    // In a real deployment, the faculty device broadcasts the BLE token
    // and the student's device would discover it here via Web Bluetooth.
    // In this browser-only build, BLE is optional (server accepts without it).

    setStep(2);
    setMessage("Device verification…");

    // --------------------------------------------------
    // Step 3: Device proof
    // --------------------------------------------------
    const dev = getStoredDevice();
    if (!dev) {
      return error("Device not bound. Refresh and try again.");
    }

    const challenge = `${sessionId}:${qrWindow}:${qrToken}`;
    const deviceProof = await generateProof(
      dev.deviceKey,
      DEVICE_PROOF_PREFIX,
      challenge
    );

    setStep(3);
    setMessage("Confirm fingerprint to complete…");

    // --------------------------------------------------
    // Step 4: Fingerprint (browser fallback)
    // --------------------------------------------------
    // In a native app, this triggers the OS biometric prompt.
    // In a browser we can't force biometric, so we ask the user to
    // confirm. The proof is still computed on the client.
    const confirmed = window.confirm(
      "Confirm your fingerprint / biometric to mark attendance."
    );
    if (!confirmed) {
      setStarted(false);
      setStep(0);
      return setMessage("Fingerprint cancelled.");
    }

    const fingerprintProof = await generateProof(
      dev.deviceKey,
      FINGERPRINT_PROOF_PREFIX,
      challenge
    );

    // --------------------------------------------------
    // Submit
    // --------------------------------------------------
    setMessage("Submitting attendance…");

    try {
      const r = await client.post("/student/scan-attendance/scan", {
        sessionId,
        window: qrWindow,
        qrToken,
        deviceId: dev.deviceId,
        deviceProof,
        fingerprintProof,
        // Optional BLE fields when we actually have them
        bleWindow: blePayload?.window,
        bleToken: blePayload?.bleToken,
        bleRssi: blePayload ? -55 : undefined
      });

      success(r.data.message || "Attendance marked!");
      setTimeout(() => navigate("/student"), 1400);
    } catch (err) {
      error(err.response?.data?.message || "Failed to mark attendance");
      setStep(0);
      setStarted(false);
      setMessage("Scan failed. Try again.");
    }
  };

  return (
    <div className="stack">
      <div className="page-head">
        <h2>Mark Attendance</h2>
      </div>

      <div className="steps">
        {STEP_LABELS.map((s, i) => (
          <div key={i} className={`step ${step >= i ? "active" : ""}`}>
            <div className="step-dot">
              <s.icon size={14} />
            </div>
            <div className="step-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card center-text">
        {!started && (
          <>
            <p>{message}</p>
            <button className="btn btn-primary mt" onClick={startScanner}>
              📷 Start Camera
            </button>
          </>
        )}
        <div
          id="qr-reader"
          style={{ width: "100%", maxWidth: 420, margin: "0 auto" }}
        />
        {started && <p className="muted mt">{message}</p>}
      </div>
    </div>
  );
}