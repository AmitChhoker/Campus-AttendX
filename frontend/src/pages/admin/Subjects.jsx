import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import client from "../../api/client";
import Loader from "../../components/Loader";
import { useToast } from "../../context/ToastContext";

const FILTERS = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" }
];

export default function AdminSubjects() {
  const [sp, setSp] = useSearchParams();
  const [status, setStatus] = useState(sp.get("status") || "");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const r = await client.get("/admin/subjects", {
        params: status ? { status } : {}
      });
      setRows(r.data.data || []);
    } catch (e) {
      error(e.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status]);

  const act = async (id, action) => {
    try {
      if (action === "approve") {
        await client.patch(`/admin/subjects/${id}/approve`);
        success("Approved");
      } else {
        const reason = prompt("Rejection reason:");
        if (!reason) return;
        await client.patch(`/admin/subjects/${id}/reject`, { reason });
        success("Rejected");
      }
      load();
    } catch (e) {
      error(e.response?.data?.message || "Failed");
    }
  };

  return (
    <div className="stack">
      <div className="page-head">
        <h2>Subjects</h2>
      </div>
      <div className="tabs">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`tab ${status === f.key ? "active" : ""}`}
            onClick={() => { setStatus(f.key); setSp(f.key ? { status: f.key } : {}); }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? <Loader /> : (
        <div className="grid grid-2">
          {rows.map((s) => (
            <div key={s._id} className="card">
              <div className="row-between">
                <div>
                  <h3 className="m-0">{s.subjectName}</h3>
                  <p className="muted small">{s.subjectCode} · {s.course} · {s.branch} · Sem {s.semester}</p>
                </div>
                <span className={`pill pill-${s.status}`}>{s.status}</span>
              </div>
              <p className="small muted mt">
                Submitted by {s.submittedBy?.firstName} {s.submittedBy?.lastName}
              </p>
              <div className="row-gap mt">
                <Link className="btn btn-ghost sm" to={`/admin/subjects/${s._id}`}>View</Link>
                {s.status === "pending" && (
                  <>
                    <button className="btn btn-primary sm" onClick={() => act(s._id, "approve")}>Approve</button>
                    <button className="btn btn-danger sm" onClick={() => act(s._id, "reject")}>Reject</button>
                  </>
                )}
              </div>
            </div>
          ))}
          {rows.length === 0 && <div className="muted center">No subjects</div>}
        </div>
      )}
    </div>
  );
}