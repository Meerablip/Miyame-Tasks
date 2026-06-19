"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import CustomSelect from "@/components/CustomSelect";

interface Task {
  id: string;
  date: string;
  isCompleted: boolean;
  priority: boolean;
}

export default function EmployeeCalendarPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

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
        console.error("Failed to fetch tasks for calendar:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAllTasks();
  }, []);

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const setMonth = (m: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), m, 1));
  };

  const setYear = (y: number) => {
    setCurrentDate(new Date(y, currentDate.getMonth(), 1));
  };

  // Calendar logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const todayStr = new Date().toISOString().split("T")[0];

  // Map dates to task completion status
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach(t => {
      const dStr = t.date.split("T")[0];
      if (!map.has(dStr)) map.set(dStr, []);
      map.get(dStr)!.push(t);
    });
    return map;
  }, [tasks]);

  const renderDays = () => {
    const days = [];
    const today = new Date();
    today.setHours(0,0,0,0);

    // Padding for first day
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateStr = date.toISOString().split("T")[0];
      const isToday = dateStr === todayStr;
      const isFuture = date > today;
      
      const dayTasks = tasksByDate.get(dateStr) || [];
      const hasTasks = dayTasks.length > 0;
      const allCompleted = hasTasks && dayTasks.every(t => t.isCompleted);
      
      // Calculate shifted tasks (yellow circle logic)
      // "if a couple tasks, even a single one is shifted to the next day, the circle appears as yellow"
      // Since "shifted" implies past tasks that are incomplete, we check if any task from BEFORE this date is incomplete.
      // But specifically, the circle is FOR the current date or past date. 
      // If a past date has incomplete tasks, its circle is yellow. If all completed, green.
      let circleColor = "";
      if (hasTasks) {
        if (allCompleted) {
          circleColor = "green";
        } else {
          // Has incomplete tasks
          circleColor = "yellow";
        }
      }

      days.push(
        <div 
          key={day} 
          className={`calendar-day ${isToday ? "today" : ""}`}
          onClick={() => {
            // When a date is clicked, navigate to To-Do with that date filter (or pass via query)
            // For now, redirect to /employee?date=YYYY-MM-DD
            router.push(`/employee?date=${dateStr}`);
          }}
        >
          {isFuture && hasTasks && (
            <div className="future-task-indicator"></div>
          )}
          <span className="day-number">{day}</span>
          
          {/* Completion Circle for past/current dates */}
          {!isFuture && hasTasks && (
            <div className={`completion-circle ${circleColor}`}></div>
          )}
        </div>
      );
    }
    return days;
  };

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
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="calendar-day-header">{day}</div>
        ))}
        {renderDays()}
      </div>

      <style jsx>{`
        .calendar-container {
          padding: 1rem;
          height: calc(100vh - 60px);
          display: flex;
          flex-direction: column;
        }
        .calendar-header-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding: 1rem 0;
        }
        .cal-nav-btn {
          background: none;
          border: none;
          color: var(--text-main);
          cursor: pointer;
        }
        .cal-title {
          display: flex;
          gap: 0.5rem;
        }
        .cal-select {
          background: transparent;
          color: var(--text-main);
          font-size: 1.25rem;
          font-weight: 600;
          border: none;
          outline: none;
          cursor: pointer;
          appearance: none;
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          flex: 1;
          border: 1px solid var(--input-border);
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        .calendar-day-header {
          text-align: center;
          font-weight: 600;
          color: var(--text-muted);
          font-size: 0.85rem;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--input-border);
          background: var(--bg-main);
          border-right: 1px solid var(--input-border);
        }
        .calendar-day-header:last-child { border-right: none; }
        .calendar-day {
          position: relative;
          background: var(--card-bg);
          border-right: 1px solid var(--input-border);
          border-bottom: 1px solid var(--input-border);
          min-height: 100px;
          padding: 0.5rem;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .calendar-day:nth-child(7n) { border-right: none; }
        .calendar-day:hover {
          background: var(--input-bg);
        }
        .calendar-day.empty {
          background: var(--bg-main);
          cursor: default;
        }
        .calendar-day.today {
          background: rgba(99, 102, 241, 0.05);
        }
        .calendar-day.today .day-number {
          background: var(--primary);
          color: #fff;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          margin-top: -0.15rem;
          margin-left: -0.15rem;
        }
        .day-number {
          font-weight: 600;
          color: var(--text-main);
          margin-top: 0.25rem;
          font-size: 0.95rem;
        }
        .future-task-indicator {
          width: 100%;
          height: 6px;
          background: var(--primary);
          border-radius: 0;
          margin-top: 4px;
        }
        .completion-circle {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          margin-top: auto;
          align-self: flex-end;
        }
        .completion-circle.green {
          background: #22c55e;
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.4);
        }
        .completion-circle.yellow {
          background: #eab308;
          box-shadow: 0 0 8px rgba(234, 179, 8, 0.4);
        }
      `}</style>
    </div>
  );
}
