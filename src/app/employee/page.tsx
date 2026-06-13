"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  priority: boolean;
  date: string;
  alarm: string | null;
  isCompleted: boolean;
  orderIndex: number;
  category: Category;
  site: Site;
  assignerId: string | null;
  assigner: { id: string; fullName: string; role: string } | null;
  comments: Array<{
    id: string;
    content: string;
    author: { id: string; fullName: string; role: string };
    createdAt: string;
  }>;
}

// Sortable wrapper component
function SortableTaskItem({
  task,
  isExpanded,
  setExpandedTask,
  toggleComplete,
}: {
  task: Task;
  isExpanded: boolean;
  setExpandedTask: (id: string | null) => void;
  toggleComplete: (id: string, currentState: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const isAssigned = !!task.assignerId;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 100 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div
        className={`task-item ${task.isCompleted ? "completed" : ""} ${isAssigned ? "assigned" : ""}`}
        onClick={() => setExpandedTask(isExpanded ? null : task.id)}
      >
        {/* Priority dot */}
        {task.priority && !task.isCompleted && <div className="task-priority-dot" />}

        {/* Checkmark circle */}
        <button
          className={`task-check ${task.isCompleted ? "checked" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleComplete(task.id, task.isCompleted);
          }}
          onPointerDown={(e) => e.stopPropagation()} // Prevent drag when clicking check
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>

        <div className="task-content">
          <div className="task-name">{task.name}</div>
          <div className="task-meta">
            <span className="task-tag">{task.category.name}</span>
            <span className="task-tag">{task.site.name}</span>
            {task.alarm && (
              <span className="task-time">
                🔔 {new Date(task.alarm).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            {isAssigned && task.assigner && (
              <span className="task-tag" style={{ background: "#fff7ed", color: "#c2410c" }}>
                Assigned by {task.assigner.fullName}
              </span>
            )}
          </div>
        </div>
        
        {/* Drag handle icon */}
        <div className="drag-handle" style={{ color: "var(--text-muted)", marginLeft: "auto", cursor: "grab", padding: "0 4px" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div style={{
          padding: "0.75rem 1rem 0.75rem 3.5rem",
          background: "var(--input-bg)",
          borderRadius: "0 0 var(--radius-md) var(--radius-md)",
          marginTop: "-0.35rem",
          marginBottom: "0.5rem",
          fontSize: "0.85rem",
          color: "var(--text-muted)",
          cursor: "default"
        }} onPointerDown={(e) => e.stopPropagation()}>
          {task.description && <p style={{ marginBottom: "0.5rem" }}>{task.description}</p>}
          {task.comments.length > 0 && (
            <div>
              <strong style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>Comments:</strong>
              {task.comments.map((c) => (
                <div key={c.id} style={{ marginTop: "0.35rem", paddingLeft: "0.5rem", borderLeft: "2px solid var(--primary)" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{c.author.fullName}:</span>{" "}
                  {c.content}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function EmployeeTodoPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [carryOverTasks, setCarryOverTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  // Add task panel state
  const [panelOpen, setPanelOpen] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskTime, setTaskTime] = useState("");
  const [taskAlarm, setTaskAlarm] = useState(false);
  const [taskPriority, setTaskPriority] = useState(false);
  const [taskCategory, setTaskCategory] = useState("");
  const [taskSite, setTaskSite] = useState("");
  const [saving, setSaving] = useState(false);

  // Filter state
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSite, setFilterSite] = useState("");

  // Expanded task for viewing details
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const getToken = () => localStorage.getItem("token") || "";
  const today = new Date().toISOString().split("T")[0];

  const fetchTasks = useCallback(async () => {
    try {
      let url = `/api/tasks?date=${today}`;
      if (filterCategory) url += `&category=${filterCategory}`;
      if (filterSite) url += `&site=${filterSite}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    }
  }, [today, filterCategory, filterSite]);

  const fetchCarryOverTasks = useCallback(async () => {
    // Fetch all incomplete tasks before today
    try {
      const res = await fetch(`/api/tasks`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) {
        const allTasks: Task[] = data.tasks || [];
        const todayDate = new Date(today);
        const carryOver = allTasks.filter((t) => {
          const taskDate = new Date(t.date);
          return !t.isCompleted && taskDate < todayDate;
        });
        setCarryOverTasks(carryOver);
      }
    } catch (err) {
      console.error("Failed to fetch carry-over tasks:", err);
    }
  }, [today]);

  const fetchDropdowns = useCallback(async () => {
    try {
      const [catRes, siteRes] = await Promise.all([
        fetch("/api/categories", {
          headers: { Authorization: `Bearer ${getToken()}` },
        }),
        fetch("/api/sites", {
          headers: { Authorization: `Bearer ${getToken()}` },
        }),
      ]);

      const catData = await catRes.json();
      const siteData = await siteRes.json();

      if (catRes.ok) setCategories(catData.categories || []);
      if (siteRes.ok) setSites(siteData.sites || []);
    } catch (err) {
      console.error("Failed to fetch dropdowns:", err);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchTasks(), fetchCarryOverTasks(), fetchDropdowns()]).finally(
      () => setLoading(false)
    );
  }, [fetchTasks, fetchCarryOverTasks, fetchDropdowns]);

  const toggleComplete = async (taskId: string, currentState: boolean) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isCompleted: !currentState }),
      });

      // Update local state
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, isCompleted: !currentState } : t
        )
      );
      setCarryOverTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, isCompleted: !currentState } : t
        )
      );
    } catch (err) {
      console.error("Failed to toggle task:", err);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim() || !taskCategory || !taskSite) return;

    setSaving(true);
    try {
      const taskDate = new Date(today);
      if (taskTime) {
        const [hours, minutes] = taskTime.split(":");
        taskDate.setHours(parseInt(hours), parseInt(minutes));
      }

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: taskName.trim(),
          description: taskDesc.trim() || null,
          date: taskDate.toISOString(),
          alarm: taskAlarm && taskTime ? taskDate.toISOString() : null,
          priority: taskPriority,
          categoryId: taskCategory,
          siteId: taskSite,
        }),
      });

      if (res.ok) {
        // Reset form
        setTaskName("");
        setTaskDesc("");
        setTaskTime("");
        setTaskAlarm(false);
        setTaskPriority(false);
        setTaskCategory("");
        setTaskSite("");
        setPanelOpen(false);
        fetchTasks();
      }
    } catch (err) {
      console.error("Failed to create task:", err);
    } finally {
      setSaving(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);

    const reorderedTasks = arrayMove(tasks, oldIndex, newIndex);
    
    // Update their orderIndex to reflect new positions
    const tasksWithNewOrder = reorderedTasks.map((t, index) => ({
      ...t,
      orderIndex: index,
    }));
    
    // Optimistic update
    setTasks(tasksWithNewOrder);

    try {
      await fetch("/api/tasks/reorder", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tasks: tasksWithNewOrder.map((t) => ({ id: t.id, orderIndex: t.orderIndex })),
        }),
      });
    } catch (err) {
      console.error("Failed to persist task reorder:", err);
      // Revert if API call fails
      fetchTasks();
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        <p>Loading tasks...</p>
      </div>
    );
  }

  return (
    <>
      {/* Filter button in header-right area */}
      <div style={{ position: "fixed", top: "0.75rem", right: "1.25rem", zIndex: 110 }}>
        <button
          className="filter-btn"
          onClick={() => setFilterOpen(!filterOpen)}
          aria-label="Filter tasks"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="8" y1="18" x2="16" y2="18" />
          </svg>

          {filterOpen && (
            <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
              <h4>Category</h4>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <h4>Site</h4>
              <select
                value={filterSite}
                onChange={(e) => setFilterSite(e.target.value)}
              >
                <option value="">All Sites</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <button
                className="filter-clear"
                onClick={() => {
                  setFilterCategory("");
                  setFilterSite("");
                }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </button>
      </div>

      {/* Carry-over tasks from previous days */}
      {carryOverTasks.length > 0 && (
        <div className="tasks-section">
          <div className="tasks-section-title">Incomplete from previous days</div>
          {carryOverTasks.map((task) => (
             <SortableTaskItem
              key={task.id}
              task={task}
              isExpanded={expandedTask === task.id}
              setExpandedTask={setExpandedTask}
              toggleComplete={toggleComplete}
            />
          ))}
          <div className="tasks-divider" />
        </div>
      )}

      {/* Today's tasks */}
      <div className="tasks-section">
        {tasks.length > 0 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              {tasks.map((task) => (
                <SortableTaskItem
                  key={task.id}
                  task={task}
                  isExpanded={expandedTask === task.id}
                  setExpandedTask={setExpandedTask}
                  toggleComplete={toggleComplete}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <h3>No tasks for today</h3>
            <p>Tap the button below to add your first task</p>
          </div>
        )}
      </div>

      {/* Add Task Button */}
      <button className="add-task-trigger" onClick={() => setPanelOpen(true)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add a Task
      </button>

      {/* Add Task Panel (slides up from bottom like Microsoft To-Do) */}
      <div className={`add-task-panel ${panelOpen ? "open" : ""}`}>
        <div className="add-task-header">
          <h3>New Task</h3>
          <button className="add-task-close" onClick={() => setPanelOpen(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form className="add-task-body" onSubmit={handleAddTask}>
          {/* Task Name */}
          <div className="input-group" style={{ marginBottom: 0 }}>
            <input
              type="text"
              className="input-field"
              placeholder="What do you need to do?"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              style={{ paddingLeft: "1rem", fontSize: "1rem", fontWeight: 500 }}
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div className="input-group" style={{ marginBottom: 0 }}>
            <textarea
              className="input-field"
              placeholder="Add a description (optional)"
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              rows={2}
              style={{ paddingLeft: "1rem", resize: "vertical", fontFamily: "inherit" }}
            />
          </div>

          {/* Schedule + Alarm */}
          <div className="add-task-row">
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">SCHEDULE TIME</label>
              <input
                type="time"
                className="input-field"
                value={taskTime}
                onChange={(e) => setTaskTime(e.target.value)}
                style={{ paddingLeft: "1rem" }}
              />
            </div>

            <div className="input-group" style={{ marginBottom: 0, display: "flex", alignItems: "flex-end" }}>
              <label style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: "pointer",
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                padding: "0.875rem 1rem",
                background: "var(--input-bg)",
                borderRadius: "var(--radius-md)",
                border: `1px solid ${taskAlarm ? "var(--primary)" : "var(--input-border)"}`,
                width: "100%",
              }}>
                <input
                  type="checkbox"
                  checked={taskAlarm}
                  onChange={(e) => setTaskAlarm(e.target.checked)}
                  style={{ accentColor: "var(--primary)" }}
                />
                Set Alarm
              </label>
            </div>
          </div>

          {/* Category + Site */}
          <div className="add-task-row">
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">CATEGORY *</label>
              <select
                className="input-field input-field-select"
                value={taskCategory}
                onChange={(e) => setTaskCategory(e.target.value)}
                style={{ paddingLeft: "1rem" }}
                required
              >
                <option value="" disabled>Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">SITE *</label>
              <select
                className="input-field input-field-select"
                value={taskSite}
                onChange={(e) => setTaskSite(e.target.value)}
                style={{ paddingLeft: "1rem" }}
                required
              >
                <option value="" disabled>Select site</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority Toggle */}
          <button
            type="button"
            className="priority-toggle"
            onClick={() => setTaskPriority(!taskPriority)}
          >
            <div className={`priority-circle ${taskPriority ? "active" : ""}`} />
            Mark as priority
          </button>

          {/* Save */}
          <button
            type="submit"
            className="add-task-save"
            disabled={saving || !taskName.trim() || !taskCategory || !taskSite}
          >
            {saving ? "Saving..." : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
                </svg>
                Save Task
              </>
            )}
          </button>
        </form>
      </div>
    </>
  );
}
