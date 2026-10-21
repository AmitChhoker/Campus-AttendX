import { useEffect, useState } from "react";
import client from "../../api/client";
import Loader from "../../components/Loader";
import { useToast } from "../../context/ToastContext";

export default function FacultyProfile() {
  const { success, error } = useToast();
  const [p, setP] = useState(null);
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  useEffect(() => {
    client.get("/faculty/settings/profile").then((r) => setP(r.data.data));
  }, []);

  if (!p) return <Loader full />;

  const change = async (e) => {
    e.preventDefault();
    try {
      await client.patch("/faculty/settings/change-password", pw);
      success("Password changed. Please log in again.");
      window.location.href = "/login";
    } catch (err) {
      error(err.response?.data?.message || "Failed");
    }
  };

  return (
    <div className="stack">
      <div className="page-head"><h2>My Profile</h2></div>
      <div className="card">
        <h3 className="m-0">{p.firstName} {p.lastName}</h3>
        <p className="muted">{p.emailId}</p>
        <div className="kv-grid mt">
          <KV label="Role" value={p.role} />
          <KV label="Department" value={p.department} />
          <KV label="Branch" value={p.branch} />
          <KV label="Course" value={p.course} />
        </div>
      </div>

      <form onSubmit={change} className="card form">
        <h3 className="m-0">Change Password</h3>
        <label className="field"><span>Current Password</span>
          <input type="password" required
            value={pw.currentPassword}
            onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
        </label>
        <label className="field"><span>New Password</span>
          <input type="password" required minLength={8}
            value={pw.newPassword}
            onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
        </label>
        <label className="field"><span>Confirm New Password</span>
          <input type="password" required
            value={pw.confirmPassword}
            onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })} />
        </label>
        <button className="btn btn-primary">Update Password</button>
      </form>
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