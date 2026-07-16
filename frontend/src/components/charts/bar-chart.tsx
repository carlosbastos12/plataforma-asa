"use client";

import { useContainerWidth } from "./use-container-width";
import { formatarMoeda } from "@/lib/mock-data";

export interface BarChartDatum {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartDatum[];
  height?: number;
  color?: string;
  currency?: boolean;
}

/** Gráfico de barras em SVG puro (P036) — porta fiel do Protótipo 1 (`barChart`). */
export function BarChart({ data, height = 220, color = "var(--primary)", currency }: BarChartProps) {
  const { ref, width: w } = useContainerWidth();
  const padL = 34;
  const padB = 26;
  const padT = 10;
  const padR = 10;
  const innerW = Math.max(w - padL - padR, 1);
  const innerH = height - padT - padB;
  const max = Math.max(...data.map((d) => d.value), 1) * 1.15;
  const barGap = innerW / (data.length || 1);
  const barW = Math.min(34, barGap * 0.5);

  const gridCount = 4;
  const grid = Array.from({ length: gridCount + 1 }, (_, i) => {
    const y = padT + (innerH / gridCount) * i;
    const val = Math.round(max - (max / gridCount) * i);
    return { y, val };
  });

  const fmt = (v: number) => (currency ? formatarMoeda(v).replace(",00", "") : v >= 1000 ? `${Math.round(v / 1000)}k` : String(v));

  return (
    <div ref={ref} className="w-full">
      <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} role="img" aria-label="Gráfico de barras">
        {grid.map((g, i) => (
          <g key={i}>
            <line x1={padL} y1={g.y} x2={w - padR} y2={g.y} stroke="var(--border)" strokeWidth={1} />
            <text x={padL - 8} y={g.y + 4} fontSize={10} textAnchor="end" fill="var(--muted-faint)">
              {fmt(g.val)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = padL + barGap * i + (barGap - barW) / 2;
          const barH = (d.value / max) * innerH;
          const y = padT + innerH - barH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} rx={4} fill={d.color ?? color}>
                <title>{`${d.label}: ${currency ? formatarMoeda(d.value) : d.value}`}</title>
              </rect>
              <text x={x + barW / 2} y={height - 6} fontSize={10.5} textAnchor="middle" fill="var(--muted-foreground)">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
