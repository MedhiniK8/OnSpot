"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { apiGetEvents, type ApiEvent } from "@/lib/api";

const SEVERITY_BADGE: Record<string, string> = {
  High: "badge-red", Critical: "badge-red", Medium: "badge-yellow", Low: "badge-gray",
};

const STATUS_BADGE: Record<string, string> = {
  completed: "badge-green", ongoing: "badge-yellow", failed: "badge-red",
};

function formatAction(evt: ApiEvent): string {
  if (evt.ai_decision) return evt.ai_decision.slice(0, 60);
  return evt.departments_alerted.length > 0 ? `Dispatch: ${evt.departments_alerted.join(", ")}` : "AI analysis pending";
}

export default function EventsPage() {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGetEvents(1, 100);
      setEvents(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }

  const filtered = events.filter((e) => {
    const matchSeverity = severityFilter === "All" || e.severity === severityFilter;
    const matchStatus = statusFilter === "All" || e.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || (e.location ?? "").toLowerCase().includes(q)
      || e.accident_type.toLowerCase().includes(q)
      || e.id.toLowerCase().includes(q)
      || e.severity.toLowerCase().includes(q);
    return matchSeverity && matchStatus && matchSearch;
  });

  return (
    <>
      <div className="topbar">
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>Events</h1>
          <p style={{ fontSize: 13, color: "#6b7280" }}>AI-processed incident results — severity, actions taken, departments alerted</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="badge badge-gray">{events.length} events</span>
          <button className="btn btn-secondary btn-sm" onClick={fetchEvents} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="page-container" style={{ flex: 1 }}>
        <motion.div className="card"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {/* Filters */}
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <input id="events-search" type="search" className="input"
              placeholder="Search by location, type, or ID..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 200 }} />
            <div className="tabs" style={{ padding: "3px" }}>
              {["All", "completed", "ongoing", "failed"].map((s) => (
                <button key={s} id={`status-filter-${s.toLowerCase()}`}
                  className={`tab ${statusFilter === s ? "active" : ""}`}
                  onClick={() => setStatusFilter(s)}
                  style={{ textTransform: "capitalize" }}>
                  {s}
                </button>
              ))}
            </div>
            <div className="tabs" style={{ padding: "3px" }}>
              {["All", "High", "Medium", "Low"].map((sv) => (
                <button key={sv} id={`severity-filter-${sv.toLowerCase()}`}
                  className={`tab ${severityFilter === sv ? "active" : ""}`}
                  onClick={() => setSeverityFilter(sv)}>
                  {sv}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Event ID</th>
                  <th>Submitted</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Severity</th>
                  <th>Action Taken</th>
                  <th>Department Alerted</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af" }}>
                      Loading events from backend...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "48px 0" }}>
                      <p style={{ fontSize: 14, color: "#dc2626" }}>{error}</p>
                      <button className="btn btn-secondary btn-sm" onClick={fetchEvents} style={{ marginTop: 12 }}>Retry</button>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "56px 0" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        <p style={{ fontSize: 14, fontWeight: 500, color: "#6b7280" }}>
                          {events.length === 0 ? "No events yet" : "No events match your filters"}
                        </p>
                        <p style={{ fontSize: 13, color: "#9ca3af" }}>
                          {events.length === 0
                            ? "Submit an incident from the Dashboard — AI results will appear here"
                            : "Try adjusting your search or filter criteria"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((evt) => (
                    <tr key={evt.id}>
                      <td style={{ fontFamily: "monospace", fontSize: 11, color: "#9ca3af" }}>{evt.id.slice(0, 8)}…</td>
                      <td style={{ fontFamily: "monospace", fontSize: 12, color: "#6b7280" }}>
                        {evt.created_at ? new Date(evt.created_at).toLocaleString() : "—"}
                      </td>
                      <td style={{ color: "#374151", textTransform: "capitalize" }}>{evt.input_type}</td>
                      <td style={{ fontWeight: 500 }}>{evt.location || "—"}</td>
                      <td><span className={`badge ${SEVERITY_BADGE[evt.severity] ?? "badge-gray"}`}>{evt.severity}</span></td>
                      <td style={{ fontSize: 13, color: "#374151", maxWidth: 220 }}>{formatAction(evt)}</td>
                      <td style={{ fontSize: 13, color: "#374151" }}>
                        {evt.departments_alerted.length > 0 ? evt.departments_alerted.join(", ") : "—"}
                      </td>
                      <td><span className={`badge ${STATUS_BADGE[evt.status] ?? "badge-gray"}`}>{evt.status}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#9ca3af" }}>
              {filtered.length === 0 ? "No events to display" : `Showing ${filtered.length} of ${events.length} events`}
            </span>
          </div>
        </motion.div>
      </div>
    </>
  );
}
