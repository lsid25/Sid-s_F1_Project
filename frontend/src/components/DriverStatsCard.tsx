"use client";

// ============================================================
// DriverStatsCard — Compact driver info panel
// ============================================================

interface Driver {
  id: number;
  acronym: string;
  name: string;
  team: string;
  color: string;
  number: number;
}

interface DriverStatsCardProps {
  driver: Driver;
  slot: 1 | 2;
}

export default function DriverStatsCard({ driver, slot }: DriverStatsCardProps) {
  return (
    <div
      className="carbon-card px-4 py-3 flex items-center gap-3"
      style={{ borderLeft: `3px solid ${driver.color}` }}
    >
      {/* Number Badge */}
      <div
        className="w-9 h-9 rounded flex items-center justify-center font-black text-base flex-shrink-0"
        style={{
          backgroundColor: `${driver.color}20`,
          color: driver.color,
          border: `1px solid ${driver.color}40`,
        }}
      >
        {driver.number}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-mono font-bold"
            style={{ color: "var(--f1-white)" }}
          >
            {driver.acronym}
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded font-mono"
            style={{
              backgroundColor: "var(--f1-carbon-500)",
              color: "var(--f1-silver-dim)",
            }}
          >
            Driver {slot}
          </span>
        </div>
        <p className="text-xs font-mono truncate" style={{ color: "var(--f1-silver-dim)" }}>
          {driver.name}
        </p>
        <p className="text-xs font-mono truncate" style={{ color: driver.color }}>
          {driver.team}
        </p>
      </div>
    </div>
  );
}
