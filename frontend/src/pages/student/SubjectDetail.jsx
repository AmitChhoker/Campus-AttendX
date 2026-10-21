import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../../api/client";
import Loader from "../../components/Loader";
import { Download } from "lucide-react";

export default function StudentSubjectDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [s, setS] = useState(null);

  useEffect(() => {
    client.get(`/student/subjects/${id}`).then((r) => setS(r.data.data));
  }, [id]);

  if (!s) return <Loader full />;

  const downloadSyllabus = () => {
    window.open(`/api/student/subjects/${id}/syllabus`, "_blank");
  };

  return (
    <div className="stack">
      <button className="btn btn-ghost sm" onClick={() => nav(-1)}>← Back</button>
      <div className="card">
        <h2 className="m-0">{s.subjectName}</h2>
        <p className="muted">{s.subjectCode} · {s.course} · {s.branch} · Sem {s.semester}</p>
        <div className="kv-grid mt">
          <KV label="Credits" value={s.credits} />
          <KV label="Type" value={s.type} />
          <KV label="Faculty" value={s.faculty?.name || "—"} />
        </div>
        {s.syllabus?.available && (
          <button className="btn btn-primary mt" onClick={downloadSyllabus}>
            <Download size={16} /> Download Syllabus
          </button>
        )}
      </div>
    </div>
  );
}

function KV({ label, value }) {
  return (
    <div className="kv">
      <div className="muted small">{label}</div>
      <div className="kv-val">{value}</div>
    </div>
  );
}