import { useEffect, useState } from "react";
import client from "../../api/client";
import Loader from "../../components/Loader";
import { useToast } from "../../context/ToastContext";

export default function AdminProfile() {
  const { success, error } = useToast();
  const [p, setP] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    client.get("/admin/profile").then((r) => {
      setP(r.data.data);
      setForm({
        firstName: r.data.data.firstName,
        lastName: r.data.data.lastName,
        emailId: r.data.data.emailId,
        phone: r.data.data.phone
      });
    });
  }, []);

  if (!p) return <Loader full />;

  const save = async (e) => {
    e.preventDefault();
    try {
      const r = await client.patch("/admin/profile", form);
      setP(r.data.data);
      success("Profile updated");
    } catch (err) {
      error(err.response?.data?.message || "Failed");
    }
  };

  return (
    <div className="stack">
      <div className="page-head"><h2>My Profile</h2></div>
      <div className="card">
        <p className="muted">Role: <b>{p.role}</b> · Branch: <b>{p.adminBranch}</b></p>
        <form onSubmit={save} className="form grid-2 mt">
          <label className="field"><span>First Name</span>
            <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </label>
          <label className="field"><span>Last Name</span>
            <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </label>
          <label className="field"><span>Email</span>
            <input value={form.emailId} onChange={(e) => setForm({ ...form, emailId: e.target.value })} />
          </label>
          <label className="field"><span>Phone</span>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>
          <div className="span-2">
            <button className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}