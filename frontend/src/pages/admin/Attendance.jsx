import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../../api/client";
import Loader from "../../components/Loader";

export default function AdminAttendance() {
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({
    course: "", branch: "", semester: "", fromDate: "", toDate: ""
  });

  const load = async () => {
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    const r = await client.get("/admin/attendance/sessions", { params });
    setData(r.data.data);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="stack">
      <div className="page-head"><h2>Attendance Sessions</h2></div>

      <div className="card">
        <div className="grid grid-5">
          <input placeholder="Course" value={filters.course}
            onChange={(e) => setFilters({ ...filters, course: e.target.value })} />
          <input placeholder="Branch" value={filters.branch}
            onChange={(e) => setFilters({ ...filters, branch: e.target.value })} />
          <input placeholder="Semester" value={filters.semester}
            onChange={(e) => setFilters({ ...filters, semester: e.target.value })} />
          <input type="date" value={filters.fromDate}
            onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })} />
          <input type="date" value={filters.toDate}
            onChange={(e) => setFilters({ ...filters, toDate: e.target.value })} />
        </div>
        <button className="btn btn-primary mt" onClick={load}>Apply Filters</button>
      </div>

      {!data ? <Loader /> : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Faculty</th><th>Subject</th><th>Started</th>
                <th>Present / Total</th><th>%</th><th></th>
              </tr>
            </thead>
            <tbody>
              {data.sessions.map((s) => (
                <tr key={s.sessionId}>
                  <td>{s.faculty.name}</td>
                  <td>{s.subject.name} ({s.subject.code})</td>
                  <td className="muted small">{new Date(s.startedAt).toLocaleString()}</td>
                  <td>{s.attendance.present} / {s.attendance.totalStudents}</td>
                  <td>{s.attendance.attendancePercentage}%</td>
                  <td>
                    <Link className="btn btn-ghost sm" to={`/admin/attendance/${s.sessionId}`}>View</Link>
                  </td>
                </tr>
              ))}
              {data.sessions.length === 0 && (
                <tr><td colSpan={6} className="center muted">No sessions</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}