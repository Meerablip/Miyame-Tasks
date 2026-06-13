"use client";

import { useEffect, useState, useCallback } from "react";

interface Site {
  id: string;
  name: string;
}

export default function DirectorSitePage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newSiteName, setNewSiteName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const getToken = () => localStorage.getItem("token") || "";

  const fetchSites = useCallback(async () => {
    try {
      const res = await fetch("/api/sites", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) {
        setSites(data.sites || []);
      }
    } catch (err) {
      console.error("Failed to fetch sites:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteName.trim()) return;

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newSiteName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create site.");
        return;
      }

      setNewSiteName("");
      setShowAdd(false);
      fetchSites();
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="empty-state"><p>Loading sites...</p></div>;

  return (
    <div style={{ paddingTop: "0.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Sites</h2>
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
          }}
        >
          + Add Site
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAddSite}
          style={{
            display: "flex", gap: "0.5rem", marginBottom: "1rem", background: "var(--card-bg)", padding: "0.75rem", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-sm)"
          }}
        >
          <input
            type="text"
            className="input-field"
            placeholder="Enter site name/location"
            value={newSiteName}
            onChange={(e) => setNewSiteName(e.target.value)}
            style={{ paddingLeft: "1rem", flex: 1 }}
            autoFocus
            required
          />
          <button
            type="submit"
            disabled={saving || !newSiteName.trim()}
            style={{
              padding: "0.5rem 0.75rem", background: "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </form>
      )}

      {error && (
        <div style={{ padding: "0.5rem", background: "#fef2f2", color: "#dc2626", borderRadius: "var(--radius-sm)", marginBottom: "0.75rem" }}>
          {error}
        </div>
      )}

      {sites.length === 0 ? (
        <div className="empty-state">
          <h3>No sites yet</h3>
          <p>Create a site location to assign tasks to</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {sites.map((site) => (
            <div key={site.id} style={{ background: "var(--card-bg)", padding: "0.875rem 1rem", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-sm)" }}>
              <p style={{ fontWeight: 500 }}>{site.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
