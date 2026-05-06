"use client";

import { useState, useRef } from "react";

/* ── Dummy Data ── */
const STAT_CARDS = [
  {
    id: "active-incidents",
    label: "Active Incidents",
    value: "7",
    change: "+2 in last hour",
    trend: "up",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    accent: "#dc2626",
    accentBg: "#fef2f2",
  },
  {
    id: "response-time",
    label: "Avg Response Time",
    value: "4.2 min",
    change: "−0.8 min vs last week",
    trend: "down",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    accent: "#2563eb",
    accentBg: "#eff6ff",
  },
  {
    id: "ai-accuracy",
    label: "AI Accuracy",
    value: "98.4%",
    change: "+0.3% this month",
    trend: "up",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    accent: "#16a34a",
    accentBg: "#f0fdf4",
  },
  {
    id: "green-corridors",
    label: "Green Corridors",
    value: "3",
    change: "Active now",
    trend: "neutral",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
    ),
    accent: "#0891b2",
    accentBg: "#ecfeff",
  },
];

const RECENT_INCIDENTS = [
  { id: "INC-001", location: "MG Road & Brigade Rd", severity: "High", type: "Accident", units: "Police + Ambulance", time: "14:23", status: "Active" },
  { id: "INC-002", location: "Silk Board Junction", severity: "Critical", type: "Multi-Vehicle", units: "Police + Ambulance + Fire", time: "13:58", status: "Active" },
  { id: "INC-003", location: "Hebbal Flyover", severity: "Medium", type: "Breakdown", units: "Police", time: "13:41", status: "Resolved" },
  { id: "INC-004", location: "Whitefield Main Rd", severity: "Low", type: "Pothole Report", units: "BMC", time: "13:20", status: "Pending" },
];

const SEVERITY_BADGE: Record<string, string> = {
  Critical: "badge-red",
  High: "badge-red",
  Medium: "badge-yellow",
  Low: "badge-gray",
};

const STATUS_BADGE: Record<string, string> = {
  Active: "badge-red",
  Resolved: "badge-green",
  Pending: "badge-yellow",
};

const TABS = ["Text", "Image", "Voice", "Camera"] as const;
type Tab = typeof TABS[number];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Text");
  const [textInput, setTextInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraCapture, setCameraCapture] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!textInput.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setTextInput("");
      setTimeout(() => setSubmitted(false), 3000);
    }, 1200);
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function openCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      alert("Camera access denied or not available.");
    }
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    setCameraCapture(canvas.toDataURL("image/jpeg"));
    cameraStream?.getTracks().forEach((t) => t.stop());
    setCameraStream(null);
  }

  function clearCamera() {
    setCameraCapture(null);
    cameraStream?.getTracks().forEach((t) => t.stop());
    setCameraStream(null);
  }

  return (
    <>
      {/* ── Topbar ── */}
      <div className="topbar">
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: "#6b7280" }}>Real-time emergency response overview</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7280" }}>
            <div className="pulse-dot red" />
            <span>Live Feed</span>
          </div>
          <div style={{ padding: "6px 12px", background: "#f8f9fa", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, color: "#374151" }}>
            Mon, 5 May 2026 · 14:28
          </div>
        </div>
      </div>

      <div className="page-container">
        {/* ── Stat Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
          {STAT_CARDS.map((card) => (
            <div key={card.id} id={card.id} className="card stat-card">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                <span className="stat-label">{card.label}</span>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: card.accentBg,
                    color: card.accent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {card.icon}
                </div>
              </div>
              <div className="stat-value">{card.value}</div>
              <div className={`stat-change ${card.trend === "up" && card.id === "active-incidents" ? "down" : card.trend === "down" ? "up" : ""}`}
                style={card.trend === "neutral" ? { color: "#0891b2" } : {}}>
                {card.change}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 20 }}>
          {/* ── Left Column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Recent Incidents Table */}
            <div className="card">
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ fontSize: 15, fontWeight: 600 }}>Recent Incidents</h2>
                  <p style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>Live incident tracking</p>
                </div>
                <a href="/events" style={{ fontSize: 13, color: "#2563eb", textDecoration: "none", fontWeight: 500 }}>View all →</a>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Location</th>
                      <th>Type</th>
                      <th>Severity</th>
                      <th>Units Deployed</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RECENT_INCIDENTS.map((inc) => (
                      <tr key={inc.id}>
                        <td style={{ fontFamily: "monospace", fontSize: 12, color: "#6b7280" }}>{inc.id}</td>
                        <td style={{ fontWeight: 500 }}>{inc.location}</td>
                        <td style={{ color: "#6b7280" }}>{inc.type}</td>
                        <td>
                          <span className={`badge ${SEVERITY_BADGE[inc.severity] ?? "badge-gray"}`}>{inc.severity}</span>
                        </td>
                        <td style={{ fontSize: 13, color: "#374151" }}>{inc.units}</td>
                        <td style={{ fontFamily: "monospace", fontSize: 13, color: "#6b7280" }}>{inc.time}</td>
                        <td>
                          <span className={`badge ${STATUS_BADGE[inc.status] ?? "badge-gray"}`}>{inc.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Activity chart placeholder */}
            <div className="card" style={{ padding: "16px 20px" }}>
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600 }}>Incident Activity — Last 7 Days</h2>
                <p style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>Daily incident volume</p>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 100 }}>
                {[12, 8, 15, 7, 19, 11, 7].map((v, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div
                      style={{
                        width: "100%",
                        height: `${(v / 20) * 80}px`,
                        background: i === 6 ? "#2563eb" : "#e5e7eb",
                        borderRadius: "4px 4px 0 0",
                        transition: "background 0.2s",
                      }}
                    />
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>
                      {["M", "T", "W", "T", "F", "S", "S"][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right Column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Incident Control */}
            <div className="card">
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                <h2 style={{ fontSize: 15, fontWeight: 600 }}>Report Incident</h2>
                <p style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>Submit via text, image, voice, or camera</p>
              </div>
              <div style={{ padding: 20 }}>
                <div className="tabs" style={{ marginBottom: 20 }}>
                  {TABS.map((tab) => (
                    <button
                      key={tab}
                      id={`incident-tab-${tab.toLowerCase()}`}
                      className={`tab ${activeTab === tab ? "active" : ""}`}
                      onClick={() => setActiveTab(tab)}
                      style={{ flex: 1, justifyContent: "center" }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* TEXT TAB */}
                {activeTab === "Text" && (
                  <form onSubmit={handleTextSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <label className="label" htmlFor="incident-location">Location</label>
                      <input id="incident-location" className="input" placeholder="e.g. MG Road near Brigade Rd" />
                    </div>
                    <div>
                      <label className="label" htmlFor="incident-type">Type</label>
                      <select id="incident-type" className="input select" style={{ width: "100%" }}>
                        <option>Vehicle Accident</option>
                        <option>Fire</option>
                        <option>Medical Emergency</option>
                        <option>Flood</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="label" htmlFor="incident-desc">Description</label>
                      <textarea
                        id="incident-desc"
                        className="input"
                        rows={3}
                        placeholder="Describe the incident..."
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        style={{ resize: "none" }}
                      />
                    </div>
                    {submitted && (
                      <div style={{ padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, fontSize: 13, color: "#166534" }}>
                        ✓ Incident reported successfully
                      </div>
                    )}
                    <button id="submit-incident-text" type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? "Submitting..." : "Submit Report"}
                    </button>
                  </form>
                )}

                {/* IMAGE TAB */}
                {activeTab === "Image" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <input
                      ref={fileInputRef}
                      id="image-upload-input"
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleImageUpload}
                    />
                    {imagePreview ? (
                      <>
                        <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imagePreview} alt="Preview" style={{ width: "100%", objectFit: "cover", maxHeight: 200 }} />
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { setImagePreview(null); }}>
                            Submit Image
                          </button>
                          <button className="btn btn-secondary" onClick={() => setImagePreview(null)}>Clear</button>
                        </div>
                      </>
                    ) : (
                      <button
                        id="upload-image-btn"
                        className="btn btn-secondary"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ width: "100%", height: 120, flexDirection: "column", gap: 8, borderStyle: "dashed" }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <span style={{ fontSize: 13 }}>Upload from gallery</span>
                      </button>
                    )}
                  </div>
                )}

                {/* VOICE TAB */}
                {activeTab === "Voice" && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "12px 0" }}>
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: "50%",
                        background: "#fef2f2",
                        border: "2px solid #fee2e2",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#dc2626",
                      }}
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                        <path d="M19 10v2a7 7 0 01-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                      </svg>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>Voice Input</p>
                      <p style={{ fontSize: 13, color: "#6b7280" }}>Click the button to record your incident report</p>
                    </div>
                    <button id="start-voice-btn" className="btn btn-danger" style={{ width: "100%" }}>
                      Start Recording
                    </button>
                  </div>
                )}

                {/* CAMERA TAB */}
                {activeTab === "Camera" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {!cameraStream && !cameraCapture && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <button
                          id="open-camera-btn"
                          className="btn btn-primary"
                          onClick={openCamera}
                          style={{ width: "100%" }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                          Open Camera
                        </button>
                        <button
                          id="upload-from-gallery-btn"
                          className="btn btn-secondary"
                          onClick={() => fileInputRef.current?.click()}
                          style={{ width: "100%" }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                          Upload from Gallery
                        </button>
                        <input
                          ref={fileInputRef}
                          id="gallery-upload-input"
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={handleImageUpload}
                        />
                        {imagePreview && (
                          <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imagePreview} alt="Preview" style={{ width: "100%", objectFit: "cover", maxHeight: 180 }} />
                          </div>
                        )}
                      </div>
                    )}

                    {cameraStream && !cameraCapture && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ borderRadius: 8, overflow: "hidden", background: "#000", position: "relative" }}>
                          <video ref={videoRef} style={{ width: "100%", display: "block", maxHeight: 200, objectFit: "cover" }} autoPlay muted playsInline />
                          <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(220,38,38,0.9)", color: "#fff", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4 }}>
                            LIVE
                          </div>
                        </div>
                        <canvas ref={canvasRef} style={{ display: "none" }} />
                        <div style={{ display: "flex", gap: 8 }}>
                          <button id="capture-photo-btn" className="btn btn-primary" onClick={capturePhoto} style={{ flex: 1 }}>
                            Capture Photo
                          </button>
                          <button className="btn btn-secondary" onClick={clearCamera}>Cancel</button>
                        </div>
                      </div>
                    )}

                    {cameraCapture && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={cameraCapture} alt="Captured" style={{ width: "100%", objectFit: "cover", maxHeight: 200 }} />
                        </div>
                        <p style={{ fontSize: 12, color: "#6b7280", textAlign: "center" }}>Preview — confirm before submitting</p>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button id="submit-camera-photo-btn" className="btn btn-primary" style={{ flex: 1 }}>
                            Submit Photo
                          </button>
                          <button className="btn btn-secondary" onClick={clearCamera}>Retake</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick stats side panel */}
            <div className="card" style={{ padding: "16px 20px" }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Authority Status</h2>
              {[
                { name: "Police Control Room", status: "Online", count: 12, color: "#2563eb" },
                { name: "Ambulance Dispatch", status: "Online", count: 6, color: "#16a34a" },
                { name: "Fire Department", status: "Online", count: 4, color: "#d97706" },
                { name: "Traffic Control", status: "Online", count: 8, color: "#0891b2" },
              ].map((unit) => (
                <div key={unit.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="pulse-dot green" />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{unit.name}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{unit.count} units available</div>
                    </div>
                  </div>
                  <span className="badge badge-green">{unit.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
