"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// --- Types ---
interface Category {
  id: string;
  name: string;
}

interface User {
  id: string;
  fullName: string;
}

interface Task {
  id: string;
  name: string;
  categoryId: string;
  orderIndex: number;
  isCompleted: boolean;
  priority: boolean;
  assigneeId: string;
  assignee?: User;
}

// --- Components ---

function SortableTaskCard({ task, employees, onAssign }: { task: Task, employees: User[], onAssign: (taskId: string, empId: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "Task", task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`board-task-card ${task.isCompleted ? 'completed' : ''}`}>
      <div className="task-card-header">
        {task.priority && <div className="priority-dot" />}
        <span className="task-name">{task.name}</span>
      </div>

      <div className="task-card-actions" onPointerDown={(e) => e.stopPropagation()}>
        {/* Assignee Dropdown */}
        <select 
          className="assignee-select"
          value={task.assigneeId}
          onChange={(e) => onAssign(task.id, e.target.value)}
        >
          <option value="">Unassigned</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.fullName}</option>
          ))}
        </select>

        {/* Completion Indicator (Directors just see it, not toggle it here usually, but let's just show it) */}
        <div className={`status-circle ${task.isCompleted ? 'completed' : ''}`} />
      </div>
    </div>
  );
}

function BoardColumn({ category, tasks, employees, onAssign }: { category: Category, tasks: Task[], employees: User[], onAssign: (taskId: string, empId: string) => void }) {
  const { setNodeRef } = useSortable({
    id: category.id,
    data: { type: "Column", category },
  });

  return (
    <div className="board-column" ref={setNodeRef}>
      <div className="column-header">
        <h3>{category.name}</h3>
        <span className="task-count">{tasks.length}</span>
      </div>
      
      <div className="column-content">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} employees={employees} onAssign={onAssign} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

// --- Main Page ---

export default function DirectorBoardPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const getToken = () => localStorage.getItem("token") || "";

  const fetchData = useCallback(async () => {
    try {
      const [catRes, taskRes, empRes] = await Promise.all([
        fetch("/api/categories", { headers: { Authorization: `Bearer ${getToken()}` } }),
        fetch("/api/tasks", { headers: { Authorization: `Bearer ${getToken()}` } }), // Assuming API allows director to fetch all tasks
        fetch("/api/employees", { headers: { Authorization: `Bearer ${getToken()}` } }) // Need an endpoint for this
      ]);

      if (catRes.ok) {
        const d = await catRes.json();
        setCategories(d.categories || []);
      }
      if (taskRes.ok) {
        const d = await taskRes.json();
        setTasks(d.tasks || []);
      }
      if (empRes.ok) {
        const d = await empRes.json();
        setEmployees(d.employees || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Drag and Drop Handlers ---

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "Task") {
      setActiveTask(event.active.data.current.task);
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === "Task";
    const isOverTask = over.data.current?.type === "Task";
    const isOverColumn = over.data.current?.type === "Column";

    if (!isActiveTask) return;

    // Dropping a Task over another Task
    if (isActiveTask && isOverTask) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        const overIndex = tasks.findIndex((t) => t.id === overId);

        // If they are in different columns, move it to the new column
        if (tasks[activeIndex].categoryId !== tasks[overIndex].categoryId) {
          const updatedTasks = [...tasks];
          updatedTasks[activeIndex].categoryId = tasks[overIndex].categoryId;
          return arrayMove(updatedTasks, activeIndex, overIndex);
        }

        return arrayMove(tasks, activeIndex, overIndex);
      });
    }

    // Dropping a Task over an empty Column area
    if (isActiveTask && isOverColumn) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        const updatedTasks = [...tasks];
        updatedTasks[activeIndex].categoryId = overId as string;
        return arrayMove(updatedTasks, activeIndex, activeIndex);
      });
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    // After state is updated optimistically by onDragOver, persist it
    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    // Update DB
    try {
      await fetch(`/api/tasks/${activeTask.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryId: activeTask.categoryId,
        }),
      });
      // Further we'd update orderIndex using /api/tasks/reorder if we wanted to preserve exact order
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async (taskId: string, empId: string) => {
    // Optimistic
    setTasks(tasks.map(t => t.id === taskId ? { ...t, assigneeId: empId } : t));
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assigneeId: empId }),
      });
    } catch (err) {
      console.error(err);
      fetchData(); // revert
    }
  };

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading Board...</div>;
  }

  return (
    <div className="board-container">
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="board-scroll">
          {categories.map((category) => {
            const colTasks = tasks.filter((t) => t.categoryId === category.id);
            return (
              <BoardColumn 
                key={category.id} 
                category={category} 
                tasks={colTasks} 
                employees={employees}
                onAssign={handleAssign}
              />
            );
          })}
          
          {categories.length === 0 && (
            <div style={{ padding: "2rem", color: "var(--text-muted)" }}>
              No categories found. Create a category to start your board.
            </div>
          )}
        </div>

        <DragOverlay>
          {activeTask ? (
            <SortableTaskCard 
              task={activeTask} 
              employees={employees} 
              onAssign={() => {}} 
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <style jsx>{`
        .board-container {
          padding: 1rem;
          height: calc(100vh - 80px);
          overflow: hidden;
        }
        .board-scroll {
          display: flex;
          gap: 1.5rem;
          height: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          padding-bottom: 1rem;
        }
        .board-column {
          background: var(--input-bg);
          border-radius: var(--radius-md);
          min-width: 300px;
          max-width: 300px;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .column-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid var(--input-border);
        }
        .column-header h3 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-main);
        }
        .task-count {
          background: var(--bg-main);
          color: var(--text-muted);
          font-size: 0.75rem;
          padding: 0.2rem 0.6rem;
          border-radius: 12px;
          font-weight: 600;
        }
        .column-content {
          padding: 1rem;
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
      `}</style>
      <style jsx global>{`
        .board-task-card {
          background: var(--card-bg);
          border: 1px solid var(--input-border);
          border-radius: var(--radius-sm);
          padding: 1rem;
          box-shadow: var(--shadow-sm);
          cursor: grab;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .board-task-card.completed {
          opacity: 0.6;
        }
        .task-card-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .priority-dot {
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
        }
        .task-name {
          font-weight: 500;
          font-size: 0.95rem;
          color: var(--text-main);
        }
        .task-card-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.5rem;
        }
        .assignee-select {
          background: var(--bg-main);
          border: 1px solid var(--input-border);
          border-radius: var(--radius-sm);
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          color: var(--text-main);
          outline: none;
        }
        .status-circle {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid var(--input-border);
        }
        .status-circle.completed {
          background: #22c55e;
          border-color: #22c55e;
        }
      `}</style>
    </div>
  );
}
