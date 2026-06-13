"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Task {
  id: string;
  date: string;
  isCompleted: boolean;
  priority: boolean;
  assigneeId: string;
  assignerId: string | null;
}

interface Category { id: string; name: string; }
interface Site { id: string; name: string; }
interface User { id: string; fullName: string; }

export default function DirectorCalendarPage() {
  const router = useRouter();
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [ownTasks, setOwnTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Date-click popup
  const [clickedDate, setClickedDate] = useState<string | null>(null);

  // Assign task modal state
  const [showAssignFlow, setShowAssignFlow] = useState(false);
  const [employees, setEmployees] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<User | null>(null);
  const [assignForm, setAssignForm] = useState({
    name: "", description: "", categoryId: "", siteId: "", priority: false,
  });
  const [assignLoading, setAssignLoading] = useState(false);

  const getToken = () => localStorage.getItem("token") || "";
  const getUserId = () => {
    try { return JSON.parse(localStorage.getItem("user") || "{}").id; } catch { return ""; }
  };

  useEffect(() => {
    async function fetchData() {
      const headers = { Authorization: `Bearer ${getToken()}` };
      try {
        const [allRes, ownRes, empRes, catRes, siteRes] = await Promise.all([
          fetch("/api/tasks", { headers }), // All tasks (director sees everything)
          fetch("/api/tasks?self=true", { headers }), // Director's own tasks
          fetch("/api/employees", { headers }),
          fetch("/api/categories", { headers }),
          fetch("/api/sites", { headers }),
        ]);

        if (allRes.ok) setAllTasks((await allRes.json()).tasks || []);
        if (ownRes.ok) setOwnTasks((await ownRes.json()).tasks || []);
        if (empRes.ok) setEmployees((await empRes.json()).employees || []);
        if (catRes.ok) setCategories((await catRes.json()).categories || []);
        if (siteRes.ok) setSites((await siteRes.json()).sites || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };
  const setMonth = (m: number) => setCurrentDate(new Date(currentDate.getFullYear(), m, 1));
  const setYear = (y: number) => setCurrentDate(new Date(y, currentDate.getMonth(), 1));

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const todayStr = new Date().toISOString().split("T")[0];
  const userId = getUserId();

  // Map for all tasks by date
  const allTasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    allTasks.forEach(t => {
      const d = t.date.split("T")[0];
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(t);
    });
    return map;
  }, [allTasks]);

  // Map for own tasks by date
  const ownTasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    ownTasks.forEach(t => {
      const d = t.date.split("T")[0];
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(t);
    });
    return map;
  }, [ownTasks]);

  const handleDateClick = (dateStr: string) => {
    setClickedDate(dateStr);
  };

  const handleCreateTodo = () => {
    // Navigate to the To-Do page (director's own) with the date
    router.push(`/director/to-do?date=${clickedDate}`);
    setClickedDate(null);
  };

  const handleAssignTask = () => {
    setShowAssignFlow(true);
    setClickedDate(null);
    setSelectedEmp(null);
    setAssignForm({ name: "", description: "", categoryId: "", siteId: "", priority: false });
  };

  const handleSubmitAssign = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp || !clickedDate && !showAssignFlow) return;
    setAssignLoading(true);
    try {
      const dateToUse = clickedDate || todayStr;
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...assignForm,
          date: new Date(dateToUse).toISOString(),
          assigneeId: selectedEmp.id,
        }),
      });
      if (res.ok) {
        setShowAssignFlow(false);
        setSelectedEmp(null);
        // Reload
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAssignLoading(false);
    }
  }, [selectedEmp, clickedDate, showAssignFlow, assignForm, todayStr]);

  const renderDays = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateStr = date.toISOString().split("T")[0];
      const isToday = dateStr === todayStr;
      const isFuture = date > today;

      // All employee tasks for this date (blue indicator)
      const dayAllTasks = allTasksByDate.get(dateStr) || [];
      const hasAnyTask = dayAllTasks.length > 0;

      // Director's OWN tasks for this date (pink indicator for to-do)
      const dayOwnTasks = ownTasksByDate.get(dateStr) || [];
      const hasOwnTodo = dayOwnTasks.length > 0;

      // Completion circle for own tasks
      let circleColor = "";
      if (hasOwnTodo && !isFuture) {
        circleColor = dayOwnTasks.every(t => t.isCompleted) ? "green" : "yellow";
      }

      days.push(
        <div
          key={day}
          className={`calendar-day ${isToday ? "today" : ""}`}
          onClick={() => handleDateClick(dateStr)}
        >
          {/* Blue top indicator: any employee has a future task */}
          {isFuture && hasAnyTask && <div className="future-task-indicator blue"></div>}
          {/* Pink top indicator: director has own to-do on this date */}
          {isFuture && hasOwnTodo && <div className="future-task-indicator pink"></div>}

          <span className="day-number">{day}</span>

          {!isFuture && hasOwnTodo && (
            <div className={`completion-circle ${circleColor}`}></div>
          )}
        </div>
      );
    }
    return days;
  };

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Loading calendar...</div>;
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header-nav">
        <button onClick={() => changeMonth(-1)} className="cal-nav-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <div className="cal-title">
          <select value={currentDate.getMonth()} onChange={(e) => setMonth(Number(e.target.value))} className="cal-select">
            {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>
          <select value={currentDate.getFullYear()} onChange={(e) => setYear(Number(e.target.value))} className="cal-select">
            {Array.from({ length: 11 }, (_, i) => 2024 + i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <button onClick={() => changeMonth(1)} className="cal-nav-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>

      <div className="calendar-grid">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
          <div key={d} className="calendar-day-header">{d}</div>
        ))}
        {renderDays()}
      </div>

      {/* Date click popup: Create To-do or Assign Task */}
      {clickedDate && (
        <>
          <div className="popup-overlay" onClick={() => setClickedDate(null)} />
          <div className="date-popup">
            <h3>{new Date(clickedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</h3>
            <button className="popup-option" onClick={handleCreateTodo}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              Create a To-do
            </button>
            <button className="popup-option assign" onClick={handleAssignTask}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              Assign a Task
            </button>
          </div>
        </>
      )}

      {/* Assign Task Flow */}
      {showAssignFlow && (
        <>
          <div className="popup-overlay" onClick={() => setShowAssignFlow(false)} />
          <div className="assign-flow-panel">
            {!selectedEmp ? (
              <>
                <h3>Select Employee</h3>
                <div className="emp-list-flow">
                  {employees.map(emp => (
                    <button key={emp.id} className="emp-flow-item" onClick={() => setSelectedEmp(emp)}>
                      <div className="emp-avatar-sm">{emp.fullName.charAt(0).toUpperCase()}</div>
                      <span>{emp.fullName}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <form onSubmit={handleSubmitAssign}>
                <h3>Assign to {selectedEmp.fullName}</h3>
                <div className="assign-field">
                  <label>Task Name *</label>
                  <input type="text" value={assignForm.name} onChange={e => setAssignForm({...assignForm, name: e.target.value})} required />
                </div>
                <div className="assign-field">
                  <label>Description</label>
                  <textarea value={assignForm.description} onChange={e => setAssignForm({...assignForm, description: e.target.value})} rows={2} />
                </div>
                <div className="assign-row">
                  <div className="assign-field">
                    <label>Category *</label>
                    <select value={assignForm.categoryId} onChange={e => setAssignForm({...assignForm, categoryId: e.target.value})} required>
                      <option value="">Select</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="assign-field">
                    <label>Site *</label>
                    <select value={assignForm.siteId} onChange={e => setAssignForm({...assignForm, siteId: e.target.value})} required>
                      <option value="">Select</option>
                      {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" className="assign-submit" disabled={assignLoading}>
                  {assignLoading ? "Assigning..." : "Assign Task"}
                </button>
              </form>
            )}
          </div>
        </>
      )}

      <style jsx>{`
        .calendar-container { padding: 1rem; height: calc(100vh - 60px); display: flex; flex-direction: column; }
        .calendar-header-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding: 1rem 0; }
        .cal-nav-btn { background: none; border: none; color: var(--text-main); cursor: pointer; }
        .cal-title { display: flex; gap: 0.5rem; }
        .cal-select { background: transparent; color: var(--text-main); font-size: 1.25rem; font-weight: 600; border: none; outline: none; cursor: pointer; appearance: none; }
        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; flex: 1; }
        .calendar-day-header { text-align: center; font-weight: 600; color: var(--text-muted); font-size: 0.85rem; padding-bottom: 1rem; }
        .calendar-day { position: relative; background: var(--input-bg); border-radius: var(--radius-md); min-height: 80px; padding: 0.5rem; cursor: pointer; transition: background 0.2s; display: flex; flex-direction: column; align-items: center; }
        .calendar-day:hover { background: var(--input-border); }
        .calendar-day.empty { background: transparent; cursor: default; }
        .calendar-day.today { box-shadow: inset 0 0 0 2px var(--primary); }
        .day-number { font-weight: 600; color: var(--text-main); margin-top: 0.25rem; }
        .future-task-indicator { position: absolute; top: 0; left: 10%; right: 10%; height: 4px; border-radius: 4px 4px 0 0; }
        .future-task-indicator.blue { background: var(--primary); }
        .future-task-indicator.pink { background: #ec4899; top: 5px; }
        .completion-circle { width: 12px; height: 12px; border-radius: 50%; margin-top: auto; margin-bottom: 0.5rem; }
        .completion-circle.green { background: #22c55e; box-shadow: 0 0 8px rgba(34,197,94,0.4); }
        .completion-circle.yellow { background: #eab308; box-shadow: 0 0 8px rgba(234,179,8,0.4); }

        /* Popup */
        .popup-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 100; }
        .date-popup {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 101;
          background: var(--card-bg); padding: 1.5rem;
          border-radius: var(--radius-lg) var(--radius-lg) 0 0;
          animation: slideUp 0.3s ease;
        }
        .date-popup h3 { font-size: 1.1rem; font-weight: 600; color: var(--text-main); margin-bottom: 1rem; }
        .popup-option {
          width: 100%; padding: 1rem; display: flex; align-items: center; gap: 0.75rem;
          background: var(--input-bg); border: 1px solid var(--input-border);
          border-radius: var(--radius-md); cursor: pointer; font-size: 1rem;
          font-weight: 500; color: var(--text-main); margin-bottom: 0.75rem;
          font-family: inherit; transition: background 0.15s;
        }
        .popup-option:hover { background: var(--input-border); }
        .popup-option.assign { color: var(--primary); }

        /* Assign flow panel */
        .assign-flow-panel {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 101;
          background: var(--card-bg); padding: 1.5rem; max-height: 80vh; overflow-y: auto;
          border-radius: var(--radius-lg) var(--radius-lg) 0 0;
          animation: slideUp 0.3s ease;
        }
        @media (min-width: 768px) {
          .assign-flow-panel { left: auto; top: 0; width: 420px; border-radius: var(--radius-lg) 0 0 var(--radius-lg); animation: slideLeft 0.3s ease; }
        }
        .assign-flow-panel h3 { font-size: 1.1rem; font-weight: 600; color: var(--text-main); margin-bottom: 1rem; }
        .emp-list-flow { display: flex; flex-direction: column; gap: 0.5rem; }
        .emp-flow-item {
          display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem;
          background: var(--input-bg); border: 1px solid var(--input-border);
          border-radius: var(--radius-md); cursor: pointer; font-family: inherit;
          font-size: 0.95rem; color: var(--text-main); transition: background 0.15s;
        }
        .emp-flow-item:hover { background: var(--input-border); }
        .emp-avatar-sm { width: 36px; height: 36px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; }
        .assign-field { margin-bottom: 1rem; }
        .assign-field label { display: block; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.35rem; }
        .assign-field input, .assign-field textarea, .assign-field select {
          width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--input-border);
          border-radius: var(--radius-sm); background: var(--input-bg); color: var(--text-main);
          font-size: 0.9rem; font-family: inherit; outline: none;
        }
        .assign-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .assign-submit {
          width: 100%; padding: 0.75rem; background: var(--primary); color: #fff;
          border: none; border-radius: var(--radius-sm); font-size: 1rem; font-weight: 600;
          cursor: pointer; font-family: inherit;
        }
        .assign-submit:disabled { opacity: 0.5; }

        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
}
