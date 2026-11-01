import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../../api/client";
import { BookOpen, GraduationCap, ChevronRight, AlertCircle } from "lucide-react";

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    client.get("/student/dashboard")
      .then((res) => {
        setData(res.data.data);
        setError(null);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to load dashboard.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loader-full">Loading...</div>;
  if (error) return <div className="error-box">{error}</div>;
  if (!data) return <div className="error-box">No data available.</div>;

  const overall = data.attendance.attendancePercentage;
  const isRisk = overall < 75;

  const safeCount = data.subjectSummary.filter(s => s.attendancePercentage >= 75).length;
  const warnCount = data.subjectSummary.filter(s => s.attendancePercentage >= 65 && s.attendancePercentage < 75).length;
  const riskCount = data.subjectSummary.filter(s => s.attendancePercentage < 65).length;

  return (
    <div className="stack pb-20">
      {/* 🔥 Top Header: Course & Semester Info */}
      <div className="student-header-banner">
        <div className="flex items-center gap-3">
          <div className="icon-box bg-white text-indigo-600 shadow-sm">
            <GraduationCap size={24} />
          </div>
          <div>
            <h2 className="m-0 text-white text-xl font-bold">{data.profile.course} - {data.profile.branch}</h2>
            <p className="text-indigo-100 mt-1 text-sm font-medium">Semester {data.profile.semester} · {data.profile.batch}</p>
          </div>
        </div>
      </div>

      {/* Hero Attendance Card */}
      <div className={`hero-card-modern ${isRisk ? 'risk' : 'safe'}`}>
        <div className="row-between">
          <h3 className="m-0 text-gray-700">Overall Attendance</h3>
          <span className={`pill font-bold ${isRisk ? 'pill-rejected' : 'pill-approved'}`}>
            {isRisk ? "⚠ Risk" : "✓ Safe"}
          </span>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div>
            <div className={`text-5xl font-extrabold ${isRisk ? 'text-red-500' : 'text-emerald-500'}`}>
              {overall}%
            </div>
            <p className="muted mt-2 font-medium">
              {data.attendance.classesAttended} / {data.attendance.totalClassesConducted} credits
            </p>
          </div>
          
          {/* Circular Progress */}
          <div className="progress-circle" style={{ '--percent': `${overall}%`, '--color': isRisk ? '#ef4444' : '#10b981' }}>
            <div className="progress-circle-inner">
              <span className="font-bold text-sm">{overall}%</span>
            </div>
          </div>
        </div>
        {isRisk && (
          <p className="mt-4 text-red-500 font-bold text-sm bg-red-50 p-2 rounded-lg text-center">
            ⚡ Attend more classes to reach 75%
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-3 mt-2">
        <div className="card center-text hover-lift border-t-4 border-emerald-500">
          <h3 className="text-emerald-500 font-bold">🟢 Safe</h3>
          <p className="font-extrabold text-2xl text-gray-800 m-0">{safeCount}</p>
        </div>
        <div className="card center-text hover-lift border-t-4 border-yellow-500">
          <h3 className="text-yellow-500 font-bold">🟡 Warn</h3>
          <p className="font-extrabold text-2xl text-gray-800 m-0">{warnCount}</p>
        </div>
        <div className="card center-text hover-lift border-t-4 border-red-500">
          <h3 className="text-red-500 font-bold">🔴 Risk</h3>
          <p className="font-extrabold text-2xl text-gray-800 m-0">{riskCount}</p>
        </div>
      </div>

      <Link to="/student/mark" className="btn btn-primary full big mt-2 shadow-lg hover:scale-[1.02] transition-transform">
        MARK TODAY'S ATTENDANCE →
      </Link>

      {/* Subjects List */}
      <div className="card mt-4">
        <div className="row-between mb-4">
          <h3 className="card-title m-0 flex items-center gap-2">
            <BookOpen size={18} className="text-indigo-500" /> Current Subjects ({data.subjectSummary.length})
          </h3>
        </div>
        
        <div className="stack gap-3">
          {data.subjectSummary.length === 0 && (
            <p className="muted center-text py-4">No classes have been conducted yet.</p>
          )}
          
          {data.subjectSummary.map(sub => (
            <div 
              key={sub.subjectId}
              onClick={() => navigate(`/student/subject/${sub.subjectId}`)}
              className={`subject-list-item ${sub.attendancePercentage < 75 ? 'border-red-200' : 'border-emerald-200'}`}
            >
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-3">
                  <div className={`icon-circle ${sub.attendancePercentage < 75 ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                    {sub.attendancePercentage < 75 ? '🔴' : '🟢'}
                  </div>
                  <div>
                    <h4 className="m-0 text-gray-800 font-bold">{sub.subjectName}</h4>
                    <p className="text-xs text-gray-500 m-0 mt-1">{sub.classesAttended} / {sub.totalClassesConducted} credits attended</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-extrabold ${sub.attendancePercentage < 75 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {sub.attendancePercentage}%
                  </span>
                  <ChevronRight size={18} className="text-gray-400" />
                </div>
              </div>
              {/* Progress Bar */}
              <div className="progress mt-3" style={{ height: '6px' }}>
                <div className="progress-bar" style={{ width: `${sub.attendancePercentage}%`, background: sub.attendancePercentage < 75 ? 'var(--red)' : 'var(--emerald)' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}