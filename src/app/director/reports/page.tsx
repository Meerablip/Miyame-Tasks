"use client";

import EmployeeReportsPage from "../../employee/reports/page";

export default function DirectorReportsPage() {
  // Since the API now returns ALL tasks for a Director, 
  // the EmployeeReportsPage component will naturally aggregate
  // all tasks across the company for the Director!
  return <EmployeeReportsPage />;
}
