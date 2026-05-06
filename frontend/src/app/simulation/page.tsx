"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

/* ── Route waypoints ── */
const WAYPOINTS = [
  { x: 90,  y: 230, label: "Accident Site",         type: "accident"  as const },
  { x: 230, y: 215, label: "Signal A — Park St",     type: "signal"    as const, signalId: "A" },
  { x: 390, y: 185, label: "Signal B — Ring Road",   type: "signal"    as const, signalId: "B" },
  { x: 555, y: 210, label: "Signal C — MG Road",     type: "signal"    as const, signalId: "C" },
  { x: 700, y: 252, label: "City Hospital",           type: "hospital"  as const },
];

type LightState = "red" | "green";
type Journey    = "idle" | "forward" | "waiting" | "arrived" | "return" | "complete";

const ROAD_PATH =
  `M ${WAYPOINTS[0].x},${WAYPOINTS[0].y} ` +
  `C 155,225 190,218 ${WAYPOINTS[1].x},${WAYPOINTS[1].y} ` +
  `C 295,212 340,188 ${WAYPOINTS[2].x},${WAYPOINTS[2].y} ` +
  `C 460,183 505,208 ${WAYPOINTS[3].x},${WAYPOINTS[3].y} ` +
  `C 615,212 660,248 ${WAYPOINTS[4].x},${WAYPOINTS[4].y}`;

/* How long the ambulance takes to travel one segment (ms) */
const TRAVEL_MS  = 3000;
/* How long signal stays green before turning red again (ms) — must be > TRAVEL_MS */
const GREEN_HOLD = 3500;
/* Delay after arriving / before return starts (ms) */
const PAUSE_MS   = 2500;

function TrafficLight({ x, y, state }: { x: number; y: number; state: LightState }) {
  return (
    <g>
      <line x1={x + 14} y1={y - 8} x2={x + 14} y2={y + 30} stroke="#374151" strokeWidth="2" />
      <rect x={x + 6} y={y - 36} width={16} height={42} rx="3" fill="#1f2937" />
      <circle cx={x + 14} cy={y - 26} r="5" fill={state === "red"   ? "#ef4444" : "#374151"} />
      <circle cx={x + 14} cy={y - 14} r="5" fill="#374151" />
      <circle cx={x + 14} cy={y - 2}  r="5" fill={state === "green" ? "#22c55e" : "#374151"} />
    </g>
  );
}

export default function SimulationPage() {
  const [journey,      setJourney]      = useState<Journey>("idle");
  const [ambulanceIdx, setAmbulanceIdx] = useState(0);
  const [lights,       setLights]       = useState<Record<string, LightState>>({ A: "red", B: "red", C: "red" });
  const [infoLog,      setInfoLog]      = useState<string[]>([]);

  /* We use a ref so interval/timeout callbacks always read the latest state */
  const lightRef  = useRef<Record<string, LightState>>({ A: "red", B: "red", C: "red" });
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const running   = useRef(false);

  const amb = WAYPOINTS[ambulanceIdx];

  function setLightsSynced(next: Record<string, LightState>) {
    lightRef.current = next;
    setLights({ ...next });
  }

  function addLog(msg: string) {
    const entry = `[${new Date().toLocaleTimeString()}] ${msg}`;
    setInfoLog((prev) => [entry, ...prev].slice(0, 24));
  }

  function clearTimer() {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }

  /* ── Core movement engine ── */
  const moveStep = useCallback((
    currentIdx: number,
    direction: "forward" | "return"
  ) => {
    if (!running.current) return;

    const nextIdx = direction === "forward" ? currentIdx + 1 : currentIdx - 1;
    const atEnd   = direction === "forward"
      ? nextIdx >= WAYPOINTS.length
      : nextIdx < 0;

    if (atEnd) {
      if (direction === "forward") {
        setJourney("arrived");
        addLog("Ambulance arrived at City Hospital — patient delivered");
        timerRef.current = setTimeout(() => {
          if (!running.current) return;
          addLog("Starting return journey to base...");
          setJourney("return");
          moveStep(WAYPOINTS.length - 1, "return");
        }, PAUSE_MS);
      } else {
        setJourney("complete");
        running.current = false;
        addLog("Return journey complete — ambulance back at base");
      }
      return;
    }

    const nextWP = WAYPOINTS[nextIdx];

    /* If next waypoint is a signal, turn it GREEN and wait before moving */
    if (nextWP.type === "signal" && nextWP.signalId) {
      const sid = nextWP.signalId;
      const currentLight = lightRef.current[sid];

      if (currentLight === "red") {
        setJourney("waiting");
        addLog(`Ambulance waiting — Signal ${sid} is RED`);

        /* Turn signal GREEN after a brief pause (1s) to make it visible */
        timerRef.current = setTimeout(() => {
          if (!running.current) return;
          setLightsSynced({ ...lightRef.current, [sid]: "green" });
          addLog(`Signal ${sid} → GREEN — ambulance proceeding`);
          setJourney(direction === "forward" ? "forward" : "return");

          /* Now move to that waypoint */
          timerRef.current = setTimeout(() => {
            if (!running.current) return;
            setAmbulanceIdx(nextIdx);
            addLog(`Ambulance at: ${nextWP.label}`);

            /* Turn signal RED after ambulance passes */
            timerRef.current = setTimeout(() => {
              if (!running.current) return;
              setLightsSynced({ ...lightRef.current, [sid]: "red" });
              addLog(`Signal ${sid} → RED (ambulance passed)`);
              moveStep(nextIdx, direction);
            }, GREEN_HOLD);
          }, TRAVEL_MS);
        }, 1000);
        return;
      }
      /* Signal already green — move immediately */
    }

    /* No signal — just travel */
    timerRef.current = setTimeout(() => {
      if (!running.current) return;
      setAmbulanceIdx(nextIdx);
      addLog(`Ambulance at: ${nextWP.label}`);
      moveStep(nextIdx, direction);
    }, TRAVEL_MS);
  }, []);

  function startSimulation() {
    if (running.current) return;
    clearTimer();
    running.current = true;
    const initLights = { A: "red", B: "red", C: "red" } as Record<string, LightState>;
    setLightsSynced(initLights);
    setAmbulanceIdx(0);
    setInfoLog([]);
    setJourney("forward");
    addLog("Simulation started — ambulance dispatched from accident site");
    moveStep(0, "forward");
  }

  function resetSimulation() {
    clearTimer();
    running.current = false;
    setJourney("idle");
    setAmbulanceIdx(0);
    const reset = { A: "red", B: "red", C: "red" } as Record<string, LightState>;
    setLightsSynced(reset);
    setInfoLog([]);
  }

  useEffect(() => () => { clearTimer(); running.current = false; }, []);

  /* Progress */
  const totalSteps = (WAYPOINTS.length - 1) * 2;
  const progress = (() => {
    if (journey === "idle") return 0;
    if (journey === "forward" || journey === "waiting" || journey === "arrived") {
      return Math.round((ambulanceIdx / totalSteps) * 100);
    }
    if (journey === "return" || journey === "complete") {
      const returnSteps = (WAYPOINTS.length - 1) + (WAYPOINTS.length - 1 - ambulanceIdx);
      return Math.min(100, Math.round((returnSteps / totalSteps) * 100));
    }
    return 100;
  })();

  /* Status bar */
  const isActive = journey !== "idle" && journey !== "complete";
  const statusMsg =
    journey === "idle"    ? "Simulation ready. Press Start to begin." :
    journey === "waiting" ? `Ambulance STOPPED — waiting for signal to turn GREEN` :
    journey === "forward" ? `Ambulance en route — currently at ${amb.label}` :
    journey === "arrived" ? "Ambulance arrived at hospital. Preparing return journey..." :
    journey === "return"  ? `Returning to base — currently at ${amb.label}` :
                            "Simulation complete. Ambulance back at base.";

  const statusBg     = journey === "complete" ? "#f0fdf4" : journey === "waiting" ? "#fffbeb" : journey === "idle" ? "#f8f9fa" : "#eff6ff";
  const statusBorder = journey === "complete" ? "#bbf7d0" : journey === "waiting" ? "#fde68a" : journey === "idle" ? "#e5e7eb"  : "#bfdbfe";
  const statusColor  = journey === "complete" ? "#166534" : journey === "waiting" ? "#92400e" : journey === "idle" ? "#374151"  : "#1d4ed8";

  return (
    <>
      <div className="topbar">
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>Simulation</h1>
          <p style={{ fontSize: 13, color: "#6b7280" }}>Ambulance routing — traffic light synchronized movement</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <motion.button id="start-simulation-btn"
            className={`btn ${isActive ? "btn-secondary" : "btn-primary"}`}
            onClick={startSimulation} disabled={isActive}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            {isActive ? "Running..." : journey === "complete" ? "Run Again" : "Start Simulation"}
          </motion.button>
          <button id="reset-simulation-btn" className="btn btn-secondary" onClick={resetSimulation}>Reset</button>
        </div>
      </div>

      <div className="page-container" style={{ flex: 1 }}>
        {/* Status bar */}
        <div style={{
          marginBottom: 20, padding: "12px 16px",
          background: statusBg, border: `1px solid ${statusBorder}`,
          borderRadius: 10, display: "flex", alignItems: "center", gap: 12,
        }}>
          {isActive && journey !== "arrived" && (
            <div style={{ width: 10, height: 10, borderRadius: "50%",
              background: journey === "waiting" ? "#d97706" : "#2563eb",
              animation: "pulse-ring 1.2s ease-in-out infinite", flexShrink: 0 }} />
          )}
          {journey === "complete" && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          <span style={{ fontSize: 14, fontWeight: 500, color: statusColor }}>{statusMsg}</span>
          {journey !== "idle" && (
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 120, height: 5, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${progress}%`, height: "100%",
                  background: journey === "complete" ? "#16a34a" : journey === "waiting" ? "#d97706" : "#2563eb",
                  borderRadius: 3, transition: "width 0.5s ease" }} />
              </div>
              <span style={{ fontSize: 12, color: statusColor, fontWeight: 500 }}>{progress}%</span>
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>
          {/* Map */}
          <motion.div className="card" style={{ padding: 20 }}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div style={{ marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 15, fontWeight: 600 }}>City Road Map</h2>
              <span style={{ fontSize: 12, color: "#9ca3af" }}>Bangalore Central District</span>
            </div>

            <div id="simulation-map" style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb", background: "#f1f5f9" }}>
              <svg viewBox="0 0 800 380" width="100%" style={{ display: "block" }}>
                {/* City blocks */}
                {[[20,20,80,60],[140,20,60,55],[270,20,90,50],[430,20,80,55],[590,20,100,60],
                  [20,270,80,80],[160,265,90,85],[310,270,100,80],[480,275,90,75],[630,295,80,60]
                ].map(([x,y,w,h], i) => (
                  <rect key={i} x={x} y={y} width={w} height={h} rx="4" fill="#e2e8f0" opacity="0.6" />
                ))}

                {/* Side roads */}
                {[
                  ["M 230,215 Q 235,270 245,330", "#cbd5e1", 22],
                  ["M 230,215 Q 235,270 245,330", "#e2e8f0", 18],
                  ["M 390,185 Q 400,140 415,90",  "#cbd5e1", 22],
                  ["M 390,185 Q 400,140 415,90",  "#e2e8f0", 18],
                  ["M 555,210 Q 580,165 620,135", "#cbd5e1", 22],
                  ["M 555,210 Q 580,165 620,135", "#e2e8f0", 18],
                ].map(([d, color, w], i) => (
                  <path key={i} d={d as string} stroke={color as string} strokeWidth={w as number} strokeLinecap="round" fill="none" />
                ))}

                {/* Main road */}
                <path d={ROAD_PATH} stroke="#9ca3af" strokeWidth="34" strokeLinecap="round" fill="none" />
                <path d={ROAD_PATH} stroke="#d1d5db" strokeWidth="30" strokeLinecap="round" fill="none" />
                <path d={ROAD_PATH} stroke="white"   strokeWidth="2"  strokeLinecap="round" strokeDasharray="18 14" fill="none" opacity="0.7" />

                {/* Route highlight when running */}
                {journey !== "idle" && (
                  <path d={ROAD_PATH} stroke="#2563eb" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.2" />
                )}

                {/* Traffic lights */}
                {WAYPOINTS.filter(w => w.type === "signal").map((wp) => (
                  <TrafficLight key={wp.signalId} x={wp.x} y={wp.y - 20} state={lights[wp.signalId!]} />
                ))}

                {/* Signal ID labels */}
                {WAYPOINTS.filter(w => w.type === "signal").map((wp) => (
                  <text key={`lbl-${wp.signalId}`} x={wp.x + 36} y={wp.y - 8}
                    fontSize="9" fontFamily="Inter,sans-serif" fill="#6b7280" fontWeight="600">
                    {wp.signalId}
                  </text>
                ))}

                {/* Accident marker */}
                <circle cx={WAYPOINTS[0].x} cy={WAYPOINTS[0].y} r="18" fill="#fef2f2" stroke="#dc2626" strokeWidth="1.5" />
                <text x={WAYPOINTS[0].x} y={WAYPOINTS[0].y + 4} textAnchor="middle" fontSize="12" fontFamily="Inter,sans-serif" fill="#dc2626" fontWeight="700">ACC</text>
                <text x={WAYPOINTS[0].x} y={WAYPOINTS[0].y - 26} textAnchor="middle" fontSize="9" fontFamily="Inter,sans-serif" fill="#dc2626" fontWeight="600">ACCIDENT</text>

                {/* Hospital marker */}
                <rect x={WAYPOINTS[4].x - 20} y={WAYPOINTS[4].y - 20} width="40" height="40" rx="6" fill="#eff6ff" stroke="#93c5fd" strokeWidth="1.5" />
                <text x={WAYPOINTS[4].x} y={WAYPOINTS[4].y + 5} textAnchor="middle" fontSize="11" fontFamily="Inter,sans-serif" fill="#2563eb" fontWeight="700">H+</text>
                <text x={WAYPOINTS[4].x} y={WAYPOINTS[4].y + 30} textAnchor="middle" fontSize="9" fontFamily="Inter,sans-serif" fill="#2563eb" fontWeight="600">HOSPITAL</text>

                {/* Ambulance — CSS transition moves it smoothly */}
                <g style={{
                  transform: `translate(${amb.x}px, ${amb.y}px)`,
                  transition: journey === "waiting" ? "none" : `transform ${TRAVEL_MS * 0.85}ms ease-in-out`,
                }}>
                  <rect x="-16" y="-10" width="32" height="20" rx="4" fill="#16a34a" />
                  <rect x="-14" y="-8"  width="28" height="16" rx="3" fill="#dcfce7" />
                  <text x="0" y="4" textAnchor="middle" fontSize="9" fontFamily="Inter,sans-serif" fill="#166534" fontWeight="700">AMB</text>
                  <line x1="-4" y1="0" x2="4" y2="0" stroke="#dc2626" strokeWidth="1.5" />
                  <line x1="0" y1="-4" x2="0" y2="4" stroke="#dc2626" strokeWidth="1.5" />
                </g>
              </svg>
            </div>

            {/* Legend */}
            <div style={{ marginTop: 14, padding: "10px 14px", background: "#f8f9fa", border: "1px solid #e5e7eb", borderRadius: 8, display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Legend</span>
              {[
                { color: "#dc2626", label: "Accident Site" },
                { color: "#2563eb", label: "Hospital" },
                { color: "#16a34a", label: "Ambulance" },
                { color: "#ef4444", label: "Red — Ambulance Stops" },
                { color: "#22c55e", label: "Green — Ambulance Moves" },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
                  <span style={{ fontSize: 12, color: "#6b7280" }}>{label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Real-time status */}
            <motion.div className="card"
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
              <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--border)" }}>
                <h2 style={{ fontSize: 14, fontWeight: 600 }}>Real-Time Status</h2>
              </div>
              <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Current Location", value: amb.label },
                  { label: "Signal A",          value: lights.A.toUpperCase() },
                  { label: "Signal B",          value: lights.B.toUpperCase() },
                  { label: "Signal C",          value: lights.C.toUpperCase() },
                  { label: "Action",            value: journey === "idle"    ? "Standby"
                                                      : journey === "waiting" ? "Stopped at RED signal"
                                                      : journey === "forward" ? "En route to hospital"
                                                      : journey === "arrived" ? "Patient delivered"
                                                      : journey === "return"  ? "Returning to base"
                                                      : "Mission complete" },
                  { label: "Route Progress",   value: `${progress}%` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, borderBottom: "1px solid var(--border-subtle)" }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: "#6b7280" }}>{label}</span>
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      color: value === "GREEN" ? "#16a34a"
                           : value === "RED"   ? "#dc2626"
                           : value === "Stopped at RED signal" ? "#d97706"
                           : "#111827",
                    }}>{value}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Traffic Signals */}
            <motion.div className="card"
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
              <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--border)" }}>
                <h2 style={{ fontSize: 14, fontWeight: 600 }}>Traffic Signals</h2>
                <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Ambulance stops at RED, proceeds on GREEN</p>
              </div>
              <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                {(["A", "B", "C"] as const).map((id) => (
                  <div key={id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "#374151" }}>
                      Signal {id} — {WAYPOINTS.find(w => w.signalId === id)?.label.split(" — ")[1]}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: lights[id] === "green" ? "#16a34a" : "#dc2626" }}>
                        {lights[id].toUpperCase()}
                      </span>
                      <div style={{ width: 12, height: 12, borderRadius: "50%",
                        background: lights[id] === "green" ? "#22c55e" : "#ef4444",
                        transition: "background 0.4s ease" }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Journey phases */}
            <motion.div className="card"
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
              <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--border)" }}>
                <h2 style={{ fontSize: 14, fontWeight: 600 }}>Journey Phases</h2>
              </div>
              <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { key: "forward",  label: "Forward — Accident to Hospital", done: ["forward","waiting","arrived","return","complete"].includes(journey) },
                  { key: "arrived",  label: "Patient Delivered at Hospital",   done: ["arrived","return","complete"].includes(journey) },
                  { key: "return",   label: "Return — Hospital to Base",       done: ["return","complete"].includes(journey) },
                  { key: "complete", label: "Mission Complete",                done: journey === "complete" },
                ].map((phase) => (
                  <div key={phase.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%",
                      background: phase.done ? "#2563eb" : "#f0f0f0",
                      border: `2px solid ${phase.done ? "#2563eb" : "#e5e7eb"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, transition: "all 0.3s",
                    }}>
                      {phase.done && (
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: phase.done ? "#374151" : "#9ca3af", fontWeight: phase.done ? 500 : 400 }}>
                      {phase.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Live log */}
        <motion.div className="card" style={{ marginTop: 20 }}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
          <div style={{ padding: "13px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 600 }}>Live Activity Log</h2>
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Real-time updates — signal changes, stops, movement</p>
            </div>
            {infoLog.length > 0 && (
              <button className="btn btn-secondary btn-sm" onClick={() => setInfoLog([])}>Clear</button>
            )}
          </div>
          <div style={{ padding: 16, fontFamily: "monospace", fontSize: 12, maxHeight: 200, overflowY: "auto" }}>
            {infoLog.length === 0 ? (
              <p style={{ color: "#9ca3af", fontFamily: "inherit" }}>No activity yet. Start the simulation to see real-time updates.</p>
            ) : (
              infoLog.map((entry, i) => (
                <div key={i} style={{
                  padding: "4px 0",
                  borderBottom: "1px solid var(--border-subtle)",
                  color: i === 0 ? (entry.includes("STOP") || entry.includes("waiting") || entry.includes("RED") ? "#d97706" : "#1d4ed8") : "#6b7280",
                }}>
                  {entry}
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}
