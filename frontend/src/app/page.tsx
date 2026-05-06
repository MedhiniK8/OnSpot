"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { setUser } from "@/lib/auth";
import { apiLogin, apiRegister, setToken } from "@/lib/api";

const PROFESSIONS = ["Citizen", "Doctor", "Driver", "Police", "Firefighter", "Other"];

const FEATURES = [
  "Real-time accident detection and alert dispatch",
  "Instant coordination with police, ambulance and fire dept",
  "Smart traffic signal control for green corridors",
  "AI-powered decision engine with severity analysis",
];

const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [profession, setProfession] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!profession) {
      setError("Please select your profession.");
      return;
    }

    setLoading(true);
    try {
      let token: string;
      let backendUser: { role: string; full_name: string | null; email: string };

      if (isRegister) {
        const result = await apiRegister(email.trim(), password, name.trim() || email.split("@")[0]);
        token = result.access_token;
        backendUser = result.user;
      } else {
        const result = await apiLogin(email.trim(), password);
        token = result.access_token;
        backendUser = result.user;
      }

      // Persist JWT for all subsequent API calls
      setToken(token);

      // Persist user profile for UI display
      setUser({
        email: backendUser.email,
        name: backendUser.full_name || backendUser.email.split("@")[0],
        profession,
        role: backendUser.role as "admin" | "user",
      });

      router.push(backendUser.role === "admin" ? "/admin" : "/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#fff" }}>
      {/* Left: Hero */}
      <div style={{
        flex: 1, background: "#f8f9fa", borderRight: "1px solid #e5e7eb",
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "60px 56px", position: "relative", overflow: "hidden",
      }}>
        <div aria-hidden style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)",
          backgroundSize: "40px 40px", opacity: 0.3,
        }} />

        <motion.div style={{ position: "relative", zIndex: 1, maxWidth: 520 }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
            <div style={{ width: 36, height: 36, background: "#111827", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <ShieldIcon />
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>OnSpot</span>
          </div>

          <h1 style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.15, color: "#111827", letterSpacing: "-0.03em", marginBottom: 14 }}>
            Every second matters.<br />
            <span style={{ color: "#2563eb" }}>OnSpot</span> makes it count.
          </h1>

          <p style={{ fontSize: 16, fontWeight: 500, color: "#4b5563", marginBottom: 12, lineHeight: 1.4 }}>
            AI-powered emergency response in real-time
          </p>
          <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7, marginBottom: 32, maxWidth: 440 }}>
            OnSpot helps cities respond to emergencies faster by combining AI-driven detection,
            automated alerts, and intelligent traffic management.
          </p>

          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
            {FEATURES.map((f) => (
              <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  <CheckIcon />
                </div>
                <span style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>{f}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Right: Auth */}
      <div style={{ width: 440, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 48px", background: "#fff" }}>
        <motion.div style={{ width: "100%", maxWidth: 360 }}
          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
            <div style={{ width: 28, height: 28, background: "#111827", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>OnSpot</span>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 6 }}>
            {isRegister ? "Create your account" : "Sign in to OnSpot"}
          </h2>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
            {isRegister ? "Start managing emergency response smarter." : "Access your emergency response dashboard."}
          </p>

          {/* Tabs */}
          <div className="tabs" style={{ marginBottom: 24 }}>
            <button id="tab-login" className={`tab ${!isRegister ? "active" : ""}`} onClick={() => { setIsRegister(false); setError(""); }} style={{ flex: 1, justifyContent: "center" }}>
              Sign In
            </button>
            <button id="tab-register" className={`tab ${isRegister ? "active" : ""}`} onClick={() => { setIsRegister(true); setError(""); }} style={{ flex: 1, justifyContent: "center" }}>
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {isRegister && (
              <div>
                <label htmlFor="full-name" className="label">Full Name</label>
                <input id="full-name" type="text" className="input" placeholder="Your full name"
                  value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}

            <div>
              <label htmlFor="email" className="label">Email address</label>
              <input id="email" type="email" className="input" placeholder="your@email.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label htmlFor="password" className="label" style={{ margin: 0 }}>Password</label>
              </div>
              <div style={{ position: "relative" }}>
                <input id="password" type={showPassword ? "text" : "password"} className="input"
                  placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                  required style={{ paddingRight: 42 }} />
                <button type="button" id="toggle-password" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", alignItems: "center" }}>
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="profession" className="label">Profession</label>
              <select id="profession" className="input select" style={{ width: "100%" }}
                value={profession} onChange={(e) => setProfession(e.target.value)} required>
                <option value="">Select your profession</option>
                {PROFESSIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {error && (
              <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, color: "#b91c1c" }}>
                {error}
              </div>
            )}

            <motion.button id="submit-auth" type="submit" className="btn btn-primary"
              disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              style={{ width: "100%", marginTop: 4, padding: "13px 18px", fontSize: 15 }}>
              {loading ? (isRegister ? "Creating account..." : "Signing in...") : (isRegister ? "Create Account" : "Sign In")}
            </motion.button>
          </form>

          <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid #f0f0f0" }}>
            <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center" }}>
              {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
              <button type="button" onClick={() => { setIsRegister(!isRegister); setError(""); }}
                style={{ color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 500 }}>
                {isRegister ? "Sign in" : "Register"}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
