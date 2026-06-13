// ============================================================
// F1 2026 Telemetry & Finish Predictor — Core Type Definitions
// ============================================================

// ─── OpenF1 API Types ───────────────────────────────────────

export interface CarDataPoint {
  brake: number;
  date: string;
  driver_number: number;
  drs: number;
  meeting_key: number;
  n_gear: number;
  rpm: number;
  session_key: number;
  speed: number;
  throttle: number;
}

export interface DriverInfo {
  broadcast_name: string;
  country_code: string;
  driver_number: number;
  first_name: string;
  full_name: string;
  headshot_url: string;
  last_name: string;
  meeting_key: number;
  name_acronym: string;
  session_key: number;
  team_colour: string;
  team_name: string;
}

export interface LapData {
  date_start: string;
  driver_number: number;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  i1_speed: number | null;
  i2_speed: number | null;
  is_pit_out_lap: boolean;
  lap_duration: number | null;
  lap_number: number;
  meeting_key: number;
  session_key: number;
  st_speed: number | null;
}

export interface SessionInfo {
  circuit_key: number;
  circuit_short_name: string;
  country_code: string;
  country_key: number;
  country_name: string;
  date_end: string;
  date_start: string;
  gmt_offset: string;
  location: string;
  meeting_key: number;
  session_key: number;
  session_name: string;
  session_type: string;
  year: number;
}

// ─── Feature-Engineered Telemetry Types ─────────────────────

export interface TelemetryDataPoint {
  time_index: number;
  [key: string]: number | boolean;
}

export interface ProcessedTelemetry {
  data: TelemetryDataPoint[];
}

// ─── Predictor Types ─────────────────────────────────────────

export type SessionType = "FP1" | "FP2" | "FP3" | "Qualifying" | "Race";

export interface PredictionRequest {
  session_key: string;
  year: number;
  round_num: number;
  driver_id: number;
  circuit?: string;
  session_type?: SessionType;
  simulation_type?: string;
}

export interface SimulationRequest {
  year: number;
  round_num: number;
  driver_1: number;
  driver_2: number;
  circuit: string;
  session_type: SessionType;
  session_key: string;
  simulation_type?: string;
}

export interface PredictionResult {
  driver_id: number;
  predicted_position: number;
  confidence_score: number;
  simulated_lap_time: number;
  derating_impact_seconds: number;
  message: string;
}

export interface RaceFinishPrediction {
  driver: DriverInfo;
  prediction: PredictionResult;
}

export interface SimulationResult {
  driver_1: PredictionResult;
  driver_2: PredictionResult;
  circuit: string;
  session_type: SessionType;
}

// ─── UI State Types ──────────────────────────────────────────

export interface DashboardState {
  selectedGP: string;
  selectedSession: SessionType;
  selectedDriver1: number | null;
  selectedDriver2: number | null;
  isSimulating: boolean;
  predictionResults: PredictionResult[];
}

// ─── Grand Prix Catalog ──────────────────────────────────────

export interface GrandPrix {
  name: string;
  circuit: string;
  country: string;
  flag: string;
  sessionKey: string;
}

// ─── 2026 Regulation Simulation Types ────────────────────────

export interface Regulation2026Params {
  hybridSplitRatio: number; // 0.5 = 50:50
  mguKPowerKW: number;
  mguHPowerKW: number;
  activeAeroEnabled: boolean;
  deratingThresholdKmh: number;
  energyDeploymentPerLapKJ: number;
}
