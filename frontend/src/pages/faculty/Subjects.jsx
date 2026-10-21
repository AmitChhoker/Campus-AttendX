import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../../api/client";
import Loader from "../../components/Loader";
import { Plus } from "lucide-react";

export default function FacultySubjects() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get("/subjects/my-submissions").then((r) => {
      setRows(r.data.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <Loader full />;

  return (
    <div className="stack">
      <div className="page-head">
        <h2>My Subjects</h2>
        <Link to="/faculty/subjects/new" className="btn btn-primary">
          <Plus size={16} /> Submit New Subject
        </Link>
      </div>

      <div className="grid grid-2">
        {rows.map((s) => (
          <div key={s._id} className="card">
            <div className="row-between">
              <h3 className="m-0">{s.subjectName}</h3>
              <span className={`pill pill-${s.status}`}>{s.status}</span>
            </div>
            <p className="muted small">{s.subjectCode} · {s.course} · {s.branch} · Sem {s.semester}</p>
            <p className="small">Credits: {s.credits} · Type: {s.type}</p>
            {s.rejectionReason && (
              <p className="error-box small mt">
                <strong>Rejected:</strong> {s.rejectionReason}
              </p>
            )}
          </div>
        ))}
        {rows.length === 0 && <div className="muted center">No submissions yet</div>}
      </div>
    </div>
  );
}