// client/src/components/Loader.jsx
import React from "react";

/**
 * Centered loading indicator with customizable Arabic message.
 */
export default function Loader({ message = "جاري المعالجة..." }) {
  return (
    <div
      className="animate-fade-in"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "4rem 2rem",
        gap: "1.5rem",
      }}
    >
      {/* Spinning ring */}
      <div style={{ position: "relative", width: 60, height: 60 }}>
        <svg
          width="60"
          height="60"
          viewBox="0 0 60 60"
          fill="none"
          className="animate-spin"
          style={{ display: "block" }}
        >
          <circle cx="30" cy="30" r="24" stroke="rgba(240,165,0,0.12)" strokeWidth="4" />
          <path
            d="M30 6 A24 24 0 0 1 54 30"
            stroke="var(--gold-500)"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
        {/* Centre pulse dot */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="animate-pulse"
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: "var(--gold-500)",
            }}
          />
        </div>
      </div>

      <p
        className="animate-pulse"
        style={{ color: "var(--text-muted)", fontSize: "0.95rem", fontWeight: 600, margin: 0 }}
      >
        {message}
      </p>
    </div>
  );
}
