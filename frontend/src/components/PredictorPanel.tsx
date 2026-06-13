"use client";

// ============================================================
// PredictorPanel — GP/Session/Driver selector + Simulation CTA
// ============================================================

import { GrandPrix, SessionType } from "@/types/f1";
import { ChevronDown, Play, Loader2, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

interface Driver {
  id: number;
  acronym: string;
  name: string;
  team: string;
  color: string;
  number: number;
}

interface PredictorPanelProps {
  gpCalendar: GrandPrix[];
  sessionTypes: SessionType[];
  driverRoster: Driver[];
  selectedGP: GrandPrix;
  selectedSession: SessionType;
  driver1Id: number;
  driver2Id: number;
  isSimulating: boolean;
  onGPChange: (gp: GrandPrix) => void;
  onSessionChange: (session: SessionType) => void;
  onDriver1Change: (id: number) => void;
  onDriver2Change: (id: number) => void;
  onRunSimulation: () => void;
}

// ─── Reusable Select Component ────────────────────────────────
function F1Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label
        className="block text-xs font-mono uppercase tracking-widest"
        style={{ color: "var(--f1-silver-dim)" }}
      >
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full appearance-none rounded px-3 py-2 pr-8 text-sm font-mono",
            "focus:outline-none focus:ring-1 transition-colors"
          )}
          style={{
            backgroundColor: "var(--f1-carbon-600)",
            border: "1px solid var(--f1-carbon-400)",
            color: "var(--f1-white)",
          }}
        >
          {children}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "var(--f1-silver-dim)" }}
        />
      </div>
    </div>
  );
}

// ─── Driver Color Dot ─────────────────────────────────────────
function DriverDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0"
      style={{ backgroundColor: `#${color.replace("#", "")}` }}
    />
  );
}

export default function PredictorPanel({
  gpCalendar,
  sessionTypes,
  driverRoster,
  selectedGP,
  selectedSession,
  driver1Id,
  driver2Id,
  isSimulating,
  onGPChange,
  onSessionChange,
  onDriver1Change,
  onDriver2Change,
  onRunSimulation,
}: PredictorPanelProps) {
  return (
    <div
      className="carbon-card p-5 space-y-5"
      role="region"
      aria-label="Predictor Panel"
    >
      {/* ── Panel Header ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: "var(--f1-carbon-500)" }}>
        <Cpu size={16} style={{ color: "var(--f1-neon-red)" }} />
        <h2
          className="text-sm font-mono font-bold uppercase tracking-widest"
          style={{ color: "var(--f1-white)" }}
        >
          2026 Simulation
        </h2>
      </div>

      {/* ── Grand Prix Selector ───────────────────────────────── */}
      <F1Select
        label="Grand Prix"
        value={selectedGP.sessionKey}
        onChange={(v) => {
          const gp = gpCalendar.find((g) => g.sessionKey === v);
          if (gp) onGPChange(gp);
        }}
      >
        {gpCalendar.map((gp) => (
          <option key={gp.sessionKey} value={gp.sessionKey}>
            {gp.flag} {gp.name}
          </option>
        ))}
      </F1Select>

      {/* ── Session Selector ─────────────────────────────────── */}
      <F1Select
        label="Session"
        value={selectedSession}
        onChange={(v) => onSessionChange(v as SessionType)}
      >
        {sessionTypes.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </F1Select>

      {/* ── Driver 1 Selector ────────────────────────────────── */}
      <div className="space-y-1">
        <label
          className="block text-xs font-mono uppercase tracking-widest"
          style={{ color: "var(--f1-silver-dim)" }}
        >
          Driver 1
        </label>
        <div className="relative">
          <select
            value={driver1Id}
            onChange={(e) => onDriver1Change(Number(e.target.value))}
            className="w-full appearance-none rounded px-3 py-2 pr-8 text-sm font-mono focus:outline-none"
            style={{
              backgroundColor: "var(--f1-carbon-600)",
              border: `1px solid ${driverRoster.find((d) => d.id === driver1Id)?.color ?? "#fff"}`,
              color: "var(--f1-white)",
            }}
          >
            {driverRoster.map((d) => (
              <option key={d.id} value={d.id}>
                #{d.number} {d.acronym} — {d.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--f1-silver-dim)" }}
          />
        </div>
        <p className="text-xs font-mono" style={{ color: "var(--f1-silver-dim)" }}>
          <DriverDot color={driverRoster.find((d) => d.id === driver1Id)?.color ?? "#fff"} />
          {driverRoster.find((d) => d.id === driver1Id)?.team}
        </p>
      </div>

      {/* ── Driver 2 Selector ────────────────────────────────── */}
      <div className="space-y-1">
        <label
          className="block text-xs font-mono uppercase tracking-widest"
          style={{ color: "var(--f1-silver-dim)" }}
        >
          Driver 2
        </label>
        <div className="relative">
          <select
            value={driver2Id}
            onChange={(e) => onDriver2Change(Number(e.target.value))}
            className="w-full appearance-none rounded px-3 py-2 pr-8 text-sm font-mono focus:outline-none"
            style={{
              backgroundColor: "var(--f1-carbon-600)",
              border: `1px solid ${driverRoster.find((d) => d.id === driver2Id)?.color ?? "#fff"}`,
              color: "var(--f1-white)",
            }}
          >
            {driverRoster.map((d) => (
              <option key={d.id} value={d.id}>
                #{d.number} {d.acronym} — {d.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--f1-silver-dim)" }}
          />
        </div>
        <p className="text-xs font-mono" style={{ color: "var(--f1-silver-dim)" }}>
          <DriverDot color={driverRoster.find((d) => d.id === driver2Id)?.color ?? "#fff"} />
          {driverRoster.find((d) => d.id === driver2Id)?.team}
        </p>
      </div>

      {/* ── Run Simulation Button ─────────────────────────────── */}
      <button
        onClick={onRunSimulation}
        disabled={isSimulating}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-3 px-4 rounded",
          "text-sm font-mono font-bold uppercase tracking-widest",
          "transition-all duration-200",
          isSimulating
            ? "opacity-60 cursor-not-allowed"
            : "hover:brightness-110 active:scale-95"
        )}
        style={{
          backgroundColor: isSimulating ? "var(--f1-carbon-500)" : "var(--f1-neon-red)",
          color: "#fff",
          boxShadow: isSimulating ? "none" : "0 0 16px rgba(232, 0, 45, 0.4)",
        }}
      >
        {isSimulating ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Running 2026 Simulation...
          </>
        ) : (
          <>
            <Play size={14} />
            Run 2026 Simulation
          </>
        )}
      </button>

      {/* ── Info Note ────────────────────────────────────────── */}
      <p
        className="text-xs font-mono leading-relaxed"
        style={{ color: "var(--f1-silver-dim)" }}
      >
        Requires Python backend on{" "}
        <span style={{ color: "var(--f1-neon-blue)" }}>localhost:8000</span>.
        Telemetry overlays use mock data when offline.
      </p>
    </div>
  );
}
