"use client";

import { useEffect, useState, useCallback } from "react";

interface Category { id: string; name: string; }
interface Site { id: string; name: string; }
interface User { id: string; fullName: string; }
interface Task {
  id: string;
  name: string;
  date: string;
  isCompleted: boolean;
  assigneeId: string;
  category: Category;
  site: Site;
}

type View = "overview" | "cat-employees" | "site-employees" | "emp-tasks";

export default function DirectorReportsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  // Navigation state
  const [view, setView] = useState<View>("overview");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [filterDate, setFilterDate] = useState("");

  const getToken = () => localStorage.getItem("token") || "";

  useEffect(() => {
    async function fetchData() {
      const headers = { Authorization: `Bearer ${getToken()}` };
      try {
        const [tRes, eRes, cRes, sRes] = await Promise.all([
          fetch("/api/tasks", { headers }),
          fetch("/api/employees", { headers }),
          fetch("/api/categories", { headers }),
          fetch("/api/sites", { headers }),
        ]);
        if (tRes.ok) setTasks((await tRes.json()).tasks || []);
        if (eRes.ok) setEmployees((await eRes.json()).employees || []);
        if (cRes.ok) setCategories((await cRes.json()).categories || []);
        if (sRes.ok) setSites((await sRes.json()).sites || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const goBack = () => {
    if (view === "emp-tasks") {
      if (selectedCategory) setView("cat-employees");
      else if (selectedSite) setView("site-employees");
      else setView("overview");
      setSelectedEmployee(null);
      setFilterDate("");
    } else if (view === "cat-employees" || view === "site-employees") {
      setView("overview");
      setSelectedCategory(null);
      setSelectedSite(null);
    }
  };

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Loading reports...</div>;
  }

  // === OVERVIEW ===
  if (view === "overview") {
    const catStats = categories.map(cat => ({
      ...cat,
      count: tasks.filter(t => t.category?.id === cat.id && t.isCompleted).length,
      total: tasks.filter(t => t.category?.id === cat.id).length,
    }));

    const siteStats = sites.map(s => ({
      ...s,
      count: tasks.filter(t => t.site?.id === s.id && t.isCompleted).length,
      total: tasks.filter(t => t.site?.id === s.id).length,
    }));

    return (
      <div className="reports-container">
        <h2 className="section-title">Categories</h2>
        <div className="stats-grid">
          {catStats.map(cat => (
            <div key={cat.id} className="stat-card" onClick={() => { setSelectedCategory(cat); setView("cat-employees"); }}>
              <div className="stat-header">
                <h3>{cat.name}</h3>
                <span className="stat-badge">{cat.count}/{cat.total}</span>
              </div>
              <div className="stat-bar">
                <div className="stat-fill" style={{ width: `${cat.total > 0 ? (cat.count / cat.total) * 100 : 0}%` }} />
              </div>
            </div>
          ))}
        </div>

        <h2 className="section-title" style={{ marginTop: "2rem" }}>Sites</h2>
        <div className="stats-grid">
          {siteStats.map(s => (
            <div key={s.id} className="stat-card" onClick={() => { setSelectedSite(s); setView("site-employees"); }}>
              <div className="stat-header">
                <h3>{s.name}</h3>
                <span className="stat-badge">{s.count}/{s.total}</span>
              </div>
              <div className="stat-bar">
                <div className="stat-fill" style={{ width: `${s.total > 0 ? (s.count / s.total) * 100 : 0}%` }} />
              </div>
            </div>
          ))}
        </div>

        <style jsx>{`${reportStyles}`}</style>
      </div>
    );
  }

  // === EMPLOYEES LIST (for a category or site) ===
  if (view === "cat-employees" || view === "site-employees") {
    const filterKey = view === "cat-employees" ? "category" : "site";
    const filterId = view === "cat-employees" ? selectedCategory?.id : selectedSite?.id;
    const title = view === "cat-employees" ? selectedCategory?.name : selectedSite?.name;

    const filteredTasks = tasks.filter(t =>
      filterKey === "category" ? t.category?.id === filterId : t.site?.id === filterId
    );

    const empStats = employees.map(emp => ({
      ...emp,
      count: filteredTasks.filter(t => t.assigneeId === emp.id && t.isCompleted).length,
      total: filteredTasks.filter(t => t.assigneeId === emp.id).length,
    })).filter(e => e.total > 0);

    return (
      <div className="reports-container">
        <button className="back-btn" onClick={goBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          Back
        </button>
        <h2 className="section-title">{title} — Employees</h2>
        <div className="stats-grid">
          {empStats.map(emp => (
            <div key={emp.id} className="stat-card" onClick={() => { setSelectedEmployee(emp); setView("emp-tasks"); }}>
              <div className="stat-header">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div className="emp-avatar-mini">{emp.fullName.charAt(0).toUpperCase()}</div>
                  <h3>{emp.fullName}</h3>
                </div>
                <span className="stat-badge">{emp.count}/{emp.total}</span>
              </div>
            </div>
          ))}
          {empStats.length === 0 && <p style={{ color: "var(--text-muted)" }}>No employees with tasks in this {filterKey}.</p>}
        </div>
        <style jsx>{`${reportStyles}`}</style>
      </div>
    );
  }

  // === EMPLOYEE TASKS (date-sorted, with date filter) ===
  if (view === "emp-tasks" && selectedEmployee) {
    const filterKey = selectedCategory ? "category" : "site";
    const filterId = selectedCategory?.id || selectedSite?.id;

    let empTasks = tasks.filter(t => {
      const matchAssignee = t.assigneeId === selectedEmployee.id;
      const matchFilter = filterKey === "category"
        ? t.category?.id === filterId
        : t.site?.id === filterId;
      return matchAssignee && matchFilter;
    });

    if (filterDate) {
      empTasks = empTasks.filter(t => t.date.split("T")[0] === filterDate);
    }

    // Sort by date descending
    empTasks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Group by date
    const grouped = new Map<string, Task[]>();
    empTasks.forEach(t => {
      const d = t.date.split("T")[0];
      if (!grouped.has(d)) grouped.set(d, []);
      grouped.get(d)!.push(t);
    });

    return (
      <div className="reports-container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <button className="back-btn" onClick={goBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </button>
          <input
            type="date"
            className="date-filter"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
          />
        </div>
        <h2 className="section-title">{selectedEmployee.fullName} — Tasks</h2>

        {Array.from(grouped.entries()).map(([date, dateTasks]) => (
          <div key={date} className="date-group">
            <h4 className="date-label">{new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</h4>
            {dateTasks.map(task => (
              <div key={task.id} className={`task-row ${task.isCompleted ? "completed" : ""}`}>
                <div className={`status-dot ${task.isCompleted ? "done" : ""}`} />
                <span>{task.name}</span>
              </div>
            ))}
          </div>
        ))}

        {empTasks.length === 0 && <p style={{ color: "var(--text-muted)", textAlign: "center", marginTop: "2rem" }}>No tasks found.</p>}

        <style jsx>{`${reportStyles}`}</style>
      </div>
    );
  }

  return null;
}

const reportStyles = `
  .reports-container { padding: 1.5rem; }
  .section-title { font-size: 1.2rem; font-weight: 600; color: var(--text-main); margin-bottom: 1rem; }
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 0.75rem; }
  .stat-card {
    background: var(--card-bg); border: 1px solid var(--input-border);
    border-radius: var(--radius-md); padding: 1rem; cursor: pointer;
    transition: border-color 0.2s;
  }
  .stat-card:hover { border-color: var(--primary); }
  .stat-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
  .stat-header h3 { font-size: 0.95rem; font-weight: 600; color: var(--text-main); }
  .stat-badge {
    font-size: 0.8rem; font-weight: 700; color: var(--primary);
    background: rgba(99, 102, 241, 0.1); padding: 0.15rem 0.5rem;
    border-radius: 10px;
  }
  .stat-bar { height: 4px; background: var(--input-border); border-radius: 4px; overflow: hidden; }
  .stat-fill { height: 100%; background: var(--primary); border-radius: 4px; transition: width 0.3s; }
  .emp-avatar-mini {
    width: 28px; height: 28px; border-radius: 50%;
    background: var(--primary); color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 0.75rem; flex-shrink: 0;
  }
  .back-btn {
    display: flex; align-items: center; gap: 0.5rem;
    background: none; border: none; color: var(--text-main);
    font-weight: 600; cursor: pointer; padding: 0; margin-bottom: 1rem;
    font-family: inherit;
  }
  .date-filter {
    padding: 0.4rem 0.6rem; border: 1px solid var(--input-border);
    border-radius: var(--radius-sm); background: var(--input-bg);
    color: var(--text-main); font-family: inherit;
  }
  .date-group { margin-bottom: 1.5rem; }
  .date-label { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.5rem; }
  .task-row {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.75rem 1rem; background: var(--card-bg);
    border: 1px solid var(--input-border); border-radius: var(--radius-sm);
    margin-bottom: 0.5rem; font-size: 0.9rem; color: var(--text-main);
  }
  .task-row.completed { opacity: 0.5; }
  .status-dot { width: 10px; height: 10px; border-radius: 50%; border: 2px solid var(--input-border); flex-shrink: 0; }
  .status-dot.done { background: #22c55e; border-color: #22c55e; }
`;
