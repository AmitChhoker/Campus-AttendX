import { useEffect, useState } from "react";
import client from "../../api/client";
import { useToast } from "../../context/ToastContext";

export default function AdminSubjects() {
  const { success, error } = useToast();
  const [subjects, setSubjects] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");

  const loadSubjects = () => {
    client.get("/admin/subjects").then(r => {
      setSubjects(r.data.data || []);
    });
  };

  useEffect(() => { loadSubjects(); }, []);

  const handleApprove = async (id) => {
    try {
      await client.patch(`/admin/subjects/${id}/approve`);
      success("Subject approved successfully!");
      loadSubjects();
    } catch (err) {
      error("Failed to approve");
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    try {
      await client.patch(`/admin/subjects/${id}/reject`, { reason });
      success("Subject rejected");
      loadSubjects();
    } catch (err) {
      error("Failed to reject");
    }
  };

  const filtered = subjects.filter(s => s.status === activeTab);

  return (
    <div className="stack">
      <div className="page-head">
        <h2>Subject Approvals</h2>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === "pending" ? "active" : ""}`} onClick={() => setActiveTab("pending")}>Pending</button>
        <button className={`tab ${activeTab === "approved" ? "active" : ""}`} onClick={() => setActiveTab("approved")}>Approved</button>
        <button className={`tab ${activeTab === "rejected" ? "active" : ""}`} onClick={() => setActiveTab("rejected")}>Rejected</button>
      </div>

      {filtered.length === 0 && (
        <div className="card center-text">
          <p className="muted">No {activeTab} subjects found.</p>
        </div>
      )}

      <div className="grid grid-2">
        {filtered.map(sub => (
          <div key={sub._id} className="card">
            <h3>{sub.subjectName} ({sub.subjectCode})</h3>
            <p className="small muted">Faculty: {sub.submittedBy?.firstName} {sub.submittedBy?.lastName}</p>
            <p className="small muted">{sub.course} · {sub.branch} · Sem {sub.semester}</p>
            
            {/* Syllabus Link */}
            {sub.syllabus?.fileUrl && (
              <a href={sub.syllabus.fileUrl} target="_blank" rel="noreferrer" className="small text-indigo mt block">
                📄 View Syllabus PDF
              </a>
            )}

            {activeTab === "pending" && (
              <div className="row-gap mt">
                <button className="btn btn-primary sm" onClick={() => handleApprove(sub._id)}>Approve</button>
                <button className="btn btn-danger sm" onClick={() => handleReject(sub._id)}>Reject</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}