"use client";

// ============================================================
// PredictionResultCard — Displays ML prediction output
// ============================================================

import { PredictionResult } from "@/types/f1";
import { formatLapTime } from "@/lib/utils";
import { Trophy, Clock, Zap, AlertTriangle } from "lucide-react";

interface Driver {
  id: number;
  acronym: string;
  name: string;
  team: string;
  color: string;
  number: number;
}

interface PredictionResultCardProps {
  result: PredictionResult;
  driver: Driver;
}

function MetricRow({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: "var(--f1-carbon-500)" }}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-mono" style={{ color: "var(--f1-silver-dim)" }}>
          {label}
        </span>
      </div>
      <span
        className="text-sm font-mono font-bold"
        style={{ color: valueColor ?? "var(--f1-white)" }}
      >
        {value}
      </span>
    </div>
  );
}

export default function PredictionResultCard({
  result,
  driver,
}: PredictionResultCardProps) {
  const positionSuffix = (n: number) => {
    if (n === 1) return "st";
    if (n === 2) return "nd";
    if (n === 3) return "rd";
    return "th";
  };

  const confidenceColor =
    result.confidence_score >= 0.85
      ? "var(--f1-neon-green)"
      : result.confidence_score >= 0.7
      ? "var(--f1-neon-orange)"
      : "var(--f1-derating)";

  return (
    <div
      className="carbon-card p-5 space-y-3"
      style={{ borderTop: `3px solid ${driver.color}` }}
    >
      {/* ── Driver Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded flex items-center justify-center font-black text-lg"
            style={{ backgroundColor: `${driver.color}22`, color: driver.color }}
          >
            {driver.number}
          </div>
          <div>
            <p
              className="text-sm font-bold font-mono"
              style={{ color: "var(--f1-white)" }}
            >
              {driver.acronym}
            </p>
            <p className="text-xs font-mono" style={{ color: "var(--f1-silver-dim)" }}>
              {driver.team}
            </p>
          </div>
        </div>
        {/* Predicted Position Badge */}
        <div
          className="flex flex-col items-center justify-center w-14 h-14 rounded-full border-2"
          style={{ borderColor: driver.color }}
        >
          <span
            className="text-xl font-black leading-none"
            style={{ color: driver.color }}
          >
            {result.predicted_position}
          </span>
          <span className="text-xs font-mono" style={{ color: "var(--f1-silver-dim)" }}>
            {positionSuffix(result.predicted_position)}
          </span>
        </div>
      </div>

      {/* ── Metrics ───────────────────────────────────────────── */}
      <div>
        <MetricRow
          icon={<Clock size={12} style={{ color: "var(--f1-neon-blue)" }} />}
          label="Simulated Lap Time"
          value={formatLapTime(result.simulated_lap_time)}
          valueColor="var(--f1-neon-blue)"
        />
        <MetricRow
          icon={<AlertTriangle size={12} style={{ color: "var(--f1-derating)" }} />}
          label="Derating Impact"
          value={`+${result.derating_impact_seconds.toFixed(3)}s`}
          valueColor="var(--f1-derating)"
        />
        <MetricRow
          icon={<Trophy size={12} style={{ color: "var(--f1-neon-yellow)" }} />}
          label="Model Confidence"
          value={`${(result.confidence_score * 100).toFixed(1)}%`}
          valueColor={confidenceColor}
        />
      </div>

      {/* ── Confidence Bar ────────────────────────────────────── */}
      <div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: "var(--f1-carbon-500)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${result.confidence_score * 100}%`,
              backgroundColor: confidenceColor,
              boxShadow: `0 0 8px ${confidenceColor}`,
            }}
          />
        </div>
      </div>

      {/* ── Model Note ────────────────────────────────────────── */}
      <p
        className="text-xs font-mono leading-relaxed"
        style={{ color: "var(--f1-silver-dim)" }}
      >
        <Zap size={10} className="inline mr-1" style={{ color: "var(--f1-neon-orange)" }} />
        {result.message}
      </p>
    </div>
  );
}
