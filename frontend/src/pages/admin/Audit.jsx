import { ShieldCheck, ShieldAlert } from "lucide-react";

export default function AdminAudit() {
  return (
    <div className="stack">
      <div className="page-head">
        <h2>Audit Logs</h2>
        <button className="btn btn-ghost">Export Logs</button>
      </div>

      <div className="card">
        <ul className="list">
          <li className="list-row">
            <div>
              <strong>Rahul Sharma marked attendance ✓</strong>
              <p className="small muted mt">2026-10-01 10:15 · DBMS · Session CS201-S7-Mon</p>
              <div className="row-gap mt">
                <span className="pill pill-approved">QR ✓</span>
                <span className="pill pill-approved">BLE ✓</span>
                <span className="pill pill-approved">Device ✓</span>
                <span className="pill pill-approved">Finger ✓</span>
              </div>
            </div>
          </li>
          <li className="list-row" style={{ background: "#fef2f2" }}>
            <div>
              <strong className="text-red-500">Failed attempt: Amit Kumar</strong>
              <p className="small muted mt">2026-10-01 10:14 · Reason: BLE proximity failed (-85 dBm)</p>
            </div>
            <ShieldAlert size={20} className="text-red-500" />
          </li>
          <li className="list-row">
            <div>
              <strong>Dr. Priya started session CS201-S7-Mon</strong>
              <p className="small muted mt">2026-10-01 10:12</p>
            </div>
            <ShieldCheck size={20} className="text-green-500" />
          </li>
        </ul>
      </div>
    </div>
  );
}