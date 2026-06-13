// ============================================================
// F1 2026 Predictor — API Client
// Centralised HTTP client for FastAPI backend communication
// ============================================================

import axios, { AxiosInstance, AxiosResponse } from "axios";
import {
  ProcessedTelemetry,
  SimulationRequest,
  SimulationResult,
} from "@/types/f1";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30_000,
});

// ─── Predictor Endpoints ─────────────────────────────────────

export async function runSimulation(
  payload: SimulationRequest
): Promise<SimulationResult> {
  const response: AxiosResponse<SimulationResult> = await apiClient.post(
    "/api/predict/simulate",
    payload
  );
  return response.data;
}

// ─── Telemetry Endpoints ─────────────────────────────────────

export async function getTelemetryComparison(
  sessionKey: string,
  driver1: number,
  driver2: number
): Promise<ProcessedTelemetry> {
  const response: AxiosResponse<ProcessedTelemetry> = await apiClient.get(
    "/api/telemetry/compare",
    {
      params: { session_key: sessionKey, driver1, driver2 },
    }
  );
  return response.data;
}

// ─── Health Check ─────────────────────────────────────────────

export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await apiClient.get("/health");
    return response.status === 200;
  } catch {
    return false;
  }
}
