'use client';

import { useState, useCallback } from "react";
import { PredictionResult, SessionType } from "@/types/f1";
import { GP_CALENDAR_2026, SESSION_TYPES, generateMockTelemetry } from "@/lib/utils";
import { runPrediction } from "@/lib/api";
import PitWallHeader from "@/components/PitWallHeader";
import PredictorPanel from "@/components/PredictorPanel";
import TelemetryOverlay from "@/components/TelemetryOverlay";
import DriverPredictionCard from "@/components/DriverPredictionCard";
import RegulationBadge from "@/components/RegulationBadge";
import ApiStatusBadge from "@/components/ApiStatusBadge";
import DriverStatsCard from "@/components/DriverStatsCard";

// ─── Mock Driver Roster ───────────────────────────────────────
const DRIVER_ROSTER = [
  { id: 1, acronym: "NOR", name: "Lando Norris", team: "McLaren", color: "#FF8000", number: 1 },
  { id: 81, acronym: "PIA", name: "Oscar Piastri", team: "McLaren", color: "#FF8000", number: 81 },
  { id: 16, acronym: "LEC", name: "Charles Leclerc", team: "Ferrari", color: "#E8002D", number: 16 },
  { id: 44, acronym: "HAM", name: "Lewis Hamilton", team: "Ferrari", color: "#E8002D", number: 44 },
  { id: 3, acronym: "VER", name: "Max Verstappen", team: "Red Bull Racing", color: "#3671C6", number: 3 },
  { id: 6, acronym: "HAD", name: "Isack Hadjar", team: "Red Bull Racing", color: "#3671C6", number: 6 },
  { id: 63, acronym: "RUS", name: "George Russell", team: "Mercedes", color: "#27F4D2", number: 63 },
  { id: 12, acronym: "ANT", name: "Kimi Antonelli", team: "Mercedes", color: "#27F4D2", number: 12 },
  { id: 14, acronym: "ALO", name: "Fernando Alonso", team: "Aston Martin", color: "#229971", number: 14 },
  { id: 18, acronym: "STR", name: "Lance Stroll", team: "Aston Martin", color: "#229971", number: 18 },
  { id: 10, acronym: "GAS", name: "Pierre Gasly", team: "Alpine", color: "#0093CC", number: 10 },
  { id: 43, acronym: "COL", name: "Franco Colapinto", team: "Alpine", color: "#0093CC", number: 43 },
  { id: 31, acronym: "OCO", name: "Esteban Ocon", team: "Haas", color: "#FFFFFF", number: 31 },
  { id: 87, acronym: "BEA", name: "Oliver Bearman", team: "Haas", color: "#FFFFFF", number: 87 },
  { id: 30, acronym: "LAW", name: "Liam Lawson", team: "Racing Bulls (VCARB)", color: "#6692FF", number: 30 },
  { id: 41, acronym: "LIN", name: "Arvid Lindblad", team: "Racing Bulls (VCARB)", color: "#6692FF", number: 41 },
  { id: 23, acronym: "ALB", name: "Alex Albon", team: "Williams", color: "#64C4FF", number: 23 },
  { id: 55, acronym: "SAI", name: "Carlos Sainz", team: "Williams", color: "#64C4FF", number: 55 },
  { id: 27, acronym: "HUL", name: "Nico Hülkenberg", team: "Audi", color: "#000000", number: 27 },
  { id: 5, acronym: "BOR", name: "Gabriel Bortoleto", team: "Audi", color: "#000000", number: 5 },
  { id: 11, acronym: "PER", name: "Sergio Pérez", team: "Cadillac", color: "#FFD700", number: 11 },
  { id: 77, acronym: "BOT", name: "Valtteri Bottas", team: "Cadillac", color: "#FFD700", number: 77 },
];

export default function DashboardPage() {
  // ─── State ──────────────────────────────────────────────────
  const [selectedGP, setSelectedGP] = useState(GP_CALENDAR_2026[0]);
  const [selectedSession, setSelectedSession] = useState<SessionType>("Qualifying");
  const [selectedDriverId, setSelectedDriverId] = useState<number>(1);
  const [isSimulating, setIsSimulating] = useState(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [telemetryData, setTelemetryData] = useState<Record<string, number | boolean>[]>(
    generateMockTelemetry(1, 1)
  );
  const [simulationError, setSimulationError] = useState<string | null>(null);

  const selectedDriver = DRIVER_ROSTER.find((d) => d.id === selectedDriverId) ?? DRIVER_ROSTER[0];

  // ─── Simulation Handler ──────────────────────────────────────
  const handleRunSimulation = useCallback(async () => {
    setIsSimulating(true);
    setSimulationError(null);
    setPredictionResult(null);

    try {
      const result = await runPrediction({
        session_key: selectedGP.sessionKey,
        driver_id: selectedDriverId,
        simulation_type: "2026_regulations",
      });

      setPredictionResult(result);
      setTelemetryData(generateMockTelemetry(selectedDriverId, selectedDriverId));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Simulation failed. Is the backend running on localhost:8000?";
      setSimulationError(message);
      setTelemetryData(generateMockTelemetry(selectedDriverId, selectedDriverId));
    } finally {
      setIsSimulating(false);
    }
  }, [selectedGP, selectedDriverId]);

  // ─── Driver Change Handler ───────────────────────────────────
  const handleDriverChange = (driverId: number) => {
    setSelectedDriverId(driverId);
    setTelemetryData(generateMockTelemetry(driverId, driverId));
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
              selectedDriverId={selectedDriverId}
              isSimulating={isSimulating}
              onGPChange={setSelectedGP}
              onSessionChange={setSelectedSession}
              onDriverChange={handleDriverChange}
              onRunSimulation={handleRunSimulation}
            />

            {/* ── Driver Stats Card ─────────────────────────── */}
            <DriverStatsCard driver={selectedDriver} slot={1} />
          </div>

          {/* ── Right Column: Telemetry Charts ────────────────── */}
          <div className="xl:col-span-2 space-y-4">
            <TelemetryOverlay
              telemetryData={telemetryData}
              driver1={selectedDriver}
              driver2={selectedDriver}
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

        {/* ── Prediction Result ──────────────────────────── */}
        {predictionResult && (
          <section>
            <h2
              className="text-sm font-mono font-semibold uppercase tracking-widest mb-4"
              style={{ color: "var(--f1-silver-dim)" }}
            >
              2026 Simulation Result
            </h2>
            <DriverPredictionCard
              driverNumber={selectedDriver.number}
              driverName={selectedDriver.name}
              team={selectedDriver.team}
              teamColor={selectedDriver.color}
              prediction={predictionResult}
              isLoading={isSimulating}
            />
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
