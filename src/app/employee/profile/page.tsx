"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: string;
  securityQuestion: string;
}

export default function EmployeeProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Check saved theme preference
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  if (!user) return null;

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div style={{ paddingTop: "1rem" }}>
      {/* Profile avatar */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "var(--primary-light)",
            color: "var(--primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.75rem",
            fontWeight: 700,
            margin: "0 auto 0.75rem",
          }}
        >
          {getInitials(user.fullName)}
        </div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>{user.fullName}</h2>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "capitalize" }}>
          {user.role.toLowerCase()}
        </p>
      </div>

      {/* Info cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div
          style={{
            background: "var(--card-bg)",
            padding: "1rem 1.25rem",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Full Name
          </label>
          <p style={{ fontSize: "0.95rem", marginTop: "0.25rem" }}>{user.fullName}</p>
        </div>

        <div
          style={{
            background: "var(--card-bg)",
            padding: "1rem 1.25rem",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Email
          </label>
          <p style={{ fontSize: "0.95rem", marginTop: "0.25rem" }}>{user.email}</p>
        </div>

        <div
          style={{
            background: "var(--card-bg)",
            padding: "1rem 1.25rem",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Security Question
          </label>
          <p style={{ fontSize: "0.95rem", marginTop: "0.25rem" }}>
            {user.securityQuestion || "Not set"}
          </p>
        </div>

        {/* Dark Mode Toggle */}
        <div
          style={{
            background: "var(--card-bg)",
            padding: "1rem 1.25rem",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Theme
            </label>
            <p style={{ fontSize: "0.95rem", marginTop: "0.25rem" }}>
              {darkMode ? "Dark Mode" : "Light Mode"}
            </p>
          </div>
          <button
            onClick={toggleDarkMode}
            style={{
              width: 52,
              height: 28,
              borderRadius: 999,
              background: darkMode ? "var(--primary)" : "var(--input-border)",
              border: "none",
              cursor: "pointer",
              position: "relative",
              transition: "background 0.3s ease",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "#fff",
                position: "absolute",
                top: 3,
                left: darkMode ? 27 : 3,
                transition: "left 0.3s ease",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }}
            />
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "0.875rem",
            background: "#fef2f2",
            color: "#dc2626",
            border: "1px solid #fecaca",
            borderRadius: "var(--radius-md)",
            fontSize: "0.95rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
            fontFamily: "inherit",
            marginTop: "0.5rem",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#dc2626";
            e.currentTarget.style.color = "#fff";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "#fef2f2";
            e.currentTarget.style.color = "#dc2626";
          }}
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
