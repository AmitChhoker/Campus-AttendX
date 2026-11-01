import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import { ChevronLeft, BookOpen, ChevronDown, ChevronUp } from "lucide-react";

export default function StudentAttendance() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("current");
  const [currentData, setCurrentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get("/student/dashboard").then((res) => {
      setCurrentData(res.data.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loader-full">Loading...</div>;
  if (!currentData) return <div className="error-box">No data found</div>;

  return (
    <div className="stack pb-20">
      <div className="row-between mb-4">
        <button className="btn btn-ghost sm" onClick={() => navigate(-1)}>
          <ChevronLeft size={18} /> Back
        </button>
      </div>
      
      <h2 className="page-title text-2xl font-bold">My Attendance</h2>

      <div className="tabs mb-4">
        <button className={`tab ${activeTab === "current" ? "active" : ""}`} onClick={() => setActiveTab("current")}>
          Current Sem
        </button>
        <button className={`tab ${activeTab === "previous" ? "active" : ""}`} onClick={() => setActiveTab("previous")}>
          Previous Semesters
        </button>
      </div>

      {activeTab === "current" && (
        <div className="card glass-panel">
          <div className="row-between mb-4 pb-4 border-b">
            <div>
              <h3 className="m-0 text-xl font-bold text-indigo-900">Current Semester · Sem {currentData.profile.semester}</h3>
              <p className="muted mt-1">Overall: {currentData.attendance.attendancePercentage}% · {currentData.attendance.classesAttended}/{currentData.attendance.totalClassesConducted} credits</p>
            </div>
            <div className={`pill ${currentData.attendance.attendancePercentage < 75 ? 'pill-rejected' : 'pill-approved'} font-bold`}>
              {currentData.attendance.attendancePercentage < 75 ? '⚠ Risk' : '✓ Safe'}
            </div>
          </div>
          
          <div className="stack gap-3">
            {currentData.subjectSummary.length === 0 && <p className="muted">No subjects found.</p>}
            {currentData.subjectSummary.map(sub => (
              <div 
                key={sub.subjectId} 
                className={`subject-list-item ${sub.attendancePercentage < 75 ? 'border-red-200' : 'border-emerald-200'}`}
                onClick={() => navigate(`/student/subject/${sub.subjectId}`)}
              >
                <div className="flex justify-between items-center w-full mb-2">
                  <h4 className="m-0 text-gray-800 font-bold flex items-center gap-2">
                    <BookOpen size={16} className="text-gray-400"/> {sub.subjectName}
                  </h4>
                  <strong className={sub.attendancePercentage < 75 ? 'text-red-500' : 'text-emerald-500'}>
                    {sub.attendancePercentage}%
                  </strong>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                  <span>{sub.classesAttended} / {sub.totalClassesConducted} credits</span>
                </div>
                <div className="progress" style={{ height: '6px' }}>
                  <div className="progress-bar" style={{ width: `${sub.attendancePercentage}%`, background: sub.attendancePercentage < 75 ? 'var(--red)' : 'var(--emerald)' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {activeTab === "previous" && (
        <div className="card center-text py-8">
          <p className="muted">Previous semesters data will be available here.</p>
        </div>
      )}
    </div>
  );
}