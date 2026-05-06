"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { getUser, type AuthUser } from "@/lib/auth";
import { apiAnalyzeUnified, apiGetEvents, type ApiEvent } from "@/lib/api";

const SEVERITY_BADGE: Record<string, string> = {
  High: "badge-red", Medium: "badge-yellow", Low: "badge-gray",
};

const STATUS_BADGE: Record<string, string> = {
  completed: "badge-green", ongoing: "badge-yellow", failed: "badge-red",
};

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

export default function DashboardPage() {
  const [textInput, setTextInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [incidentType, setIncidentType] = useState("Vehicle Accident");
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraCapture, setCameraCapture] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [myEvents, setMyEvents] = useState<ApiEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasInput = !!(textInput.trim() || imageFile || capturedFile || voiceTranscript.trim());

  useEffect(() => {
    setUser(getUser());
    fetchMyEvents();
  }, []);

  async function fetchMyEvents() {
    setEventsLoading(true);
    try {
      const data = await apiGetEvents(1, 20);
      setMyEvents(data.items);
    } catch {
      // Not authenticated yet or backend down — silently ignore
    } finally {
      setEventsLoading(false);
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleUnifiedSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasInput) return;
    setSubmitting(true);
    setSubmitResult(null);

    try {
      const result = await apiAnalyzeUnified({
        location: locationInput,
        incidentType,
        description: textInput,
        voiceTranscript,
        imageFile: capturedFile || imageFile,
      });

      setSubmitResult({
        ok: true,
        msg: `Report submitted — Severity: ${result.decision_result.severity} | Departments: ${result.decision_result.departments_alerted.join(", ")}`,
      });
      
      // Clear form
      setTextInput("");
      setLocationInput("");
      setVoiceTranscript("");
      setImageFile(null);
      setImagePreview(null);
      setCameraCapture(null);
      setCapturedFile(null);
      setIsRecording(false);

      await fetchMyEvents();
    } catch (err) {
      setSubmitResult({ ok: false, msg: err instanceof Error ? err.message : "Submission failed" });
    } finally {
      setSubmitting(false);
    }
  }

  async function openCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
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
    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedFile(new File([blob], "capture.jpg", { type: "image/jpeg" }));
      }
    }, "image/jpeg");
    setCameraCapture(canvas.toDataURL("image/jpeg"));
    cameraStream?.getTracks().forEach((t) => t.stop());
    setCameraStream(null);
  }

  function clearCamera() {
    setCameraCapture(null);
    setCapturedFile(null);
    cameraStream?.getTracks().forEach((t) => t.stop());
    setCameraStream(null);
  }

  const greeting = user?.name ? `Welcome, ${user.name.split(" ")[0]}` : "Dashboard";

  return (
    <>
      <div className="topbar">
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>{greeting}</h1>
          <p style={{ fontSize: 13, color: "#6b7280" }}>
            {user?.profession ? `${user.profession} — ` : ""}Submit an incident report below
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7280" }}>
          <div className="pulse-dot red" />
          <span>Live</span>
        </div>
      </div>

      <div className="page-container" style={{ flex: 1 }}>
        {/* Report Incident */}
        <motion.div className="card" {...fadeUp} style={{ marginBottom: 24 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: 15, fontWeight: 600 }}>Report an Incident</h2>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>Submit via text, image, voice, or live camera</p>
          </div>
          <div style={{ padding: 20 }}>
            <form onSubmit={handleUnifiedSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label className="label" htmlFor="incident-location">Location</label>
                  <input id="incident-location" className="input" placeholder="e.g. MG Road, Brigade Rd"
                    value={locationInput} onChange={(e) => setLocationInput(e.target.value)} />
                </div>
                <div>
                  <label className="label" htmlFor="incident-type">Incident Type</label>
                  <select id="incident-type" className="input select" style={{ width: "100%" }}
                    value={incidentType} onChange={(e) => setIncidentType(e.target.value)}>
                    <option>Vehicle Accident</option><option>Fire</option>
                    <option>Medical Emergency</option><option>Flood</option><option>Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label" htmlFor="incident-desc">Description</label>
                <textarea id="incident-desc" className="input" rows={3}
                  placeholder="Describe what you observed in detail..."
                  value={textInput} onChange={(e) => setTextInput(e.target.value)}
                  style={{ resize: "none" }} />
              </div>

              {/* Media Section */}
              <div>
                <label className="label" style={{ marginBottom: 8 }}>Media Attachments</label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    Upload Image
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={openCamera} disabled={!!cameraStream || !!cameraCapture}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    Open Camera
                  </button>
                  <button type="button" className={`btn ${isRecording ? "btn-danger" : "btn-secondary"}`} onClick={() => setIsRecording(!isRecording)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                    {isRecording ? "Stop Recording" : "Record Voice"}
                  </button>
                </div>

                <input ref={fileInputRef} id="image-upload-input" type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />

                {/* Previews */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {imagePreview && !cameraCapture && !cameraStream && (
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreview} alt="Preview" style={{ width: 120, height: 80, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)" }} />
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setImagePreview(null); setImageFile(null); }}>Remove Image</button>
                    </div>
                  )}

                  {cameraStream && !cameraCapture && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 320 }}>
                      <div style={{ borderRadius: 8, overflow: "hidden", background: "#000", position: "relative" }}>
                        <video ref={videoRef} style={{ width: "100%", display: "block", maxHeight: 240, objectFit: "cover" }} autoPlay muted playsInline />
                        <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(220,38,38,0.9)", color: "#fff", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4 }}>LIVE</div>
                      </div>
                      <canvas ref={canvasRef} style={{ display: "none" }} />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" className="btn btn-primary btn-sm" onClick={capturePhoto} style={{ flex: 1 }}>Capture Photo</button>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={clearCamera}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {cameraCapture && (
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cameraCapture} alt="Captured" style={{ width: 120, height: 80, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)" }} />
                      <button type="button" className="btn btn-secondary btn-sm" onClick={clearCamera}>Retake Photo</button>
                    </div>
                  )}

                  {(isRecording || voiceTranscript) && (
                    <div>
                      <textarea className="input" rows={2}
                        placeholder="Voice transcript will appear here..."
                        value={voiceTranscript} onChange={(e) => setVoiceTranscript(e.target.value)}
                        style={{ resize: "none" }} />
                    </div>
                  )}
                </div>
              </div>

              {submitResult && (
                <div style={{ padding: "10px 14px", background: submitResult.ok ? "#f0fdf4" : "#fef2f2", border: `1px solid ${submitResult.ok ? "#bbf7d0" : "#fecaca"}`, borderRadius: 8, fontSize: 13, color: submitResult.ok ? "#166534" : "#b91c1c" }}>
                  {submitResult.msg}
                </div>
              )}

              <motion.button id="submit-incident-btn" type="submit" className="btn btn-primary"
                disabled={submitting || !hasInput} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                style={{ alignSelf: "flex-start", padding: "11px 24px" }}>
                {submitting ? "Analyzing..." : "Submit Report"}
              </motion.button>
            </form>
          </div>
        </motion.div>

        {/* Submission History */}
        <motion.div className="card"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600 }}>My Submission History</h2>
              <p style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>Your past reports and their AI analysis results</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={fetchMyEvents} disabled={eventsLoading}>
              {eventsLoading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {eventsLoading ? (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "#9ca3af" }}>Loading submissions...</p>
            </div>
          ) : myEvents.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 10px" }}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p style={{ fontSize: 14, color: "#9ca3af" }}>No submissions yet. Submit your first report above.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th><th>Type</th><th>Location</th><th>Severity</th>
                    <th>Departments Alerted</th><th>Status</th><th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {myEvents.map((evt) => (
                    <tr key={evt.id}>
                      <td style={{ fontFamily: "monospace", fontSize: 11, color: "#9ca3af" }}>{evt.id.slice(0, 8)}…</td>
                      <td style={{ textTransform: "capitalize" }}>{evt.input_type}</td>
                      <td style={{ color: "#6b7280", fontSize: 13 }}>{evt.location || "—"}</td>
                      <td><span className={`badge ${SEVERITY_BADGE[evt.severity] ?? "badge-gray"}`}>{evt.severity}</span></td>
                      <td style={{ fontSize: 13 }}>{evt.departments_alerted.join(", ") || "—"}</td>
                      <td><span className={`badge ${STATUS_BADGE[evt.status] ?? "badge-gray"}`}>{evt.status}</span></td>
                      <td style={{ fontFamily: "monospace", fontSize: 12, color: "#9ca3af" }}>
                        {evt.created_at ? new Date(evt.created_at).toLocaleTimeString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}
