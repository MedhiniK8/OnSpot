"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

type BillingCycle = "monthly" | "yearly";

const PLANS = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "For individuals and small teams getting started with emergency reporting.",
    features: [
      { text: "Real-time emergency alerts", included: true },
      { text: "Text and image incident reporting", included: true },
      { text: "Basic event history (last 30 days)", included: true },
      { text: "AI-based decision system", included: false },
      { text: "Simulation access", included: false },
      { text: "Priority response routing", included: false },
      { text: "Multi-department coordination", included: false },
      { text: "Dedicated support", included: false },
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 10,
    yearlyPrice: 96, // $8/mo billed yearly
    description: "For professionals and teams who need AI-powered incident analysis.",
    features: [
      { text: "Real-time emergency alerts", included: true },
      { text: "Text, image, voice and camera reporting", included: true },
      { text: "Full event history", included: true },
      { text: "AI-based decision system", included: true },
      { text: "Simulation access", included: true },
      { text: "Priority response routing", included: true },
      { text: "Multi-department coordination", included: false },
      { text: "Dedicated support", included: false },
    ],
    cta: "Start Pro",
    highlighted: true, // recommended
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: null,
    yearlyPrice: 100,
    yearlyNote: "per year, billed annually",
    description: "For city authorities and organisations managing large-scale emergency response.",
    features: [
      { text: "Real-time emergency alerts", included: true },
      { text: "Text, image, voice and camera reporting", included: true },
      { text: "Full event history with analytics", included: true },
      { text: "AI-based decision system", included: true },
      { text: "Simulation access", included: true },
      { text: "Priority response routing", included: true },
      { text: "Multi-department coordination", included: true },
      { text: "Dedicated support", included: true },
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const CheckIcon = ({ color }: { color: string }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function PricingPage() {
  const [billing, setBilling] = useState<BillingCycle>("monthly");

  function getPrice(plan: typeof PLANS[0]) {
    if (plan.id === "enterprise") {
      return billing === "yearly" ? `$${plan.yearlyPrice}` : "Custom";
    }
    const price = billing === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
    return `$${price}`;
  }

  function getPeriod(plan: typeof PLANS[0]) {
    if (plan.id === "enterprise" && billing === "yearly") return "/year";
    if (plan.id === "enterprise") return "";
    return "/month";
  }

  return (
    <>
      {/* Nav */}
      <header style={{ padding: "16px 40px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 30, height: 30, background: "#111827", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>OnSpot</span>
        </Link>
        <Link href="/dashboard" className="btn btn-secondary btn-sm">Back to Dashboard</Link>
      </header>

      <main style={{ flex: 1, padding: "64px 24px" }}>
        {/* Header */}
        <motion.div
          style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 48px" }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 style={{ fontSize: 36, fontWeight: 800, color: "#111827", letterSpacing: "-0.03em", marginBottom: 12 }}>
            Simple, transparent pricing
          </h1>
          <p style={{ fontSize: 16, color: "#6b7280", lineHeight: 1.6 }}>
            Choose the plan that fits your role. All plans include access to the OnSpot emergency reporting platform.
          </p>
        </motion.div>

        {/* Billing toggle */}
        <motion.div
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 48 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <span style={{ fontSize: 14, fontWeight: 500, color: billing === "monthly" ? "#111827" : "#9ca3af" }}>Monthly</span>
          <label id="billing-toggle" className="toggle" style={{ width: 48, height: 26 }}>
            <input type="checkbox" checked={billing === "yearly"} onChange={(e) => setBilling(e.target.checked ? "yearly" : "monthly")} />
            <span className="toggle-slider" />
          </label>
          <span style={{ fontSize: 14, fontWeight: 500, color: billing === "yearly" ? "#111827" : "#9ca3af" }}>
            Yearly
            <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: "#16a34a", background: "#f0fdf4", padding: "2px 8px", borderRadius: 20, border: "1px solid #bbf7d0" }}>
              Save 20%
            </span>
          </span>
        </motion.div>

        {/* Plan cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, maxWidth: 1000, margin: "0 auto" }}>
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              id={`plan-${plan.id}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 + i * 0.06 }}
              style={{
                background: "#fff",
                border: plan.highlighted ? "2px solid #111827" : "1px solid #e5e7eb",
                borderRadius: 14,
                padding: "28px 24px",
                position: "relative",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Recommended badge */}
              {plan.highlighted && (
                <div style={{
                  position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
                  background: "#111827", color: "#fff", fontSize: 11, fontWeight: 600,
                  padding: "4px 14px", borderRadius: 20, letterSpacing: "0.04em", whiteSpace: "nowrap",
                }}>
                  RECOMMENDED
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                  {plan.name}
                </p>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 10 }}>
                  <span style={{ fontSize: 40, fontWeight: 800, color: "#111827", letterSpacing: "-0.03em", lineHeight: 1 }}>
                    {getPrice(plan)}
                  </span>
                  <span style={{ fontSize: 14, color: "#9ca3af", marginBottom: 4 }}>{getPeriod(plan)}</span>
                </div>
                {billing === "yearly" && plan.id === "pro" && (
                  <p style={{ fontSize: 12, color: "#16a34a", fontWeight: 500 }}>$8/month billed annually</p>
                )}
                <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5, marginTop: 8 }}>{plan.description}</p>
              </div>

              <motion.a
                href="#"
                className={`btn ${plan.highlighted ? "btn-primary" : "btn-secondary"}`}
                style={{ width: "100%", marginBottom: 24, justifyContent: "center" }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {plan.cta}
              </motion.a>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 11 }}>
                {plan.features.map((f) => (
                  <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flexShrink: 0 }}>
                      {f.included ? <CheckIcon color={plan.highlighted ? "#111827" : "#16a34a"} /> : <XIcon />}
                    </div>
                    <span style={{ fontSize: 13, color: f.included ? "#374151" : "#9ca3af" }}>{f.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.p
          style={{ textAlign: "center", marginTop: 40, fontSize: 13, color: "#9ca3af" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          All plans include a 14-day free trial. No credit card required to get started.
        </motion.p>
      </main>
    </>
  );
}
