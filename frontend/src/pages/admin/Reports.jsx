import { useState } from "react";
import client from "../../api/client";
import { useToast } from "../../context/ToastContext";

const TYPES = [
  { key: "monthly", label: "Monthly Attendance", url: "/admin/reports/monthly-attendance" },
  { key: "low", label: "Low Attendance (<75%)", url: "/admin/reports/low-attendance" },
  { key: "faculty", label: "Faculty Activity", url: "/admin/reports/faculty-activity" }
];

export default function AdminReports() {
  const { error } = useToast();
  const [type, setType] = useState(TYPES[0]);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const r = await client.get(type.url, { params: { month, year } });
      setData(r.data.data);
    } catch (e) {
      error(e.response?.data?.message || "Failed");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stack">
      <div className="page-head"><h2>Reports</h2></div>

      <div className="card">
        <div className="grid grid-3">
          <label className="field">
            <span>Report Type</span>
            <select
              value={type.key}
              onChange={(e) => setType(TYPES.find((t) => t.key === e.target.value))}
            >
              {TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Month</span>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {[...Array(12)].map((_, i) => (
                <option key={i} value={i}>{new Date(0, i).toLocaleString("en", { month: "long" })}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Year</span>
            <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          </label>
        </div>
        <button className="btn btn-primary mt" onClick={run} disabled={loading}>
          {loading ? "Generating…" : "Generate Report"}
        </button>
      </div>

      {data && (
        <div className="card">
          <h3>Results ({data.totalSubjects ?? data.totalFaculty ?? 0})</h3>
          <pre className="code-block">{JSON.stringify(data, null, 2).slice(0, 5000)}</pre>
        </div>
      )}
    </div>
  );
}