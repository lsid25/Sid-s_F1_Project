"use client";

// ============================================================
// ApiStatusBadge — Live backend health indicator
// ============================================================

import { useEffect, useState } from "react";
import { checkApiHealth } from "@/lib/api";

type Status = "checking" | "online" | "offline";

export default function ApiStatusBadge() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    const check = async () => {
      const healthy = await checkApiHealth();
      setStatus(healthy ? "online" : "offline");
    };
    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, []);

  const config = {
    checking: {
      color: "var(--f1-silver-dim)",
      bg: "rgba(110, 110, 122, 0.1)",
      border: "var(--f1-carbon-400)",
      label: "Checking API...",
      pulse: true,
    },
    online: {
      color: "var(--f1-neon-green)",
      bg: "rgba(57, 255, 20, 0.1)",
      border: "var(--f1-neon-green)",
      label: "API Online",
      pulse: true,
    },
    offline: {
      color: "var(--f1-derating)",
      bg: "rgba(255, 68, 68, 0.1)",
      border: "var(--f1-derating)",
      label: "API Offline",
      pulse: false,
    },
  }[status];

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-widest border"
      style={{
        backgroundColor: config.bg,
        borderColor: config.border,
        color: config.color,
      }}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${config.pulse ? "status-live" : ""}`}
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </div>
  );
}
