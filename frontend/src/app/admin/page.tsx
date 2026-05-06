"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getUser } from "@/lib/auth";

type EventRow = {
  id: string;
  location: string;
  time: string;
  severity: string;
  type: string;
  status: "pending" | "approved" | "rejected";
  submittedBy?: string;
};

type LogEntry = {
  time: string;
  action: string;
  user: string;
  level: "info" | "success" | "warning" | "error";
};

const LOG_COLORS: Record<string, string> = {
  info: "#2563eb", success: "#16a34a", warning: "#d97706", error: "#dc2626",
};

const SEVERITY_BADGE: Record<string, string> = {
  Critical: "badge-red", High: "badge-red", Medium: "badge-yellow", Low: "badge-gray",
};

const AUTOMATION_RULES = [
  { id: "rule-1", name: "Auto-dispatch ambulance on Critical severity", enabled: true },
  { id: "rule-2", name: "Activate green corridor on High+ severity", enabled: true },
  { id: "rule-3", name: "Notify traffic control on all incidents", enabled: true },
  { id: "rule-4", name: "Alert fire dept on fire-type incidents", enabled: true },
  { id: "rule-5", name: "Send SMS to registered authorities", enabled: false },
  { id: "rule-6", name: "Auto-escalate if unacknowledged > 2 min", enabled: false },
];

export default function AdminPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  // Route guard — admin only
  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== "admin") {
      router.replace("/");
    } else {
      setReady(true);
    }
  }, [router]);

  // Events & logs come from backend — start empty, ready for API
  const [events, setEvents] = useState<EventRow[]>([]);
  const [logs] = useState<LogEntry[]>([]);
  const [rules, setRules] = useState(AUTOMATION_RULES);

  function updateEvent(id: string, status: "approved" | "rejected") {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
    // TODO: PATCH /api/admin/events/:id { status }
  }

  function toggleRule(id: string) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
    // TODO: PATCH /api/admin/rules/:id { enabled }
  }

  if (!ready) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <span style={{ fontSize: 14, color: "#6b7280" }}>Verifying access...</span>
      </div>
    );
  }

  const pendingCount = events.filter((e) => e.status === "pending").length;

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>Admin Panel</h1>
          <p style={{ fontSize: 13, color: "#6b7280" }}>Manage events, automation rules, and system logs</p>
        </div>
        {pendingCount > 0 && (
          <span className="badge badge-red">{pendingCount} pending</span>
        )}
      </div>

      <div className="page-container" style={{ flex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Event Approval Queue */}
            <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
                <h2 style={{ fontSize: 15, fontWeight: 600 }}>Event Approval Queue</h2>
                <p style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
                  Review and approve or reject flagged incidents
                </p>
              </div>
              {events.length === 0 ? (
                <div style={{ padding: "48px 20px", textAlign: "center" }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 10px" }}>
                    <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                  </svg>
                  <p style={{ fontSize: 14, color: "#9ca3af" }}>No events pending review</p>
                  <p style={{ fontSize: 13, color: "#d1d5db", marginTop: 4 }}>Events submitted by users will appear here</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ID</th><th>Location</th><th>Time</th><th>Type</th>
                        <th>Severity</th><th>Submitted By</th><th>Status</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((evt) => (
                        <tr key={evt.id}>
                          <td style={{ fontFamily: "monospace", fontSize: 12, color: "#6b7280" }}>{evt.id}</td>
                          <td style={{ fontWeight: 500 }}>{evt.location}</td>
                          <td style={{ fontFamily: "monospace", fontSize: 13, color: "#6b7280" }}>{evt.time}</td>
                          <td style={{ color: "#374151" }}>{evt.type}</td>
                          <td><span className={`badge ${SEVERITY_BADGE[evt.severity] ?? "badge-gray"}`}>{evt.severity}</span></td>
                          <td style={{ fontSize: 12, color: "#6b7280" }}>{evt.submittedBy || "—"}</td>
                          <td>
                            <span className={`badge ${evt.status === "approved" ? "badge-green" : evt.status === "rejected" ? "badge-gray" : "badge-yellow"}`}>
                              {evt.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button id={`approve-${evt.id}`} className="btn btn-sm" disabled={evt.status !== "pending"}
                                onClick={() => updateEvent(evt.id, "approved")}
                                style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", fontSize: 12 }}>
                                Approve
                              </button>
                              <button id={`reject-${evt.id}`} className="btn btn-sm btn-secondary" disabled={evt.status !== "pending"}
                                onClick={() => updateEvent(evt.id, "rejected")}
                                style={{ fontSize: 12 }}>
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            {/* System Audit Log */}
            <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ fontSize: 15, fontWeight: 600 }}>System Audit Log</h2>
                  <p style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>All admin actions and system events</p>
                </div>
                <button className="btn btn-secondary btn-sm" disabled={logs.length === 0}>Export CSV</button>
              </div>
              {logs.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center" }}>
                  <p style={{ fontSize: 13, color: "#9ca3af" }}>No log entries yet. Actions will be recorded here.</p>
                </div>
              ) : (
                <div style={{ fontFamily: "monospace", fontSize: 12 }}>
                  {logs.map((log, i) => (
                    <div key={i} style={{ display: "flex", gap: 16, padding: "10px 20px", borderBottom: "1px solid var(--border-subtle)", alignItems: "flex-start" }}>
                      <span style={{ color: "#9ca3af", flexShrink: 0 }}>{log.time}</span>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: LOG_COLORS[log.level], marginTop: 4, flexShrink: 0 }} />
                      <span style={{ flex: 1, color: "#374151", fontFamily: "inherit" }}>{log.action}</span>
                      <span style={{ color: "#9ca3af", flexShrink: 0, fontSize: 11 }}>{log.user}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Automation Rules */}
            <motion.div className="card" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
              <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
                <h2 style={{ fontSize: 14, fontWeight: 600 }}>Automation Rules</h2>
                <p style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>Enable or disable response rules</p>
              </div>
              <div style={{ padding: "8px 0" }}>
                {rules.map((rule) => (
                  <div key={rule.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "11px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{rule.name}</div>
                      <div style={{ fontSize: 12, color: rule.enabled ? "#16a34a" : "#9ca3af", marginTop: 2 }}>
                        {rule.enabled ? "Active" : "Disabled"}
                      </div>
                    </div>
                    <label id={`rule-toggle-${rule.id}`} className="toggle" style={{ flexShrink: 0 }}>
                      <input type="checkbox" checked={rule.enabled} onChange={() => toggleRule(rule.id)} />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Admin overview */}
            <motion.div className="card" style={{ padding: 16 }} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Admin Overview</h2>
              {[
                { label: "Events in Queue", value: `${events.length}` },
                { label: "Rules Active", value: `${rules.filter((r) => r.enabled).length} / ${rules.length}` },
                { label: "Log Entries", value: `${logs.length}` },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{value}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
