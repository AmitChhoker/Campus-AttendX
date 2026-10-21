import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import client from "../../api/client";
import Loader from "../../components/Loader";
import { useToast } from "../../context/ToastContext";

export default function AdminUserDetail() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const type = sp.get("type") || "students";
  const [user, setUser] = useState(null);
  const { success, error } = useToast();
  const nav = useNavigate();

  const load = () => {
    client
      .get(`/admin/users/${type}/${id}`)
      .then((r) => setUser(r.data.data))
      .catch((e) => error(e.response?.data?.message || "Failed"));
  };
  useEffect(load, [id, type]);

  if (!user) return <Loader full />;

  const toggle = async () => {
    try {
      await client.patch(
        `/admin/users/${id}/${user.isActive ? "deactivate" : "activate"}`
      );
      success("Updated");
      load();
    } catch (e) {
      error(e.response?.data?.message || "Failed");
    }
  };

  return (
    <div className="stack">
      <button className="btn btn-ghost sm" onClick={() => nav(-1)}>← Back</button>
      <div className="card">
        <h2 className="m-0">{user.firstName} {user.lastName}</h2>
        <p className="muted">{user.emailId}</p>
        <div className="kv-grid mt">
          <KV label="Role" value={user.role} />
          <KV label="Phone" value={user.phone} />
          {user.registrationNumber && <KV label="Roll No" value={user.registrationNumber} />}
          {user.branch && <KV label="Branch" value={user.branch} />}
          {user.course && <KV label="Course" value={user.course} />}
          {user.semester && <KV label="Semester" value={user.semester} />}
          {user.adminBranch && <KV label="Admin Branch" value={user.adminBranch} />}
          <KV label="Status" value={user.isActive ? "Active" : "Inactive"} />
        </div>
        <div className="mt">
          <button className={`btn ${user.isActive ? "btn-danger" : "btn-primary"}`} onClick={toggle}>
            {user.isActive ? "Deactivate" : "Activate"} Account
          </button>
        </div>
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