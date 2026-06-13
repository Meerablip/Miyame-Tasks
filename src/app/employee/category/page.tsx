"use client";

import { useEffect, useState, useCallback } from "react";

interface Category {
  id: string;
  name: string;
  creator: { id: string; fullName: string } | null;
  createdAt: string;
}

export default function EmployeeCategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const getToken = () => localStorage.getItem("token") || "";

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) {
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create category.");
        return;
      }

      setNewCategoryName("");
      setShowAdd(false);
      fetchCategories();
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        <p>Loading categories...</p>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: "0.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Categories</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          style={{
            padding: "0.5rem 1rem",
            background: "var(--primary)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "background 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "var(--primary-hover)")}
          onMouseOut={(e) => (e.currentTarget.style.background = "var(--primary)")}
        >
          + Add Category
        </button>
      </div>

      {/* Add category form */}
      {showAdd && (
        <form
          onSubmit={handleAddCategory}
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "1rem",
            background: "var(--card-bg)",
            padding: "0.75rem",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <input
            type="text"
            className="input-field"
            placeholder="Enter category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            style={{ paddingLeft: "1rem", flex: 1 }}
            autoFocus
            required
          />
          <button
            type="submit"
            disabled={saving || !newCategoryName.trim()}
            style={{
              padding: "0.5rem 0.75rem",
              background: "var(--primary)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </form>
      )}

      {error && (
        <div style={{
          padding: "0.5rem 0.75rem",
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "var(--radius-sm)",
          color: "#dc2626",
          fontSize: "0.85rem",
          marginBottom: "0.75rem",
        }}>
          {error}
        </div>
      )}

      {/* Category list */}
      {categories.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h6v6H4z" /><path d="M14 4h6v6h-6z" /><path d="M4 14h6v6H4z" /><path d="M14 14h6v6h-6z" />
          </svg>
          <h3>No categories yet</h3>
          <p>Add a category to organize your tasks</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {categories.map((cat) => (
            <div
              key={cat.id}
              style={{
                background: "var(--card-bg)",
                padding: "0.875rem 1rem",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <p style={{ fontWeight: 500, fontSize: "0.95rem" }}>{cat.name}</p>
                {cat.creator && (
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                    Added by {cat.creator.fullName}
                  </p>
                )}
              </div>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--primary)",
                  opacity: 0.5,
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
