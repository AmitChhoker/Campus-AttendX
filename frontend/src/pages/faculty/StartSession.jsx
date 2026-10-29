import { useNavigate } from "react-router-dom";

export default function FacultyStartSession() {
  const nav = useNavigate();

  return (
    <div className="stack">
      <button className="btn btn-ghost sm" onClick={() => nav(-1)}>← Back</button>
      <div className="page-head"><h2>Start New Session</h2></div>

      <div className="card">
        <h3 className="card-title">Section 1: Academic Info</h3>
        <div className="grid grid-2">
          <label className="field"><span>Faculty</span><input value="Dr. Priya" disabled /></label>
          <label className="field"><span>Department</span><input value="SFET" disabled /></label>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Section 2 & 3: Course & Subject</h3>
        <div className="grid grid-2">
          <label className="field"><span>Course Name</span><input placeholder="e.g. B.TECH" /></label>
          <label className="field"><span>Year</span><input placeholder="e.g. 2026" /></label>
          <label className="field"><span>Semester</span><input placeholder="e.g. 7" /></label>
          <label className="field"><span>Subject Name</span><input placeholder="e.g. DBMS" /></label>
          <label className="field"><span>Subject Code</span><input placeholder="e.g. CS201" /></label>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Section 4: Class Details</h3>
        <div className="grid grid-2">
          <label className="field"><span>Building</span><input placeholder="e.g. 1E" /></label>
          <label className="field"><span>Class Type</span>
            <select><option>Theory</option><option>Practical</option></select>
          </label>
        </div>
      </div>

      <button className="btn btn-primary full big" onClick={() => nav("/faculty/session/1")}>
        START SESSION
      </button>
    </div>
  );
}