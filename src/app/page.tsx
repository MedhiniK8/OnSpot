"use client";

import { useState } from "react";
import Link from "next/link";

/* ── tiny inline icon helpers ── */
const Icon = {
  Shield: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  ArrowRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  Eye: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
};

const FEATURES = [
  "Real-time accident detection",
  "Instant alert system to police, ambulance & fire",
  "Smart traffic signal control (green corridor)",
  "AI-powered decision engine",
];

const FLOW_STEPS = [
  { label: "Accident", icon: "🚨" },
  { label: "AI Analysis", icon: "🧠" },
  { label: "Authority Alert", icon: "📡" },
  { label: "Emergency Response", icon: "🚑" },
];

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    window.location.href = "/dashboard";
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#fff" }}>
      {/* ── Left: Hero ── */}
      <div
        style={{
          flex: 1,
          background: "#f8f9fa",
          borderRight: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 56px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* background subtle grid */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            opacity: 0.35,
          }}
        />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 520 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
            <div
              style={{
                width: 36,
                height: 36,
                background: "#111827",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <Icon.Shield />
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>
              OnSpot
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: 42,
              fontWeight: 800,
              lineHeight: 1.15,
              color: "#111827",
              letterSpacing: "-0.03em",
              marginBottom: 16,
            }}
          >
            Every second matters.
            <br />
            <span style={{ color: "#2563eb" }}>OnSpot</span> makes it count.
          </h1>

          <p
            style={{
              fontSize: 17,
              fontWeight: 500,
              color: "#4b5563",
              marginBottom: 16,
              lineHeight: 1.4,
            }}
          >
            AI-powered emergency response in real-time
          </p>

          <p
            style={{
              fontSize: 14,
              color: "#6b7280",
              lineHeight: 1.7,
              marginBottom: 32,
              maxWidth: 440,
            }}
          >
            OnSpot helps cities respond to emergencies faster by combining AI-driven
            detection, automated alerts, and intelligent traffic management. From accident
            detection to ambulance routing, everything happens in seconds.
          </p>

          {/* Feature bullets */}
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, marginBottom: 36 }}>
            {FEATURES.map((f) => (
              <li key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#eff6ff",
                    color: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon.Check />
                </div>
                <span style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>{f}</span>
              </li>
            ))}
          </ul>

          {/* Flow diagram */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: "16px 20px",
              marginBottom: 36,
              boxShadow: "0 1px 3px rgb(0 0 0 / 0.06)",
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
              Response Flow
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              {FLOW_STEPS.map((step, i) => (
                <div key={step.label} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: "#f1f5f9",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                      }}
                    >
                      {step.icon}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 500, color: "#6b7280", whiteSpace: "nowrap" }}>
                      {step.label}
                    </span>
                  </div>
                  {i < FLOW_STEPS.length - 1 && (
                    <div style={{ flex: 1, height: 1, background: "#e5e7eb", margin: "0 6px", marginBottom: 14 }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 12 }}>
            <Link
              href="/dashboard"
              className="btn btn-primary btn-lg"
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              Get Started <Icon.ArrowRight />
            </Link>
            <Link
              href="/simulation"
              className="btn btn-secondary btn-lg"
            >
              View Simulation
            </Link>
          </div>
        </div>
      </div>

      {/* ── Right: Login Card ── */}
      <div
        style={{
          width: 440,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 48px",
          background: "#fff",
        }}
      >
        <div style={{ width: "100%", maxWidth: 360 }}>
          {/* logo small */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 36 }}>
            <div
              style={{
                width: 28,
                height: 28,
                background: "#111827",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>OnSpot</span>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 6 }}>
            {isRegister ? "Create your account" : "Sign in to OnSpot"}
          </h2>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 28 }}>
            {isRegister
              ? "Start managing emergency response smarter."
              : "Access your emergency response dashboard."}
          </p>

          {/* Tab toggle */}
          <div className="tabs" style={{ marginBottom: 24 }}>
            <button
              id="tab-login"
              className={`tab ${!isRegister ? "active" : ""}`}
              onClick={() => setIsRegister(false)}
              style={{ flex: 1, justifyContent: "center" }}
            >
              Sign In
            </button>
            <button
              id="tab-register"
              className={`tab ${isRegister ? "active" : ""}`}
              onClick={() => setIsRegister(true)}
              style={{ flex: 1, justifyContent: "center" }}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {isRegister && (
              <div>
                <label htmlFor="full-name" className="label">Full Name</label>
                <input
                  id="full-name"
                  type="text"
                  className="input"
                  placeholder="John Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="label">Email address</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="admin@onspot.city"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label htmlFor="password" className="label" style={{ margin: 0 }}>Password</label>
                {!isRegister && (
                  <button type="button" style={{ fontSize: 13, color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                    Forgot?
                  </button>
                )}
              </div>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: 42 }}
                />
                <button
                  type="button"
                  id="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#9ca3af",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {showPassword ? <Icon.EyeOff /> : <Icon.Eye />}
                </button>
              </div>
            </div>

            {!isRegister && (
              <label htmlFor="remember" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input id="remember" type="checkbox" style={{ width: 14, height: 14, accentColor: "#2563eb" }} />
                <span style={{ fontSize: 13, color: "#6b7280" }}>Remember me for 30 days</span>
              </label>
            )}

            <button
              id="submit-auth"
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 4, padding: "13px 18px", fontSize: 15 }}
            >
              {isRegister ? "Create Account" : "Sign In"}
            </button>
          </form>

          <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid #f0f0f0" }}>
            <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center" }}>
              {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                style={{ color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 500 }}
              >
                {isRegister ? "Sign in" : "Register"}
              </button>
            </p>
          </div>

          {/* Demo credentials hint */}
          <div
            style={{
              marginTop: 20,
              padding: "12px 14px",
              background: "#f8f9fa",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
          >
            <p style={{ fontSize: 12, color: "#6b7280" }}>
              <span style={{ fontWeight: 600 }}>Demo:</span> admin@onspot.city / demo1234
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
