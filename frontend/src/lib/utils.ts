// ============================================================
// F1 2026 Predictor — Utility Functions & Constants
// ============================================================

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { GrandPrix, SessionType, Regulation2026Params } from "@/types/f1";

// ─── Tailwind Class Merger ────────────────────────────────────

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ─── Lap Time Formatter ───────────────────────────────────────

export function formatLapTime(seconds: number): string {
  if (!seconds || seconds <= 0) return "--:--.---";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const secsFormatted = secs.toFixed(3).padStart(6, "0");
  return `${mins}:${secsFormatted}`;
}

// ─── Team Color Utilities ─────────────────────────────────────

export function getTeamColor(teamName: string): string {
  const colors: Record<string, string> = {
    "Red Bull Racing": "#3671C6",
    Ferrari: "#E8002D",
    Mercedes: "#27F4D2",
    McLaren: "#FF8000",
    "Aston Martin": "#229971",
    Alpine: "#FF87BC",
    Williams: "#64C4FF",
    "RB F1 Team": "#6692FF",
    "Kick Sauber": "#52E252",
    "Haas F1 Team": "#B6BABD",
  };
  return colors[teamName] ?? "#FFFFFF";
}

// ─── 2026 Grand Prix Calendar ─────────────────────────────────

export const GP_CALENDAR_2026: GrandPrix[] = [
  { name: "Australian Grand Prix", circuit: "Albert Park", country: "Australia", flag: "🇦🇺", sessionKey: "latest" },
  { name: "Bahrain Grand Prix", circuit: "Bahrain International Circuit", country: "Bahrain", flag: "🇧🇭", sessionKey: "9158" },
  { name: "Saudi Arabian Grand Prix", circuit: "Jeddah Corniche Circuit", country: "Saudi Arabia", flag: "🇸🇦", sessionKey: "9159" },
  { name: "Japanese Grand Prix", circuit: "Suzuka Circuit", country: "Japan", flag: "🇯🇵", sessionKey: "9160" },
  { name: "Chinese Grand Prix", circuit: "Shanghai International Circuit", country: "China", flag: "🇨🇳", sessionKey: "9161" },
  { name: "Miami Grand Prix", circuit: "Miami International Autodrome", country: "USA", flag: "🇺🇸", sessionKey: "9162" },
  { name: "Emilia Romagna Grand Prix", circuit: "Autodromo Enzo e Dino Ferrari", country: "Italy", flag: "🇮🇹", sessionKey: "9163" },
  { name: "Monaco Grand Prix", circuit: "Circuit de Monaco", country: "Monaco", flag: "🇲🇨", sessionKey: "9164" },
  { name: "Spanish Grand Prix", circuit: "Circuit de Barcelona-Catalunya", country: "Spain", flag: "🇪🇸", sessionKey: "9165" },
  { name: "Canadian Grand Prix", circuit: "Circuit Gilles Villeneuve", country: "Canada", flag: "🇨🇦", sessionKey: "9166" },
  { name: "Austrian Grand Prix", circuit: "Red Bull Ring", country: "Austria", flag: "🇦🇹", sessionKey: "9167" },
  { name: "British Grand Prix", circuit: "Silverstone Circuit", country: "UK", flag: "🇬🇧", sessionKey: "9168" },
  { name: "Belgian Grand Prix", circuit: "Circuit de Spa-Francorchamps", country: "Belgium", flag: "🇧🇪", sessionKey: "9169" },
  { name: "Hungarian Grand Prix", circuit: "Hungaroring", country: "Hungary", flag: "🇭🇺", sessionKey: "9170" },
  { name: "Dutch Grand Prix", circuit: "Circuit Zandvoort", country: "Netherlands", flag: "🇳🇱", sessionKey: "9171" },
  { name: "Italian Grand Prix", circuit: "Autodromo Nazionale Monza", country: "Italy", flag: "🇮🇹", sessionKey: "9172" },
  { name: "Azerbaijan Grand Prix", circuit: "Baku City Circuit", country: "Azerbaijan", flag: "🇦🇿", sessionKey: "9173" },
  { name: "Singapore Grand Prix", circuit: "Marina Bay Street Circuit", country: "Singapore", flag: "🇸🇬", sessionKey: "9174" },
  { name: "United States Grand Prix", circuit: "Circuit of the Americas", country: "USA", flag: "🇺🇸", sessionKey: "9175" },
  { name: "Mexico City Grand Prix", circuit: "Autodromo Hermanos Rodriguez", country: "Mexico", flag: "🇲🇽", sessionKey: "9176" },
  { name: "São Paulo Grand Prix", circuit: "Autodromo Jose Carlos Pace", country: "Brazil", flag: "🇧🇷", sessionKey: "9177" },
  { name: "Las Vegas Grand Prix", circuit: "Las Vegas Strip Circuit", country: "USA", flag: "🇺🇸", sessionKey: "9178" },
  { name: "Qatar Grand Prix", circuit: "Lusail International Circuit", country: "Qatar", flag: "🇶🇦", sessionKey: "9179" },
  { name: "Abu Dhabi Grand Prix", circuit: "Yas Marina Circuit", country: "UAE", flag: "🇦🇪", sessionKey: "9180" },
];

export const SESSION_TYPES: SessionType[] = [
  "FP1",
  "FP2",
  "FP3",
  "Qualifying",
  "Race",
];

// ─── 2026 Regulation Constants ────────────────────────────────

export const REGULATION_2026_DEFAULTS: Regulation2026Params = {
  hybridSplitRatio: 0.5,
  mguKPowerKW: 350,
  mguHPowerKW: 350,
  activeAeroEnabled: true,
  deratingThresholdKmh: 290,
  energyDeploymentPerLapKJ: 4000,
};
