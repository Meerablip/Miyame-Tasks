"use client";

import { useEffect, useState, useCallback } from "react";

interface Notification {
  id: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const getToken = () => localStorage.getItem("token") || "";

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => {
          setOpen(!open);
          if (!open && unreadCount > 0) markAllRead();
        }}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          position: "relative",
          padding: "0.4rem",
          display: "flex",
          alignItems: "center",
          color: "var(--text-main)",
        }}
        aria-label="Notifications"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "#ef4444",
              color: "#fff",
              fontSize: "0.6rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99,
            }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 0.5rem)",
              right: 0,
              width: 320,
              maxHeight: 400,
              overflowY: "auto",
              background: "var(--card-bg)",
              border: "1px solid var(--input-border)",
              borderRadius: "var(--radius-md)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
              zIndex: 100,
            }}
          >
            <div
              style={{
                padding: "0.75rem 1rem",
                borderBottom: "1px solid var(--input-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h4 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-main)" }}>
                Notifications
              </h4>
            </div>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: "2rem 1rem",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                }}
              >
                No notifications yet.
              </div>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: "0.75rem 1rem",
                    borderBottom: "1px solid var(--input-border)",
                    background: n.isRead ? "transparent" : "rgba(99, 102, 241, 0.04)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-main)",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {n.content}
                  </p>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    {timeAgo(n.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
