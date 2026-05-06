"use client";

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        background: "#fff",
        padding: "18px 24px",
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 13, color: "#9ca3af" }}>
          &copy; {new Date().getFullYear()} OnSpot. All rights reserved.
        </span>
        <div style={{ display: "flex", gap: 24 }}>
          {[
            { label: "Contact Us", href: "#contact" },
            { label: "Privacy Policy", href: "#privacy" },
            { label: "Terms of Service", href: "#terms" },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              style={{
                fontSize: 13,
                color: "#6b7280",
                textDecoration: "none",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "#111827")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "#6b7280")
              }
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
