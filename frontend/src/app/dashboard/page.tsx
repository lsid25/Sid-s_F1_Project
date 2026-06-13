"use client";

// ============================================================
// F1 2026 Telemetry & Finish Predictor — Dashboard Page
// Pit-wall style dark dashboard with telemetry overlays
// and 2026 regulation simulation panel
// ============================================================

import { useState, useCallback } from "react";
import { PredictionResult, SessionType } from "@/types/f1";
import { GP_CALENDAR_2026, SESSION_TYPES } from "@/lib/utils";
import { getTelemetryComparison, runSimulation } from "@/lib/api";
import PitWallHeader from "@/components/PitWallHeader";
import PredictorPanel from "@/components/PredictorPanel";
import TelemetryOverlay from "@/components/TelemetryOverlay";
import PredictionResultCard from "@/components/PredictionResultCard";
import RegulationBadge from "@/components/RegulationBadge";
import ApiStatusBadge from "@/components/ApiStatusBadge";
import DriverStatsCard from "@/components/DriverStatsCard";

// ─── 2026 Driver Roster ───────────────────────────────────────
const DRIVER_ROSTER = [
  // Mercedes
  { id: 63, acronym: "RUS", name: "George Russell", team: "Mercedes", color: "#27F4D2", number: 63 },
  { id: 84, acronym: "ANT", name: "Andrea Antonelli", team: "Mercedes", color: "#27F4D2", number: 84 },
  // Ferrari
  { id: 44, acronym: "HAM", name: "Lewis Hamilton", team: "Ferrari", color: "#E8002D", number: 44 },
  { id: 16, acronym: "LEC", name: "Charles Leclerc", team: "Ferrari", color: "#E8002D", number: 16 },
  // McLaren
  { id: 4, acronym: "NOR", name: "Lando Norris", team: "McLaren", color: "#FF8000", number: 4 },
  { id: 81, acronym: "PIA", name: "Oscar Piastri", team: "McLaren", color: "#FF8000", number: 81 },
  // Red Bull Racing
  { id: 1, acronym: "VER", name: "Max Verstappen", team: "Red Bull Racing", color: "#3671C6", number: 1 },
  { id: 27, acronym: "HAD", name: "Isack Hadjar", team: "Red Bull Racing", color: "#3671C6", number: 27 },
  // Alpine
  { id: 10, acronym: "GAS", name: "Pierre Gasly", team: "Alpine", color: "#FF87BC", number: 10 },
  { id: 43, acronym: "COL", name: "Franco Colapinto", team: "Alpine", color: "#FF87BC", number: 43 },
  // Racing Bulls
  { id: 30, acronym: "LAW", name: "Liam Lawson", team: "Racing Bulls", color: "#6692FF", number: 30 },
  { id: 32, acronym: "LIN", name: "Yuki Lindblad", team: "Racing Bulls", color: "#6692FF", number: 32 },
  // Haas F1 Team
  { id: 31, acronym: "OCO", name: "Esteban Ocon", team: "Haas F1 Team", color: "#B6BABD", number: 31 },
  { id: 26, acronym: "BEA", name: "Oliver Bearman", team: "Haas F1 Team", color: "#B6BABD", number: 26 },
  // Williams
  { id: 23, acronym: "ALB", name: "Alexander Albon", team: "Williams", color: "#64C4FF", number: 23 },
  { id: 55, acronym: "SAI", name: "Carlos Sainz", team: "Williams", color: "#64C4FF", number: 55 },
  // Audi
  { id: 27, acronym: "HUL", name: "Nico Hulkenberg", team: "Audi", color: "#52E252", number: 27 },
  { id: 5, acronym: "BOR", name: "Gabriel Bortoleto", team: "Audi", color: "#52E252", number: 5 },
  // Aston Martin
  { id: 14, acronym: "ALO", name: "Fernando Alonso", team: "Aston Martin", color: "#229971", number: 14 },
  { id: 18, acronym: "STR", name: "Lance Stroll", team: "Aston Martin", color: "#229971", number: 18 },
  // Cadillac
  { id: 77, acronym: "BOT", name: "Valtteri Bottas", team: "Cadillac", color: "#FF6B35", number: 77 },
  { id: 11, acronym: "PER", name: "Sergio Perez", team: "Cadillac", color: "#FF6B35", number: 11 },
];

export default function DashboardPage() {
  // ─── State ──────────────────────────────────────────────────
  const [selectedGP, setSelectedGP] = useState(GP_CALENDAR_2026[0]);
  const [selectedSession, setSelectedSession] = useState<SessionType>("Qualifying");
  const [driver1Id, setDriver1Id] = useState<number>(1);
  const [driver2Id, setDriver2Id] = useState<number>(16);
  const [isSimulating, setIsSimulating] = useState(false);
  const [predictionResults, setPredictionResults] = useState<PredictionResult[]>([]);
  const [telemetryData, setTelemetryData] = useState<Record<string, number | boolean>[]>([]);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  const driver1 = DRIVER_ROSTER.find((d) => d.id === driver1Id) ?? DRIVER_ROSTER[0];
  const driver2 = DRIVER_ROSTER.find((d) => d.id === driver2Id) ?? DRIVER_ROSTER[2];

  // ─── Simulation Handler ──────────────────────────────────────
  const handleRunSimulation = useCallback(async () => {
    setIsSimulating(true);
    setSimulationError(null);
    setPredictionResults([]);
    setTelemetryData([]);

    try {
      const simulation = await runSimulation({
        year: 2026,
        round_num: GP_CALENDAR_2026.indexOf(selectedGP) + 1,
        driver_1: driver1Id,
        driver_2: driver2Id,
        circuit: selectedGP.circuit,
        session_type: selectedSession,
        session_key: selectedGP.sessionKey,
        simulation_type: "2026_regulations",
      });

      setPredictionResults([simulation.driver_1, simulation.driver_2]);

      const telemetry = await getTelemetryComparison(
        selectedGP.sessionKey,
        2026,
        GP_CALENDAR_2026.indexOf(selectedGP) + 1,
        driver1Id,
        driver2Id
      );
      setTelemetryData(telemetry.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Simulation failed. Is the backend running on localhost:8000?";
      setSimulationError(message);
      setTelemetryData([]);
    } finally {
      setIsSimulating(false);
    }
  }, [selectedGP, selectedSession, driver1Id, driver2Id]);

  // ─── Driver Change Handler ───────────────────────────────────
  const handleDriverChange = (slot: 1 | 2, driverId: number) => {
    if (slot === 1) setDriver1Id(driverId);
    else setDriver2Id(driverId);
    setTelemetryData([]);
  };

  return (
    <div className="min-h-screen pit-wall-grid" style={{ backgroundColor: "var(--f1-carbon-900)" }}>
      {/* ── Top Navigation Bar ─────────────────────────────── */}
      <PitWallHeader />

      {/* ── Main Content ────────────────────────────────────── */}
      <main className="max-w-screen-2xl mx-auto px-4 py-6 space-y-6">

        {/* ── Status Row ──────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <RegulationBadge />
            <ApiStatusBadge />
          </div>
          <p className="text-xs font-mono" style={{ color: "var(--f1-silver-dim)" }}>
            Session: <span style={{ color: "var(--f1-neon-blue)" }}>{selectedGP.name}</span>
            {" · "}
            <span style={{ color: "var(--f1-neon-orange)" }}>{selectedSession}</span>
          </p>
        </div>

        {/* ── Primary Grid: Predictor + Telemetry ─────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ── Left Column: Predictor Panel ──────────────────── */}
          <div className="xl:col-span-1 space-y-4">
            <PredictorPanel
              gpCalendar={GP_CALENDAR_2026}
              sessionTypes={SESSION_TYPES}
              driverRoster={DRIVER_ROSTER}
              selectedGP={selectedGP}
              selectedSession={selectedSession}
              driver1Id={driver1Id}
              driver2Id={driver2Id}
              isSimulating={isSimulating}
              onGPChange={setSelectedGP}
              onSessionChange={setSelectedSession}
              onDriver1Change={(id) => handleDriverChange(1, id)}
              onDriver2Change={(id) => handleDriverChange(2, id)}
              onRunSimulation={handleRunSimulation}
            />

            {/* ── Driver Stats Cards ─────────────────────────── */}
            <DriverStatsCard driver={driver1} slot={1} />
            <DriverStatsCard driver={driver2} slot={2} />
          </div>

          {/* ── Right Column: Telemetry Charts ────────────────── */}
          <div className="xl:col-span-2 space-y-4">
            <TelemetryOverlay
              telemetryData={telemetryData}
              driver1={driver1}
              driver2={driver2}
            />
          </div>
        </div>

        {/* ── Simulation Error ────────────────────────────────── */}
        {simulationError && (
          <div
            className="carbon-card p-4 border-l-4 text-sm font-mono"
            style={{ borderLeftColor: "var(--f1-neon-red)", color: "var(--f1-derating)" }}
          >
            <span className="font-bold">SIMULATION ERROR: </span>
            {simulationError}
          </div>
        )}

        {/* ── Prediction Results Grid ──────────────────────────── */}
        {predictionResults.length > 0 && (
          <section>
            <h2
              className="text-sm font-mono font-semibold uppercase tracking-widest mb-4"
              style={{ color: "var(--f1-silver-dim)" }}
            >
              2026 Simulation Results
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {predictionResults.map((result, idx) => {
                const driver = idx === 0 ? driver1 : driver2;
                return (
                  <PredictionResultCard
                    key={result.driver_id}
                    result={result}
                    driver={driver}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* ── Regulation Info Footer ───────────────────────────── */}
        <section
          className="carbon-card p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono"
          style={{ color: "var(--f1-silver-dim)" }}
        >
          <div>
            <p className="font-bold mb-1" style={{ color: "var(--f1-neon-blue)" }}>
              ⚡ 50:50 Hybrid Split
            </p>
            <p>
              The 2026 regulations mandate equal power contribution from the
              ICE and the MGU-K (350 kW each), fundamentally altering energy
              deployment strategy on every straight.
            </p>
          </div>
          <div>
            <p className="font-bold mb-1" style={{ color: "var(--f1-neon-green)" }}>
              🏎 Active Aerodynamics
            </p>
            <p>
              Manual DRS is abolished. Cars use automated active aero systems
              that continuously adjust drag and downforce, replacing the
              driver-controlled DRS flap entirely.
            </p>
          </div>
          <div>
            <p className="font-bold mb-1" style={{ color: "var(--f1-neon-orange)" }}>
              🔋 Derating Zones
            </p>
            <p>
              When the MGU-K battery is depleted mid-straight, cars experience
              a sharp power reduction ("derating"), visible as a speed plateau
              at high throttle — highlighted in red on the telemetry overlay.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
