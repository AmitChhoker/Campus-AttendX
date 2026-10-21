import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../../api/client";
import Loader from "../../components/Loader";

export default function StudentSubjects() {
  const [data, setData] = useState(null);

  useEffect(() => {
    client.get("/student/subjects").then((r) => setData(r.data.data));
  }, []);

  if (!data) return <Loader full />;

  return (
    <div className="stack">
      <div className="page-head"><h2>My Subjects</h2></div>
      <div className="grid grid-2">
        {data.subjects.map((s) => (
          <Link key={s.id} to={`/student/subjects/${s.id}`} className="card link-card">
            <div className="row-between">
              <h3 className="m-0">{s.subjectName}</h3>
              <span className="pill pill-approved">{s.type}</span>
            </div>
            <p className="muted small">{s.subjectCode} · {s.credits} credits</p>
            <p className="small">Faculty: {s.faculty?.name || "—"}</p>
          </Link>
        ))}
        {data.subjects.length === 0 && <div className="muted">No subjects yet</div>}
      </div>
    </div>
  );
}