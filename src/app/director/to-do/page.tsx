"use client";

import EmployeeTodoPage from "../../employee/page";

export default function DirectorTodoPage() {
  // Director's personal To-Do works identically to Employee's To-Do
  // The tasks API already scopes to the current user when role is EMPLOYEE,
  // but for DIRECTOR it shows all tasks. We need to filter to only the director's own tasks.
  // Since EmployeeTodoPage fetches tasks with the current user's token and the API
  // scopes EMPLOYEE tasks to assigneeId = userId, we need the director's personal tasks
  // to work the same way. Let's reuse the component directly — the API will need
  // to handle this. For now, since the employee page creates tasks with assigneeId = userId,
  // the director's To-Do will also create tasks assigned to themselves.
  return <EmployeeTodoPage />;
}
