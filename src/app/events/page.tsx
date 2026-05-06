"use client";

import { useState } from "react";

const EVENTS = [
  { id: "EVT-0041", location: "MG Road & Brigade Rd", time: "14:23", severity: "High", type: "Vehicle Accident", action: "Police + Ambulance Alerted", units: 3, resolved: false },
  { id: "EVT-0040", location: "Silk Board Junction", time: "13:58", severity: "Critical", type: "Multi-Vehicle Collision", action: "Police + Ambulance + Fire Dept", units: 7, resolved: false },
  { id: "EVT-0039", location: "Hebbal Flyover", time: "13:41", severity: "Medium", type: "Vehicle Breakdown", action: "Police Dispatched", units: 1, resolved: true },
  { id: "EVT-0038", location: "Whitefield Main Rd", time: "13:20", severity: "Low", type: "Pothole Report", action: "BMC Notified", units: 1, resolved: true },
  { id: "EVT-0037", location: "Koramangala 5th Block", time: "12:54", severity: "High", type: "Pedestrian Accident", action: "Ambulance Dispatched", units: 2, resolved: true },
  { id: "EVT-0036", location: "Electronic City Flyover", time: "12:30", severity: "Critical", type: "Fire Incident", action: "Fire Dept + Ambulance Alerted", units: 5, resolved: true },
  { id: "EVT-0035", location: "Indiranagar 100ft Rd", time: "11:48", severity: "Medium", type: "Signal Malfunction", action: "Traffic Control Alerted", units: 2, resolved: true },
  { id: "EVT-0034", location: "Bannerghatta Road", time: "11:15", severity: "High", type: "Vehicle Accident", action: "Police + Ambulance Alerted", units: 4, resolved: true },
  { id: "EVT-0033", location: "Jayanagar 4th Block", time: "10:52", severity: "Low", type: "Minor Collision", action: "Police Dispatched", units: 1, resolved: true },
  { id: "EVT-0032", location: "Outer Ring Road (ORR)", time: "10:10", severity: "Critical", type: "Multi-Vehicle Accident", action: "Police + Ambulance + Fire Dept", units: 9, resolved: true },
];

type SeverityKey = "All" | "Critical" | "High" | "Medium" | "Low";

const SEVERITY_BADGE: Record<string, string> = {
  Critical: "badge-red",
  High: "badge-red",
  Medium: "badge-yellow",
  Low: "badge-gray",
};

export default function EventsPage() {
  const [filter, setFilter] = useState<SeverityKey>("All");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Resolved">("All");

  const filtered = EVENTS.filter((e) => {
    const matchesSeverity = filter === "All" || e.severity === filter;
    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Active" && !e.resolved) ||
      (statusFilter === "Resolved" && e.resolved);
    const matchesSearch =
      search === "" ||
      e.location.toLowerCase().includes(search.toLowerCase()) ||
      e.type.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase());
    return matchesSeverity && matchesStatus && matchesSearch;
  });

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>Events Log</h1>
          <p style={{ fontSize: 13, color: "#6b7280" }}>Complete history of all detected incidents</p>
        </div>
        <span className="badge badge-gray">{EVENTS.length} total events</span>
      </div>

      <div className="page-container">
        {/* Summary row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Events", value: EVENTS.length, color: "#111827" },
            { label: "Critical", value: EVENTS.filter((e) => e.severity === "Critical").length, color: "#dc2626" },
            { label: "Active", value: EVENTS.filter((e) => !e.resolved).length, color: "#d97706" },
            { label: "Resolved", value: EVENTS.filter((e) => e.resolved).length, color: "#16a34a" },
          ].map((s) => (
            <div key={s.label} className="card" style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>{s.label}</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>

        <div className="card">
          {/* Filters */}
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <input
              id="events-search"
              type="search"
              className="input"
              placeholder="Search by location, type, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 200 }}
            />
            <div className="tabs" style={{ padding: "3px" }}>
              {(["All", "Active", "Resolved"] as const).map((s) => (
                <button
                  key={s}
                  id={`status-filter-${s.toLowerCase()}`}
                  className={`tab ${statusFilter === s ? "active" : ""}`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="tabs" style={{ padding: "3px" }}>
              {(["All", "Critical", "High", "Medium", "Low"] as const).map((sv) => (
                <button
                  key={sv}
                  id={`severity-filter-${sv.toLowerCase()}`}
                  className={`tab ${filter === sv ? "active" : ""}`}
                  onClick={() => setFilter(sv)}
                >
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
                  <th>Location</th>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Action Taken</th>
                  <th>Units</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", color: "#9ca3af", padding: "32px 0" }}>
                      No events match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((evt) => (
                    <tr key={evt.id}>
                      <td style={{ fontFamily: "monospace", fontSize: 12, color: "#6b7280" }}>{evt.id}</td>
                      <td style={{ fontWeight: 500 }}>{evt.location}</td>
                      <td style={{ fontFamily: "monospace", fontSize: 13, color: "#6b7280" }}>{evt.time}</td>
                      <td style={{ color: "#374151" }}>{evt.type}</td>
                      <td>
                        <span className={`badge ${SEVERITY_BADGE[evt.severity] ?? "badge-gray"}`}>{evt.severity}</span>
                      </td>
                      <td style={{ fontSize: 13, color: "#374151" }}>{evt.action}</td>
                      <td style={{ textAlign: "center" }}>
                        <span className="badge badge-blue">{evt.units}</span>
                      </td>
                      <td>
                        <span className={`badge ${evt.resolved ? "badge-green" : "badge-red"}`}>
                          {evt.resolved ? "Resolved" : "Active"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#9ca3af" }}>
              Showing {filtered.length} of {EVENTS.length} events
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-secondary btn-sm">← Previous</button>
              <button className="btn btn-secondary btn-sm">Next →</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
