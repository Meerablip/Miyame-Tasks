"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import CustomSelect from "@/components/CustomSelect";

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

  // Assign task modal state (REMOVED - navigating instead)

  const getToken = () => localStorage.getItem("token") || "";
  const getUserId = () => {
    try { return JSON.parse(localStorage.getItem("user") || "{}").id; } catch { return ""; }
  };

  useEffect(() => {
    async function fetchData() {
      const headers = { Authorization: `Bearer ${getToken()}` };
      try {
        const [allRes, ownRes] = await Promise.all([
          fetch("/api/tasks", { headers }), // All tasks (director sees everything)
          fetch("/api/tasks?self=true", { headers }), // Director's own tasks
        ]);

        if (allRes.ok) setAllTasks((await allRes.json()).tasks || []);
        if (ownRes.ok) setOwnTasks((await ownRes.json()).tasks || []);
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
    router.push(`/director?date=${clickedDate}`);
    setClickedDate(null);
  };

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
          <div style={{ width: "160px" }}>
            <CustomSelect
              options={["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => ({ value: i, label: m }))}
              value={currentDate.getMonth()}
              onChange={(v) => setMonth(Number(v))}
            />
          </div>
          <div style={{ width: "110px" }}>
            <CustomSelect
              options={Array.from({ length: 11 }, (_, i) => 2024 + i).map(y => ({ value: y, label: y.toString() }))}
              value={currentDate.getFullYear()}
              onChange={(v) => setYear(Number(v))}
            />
          </div>
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



      <style jsx>{`
        .calendar-container { padding: 1rem; height: calc(100vh - 60px); display: flex; flex-direction: column; }
        .calendar-header-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding: 1rem 0; }
        .cal-nav-btn { background: none; border: none; color: var(--text-main); cursor: pointer; }
        .cal-title { display: flex; gap: 0.5rem; }
        .cal-select { background: transparent; color: var(--text-main); font-size: 1.25rem; font-weight: 600; border: none; outline: none; cursor: pointer; appearance: none; }
        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); flex: 1; border: 1px solid var(--input-border); border-radius: var(--radius-md); overflow: hidden; }
        .calendar-day-header { text-align: center; font-weight: 600; color: var(--text-muted); font-size: 0.85rem; padding: 0.75rem 0; border-bottom: 1px solid var(--input-border); background: var(--bg-main); border-right: 1px solid var(--input-border); }
        .calendar-day-header:last-child { border-right: none; }
        .calendar-day { position: relative; background: var(--card-bg); border-right: 1px solid var(--input-border); border-bottom: 1px solid var(--input-border); min-height: 100px; padding: 0.5rem; cursor: pointer; transition: background 0.2s; display: flex; flex-direction: column; align-items: flex-start; }
        .calendar-day:nth-child(7n) { border-right: none; }
        .calendar-day:hover { background: var(--input-bg); }
        .calendar-day.empty { background: var(--bg-main); cursor: default; }
        .calendar-day.today { background: rgba(99, 102, 241, 0.05); }
        .calendar-day.today .day-number { background: var(--primary); color: #fff; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 50%; margin-top: -0.15rem; margin-left: -0.15rem; }
        .day-number { font-weight: 600; color: var(--text-main); margin-top: 0.25rem; font-size: 0.95rem; }
        .future-task-indicator { width: 100%; height: 6px; border-radius: 0; margin-top: 4px; }
        .future-task-indicator.blue { background: var(--primary); }
        .future-task-indicator.pink { background: #ec4899; }
        .completion-circle { width: 14px; height: 14px; border-radius: 50%; margin-top: auto; align-self: flex-end; }
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
