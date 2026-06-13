"use client";

// ============================================================
// PitWallHeader — Top navigation bar with F1 branding
// ============================================================

import { Activity, Radio, Zap } from "lucide-react";

export default function PitWallHeader() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-GB", { hour12: false });

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundColor: "var(--f1-carbon-800)",
        borderColor: "var(--f1-carbon-500)",
      }}
    >
      <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* ── Left: Branding ──────────────────────────────────── */}
        <div className="flex items-center gap-3">
          {/* F1 Logo Block */}
          <div
            className="flex items-center justify-center w-8 h-8 rounded font-black text-sm"
            style={{ backgroundColor: "var(--f1-neon-red)", color: "#fff" }}
          >
            F1
          </div>
          <div>
            <p
              className="text-sm font-bold leading-none tracking-tight"
              style={{ color: "var(--f1-white)" }}
            >
              Telemetry & Finish Predictor
            </p>
            <p
              className="text-xs font-mono leading-none mt-0.5"
              style={{ color: "var(--f1-silver-dim)" }}
            >
              2026 Regulation Engine
            </p>
          </div>
        </div>

        {/* ── Center: Live Indicator ───────────────────────────── */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full status-live"
              style={{ backgroundColor: "var(--f1-neon-green)" }}
            />
            <span
              className="text-xs font-mono uppercase tracking-widest"
              style={{ color: "var(--f1-neon-green)" }}
            >
              OpenF1 Connected
            </span>
          </div>
          <div
            className="w-px h-4"
            style={{ backgroundColor: "var(--f1-carbon-400)" }}
          />
          <div className="flex items-center gap-2">
            <Zap size={12} style={{ color: "var(--f1-neon-orange)" }} />
            <span
              className="text-xs font-mono"
              style={{ color: "var(--f1-silver-dim)" }}
            >
              50:50 Hybrid Mode
            </span>
          </div>
        </div>

        {/* ── Right: Stats ────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <Radio size={12} style={{ color: "var(--f1-neon-blue)" }} />
            <span
              className="text-xs font-mono"
              style={{ color: "var(--f1-silver-dim)" }}
            >
              {timeStr} UTC
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Activity size={14} style={{ color: "var(--f1-neon-red)" }} />
            <span
              className="text-xs font-mono font-bold"
              style={{ color: "var(--f1-white)" }}
            >
              PIT WALL
            </span>
          </div>
        </div>
      </div>

      {/* ── Red Accent Line ─────────────────────────────────────── */}
      <div
        className="h-0.5 w-full"
        style={{
          background: "linear-gradient(to right, var(--f1-neon-red), transparent 60%)",
        }}
      />
    </header>
  );
}
