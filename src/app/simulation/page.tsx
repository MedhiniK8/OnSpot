"use client";

import { useState, useEffect, useRef } from "react";

/* ── Types ── */
type Light = "red" | "yellow" | "green";
type Phase = "idle" | "detecting" | "alerting" | "routing" | "responding" | "complete";

/* ── Intersection positions on our grid (col, row) in grid units ── */
const GRID_COLS = 9;
const GRID_ROWS = 7;

const ROADS = {
  horizontal: [2, 4, 6], // row indices of horizontal roads
  vertical: [2, 5],      // col indices of vertical roads
};

/* Intersections at crossing points */
const INTERSECTIONS = [
  { id: "int-1", col: 2, row: 2, label: "Junction A" },
  { id: "int-2", col: 5, row: 2, label: "Junction B" },
  { id: "int-3", col: 2, row: 4, label: "Junction C" },
  { id: "int-4", col: 5, row: 4, label: "Junction D" },
  { id: "int-5", col: 2, row: 6, label: "Junction E" },
  { id: "int-6", col: 5, row: 6, label: "Junction F" },
];

const ACCIDENT_CELL = { col: 3, row: 2 };  // on horizontal road between A and B
const HOSPITAL_CELL = { col: 7, row: 4 };  // off-grid landmark
const AMBULANCE_PATH = [
  { col: 5, row: 6 }, // Start: Junction F
  { col: 5, row: 4 }, // Junction D
  { col: 5, row: 2 }, // Junction B
  { col: 3, row: 2 }, // Accident site
];

const ROAD_LABELS: Record<string, string> = {
  "h-2": "MG Road",
  "h-4": "Brigade Road",
  "h-6": "Richmond Road",
  "v-2": "Infantry Rd",
  "v-5": "Lavelle Rd",
};

const PHASE_MESSAGES: Record<Phase, string> = {
  idle: "Simulation ready. Press Start to begin.",
  detecting: "AI analyzing camera feeds… Accident detected on MG Road.",
  alerting: "Alerting Police, Ambulance & Traffic Control…",
  routing: "Computing optimal ambulance route. Green corridor activated.",
  responding: "Ambulance en route. Traffic signals cleared.",
  complete: "Incident resolved. All units returned to base.",
};

const PHASE_AI_PANEL: Record<Phase, { location: string; severity: string; decision: string; action: string }> = {
  idle: { location: "—", severity: "—", decision: "—", action: "Awaiting detection" },
  detecting: { location: "MG Road (Seg 3)", severity: "High", decision: "Analyzing scene…", action: "Camera feeds processed" },
  alerting: { location: "MG Road & Infantry Rd", severity: "High", decision: "Dispatch police + ambulance", action: "Alert sent to 3 units" },
  routing: { location: "MG Road & Infantry Rd", severity: "High", decision: "Route: Lavelle Rd → Brigade Rd → MG Rd", action: "Green corridor: 3 signals cleared" },
  responding: { location: "MG Road & Infantry Rd", severity: "High", decision: "ETA 3.8 min", action: "Ambulance dispatched" },
  complete: { location: "MG Road & Infantry Rd", severity: "High", decision: "Incident resolved", action: "All units returned" },
};

const PHASE_ORDER: Phase[] = ["idle", "detecting", "alerting", "routing", "responding", "complete"];

export default function SimulationPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [running, setRunning] = useState(false);
  const [lights, setLights] = useState<Record<string, Light>>({
    "int-1": "red", "int-2": "red", "int-3": "red",
    "int-4": "red", "int-5": "red", "int-6": "red",
  });
  const [ambulancePos, setAmbulancePos] = useState<{ col: number; row: number } | null>(null);
  const [routeProgress, setRouteProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const CELL_SIZE = 80; // px

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  function startSimulation() {
    if (running) return;
    setRunning(true);
    setPhase("detecting");
    setAmbulancePos(null);
    setRouteProgress(0);
    setLights({ "int-1": "red", "int-2": "red", "int-3": "red", "int-4": "red", "int-5": "red", "int-6": "red" });
    runPhase("detecting");
  }

  function runPhase(p: Phase) {
    const durations: Record<Phase, number> = {
      idle: 0, detecting: 2200, alerting: 1800, routing: 2000, responding: 3500, complete: 0,
    };

    timerRef.current = setTimeout(() => {
      const idx = PHASE_ORDER.indexOf(p);
      const next = PHASE_ORDER[idx + 1] as Phase | undefined;

      if (p === "routing") {
        // Activate green corridor: clear signals on route
        setLights({ "int-1": "red", "int-2": "green", "int-3": "red", "int-4": "green", "int-5": "red", "int-6": "green" });
      }
      if (p === "alerting") {
        setAmbulancePos(AMBULANCE_PATH[0]);
      }
      if (p === "responding") {
        // Animate ambulance through path
        let step = 1;
        const moveAmbulance = () => {
          if (step < AMBULANCE_PATH.length) {
            setAmbulancePos(AMBULANCE_PATH[step]);
            setRouteProgress(step);
            step++;
            timerRef.current = setTimeout(moveAmbulance, 900);
          } else {
            setPhase("complete");
            setRunning(false);
            setLights({ "int-1": "green", "int-2": "green", "int-3": "green", "int-4": "green", "int-5": "green", "int-6": "green" });
          }
        };
        timerRef.current = setTimeout(moveAmbulance, 500);
        return;
      }

      if (next && next !== "complete") {
        setPhase(next);
        runPhase(next);
      } else if (next === "complete") {
        setPhase("complete");
        setRunning(false);
      }
    }, durations[p]);
  }

  function resetSimulation() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase("idle");
    setRunning(false);
    setAmbulancePos(null);
    setRouteProgress(0);
    setLights({ "int-1": "red", "int-2": "red", "int-3": "red", "int-4": "red", "int-5": "red", "int-6": "red" });
  }

  const mapW = GRID_COLS * CELL_SIZE;
  const mapH = GRID_ROWS * CELL_SIZE;

  const ai = PHASE_AI_PANEL[phase];

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>Simulation</h1>
          <p style={{ fontSize: 13, color: "#6b7280" }}>Interactive emergency response simulation</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            id="start-simulation-btn"
            className={`btn ${running ? "btn-secondary" : "btn-primary"}`}
            onClick={startSimulation}
            disabled={running}
          >
            {running ? "Running…" : phase === "complete" ? "Run Again" : "▶ Start Simulation"}
          </button>
          <button id="reset-simulation-btn" className="btn btn-secondary" onClick={resetSimulation}>
            Reset
          </button>
        </div>
      </div>

      <div className="page-container">
        {/* Status bar */}
        <div
          style={{
            marginBottom: 20,
            padding: "12px 16px",
            background: phase === "complete" ? "#f0fdf4" : phase === "idle" ? "#f8f9fa" : "#eff6ff",
            border: `1px solid ${phase === "complete" ? "#bbf7d0" : phase === "idle" ? "#e5e7eb" : "#bfdbfe"}`,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {phase !== "idle" && phase !== "complete" && (
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#2563eb",
                animation: "pulse-ring 1s ease-in-out infinite",
                flexShrink: 0,
              }}
            />
          )}
          {phase === "complete" && <span style={{ fontSize: 16 }}>✓</span>}
          <span style={{ fontSize: 14, fontWeight: 500, color: phase === "complete" ? "#166534" : phase === "idle" ? "#374151" : "#1d4ed8" }}>
            {PHASE_MESSAGES[phase]}
          </span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {PHASE_ORDER.filter((p) => p !== "idle").map((p) => {
              const reached = PHASE_ORDER.indexOf(phase) >= PHASE_ORDER.indexOf(p);
              return (
                <div
                  key={p}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: reached ? "#2563eb" : "#e5e7eb",
                    transition: "background 0.3s",
                  }}
                />
              );
            })}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>
          {/* ── MAP ── */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 15, fontWeight: 600 }}>City Grid Map</h2>
              <span style={{ fontSize: 12, color: "#9ca3af" }}>Bangalore Central District</span>
            </div>
            <div
              id="simulation-map"
              style={{
                width: mapW,
                maxWidth: "100%",
                height: mapH,
                position: "relative",
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              {/* Grid background */}
              <svg
                width={mapW}
                height={mapH}
                style={{ position: "absolute", inset: 0 }}
                aria-hidden
              >
                {/* Light grid */}
                {Array.from({ length: GRID_COLS + 1 }).map((_, i) => (
                  <line key={`vg-${i}`} x1={i * CELL_SIZE} y1={0} x2={i * CELL_SIZE} y2={mapH} stroke="#f0f0f0" strokeWidth="1" />
                ))}
                {Array.from({ length: GRID_ROWS + 1 }).map((_, i) => (
                  <line key={`hg-${i}`} x1={0} y1={i * CELL_SIZE} x2={mapW} y2={i * CELL_SIZE} stroke="#f0f0f0" strokeWidth="1" />
                ))}

                {/* Horizontal roads */}
                {ROADS.horizontal.map((row) => (
                  <rect
                    key={`hr-${row}`}
                    x={0}
                    y={row * CELL_SIZE - 14}
                    width={mapW}
                    height={28}
                    fill="#e5e7eb"
                  />
                ))}

                {/* Vertical roads */}
                {ROADS.vertical.map((col) => (
                  <rect
                    key={`vr-${col}`}
                    x={col * CELL_SIZE - 14}
                    y={0}
                    width={28}
                    height={mapH}
                    fill="#e5e7eb"
                  />
                ))}

                {/* Road center lines */}
                {ROADS.horizontal.map((row) => (
                  <line key={`hl-${row}`} x1={0} y1={row * CELL_SIZE} x2={mapW} y2={row * CELL_SIZE}
                    stroke="white" strokeWidth="2" strokeDasharray="14 10" />
                ))}
                {ROADS.vertical.map((col) => (
                  <line key={`vl-${col}`} x1={col * CELL_SIZE} y1={0} x2={col * CELL_SIZE} y2={mapH}
                    stroke="white" strokeWidth="2" strokeDasharray="14 10" />
                ))}

                {/* Ambulance route highlight */}
                {(phase === "routing" || phase === "responding" || phase === "complete") && (
                  <>
                    {AMBULANCE_PATH.slice(0, -1).map((pt, i) => {
                      const next = AMBULANCE_PATH[i + 1];
                      const highlight = phase === "responding" ? i < routeProgress : true;
                      return (
                        <line
                          key={`route-${i}`}
                          x1={pt.col * CELL_SIZE}
                          y1={pt.row * CELL_SIZE}
                          x2={next.col * CELL_SIZE}
                          y2={next.row * CELL_SIZE}
                          stroke={highlight ? "#16a34a" : "#86efac"}
                          strokeWidth="5"
                          strokeLinecap="round"
                          opacity="0.7"
                        />
                      );
                    })}
                  </>
                )}

                {/* Road labels */}
                {ROADS.horizontal.map((row) => {
                  const key = `h-${row}`;
                  return (
                    <text key={key} x={8} y={row * CELL_SIZE - 18} fontSize="10" fill="#9ca3af" fontFamily="Inter, sans-serif" fontWeight="500">
                      {ROAD_LABELS[key]}
                    </text>
                  );
                })}
                {ROADS.vertical.map((col) => {
                  const key = `v-${col}`;
                  return (
                    <text
                      key={key}
                      x={col * CELL_SIZE + 16}
                      y={16}
                      fontSize="10"
                      fill="#9ca3af"
                      fontFamily="Inter, sans-serif"
                      fontWeight="500"
                    >
                      {ROAD_LABELS[key]}
                    </text>
                  );
                })}

                {/* Intersections with traffic lights */}
                {INTERSECTIONS.map((int) => {
                  const light = lights[int.id];
                  const lightColor = light === "green" ? "#16a34a" : light === "yellow" ? "#d97706" : "#dc2626";
                  const cx = int.col * CELL_SIZE;
                  const cy = int.row * CELL_SIZE;
                  return (
                    <g key={int.id}>
                      {/* Junction block */}
                      <rect x={cx - 14} y={cy - 14} width={28} height={28} fill="#d1d5db" />
                      {/* Traffic light box */}
                      <rect x={cx + 16} y={cy - 22} width={16} height={40} rx="3" fill="#1f2937" />
                      {/* Red */}
                      <circle cx={cx + 24} cy={cy - 14} r="4.5"
                        fill={light === "red" ? "#ef4444" : "#374151"} />
                      {/* Yellow */}
                      <circle cx={cx + 24} cy={cy} r="4.5"
                        fill={light === "yellow" ? "#f59e0b" : "#374151"} />
                      {/* Green */}
                      <circle cx={cx + 24} cy={cy + 14} r="4.5"
                        fill={light === "green" ? "#22c55e" : "#374151"} />
                      {/* Active light halo */}
                      <circle cx={cx + 24} cy={light === "red" ? cy - 14 : light === "yellow" ? cy : cy + 14}
                        r="7" fill={lightColor} opacity="0.2" />
                    </g>
                  );
                })}

                {/* Accident marker */}
                {(phase !== "idle") && (
                  <g>
                    <circle
                      cx={ACCIDENT_CELL.col * CELL_SIZE}
                      cy={ACCIDENT_CELL.row * CELL_SIZE}
                      r="16"
                      fill="#fef2f2"
                      stroke="#dc2626"
                      strokeWidth="2"
                    />
                    <text x={ACCIDENT_CELL.col * CELL_SIZE} y={ACCIDENT_CELL.row * CELL_SIZE + 5}
                      textAnchor="middle" fontSize="14" fontFamily="Inter, sans-serif">🚨</text>
                    <text x={ACCIDENT_CELL.col * CELL_SIZE} y={ACCIDENT_CELL.row * CELL_SIZE - 24}
                      textAnchor="middle" fontSize="10" fill="#dc2626" fontFamily="Inter, sans-serif" fontWeight="600">
                      ACCIDENT
                    </text>
                  </g>
                )}

                {/* Hospital */}
                <g>
                  <rect x={HOSPITAL_CELL.col * CELL_SIZE - 18} y={HOSPITAL_CELL.row * CELL_SIZE - 18} width={36} height={36} rx="6" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5" />
                  <text x={HOSPITAL_CELL.col * CELL_SIZE} y={HOSPITAL_CELL.row * CELL_SIZE + 5}
                    textAnchor="middle" fontSize="16" fontFamily="Inter, sans-serif">🏥</text>
                  <text x={HOSPITAL_CELL.col * CELL_SIZE} y={HOSPITAL_CELL.row * CELL_SIZE + 28}
                    textAnchor="middle" fontSize="9" fill="#2563eb" fontFamily="Inter, sans-serif" fontWeight="600">
                    HOSPITAL
                  </text>
                </g>

                {/* Ambulance */}
                {ambulancePos && (
                  <g style={{ transition: "all 0.8s ease" }}>
                    <circle
                      cx={ambulancePos.col * CELL_SIZE}
                      cy={ambulancePos.row * CELL_SIZE}
                      r="15"
                      fill="#f0fdf4"
                      stroke="#16a34a"
                      strokeWidth="2"
                    />
                    <text x={ambulancePos.col * CELL_SIZE} y={ambulancePos.row * CELL_SIZE + 5}
                      textAnchor="middle" fontSize="14" fontFamily="Inter, sans-serif">🚑</text>
                  </g>
                )}
              </svg>
            </div>

            {/* Legend */}
            <div
              style={{
                marginTop: 14,
                padding: "12px 16px",
                background: "#f8f9fa",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                display: "flex",
                gap: 20,
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Legend:</span>
              {[
                { icon: "🚨", label: "Accident" },
                { icon: "🏥", label: "Hospital" },
                { icon: "🚑", label: "Ambulance" },
                { icon: "🟥", label: "Red Light" },
                { icon: "🟩", label: "Green Corridor" },
              ].map((l) => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 13 }}>{l.icon}</span>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>{l.label}</span>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 20, height: 4, background: "#16a34a", borderRadius: 2 }} />
                <span style={{ fontSize: 12, color: "#6b7280" }}>Clear Route</span>
              </div>
            </div>
          </div>

          {/* ── Right Panel ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* AI Response Panel */}
            <div className="card">
              <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
                <h2 style={{ fontSize: 14, fontWeight: 600 }}>AI Response Panel</h2>
              </div>
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Location", value: ai.location },
                  { label: "Severity", value: ai.severity },
                  { label: "Decision", value: ai.decision },
                  { label: "Action Taken", value: ai.action },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: value === "—" ? "#d1d5db" : "#111827" }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Traffic Light Status */}
            <div className="card">
              <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
                <h2 style={{ fontSize: 14, fontWeight: 600 }}>Traffic Signals</h2>
              </div>
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {INTERSECTIONS.map((int) => {
                  const light = lights[int.id];
                  return (
                    <div key={int.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "#374151" }}>{int.label}</span>
                      <div style={{ display: "flex", gap: 4 }}>
                        {(["red", "yellow", "green"] as Light[]).map((l) => (
                          <div
                            key={l}
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              background: light === l
                                ? (l === "red" ? "#ef4444" : l === "yellow" ? "#f59e0b" : "#22c55e")
                                : "#e5e7eb",
                              transition: "background 0.3s",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Phase tracker */}
            <div className="card" style={{ padding: 16 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Response Phases</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(["detecting", "alerting", "routing", "responding", "complete"] as Phase[]).map((p) => {
                  const reached = PHASE_ORDER.indexOf(phase) >= PHASE_ORDER.indexOf(p);
                  const active = phase === p;
                  return (
                    <div key={p} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: reached ? "#2563eb" : "#f0f0f0",
                          border: `2px solid ${active ? "#2563eb" : reached ? "#2563eb" : "#e5e7eb"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          transition: "all 0.3s",
                        }}
                      >
                        {reached && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? "#2563eb" : reached ? "#374151" : "#9ca3af", textTransform: "capitalize" }}>
                        {p}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
