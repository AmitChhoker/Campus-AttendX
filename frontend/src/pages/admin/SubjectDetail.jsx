import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../../api/client";
import Loader from "../../components/Loader";

export default function AdminSubjectDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [s, setS] = useState(null);

  useEffect(() => {
    client.get(`/admin/subjects/${id}`).then((r) => setS(r.data.data));
  }, [id]);

  if (!s) return <Loader full />;

  return (
    <div className="stack">
      <button className="btn btn-ghost sm" onClick={() => nav(-1)}>← Back</button>
      <div className="card">
        <div className="row-between">
          <h2 className="m-0">{s.subjectName}</h2>
          <span className={`pill pill-${s.status}`}>{s.status}</span>
        </div>
        <p className="muted">{s.subjectCode} · {s.course} · {s.branch} · Sem {s.semester}</p>

        <div className="kv-grid mt">
          <KV label="Credits" value={s.credits} />
          <KV label="Type" value={s.type} />
          <KV label="Submitted By" value={`${s.submittedBy?.firstName || ""} ${s.submittedBy?.lastName || ""}`} />
          <KV label="Reviewer" value={s.reviewedBy?.firstName || "—"} />
        </div>

        {s.rejectionReason && (
          <div className="error-box mt">
            <strong>Rejection reason:</strong> {s.rejectionReason}
          </div>
        )}

        {s.syllabus?.fileUrl && (
          <a className="btn btn-ghost mt" href={s.syllabus.fileUrl} target="_blank" rel="noreferrer">
            📄 View Syllabus PDF
          </a>
        )}
      </div>
    </div>
  );
}

function KV({ label, value }) {
  return (
    <div className="kv">
      <div className="muted small">{label}</div>
      <div className="kv-val">{value || "—"}</div>
    </div>
  );
}