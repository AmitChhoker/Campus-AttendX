import { Search } from "lucide-react";

export default function AdminCourses() {
  return (
    <div className="stack">
      <div className="page-head">
        <h2>Courses Management</h2>
        <button className="btn btn-primary">Export</button>
      </div>

      <div className="searchbar">
        <Search size={16} />
        <input placeholder="Search courses..." />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 className="m-0">🎓 Computer Engineering</h3>
          <p className="muted small mt">3 years · 6 semesters · 12 subjects</p>
          <p className="small">Teacher: Dr. Priya Verma</p>
          <p className="small">Total sessions: 240</p>
        </div>
        <div className="card">
          <h3 className="m-0">🎓 Mechanical Engineering</h3>
          <p className="muted small mt">4 years · 8 semesters · 15 subjects</p>
        </div>
      </div>
    </div>
  );
}