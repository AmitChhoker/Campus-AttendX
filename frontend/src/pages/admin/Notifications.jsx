import { useEffect, useState } from "react";
import client from "../../api/client";
import Loader from "../../components/Loader";
import { Bell } from "lucide-react";

export default function AdminNotifications() {
  const [data, setData] = useState(null);

  useEffect(() => {
    client.get("/admin/dashboard/notifications").then((r) => setData(r.data.data));
  }, []);

  if (!data) return <Loader full />;

  return (
    <div className="stack">
      <div className="page-head"><h2>Notifications</h2></div>
      <div className="grid grid-3">
        <Card title="Pending Subjects" value={data.summary.pendingSubjects} />
        <Card title="Inactive Faculty" value={data.summary.inactiveFaculty} />
        <Card title="Inactive Students" value={data.summary.inactiveStudents} />
      </div>

      <div className="card">
        <h3>Alerts</h3>
        <ul className="list">
          {data.notifications.length === 0 && <li className="muted">All caught up ✨</li>}
          {data.notifications.map((n, i) => (
            <li key={i} className="list-row">
              <Bell size={18} className={`tone-${n.level === "warning" ? "orange" : "cyan"}`} />
              <div>
                <strong>{n.title}</strong>
                <div className="muted small">{n.message}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="card stat">
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{title}</div>
      </div>
    </div>
  );
}