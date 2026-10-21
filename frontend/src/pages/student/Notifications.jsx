import { useEffect, useState } from "react";
import client from "../../api/client";
import Loader from "../../components/Loader";
import { useToast } from "../../context/ToastContext";

export default function StudentNotifications() {
  const { success, error } = useToast();
  const [data, setData] = useState(null);

  const load = async () => {
    try {
      const r = await client.get("/student/notifications");
      setData(r.data.data);
    } catch (e) {
      error("Failed to load");
    }
  };
  useEffect(() => { load(); }, []);

  const markAll = async () => {
    try {
      await client.patch("/student/notifications/read-all");
      success("All read");
      load();
    } catch (e) {
      error("Failed");
    }
  };

  const del = async (id) => {
    try {
      await client.delete(`/student/notifications/${id}`);
      load();
    } catch {}
  };

  if (!data) return <Loader full />;

  return (
    <div className="stack">
      <div className="page-head">
        <h2>Notifications</h2>
        <button className="btn btn-ghost" onClick={markAll}>Mark All Read</button>
      </div>
      <div className="card">
        <ul className="list">
          {data.notifications.map((n) => (
            <li key={n._id} className={`list-row ${n.isRead ? "read" : ""}`}>
              <div>
                <strong>{n.title}</strong>
                <div className="muted small">{n.message}</div>
                <div className="muted small">
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
              <button className="btn btn-ghost sm" onClick={() => del(n._id)}>×</button>
            </li>
          ))}
          {data.notifications.length === 0 && <li className="muted">No notifications</li>}
        </ul>
      </div>
    </div>
  );
}