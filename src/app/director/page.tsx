"use client";

import { useEffect, useState, useCallback } from "react";

// --- Types ---
interface User {
  id: string;
  fullName: string;
  email: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; fullName: string; role: string };
}

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
  description: string | null;
  date: string;
  alarm: string | null;
  priority: boolean;
  isCompleted: boolean;
  orderIndex: number;
  categoryId: string;
  siteId: string;
  assigneeId: string;
  assignerId: string | null;
  category: Category;
  site: Site;
  assigner: { id: string; fullName: string; role: string } | null;
  comments: Comment[];
}

// ============ MAIN PAGE ============
export default function DirectorBoardPage() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [employeeTasks, setEmployeeTasks] = useState<Record<string, Task[]>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSite, setFilterSite] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Task detail + comment state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Assign task state
  const [assigningTo, setAssigningTo] = useState<User | null>(null);
  const [assignForm, setAssignForm] = useState({
    name: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    alarm: "",
    priority: false,
    categoryId: "",
    siteId: "",
  });
  const [assignLoading, setAssignLoading] = useState(false);

  const getToken = () => localStorage.getItem("token") || "";
  const todayStr = new Date().toISOString().split("T")[0];

  // --- Fetch all data ---
  const fetchData = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const [empRes, catRes, siteRes] = await Promise.all([
        fetch("/api/employees", { headers }),
        fetch("/api/categories", { headers }),
        fetch("/api/sites", { headers }),
      ]);

      const empData = empRes.ok ? await empRes.json() : { employees: [] };
      const catData = catRes.ok ? await catRes.json() : { categories: [] };
      const siteData = siteRes.ok ? await siteRes.json() : { sites: [] };

      setEmployees(empData.employees || []);
      setCategories(catData.categories || []);
      setSites(siteData.sites || []);

      // Fetch today's tasks for each employee
      const taskMap: Record<string, Task[]> = {};
      await Promise.all(
        (empData.employees || []).map(async (emp: User) => {
          const res = await fetch(
            `/api/tasks?assigneeId=${emp.id}&date=${todayStr}`,
            { headers }
          );
          if (res.ok) {
            const d = await res.json();
            taskMap[emp.id] = d.tasks || [];
          } else {
            taskMap[emp.id] = [];
          }
        })
      );
      setEmployeeTasks(taskMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [todayStr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Comment ---
  const handleAddComment = async () => {
    if (!selectedTask || !commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ taskId: selectedTask.id, content: commentText }),
      });
      if (res.ok) {
        const d = await res.json();
        setSelectedTask({
          ...selectedTask,
          comments: [d.comment, ...selectedTask.comments],
        });
        setCommentText("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  // --- Assign Task ---
  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTo || !assignForm.name || !assignForm.categoryId || !assignForm.siteId) return;
    setAssignLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...assignForm,
          assigneeId: assigningTo.id,
        }),
      });
      if (res.ok) {
        setAssigningTo(null);
        setAssignForm({
          name: "",
          description: "",
          date: todayStr,
          alarm: "",
          priority: false,
          categoryId: "",
          siteId: "",
        });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAssignLoading(false);
    }
  };

  // --- Filtering ---
  const filteredEmployees = employees.filter((emp) =>
    emp.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filterTasks = (tasks: Task[]) => {
    let filtered = tasks;
    if (filterCategory) {
      filtered = filtered.filter((t) => t.categoryId === filterCategory);
    }
    if (filterSite) {
      filtered = filtered.filter((t) => t.siteId === filterSite);
    }
    // Sort: assigned tasks on top, then priority, then incomplete first
    return filtered.sort((a, b) => {
      if (a.assignerId && !b.assignerId) return -1;
      if (!a.assignerId && b.assignerId) return 1;
      if (a.priority && !b.priority) return -1;
      if (!a.priority && b.priority) return 1;
      if (a.isCompleted && !b.isCompleted) return 1;
      if (!a.isCompleted && b.isCompleted) return -1;
      return 0;
    });
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
        Loading board...
      </div>
    );
  }

  return (
    <div className="dir-board">
      {/* Top bar: search + view toggle + filter */}
      <div className="board-toolbar">
        <div className="search-bar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="toolbar-actions">
          {/* View toggle (desktop) */}
          <div className="view-toggle">
            <button
              className={viewMode === "list" ? "active" : ""}
              onClick={() => setViewMode("list")}
              title="List View"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
            <button
              className={viewMode === "board" ? "active" : ""}
              onClick={() => setViewMode("board")}
              title="Board View"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
            </button>
          </div>

          {/* Filter */}
          <button className="filter-toggle-btn" onClick={() => setShowFilters(!showFilters)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="8" y1="18" x2="16" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter dropdowns */}
      {showFilters && (
        <div className="filter-row">
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select value={filterSite} onChange={(e) => setFilterSite(e.target.value)}>
            <option value="">All Sites</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* === LIST VIEW === */}
      {viewMode === "list" && (
        <div className="employee-list-view">
          {filteredEmployees.length === 0 && (
            <div className="empty-state">
              <p>No employees found.</p>
            </div>
          )}
          {filteredEmployees.map((emp) => {
            const tasks = filterTasks(employeeTasks[emp.id] || []);
            return (
              <div key={emp.id} className="emp-section">
                <div className="emp-section-header">
                  <div className="emp-section-left">
                    <div className="emp-avatar-sm">{emp.fullName.charAt(0).toUpperCase()}</div>
                    <div>
                      <h3>{emp.fullName}</h3>
                      <span className="task-summary">
                        {tasks.filter((t) => t.isCompleted).length}/{tasks.length} tasks done
                      </span>
                    </div>
                  </div>
                  <button
                    className="assign-btn"
                    onClick={() => {
                      setAssigningTo(emp);
                      setAssignForm({ ...assignForm, date: todayStr });
                    }}
                  >
                    + Assign Task
                  </button>
                </div>

                {tasks.length === 0 ? (
                  <p className="no-tasks-msg">No tasks for today.</p>
                ) : (
                  <div className="task-list">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`dir-task-item ${task.isCompleted ? "completed" : ""} ${task.assignerId ? "assigned" : ""}`}
                        onClick={() => setSelectedTask(task)}
                      >
                        <div className="task-left">
                          <div className={`task-status-dot ${task.isCompleted ? "done" : ""}`} />
                          {task.priority && <div className="task-priority-dot" />}
                          <span className="task-title">{task.name}</span>
                        </div>
                        <div className="task-right">
                          <span className="task-category-tag">{task.category?.name}</span>
                          {task.comments.length > 0 && (
                            <span className="comment-count">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                              </svg>
                              {task.comments.length}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* === BOARD VIEW (Trello-style horizontal) === */}
      {viewMode === "board" && (
        <div className="board-horizontal">
          {filteredEmployees.map((emp) => {
            const tasks = filterTasks(employeeTasks[emp.id] || []);
            return (
              <div key={emp.id} className="board-column">
                <div className="column-header">
                  <div className="emp-avatar-sm">{emp.fullName.charAt(0).toUpperCase()}</div>
                  <h3>{emp.fullName}</h3>
                  <span className="task-count">{tasks.length}</span>
                </div>
                <div className="column-tasks">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`board-card ${task.isCompleted ? "completed" : ""} ${task.assignerId ? "assigned" : ""}`}
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="card-top">
                        {task.priority && <div className="task-priority-dot" />}
                        <span>{task.name}</span>
                      </div>
                      <div className="card-bottom">
                        <span className="task-category-tag">{task.category?.name}</span>
                        <div className={`task-status-dot ${task.isCompleted ? "done" : ""}`} />
                      </div>
                    </div>
                  ))}
                  {tasks.length === 0 && <p className="no-tasks-msg">No tasks</p>}
                </div>
                <button
                  className="assign-btn board-assign"
                  onClick={() => {
                    setAssigningTo(emp);
                    setAssignForm({ ...assignForm, date: todayStr });
                  }}
                >
                  + Assign Task
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* === TASK DETAIL PANEL (slide up from bottom) === */}
      {selectedTask && (
        <>
          <div className="panel-overlay" onClick={() => setSelectedTask(null)} />
          <div className="task-detail-panel">
            <div className="panel-header">
              <h3>{selectedTask.name}</h3>
              <button className="close-panel" onClick={() => setSelectedTask(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="panel-body">
              {selectedTask.description && (
                <div className="detail-row">
                  <label>Description</label>
                  <p>{selectedTask.description}</p>
                </div>
              )}
              <div className="detail-grid">
                <div className="detail-row">
                  <label>Category</label>
                  <p>{selectedTask.category?.name}</p>
                </div>
                <div className="detail-row">
                  <label>Site</label>
                  <p>{selectedTask.site?.name}</p>
                </div>
                <div className="detail-row">
                  <label>Status</label>
                  <p>{selectedTask.isCompleted ? "✅ Completed" : "⏳ Pending"}</p>
                </div>
                <div className="detail-row">
                  <label>Priority</label>
                  <p>{selectedTask.priority ? "🔴 Yes" : "No"}</p>
                </div>
              </div>

              {/* Comments section */}
              <div className="comments-section">
                <h4>Comments ({selectedTask.comments.length})</h4>
                <div className="comment-input-row">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddComment();
                    }}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={submittingComment || !commentText.trim()}
                  >
                    {submittingComment ? "..." : "Send"}
                  </button>
                </div>
                <div className="comments-list">
                  {selectedTask.comments.map((c) => (
                    <div key={c.id} className="comment-item">
                      <div className="comment-author">
                        <strong>{c.author.fullName}</strong>
                        <span>{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <p>{c.content}</p>
                    </div>
                  ))}
                  {selectedTask.comments.length === 0 && (
                    <p className="no-comments">No comments yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* === ASSIGN TASK PANEL === */}
      {assigningTo && (
        <>
          <div className="panel-overlay" onClick={() => setAssigningTo(null)} />
          <div className="task-detail-panel assign-panel">
            <div className="panel-header">
              <h3>Assign Task to {assigningTo.fullName}</h3>
              <button className="close-panel" onClick={() => setAssigningTo(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form className="panel-body" onSubmit={handleAssignTask}>
              <div className="detail-row">
                <label>Task Name *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter task name"
                  value={assignForm.name}
                  onChange={(e) => setAssignForm({ ...assignForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="detail-row">
                <label>Description</label>
                <textarea
                  className="input-field"
                  placeholder="Description (optional)"
                  value={assignForm.description}
                  onChange={(e) => setAssignForm({ ...assignForm, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="detail-grid">
                <div className="detail-row">
                  <label>Schedule Date *</label>
                  <input
                    type="date"
                    className="input-field"
                    value={assignForm.date}
                    onChange={(e) => setAssignForm({ ...assignForm, date: e.target.value })}
                    required
                  />
                </div>
                <div className="detail-row">
                  <label>Category *</label>
                  <select
                    className="input-field"
                    value={assignForm.categoryId}
                    onChange={(e) => setAssignForm({ ...assignForm, categoryId: e.target.value })}
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="detail-row">
                  <label>Site *</label>
                  <select
                    className="input-field"
                    value={assignForm.siteId}
                    onChange={(e) => setAssignForm({ ...assignForm, siteId: e.target.value })}
                    required
                  >
                    <option value="">Select site</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="detail-row">
                  <label>Priority</label>
                  <div
                    className={`priority-toggle ${assignForm.priority ? "active" : ""}`}
                    onClick={() => setAssignForm({ ...assignForm, priority: !assignForm.priority })}
                  >
                    {assignForm.priority ? "🔴 Priority" : "No Priority"}
                  </div>
                </div>
              </div>
              <button type="submit" className="assign-submit-btn" disabled={assignLoading}>
                {assignLoading ? "Assigning..." : "Assign Task"}
              </button>
            </form>
          </div>
        </>
      )}

      <style jsx>{`
        .dir-board { padding: 1rem; }
        .board-toolbar {
          display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;
          flex-wrap: wrap;
        }
        .search-bar {
          flex: 1; min-width: 200px;
          display: flex; align-items: center; gap: 0.5rem;
          background: var(--input-bg); border: 1px solid var(--input-border);
          border-radius: var(--radius-md); padding: 0.5rem 0.75rem;
        }
        .search-bar input {
          border: none; outline: none; background: none;
          font-size: 0.9rem; color: var(--text-main); width: 100%;
          font-family: inherit;
        }
        .toolbar-actions { display: flex; gap: 0.5rem; align-items: center; }
        .view-toggle {
          display: none; gap: 0.25rem; background: var(--input-bg);
          border-radius: var(--radius-sm); padding: 0.2rem;
          border: 1px solid var(--input-border);
        }
        @media (min-width: 768px) {
          .view-toggle { display: flex; }
        }
        .view-toggle button {
          background: none; border: none; padding: 0.4rem;
          border-radius: var(--radius-sm); cursor: pointer;
          color: var(--text-muted); display: flex; align-items: center;
        }
        .view-toggle button.active {
          background: var(--primary); color: #fff;
        }
        .filter-toggle-btn {
          background: var(--input-bg); border: 1px solid var(--input-border);
          border-radius: var(--radius-sm); padding: 0.5rem;
          cursor: pointer; display: flex; color: var(--text-main);
        }
        .filter-row {
          display: flex; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap;
        }
        .filter-row select {
          padding: 0.4rem 0.6rem; border-radius: var(--radius-sm);
          border: 1px solid var(--input-border); background: var(--input-bg);
          color: var(--text-main); font-size: 0.85rem; font-family: inherit;
        }

        /* --- Employee list view --- */
        .emp-section {
          background: var(--card-bg); border-radius: var(--radius-md);
          margin-bottom: 1rem; overflow: hidden;
          border: 1px solid var(--input-border);
        }
        .emp-section-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1rem; border-bottom: 1px solid var(--input-border);
        }
        .emp-section-left { display: flex; align-items: center; gap: 0.75rem; }
        .emp-avatar-sm {
          width: 36px; height: 36px; border-radius: 50%;
          background: var(--primary); color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.9rem; flex-shrink: 0;
        }
        .emp-section-left h3 { font-size: 1rem; font-weight: 600; color: var(--text-main); }
        .task-summary { font-size: 0.75rem; color: var(--text-muted); }
        .assign-btn {
          padding: 0.4rem 0.75rem; background: var(--primary); color: #fff;
          border: none; border-radius: var(--radius-sm); font-size: 0.8rem;
          font-weight: 600; cursor: pointer; font-family: inherit; white-space: nowrap;
        }
        .assign-btn:hover { opacity: 0.9; }

        .no-tasks-msg {
          padding: 0.75rem 1rem; color: var(--text-muted); font-size: 0.85rem;
        }
        .task-list { display: flex; flex-direction: column; }
        .dir-task-item {
          display: flex; justify-content: space-between; align-items: center;
          padding: 0.75rem 1rem; cursor: pointer;
          border-bottom: 1px solid var(--input-border);
          transition: background 0.15s;
        }
        .dir-task-item:last-child { border-bottom: none; }
        .dir-task-item:hover { background: var(--input-bg); }
        .dir-task-item.completed { opacity: 0.5; }
        .dir-task-item.assigned { background: rgba(251, 191, 36, 0.08); }
        .task-left { display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 0; }
        .task-status-dot {
          width: 12px; height: 12px; border-radius: 50%;
          border: 2px solid var(--input-border); flex-shrink: 0;
        }
        .task-status-dot.done { background: #22c55e; border-color: #22c55e; }
        .task-priority-dot {
          width: 8px; height: 8px; background: #ef4444;
          border-radius: 50%; flex-shrink: 0;
        }
        .task-title {
          font-size: 0.9rem; color: var(--text-main);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .task-right { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
        .task-category-tag {
          font-size: 0.7rem; padding: 0.15rem 0.4rem;
          background: var(--bg-main); border-radius: 4px;
          color: var(--text-muted);
        }
        .comment-count {
          display: flex; align-items: center; gap: 0.2rem;
          font-size: 0.75rem; color: var(--text-muted);
        }

        /* --- Board View (horizontal Trello) --- */
        .board-horizontal {
          display: flex; gap: 1rem; overflow-x: auto;
          padding-bottom: 1rem; height: calc(100vh - 180px);
        }
        .board-column {
          background: var(--input-bg); border-radius: var(--radius-md);
          min-width: 280px; max-width: 280px; display: flex;
          flex-direction: column; border: 1px solid var(--input-border);
        }
        .column-header {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.75rem 1rem; border-bottom: 1px solid var(--input-border);
        }
        .column-header h3 { font-size: 0.9rem; font-weight: 600; flex: 1; color: var(--text-main); }
        .task-count {
          font-size: 0.7rem; background: var(--bg-main); padding: 0.15rem 0.5rem;
          border-radius: 10px; color: var(--text-muted); font-weight: 600;
        }
        .column-tasks {
          flex: 1; overflow-y: auto; padding: 0.75rem;
          display: flex; flex-direction: column; gap: 0.5rem;
        }
        .board-card {
          background: var(--card-bg); border: 1px solid var(--input-border);
          border-radius: var(--radius-sm); padding: 0.75rem;
          cursor: pointer; transition: box-shadow 0.15s;
        }
        .board-card:hover { box-shadow: var(--shadow-md); }
        .board-card.completed { opacity: 0.5; }
        .board-card.assigned { border-left: 3px solid #fbbf24; }
        .card-top { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.5rem; }
        .card-top span { font-size: 0.85rem; font-weight: 500; color: var(--text-main); }
        .card-bottom { display: flex; justify-content: space-between; align-items: center; }
        .board-assign { width: 100%; margin: 0; border-radius: 0 0 var(--radius-md) var(--radius-md); }

        /* --- Panels --- */
        .panel-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.4);
          z-index: 100; animation: fadeIn 0.2s ease;
        }
        .task-detail-panel {
          position: fixed; bottom: 0; left: 0; right: 0;
          max-height: 75vh; background: var(--card-bg);
          border-radius: var(--radius-lg) var(--radius-lg) 0 0;
          z-index: 101; overflow-y: auto;
          animation: slideUp 0.3s ease;
          box-shadow: 0 -4px 30px rgba(0,0,0,0.15);
        }
        @media (min-width: 768px) {
          .task-detail-panel {
            left: auto; right: 0; top: 0; bottom: 0;
            max-height: none; width: 480px;
            border-radius: var(--radius-lg) 0 0 var(--radius-lg);
            animation: slideLeft 0.3s ease;
          }
        }
        .panel-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1rem 1.25rem; border-bottom: 1px solid var(--input-border);
          position: sticky; top: 0; background: var(--card-bg); z-index: 1;
        }
        .panel-header h3 { font-size: 1.1rem; font-weight: 600; color: var(--text-main); }
        .close-panel {
          background: none; border: none; color: var(--text-muted);
          cursor: pointer; display: flex; padding: 0.25rem;
        }
        .panel-body { padding: 1.25rem; }
        .detail-row { margin-bottom: 1rem; }
        .detail-row label {
          display: block; font-size: 0.75rem; font-weight: 600;
          color: var(--text-muted); text-transform: uppercase;
          letter-spacing: 0.05em; margin-bottom: 0.35rem;
        }
        .detail-row p { font-size: 0.9rem; color: var(--text-main); }
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }

        /* Comment section */
        .comments-section { margin-top: 1.5rem; border-top: 1px solid var(--input-border); padding-top: 1rem; }
        .comments-section h4 { font-size: 0.9rem; font-weight: 600; margin-bottom: 0.75rem; color: var(--text-main); }
        .comment-input-row { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
        .comment-input-row input {
          flex: 1; padding: 0.5rem 0.75rem; border: 1px solid var(--input-border);
          border-radius: var(--radius-sm); background: var(--input-bg);
          color: var(--text-main); font-size: 0.85rem; font-family: inherit;
          outline: none;
        }
        .comment-input-row button {
          padding: 0.5rem 0.75rem; background: var(--primary); color: #fff;
          border: none; border-radius: var(--radius-sm); font-size: 0.85rem;
          font-weight: 600; cursor: pointer; font-family: inherit;
        }
        .comment-input-row button:disabled { opacity: 0.5; }
        .comments-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .comment-item { background: var(--input-bg); padding: 0.75rem; border-radius: var(--radius-sm); }
        .comment-author {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 0.35rem;
        }
        .comment-author strong { font-size: 0.8rem; color: var(--text-main); }
        .comment-author span { font-size: 0.7rem; color: var(--text-muted); }
        .comment-item p { font-size: 0.85rem; color: var(--text-main); }
        .no-comments { font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 1rem; }

        /* Assign panel */
        .assign-panel .input-field {
          width: 100%; padding: 0.5rem 0.75rem;
          border: 1px solid var(--input-border); border-radius: var(--radius-sm);
          background: var(--input-bg); color: var(--text-main);
          font-size: 0.85rem; font-family: inherit; outline: none;
        }
        .assign-panel textarea.input-field { resize: vertical; }
        .priority-toggle {
          padding: 0.5rem 0.75rem; border: 1px solid var(--input-border);
          border-radius: var(--radius-sm); cursor: pointer;
          font-size: 0.85rem; color: var(--text-main); text-align: center;
          background: var(--input-bg); user-select: none;
        }
        .priority-toggle.active { border-color: #ef4444; background: rgba(239,68,68,0.08); }
        .assign-submit-btn {
          width: 100%; padding: 0.75rem; background: var(--primary); color: #fff;
          border: none; border-radius: var(--radius-sm); font-size: 1rem;
          font-weight: 600; cursor: pointer; font-family: inherit; margin-top: 0.5rem;
        }
        .assign-submit-btn:disabled { opacity: 0.5; }

        /* Animations */
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp {
          from { transform: translateY(100%); } to { transform: translateY(0); }
        }
        @keyframes slideLeft {
          from { transform: translateX(100%); } to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
