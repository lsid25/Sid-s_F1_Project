"use client";

// ============================================================
// RegulationBadge — 2026 Regulation indicator pill
// ============================================================

export default function RegulationBadge() {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-widest border"
      style={{
        backgroundColor: "rgba(232, 0, 45, 0.1)",
        borderColor: "var(--f1-neon-red)",
        color: "var(--f1-neon-red)",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: "var(--f1-neon-red)" }}
      />
      2026 Regs
    </div>
  );
}
