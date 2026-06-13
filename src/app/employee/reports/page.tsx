"use client";

import { useEffect, useState, useMemo } from "react";

interface Category {
  id: string;
  name: string;
}

interface Site {
  id: string;
  name: string;
}

interface Task {
  id: string;
  name: string;
  date: string;
  isCompleted: boolean;
  category: Category;
  site: Site;
}

export default function EmployeeReportsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<"overview" | "category" | "site">("overview");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<string>("");

  const getToken = () => localStorage.getItem("token") || "";

  useEffect(() => {
    async function fetchAllTasks() {
      try {
        const res = await fetch("/api/tasks", {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const data = await res.json();
        if (res.ok) {
          setTasks(data.tasks || []);
        }
      } catch (error) {
        console.error("Failed to fetch tasks for reports:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAllTasks();
  }, []);

  const stats = useMemo(() => {
    const categoryCounts: Record<string, { name: string; count: number }> = {};
    const siteCounts: Record<string, { name: string; count: number }> = {};

    tasks.forEach(t => {
      if (t.isCompleted) {
        if (!categoryCounts[t.category.id]) {
          categoryCounts[t.category.id] = { name: t.category.name, count: 0 };
        }
        categoryCounts[t.category.id].count++;

        if (!siteCounts[t.site.id]) {
          siteCounts[t.site.id] = { name: t.site.name, count: 0 };
        }
        siteCounts[t.site.id].count++;
      }
    });

    return {
      categories: Object.entries(categoryCounts).map(([id, data]) => ({ id, ...data })).sort((a,b) => b.count - a.count),
      sites: Object.entries(siteCounts).map(([id, data]) => ({ id, ...data })).sort((a,b) => b.count - a.count),
    };
  }, [tasks]);

  const detailTasks = useMemo(() => {
    if (view === "overview") return [];
    
    let filtered = tasks.filter(t => t.isCompleted);
    
    if (view === "category" && selectedId) {
      filtered = filtered.filter(t => t.category.id === selectedId);
    } else if (view === "site" && selectedId) {
      filtered = filtered.filter(t => t.site.id === selectedId);
    }

    if (filterDate) {
      filtered = filtered.filter(t => t.date.startsWith(filterDate));
    }

    // Sort date-wise
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [tasks, view, selectedId, filterDate]);

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading Reports...</div>;
  }

  if (view === "overview") {
    return (
      <div className="reports-container">
        <h2 className="reports-title">Performance Reports</h2>
        <p className="reports-subtitle">Statistical categorization of completed tasks.</p>

        <div className="stats-section">
          <h3 className="section-title">Tasks by Category</h3>
          <div className="stats-grid">
            {stats.categories.map(c => (
              <div 
                key={c.id} 
                className="stat-card"
                onClick={() => {
                  setSelectedId(c.id);
                  setView("category");
                  setFilterDate("");
                }}
              >
                <div className="stat-value">{c.count}</div>
                <div className="stat-label">{c.name}</div>
              </div>
            ))}
            {stats.categories.length === 0 && <p>No completed tasks yet.</p>}
          </div>
        </div>

        <div className="stats-section">
          <h3 className="section-title">Tasks by Site</h3>
          <div className="stats-grid">
            {stats.sites.map(s => (
              <div 
                key={s.id} 
                className="stat-card"
                onClick={() => {
                  setSelectedId(s.id);
                  setView("site");
                  setFilterDate("");
                }}
              >
                <div className="stat-value">{s.count}</div>
                <div className="stat-label">{s.name}</div>
              </div>
            ))}
            {stats.sites.length === 0 && <p>No completed tasks yet.</p>}
          </div>
        </div>

        <style jsx>{`
          .reports-container {
            padding: 1.5rem;
          }
          .reports-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-main);
            margin-bottom: 0.5rem;
          }
          .reports-subtitle {
            color: var(--text-muted);
            margin-bottom: 2rem;
            font-size: 0.95rem;
          }
          .stats-section {
            margin-bottom: 2.5rem;
          }
          .section-title {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: var(--text-main);
            padding-bottom: 0.5rem;
            border-bottom: 1px solid var(--input-border);
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 1rem;
          }
          .stat-card {
            background: var(--input-bg);
            border-radius: var(--radius-md);
            padding: 1.5rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s ease;
            border: 1px solid var(--input-border);
          }
          .stat-card:hover {
            transform: translateY(-2px);
            border-color: var(--primary);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .stat-value {
            font-size: 2.5rem;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 0.5rem;
            line-height: 1;
          }
          .stat-label {
            font-size: 0.85rem;
            font-weight: 500;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
        `}</style>
      </div>
    );
  }

  // Detail View
  const title = view === "category" 
    ? stats.categories.find(c => c.id === selectedId)?.name 
    : stats.sites.find(s => s.id === selectedId)?.name;

  return (
    <div className="reports-container">
      <div className="detail-header">
        <button className="back-btn" onClick={() => setView("overview")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Reports
        </button>
        <div className="filter-group">
          <label>Filter Date:</label>
          <input 
            type="date" 
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="date-input"
          />
          {filterDate && (
            <button className="clear-date" onClick={() => setFilterDate("")}>&times;</button>
          )}
        </div>
      </div>

      <h2 className="detail-title">{title} Tasks</h2>

      <div className="detail-list">
        {detailTasks.map(t => (
          <div key={t.id} className="detail-item">
            <div className="detail-name">{t.name}</div>
            <div className="detail-meta">
              <span className="detail-date">{new Date(t.date).toLocaleDateString()}</span>
              {view === "category" ? (
                <span className="detail-tag">{t.site.name}</span>
              ) : (
                <span className="detail-tag">{t.category.name}</span>
              )}
            </div>
          </div>
        ))}
        {detailTasks.length === 0 && (
          <div className="empty-state">No tasks found for this filter.</div>
        )}
      </div>

      <style jsx>{`
        .reports-container {
          padding: 1.5rem;
        }
        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
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
        }
        .filter-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--input-bg);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
        }
        .filter-group label {
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .date-input {
          background: transparent;
          border: none;
          color: var(--text-main);
          font-family: inherit;
          outline: none;
        }
        .clear-date {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 1.25rem;
          line-height: 1;
        }
        .detail-title {
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
          color: var(--text-main);
        }
        .detail-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .detail-item {
          background: var(--input-bg);
          padding: 1rem;
          border-radius: var(--radius-md);
          border-left: 4px solid var(--primary);
        }
        .detail-name {
          font-weight: 600;
          color: var(--text-main);
          margin-bottom: 0.5rem;
        }
        .detail-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .detail-tag {
          background: var(--bg-main);
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
        }
        .empty-state {
          text-align: center;
          padding: 3rem;
          color: var(--text-muted);
          background: var(--input-bg);
          border-radius: var(--radius-md);
        }
      `}</style>
    </div>
  );
}
