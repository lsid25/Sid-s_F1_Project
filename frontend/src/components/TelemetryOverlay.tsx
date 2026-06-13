"use client";

// ============================================================
// TelemetryOverlay — Multi-chart telemetry comparison
// Pure SVG implementation — no external charting library.
// Renders Speed, RPM, and Acceleration overlays with
// derating zone highlights for 2026 regulation analysis.
// ============================================================

import { useRef, useEffect, useState } from "react";
import { Activity, Zap, Gauge } from "lucide-react";

interface Driver {
  id: number;
  acronym: string;
  name: string;
  team: string;
  color: string;
  number: number;
}

interface TelemetryOverlayProps {
  telemetryData: Record<string, number | boolean>[];
  driver1: Driver;
  driver2: Driver;
}

// ─── Measured Width Hook ──────────────────────────────────────
function useMeasuredWidth(fallback = 700): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    if (!ref.current) return;
    const measure = () => {
      if (ref.current) {
        const w = ref.current.getBoundingClientRect().width;
        if (w > 0) setWidth(Math.floor(w));
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return [ref, width];
}

// ─── SVG Line Chart ───────────────────────────────────────────
interface SVGLineChartProps {
  width: number;
  height: number;
  data: number[][];          // array of series, each series is array of values
  colors: string[];
  labels?: string[];
  yMin: number;
  yMax: number;
  yTickCount?: number;
  yTickFormat?: (v: number) => string;
  thresholdY?: number;
  thresholdLabel?: string;
  deratingIndices?: Set<number>;
  fills?: boolean[];
}

function SVGLineChart({
  width,
  height,
  data,
  colors,
  yMin,
  yMax,
  yTickCount = 5,
  yTickFormat,
  thresholdY,
  thresholdLabel,
  deratingIndices,
  fills,
}: SVGLineChartProps) {
  const padLeft = 44;
  const padRight = 12;
  const padTop = 8;
  const padBottom = 20;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const numPoints = data[0]?.length ?? 0;
  if (numPoints === 0) return null;

  const toX = (i: number) => padLeft + (i / (numPoints - 1)) * plotW;
  const toY = (v: number) => padTop + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

  // Build polyline points string
  const buildPath = (series: number[]) =>
    series.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");

  // Y-axis ticks
  const yTicks: number[] = [];
  for (let i = 0; i <= yTickCount; i++) {
    yTicks.push(yMin + (i / yTickCount) * (yMax - yMin));
  }

  // X-axis ticks (every ~20 points)
  const xTickStep = Math.max(1, Math.floor(numPoints / 8));
  const xTicks: number[] = [];
  for (let i = 0; i < numPoints; i += xTickStep) xTicks.push(i);

  return (
    <svg
      width={width}
      height={height}
      style={{ display: "block", overflow: "visible" }}
    >
      {/* ── Background ──────────────────────────────────────── */}
      <rect x={padLeft} y={padTop} width={plotW} height={plotH} fill="transparent" />

      {/* ── Derating zone shading ────────────────────────────── */}
      {deratingIndices && Array.from(deratingIndices).map((idx) => (
        <rect
          key={idx}
          x={toX(idx) - 3}
          y={padTop}
          width={6}
          height={plotH}
          fill="#ff2d2d"
          opacity={0.15}
        />
      ))}

      {/* ── Grid lines ───────────────────────────────────────── */}
      {yTicks.map((v) => (
        <line
          key={v}
          x1={padLeft}
          y1={toY(v)}
          x2={padLeft + plotW}
          y2={toY(v)}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
        />
      ))}

      {/* ── Threshold line ───────────────────────────────────── */}
      {thresholdY !== undefined && thresholdY >= yMin && thresholdY <= yMax && (
        <>
          <line
            x1={padLeft}
            y1={toY(thresholdY)}
            x2={padLeft + plotW}
            y2={toY(thresholdY)}
            stroke="#ff2d2d"
            strokeWidth={1}
            strokeDasharray="4 4"
            opacity={0.6}
          />
          {thresholdLabel && (
            <text
              x={padLeft + plotW - 4}
              y={toY(thresholdY) - 4}
              textAnchor="end"
              fontSize={8}
              fill="#ff2d2d"
              opacity={0.8}
              fontFamily="monospace"
            >
              {thresholdLabel}
            </text>
          )}
        </>
      )}

      {/* ── Area fills ───────────────────────────────────────── */}
      {data.map((series, si) =>
        fills?.[si] ? (
          <polygon
            key={`fill-${si}`}
            points={[
              `${toX(0).toFixed(1)},${(padTop + plotH).toFixed(1)}`,
              ...series.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`),
              `${toX(series.length - 1).toFixed(1)},${(padTop + plotH).toFixed(1)}`,
            ].join(" ")}
            fill={colors[si]}
            opacity={0.12}
          />
        ) : null
      )}

      {/* ── Data lines ───────────────────────────────────────── */}
      {data.map((series, si) => (
        <polyline
          key={`line-${si}`}
          points={buildPath(series)}
          fill="none"
          stroke={colors[si]}
          strokeWidth={si === 0 ? 2 : 1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 3px ${colors[si]}66)` }}
        />
      ))}

      {/* ── Y-axis labels ────────────────────────────────────── */}
      {yTicks.map((v) => (
        <text
          key={`yl-${v}`}
          x={padLeft - 4}
          y={toY(v) + 3}
          textAnchor="end"
          fontSize={9}
          fill="#888"
          fontFamily="monospace"
        >
          {yTickFormat ? yTickFormat(v) : Math.round(v)}
        </text>
      ))}

      {/* ── X-axis labels ────────────────────────────────────── */}
      {xTicks.map((i) => (
        <text
          key={`xl-${i}`}
          x={toX(i)}
          y={padTop + plotH + 14}
          textAnchor="middle"
          fontSize={9}
          fill="#888"
          fontFamily="monospace"
        >
          {i}
        </text>
      ))}

      {/* ── Axes ─────────────────────────────────────────────── */}
      <line
        x1={padLeft}
        y1={padTop}
        x2={padLeft}
        y2={padTop + plotH}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={1}
      />
      <line
        x1={padLeft}
        y1={padTop + plotH}
        x2={padLeft + plotW}
        y2={padTop + plotH}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={1}
      />
    </svg>
  );
}

// ─── Chart Section Wrapper ────────────────────────────────────
function ChartSection({
  title,
  icon,
  children,
  accentColor,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  accentColor: string;
}) {
  return (
    <div
      className="carbon-card p-4"
      style={{ borderTop: `2px solid ${accentColor}` }}
    >
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3
          className="text-xs font-mono font-bold uppercase tracking-widest"
          style={{ color: "var(--f1-white)" }}
        >
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function TelemetryOverlay({
  telemetryData,
  driver1,
  driver2,
}: TelemetryOverlayProps) {
  const [containerRef, chartWidth] = useMeasuredWidth(700);
  const d1Color = driver1.color;
  const d2Color = driver2.color;

  // Extract series data
  const speed1 = telemetryData.map((d) => d[`driver_${driver1.id}_speed`] as number);
  const speed2 = telemetryData.map((d) => d[`driver_${driver2.id}_speed`] as number);
  const rpm1 = telemetryData.map((d) => d[`driver_${driver1.id}_rpm`] as number);
  const rpm2 = telemetryData.map((d) => d[`driver_${driver2.id}_rpm`] as number);
  const accel1 = telemetryData.map((d) => d[`driver_${driver1.id}_accel`] as number);
  const accel2 = telemetryData.map((d) => d[`driver_${driver2.id}_accel`] as number);

  // Derating zone indices
  const deratingIndices = new Set<number>(
    telemetryData
      .filter((d) => d[`driver_${driver1.id}_derating`] || d[`driver_${driver2.id}_derating`])
      .map((d) => d.time_index as number)
  );

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* ── Driver Legend Header ──────────────────────────────── */}
      <div className="carbon-card px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              className="inline-block rounded-full"
              style={{ width: 24, height: 3, backgroundColor: d1Color, boxShadow: `0 0 6px ${d1Color}` }}
            />
            <span className="text-xs font-mono font-bold" style={{ color: d1Color }}>
              #{driver1.number} {driver1.acronym}
            </span>
            <span className="text-xs font-mono" style={{ color: "var(--f1-silver-dim)" }}>
              {driver1.team}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block rounded-full"
              style={{ width: 24, height: 3, backgroundColor: d2Color, boxShadow: `0 0 6px ${d2Color}` }}
            />
            <span className="text-xs font-mono font-bold" style={{ color: d2Color }}>
              #{driver2.number} {driver2.acronym}
            </span>
            <span className="text-xs font-mono" style={{ color: "var(--f1-silver-dim)" }}>
              {driver2.team}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block rounded-sm"
            style={{ width: 8, height: 8, backgroundColor: "#ff2d2d", opacity: 0.6 }}
          />
          <span className="text-xs font-mono" style={{ color: "#ff2d2d" }}>
            Derating Zone (MGU-K depleted)
          </span>
        </div>
      </div>

      {/* ── Chart 1: Speed Overlay ────────────────────────────── */}
      <ChartSection
        title="Velocity Profile (km/h)"
        icon={<Gauge size={14} style={{ color: "var(--f1-neon-blue)" }} />}
        accentColor="var(--f1-neon-blue)"
      >
        <SVGLineChart
          width={chartWidth - 32}
          height={220}
          data={[speed1, speed2]}
          colors={[d1Color, d2Color]}
          yMin={0}
          yMax={360}
          yTickCount={6}
          thresholdY={290}
          thresholdLabel="290 km/h Derating"
          deratingIndices={deratingIndices}
          fills={[true, true]}
        />
      </ChartSection>

      {/* ── Chart 2: RPM Overlay ──────────────────────────────── */}
      <ChartSection
        title="Engine RPM"
        icon={<Activity size={14} style={{ color: "var(--f1-neon-orange)" }} />}
        accentColor="var(--f1-neon-orange)"
      >
        <SVGLineChart
          width={chartWidth - 32}
          height={180}
          data={[rpm1, rpm2]}
          colors={[d1Color, d2Color]}
          yMin={6000}
          yMax={15000}
          yTickCount={5}
          yTickFormat={(v) => `${(v / 1000).toFixed(0)}k`}
          deratingIndices={deratingIndices}
        />
      </ChartSection>

      {/* ── Chart 3: Acceleration (dv/dt) ────────────────────── */}
      <ChartSection
        title="Acceleration Δv/Δt (km/h per sample)"
        icon={<Zap size={14} style={{ color: "var(--f1-neon-green)" }} />}
        accentColor="var(--f1-neon-green)"
      >
        <SVGLineChart
          width={chartWidth - 32}
          height={160}
          data={[accel1, accel2]}
          colors={[d1Color, d2Color]}
          yMin={-60}
          yMax={60}
          yTickCount={6}
          deratingIndices={deratingIndices}
        />
        <p className="text-xs font-mono mt-2" style={{ color: "var(--f1-silver-dim)" }}>
          Negative acceleration at high speed (above 290 km/h) with full throttle indicates a{" "}
          <span style={{ color: "#ff2d2d" }}>derating event</span> — MGU-K battery depleted,
          ICE alone cannot sustain top speed.
        </p>
      </ChartSection>
    </div>
  );
}
