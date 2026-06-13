"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
}

interface Task {
  id: string;
  name: string;
  isCompleted: boolean;
  category: { id: string; name: string };
  site: { id: string; name: string };
}

export default function DirectorEmployeesPage() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [empTasks, setEmpTasks] = useState<Task[]>([]);
  const [empLoading, setEmpLoading] = useState(false);

  const getToken = () => localStorage.getItem("token") || "";

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees", {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok) setEmployees(data.employees || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployeeTasks = async (empId: string) => {
    setEmpLoading(true);
    try {
      const res = await fetch(`/api/tasks?assigneeId=${empId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok) setEmpTasks(data.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setEmpLoading(false);
    }
  };

  const handleSelectEmployee = (emp: User) => {
    setSelectedEmployee(emp);
    fetchEmployeeTasks(emp.id);
  };

  const handleDeleteEmployee = async (empId: string, empName: string) => {
    if (!confirm(`Are you sure you want to completely remove ${empName} from the system? This will delete all their tasks.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/employees/${empId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        if (selectedEmployee?.id === empId) setSelectedEmployee(null);
        fetchEmployees();
      } else {
        alert("Failed to delete employee");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ padding: "2rem" }}>Loading employees...</div>;

  return (
    <div className="employees-container">
      {!selectedEmployee ? (
        <div className="employee-list-view">
          <h2 className="page-title">Employees Directory</h2>
          
          <div className="employee-grid">
            {employees.map(emp => (
              <div key={emp.id} className="employee-card">
                <div className="emp-info" onClick={() => handleSelectEmployee(emp)}>
                  <div className="emp-avatar">{emp.fullName.charAt(0).toUpperCase()}</div>
                  <div className="emp-details">
                    <h3>{emp.fullName}</h3>
                    <p>{emp.email}</p>
                    <span className="emp-date">Joined {new Date(emp.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <button 
                  className="emp-delete-btn"
                  onClick={() => handleDeleteEmployee(emp.id, emp.fullName)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            ))}
            {employees.length === 0 && (
              <p>No employees found.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="employee-detail-view">
          <button className="back-btn" onClick={() => setSelectedEmployee(null)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Directory
          </button>

          <div className="emp-detail-header">
            <div className="emp-avatar large">{selectedEmployee.fullName.charAt(0).toUpperCase()}</div>
            <div>
              <h2>{selectedEmployee.fullName}</h2>
              <p>{selectedEmployee.email}</p>
            </div>
          </div>

          <div className="emp-stats-section">
            <h3>Performance Stats</h3>
            {empLoading ? <p>Loading stats...</p> : (
              <div className="stats-cards">
                <div className="stat-card">
                  <span className="stat-value">{empTasks.length}</span>
                  <span className="stat-label">Total Assigned Tasks</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value" style={{ color: "#22c55e" }}>
                    {empTasks.filter(t => t.isCompleted).length}
                  </span>
                  <span className="stat-label">Completed Tasks</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value" style={{ color: "#eab308" }}>
                    {empTasks.filter(t => !t.isCompleted).length}
                  </span>
                  <span className="stat-label">Pending Tasks</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .employees-container {
          padding: 1.5rem;
        }
        .page-title {
          font-size: 1.5rem;
          color: var(--text-main);
          margin-bottom: 1.5rem;
        }
        .employee-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
        }
        .employee-card {
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          border-radius: var(--radius-md);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          transition: border-color 0.2s;
        }
        .employee-card:hover {
          border-color: var(--primary);
        }
        .emp-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem;
          flex: 1;
          cursor: pointer;
        }
        .emp-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--primary);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: 700;
        }
        .emp-avatar.large {
          width: 64px;
          height: 64px;
          font-size: 1.5rem;
        }
        .emp-details h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-main);
        }
        .emp-details p {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
        }
        .emp-date {
          display: block;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.5rem;
          opacity: 0.7;
        }
        .emp-delete-btn {
          background: none;
          border: none;
          color: #ef4444;
          padding: 1.25rem;
          cursor: pointer;
          opacity: 0.6;
          transition: opacity 0.2s;
        }
        .emp-delete-btn:hover {
          opacity: 1;
        }
        .back-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          color: var(--text-main);
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          margin-bottom: 2rem;
        }
        .emp-detail-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 3rem;
        }
        .emp-detail-header h2 {
          font-size: 1.75rem;
          color: var(--text-main);
        }
        .emp-detail-header p {
          color: var(--text-muted);
          font-size: 1rem;
        }
        .emp-stats-section h3 {
          font-size: 1.2rem;
          color: var(--text-main);
          margin-bottom: 1.5rem;
        }
        .stats-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }
        .stat-card {
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          border-radius: var(--radius-md);
          padding: 2rem;
          text-align: center;
        }
        .stat-value {
          display: block;
          font-size: 3rem;
          font-weight: 700;
          color: var(--text-main);
          line-height: 1;
          margin-bottom: 0.75rem;
        }
        .stat-label {
          font-size: 0.9rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  );
}
