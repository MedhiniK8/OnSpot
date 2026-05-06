"use client";

import { useState } from "react";

type EventRow = {
  id: string;
  location: string;
  time: string;
  severity: string;
  type: string;
  status: "pending" | "approved" | "rejected";
};

const PENDING_EVENTS: EventRow[] = [
  { id: "EVT-0041", location: "MG Road & Brigade Rd", time: "14:23", severity: "High", type: "Vehicle Accident", status: "pending" },
  { id: "EVT-0040", location: "Silk Board Junction", time: "13:58", severity: "Critical", type: "Multi-Vehicle Collision", status: "pending" },
  { id: "EVT-0039", location: "Hebbal Flyover", time: "13:41", severity: "Medium", type: "Vehicle Breakdown", status: "pending" },
];

const RULES_INITIAL = [
  { id: "rule-1", name: "Auto-dispatch ambulance on Critical", enabled: true },
  { id: "rule-2", name: "Activate green corridor on High+ severity", enabled: true },
  { id: "rule-3", name: "Notify traffic control on all incidents", enabled: true },
  { id: "rule-4", name: "Alert fire dept on fire-type incidents", enabled: true },
  { id: "rule-5", name: "Send SMS to registered authorities", enabled: false },
  { id: "rule-6", name: "Auto-escalate if unacknowledged > 2 min", enabled: false },
  { id: "rule-7", name: "Log all actions to audit trail", enabled: true },
];

const LOGS = [
  { time: "14:28:03", action: "Admin approved EVT-0041", user: "john.doe@onspot.city", level: "info" },
  { time: "14:23:17", action: "Alert sent to Police Control Room", user: "system", level: "success" },
  { time: "14:23:15", action: "Alert sent to Ambulance Dispatch", user: "system", level: "success" },
  { time: "14:23:10", action: "AI detected accident on MG Road", user: "ai-engine", level: "warning" },
  { time: "13:58:44", action: "Admin approved EVT-0040", user: "admin@onspot.city", level: "info" },
  { time: "13:41:20", action: "Green corridor activated: Silk Board to St. John's Hospital", user: "system", level: "success" },
  { time: "13:20:05", action: "Rule triggered: Auto-dispatch ambulance (Critical)", user: "system", level: "info" },
  { time: "12:54:30", action: "Admin rejected EVT-0038 (duplicate)", user: "john.doe@onspot.city", level: "error" },
];

const SEVERITY_BADGE: Record<string, string> = {
  Critical: "badge-red", High: "badge-red", Medium: "badge-yellow", Low: "badge-gray",
};

const LOG_COLORS: Record<string, string> = {
  info: "#2563eb", success: "#16a34a", warning: "#d97706", error: "#dc2626",
};

export default function AdminPage() {
  const [events, setEvents] = useState<EventRow[]>(PENDING_EVENTS);
  const [rules, setRules] = useState(RULES_INITIAL);

  function updateEvent(id: string, status: "approved" | "rejected") {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
  }

  function toggleRule(id: string) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  }

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>Admin Panel</h1>
          <p style={{ fontSize: 13, color: "#6b7280" }}>Manage events, rules, and system logs</p>
        </div>
        <span className="badge badge-red">{events.filter((e) => e.status === "pending").length} pending</span>
      </div>

      <div className="page-container">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
          {/* ── Left ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Event Approval */}
            <div className="card">
              <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
                <h2 style={{ fontSize: 15, fontWeight: 600 }}>Event Approval Queue</h2>
                <p style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>Review and approve or reject flagged incidents</p>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Location</th>
                      <th>Time</th>
                      <th>Type</th>
                      <th>Severity</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((evt) => (
                      <tr key={evt.id}>
                        <td style={{ fontFamily: "monospace", fontSize: 12, color: "#6b7280" }}>{evt.id}</td>
                        <td style={{ fontWeight: 500 }}>{evt.location}</td>
                        <td style={{ fontFamily: "monospace", fontSize: 13, color: "#6b7280" }}>{evt.time}</td>
                        <td style={{ color: "#374151" }}>{evt.type}</td>
                        <td>
                          <span className={`badge ${SEVERITY_BADGE[evt.severity] ?? "badge-gray"}`}>{evt.severity}</span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              evt.status === "approved" ? "badge-green" : evt.status === "rejected" ? "badge-gray" : "badge-yellow"
                            }`}
                          >
                            {evt.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              id={`approve-${evt.id}`}
                              className="btn btn-sm"
                              disabled={evt.status !== "pending"}
                              onClick={() => updateEvent(evt.id, "approved")}
                              style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", fontSize: 12 }}
                            >
                              Approve
                            </button>
                            <button
                              id={`reject-${evt.id}`}
                              className="btn btn-sm btn-secondary"
                              disabled={evt.status !== "pending"}
                              onClick={() => updateEvent(evt.id, "rejected")}
                              style={{ fontSize: 12 }}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* System Logs */}
            <div className="card">
              <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ fontSize: 15, fontWeight: 600 }}>System Audit Log</h2>
                  <p style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>All actions and system events</p>
                </div>
                <button className="btn btn-secondary btn-sm">Export CSV</button>
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 12 }}>
                {LOGS.map((log, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 16,
                      padding: "10px 20px",
                      borderBottom: "1px solid var(--border-subtle)",
                      alignItems: "flex-start",
                    }}
                  >
                    <span style={{ color: "#9ca3af", flexShrink: 0 }}>{log.time}</span>
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: LOG_COLORS[log.level],
                        marginTop: 4,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ flex: 1, color: "#374151", fontFamily: "inherit" }}>{log.action}</span>
                    <span style={{ color: "#9ca3af", flexShrink: 0, fontSize: 11 }}>{log.user}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: Rules ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Rules toggle */}
            <div className="card">
              <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
                <h2 style={{ fontSize: 14, fontWeight: 600 }}>Automation Rules</h2>
                <p style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>Enable or disable response rules</p>
              </div>
              <div style={{ padding: "8px 0" }}>
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "11px 16px",
                      borderBottom: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{rule.name}</div>
                      <div style={{ fontSize: 12, color: rule.enabled ? "#16a34a" : "#9ca3af", marginTop: 2 }}>
                        {rule.enabled ? "Active" : "Disabled"}
                      </div>
                    </div>
                    <label id={`rule-toggle-${rule.id}`} className="toggle" style={{ flexShrink: 0 }}>
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={() => toggleRule(rule.id)}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick admin stats */}
            <div className="card" style={{ padding: 16 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Admin Overview</h2>
              {[
                { label: "Events Today", value: "10" },
                { label: "Rules Active", value: `${rules.filter((r) => r.enabled).length}/${rules.length}` },
                { label: "Log Entries", value: `${LOGS.length}` },
                { label: "System Uptime", value: "99.98%" },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
