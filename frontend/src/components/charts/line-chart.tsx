"use client";

import { useId } from "react";
import { useContainerWidth } from "./use-container-width";
import { formatarMoeda } from "@/lib/mock-data";

export interface LineChartSerie {
  data: number[];
  color: string;
  labels?: string[];
  area?: boolean;
}

interface LineChartProps {
  series: LineChartSerie[];
  xLabels?: string[];
  height?: number;
  currency?: boolean;
}

/**
 * Gráfico de linha em SVG puro (P036) — porta fiel do motor do Protótipo 1
 * (`assets/js/main.js`, `lineChart`): mesma matemática de grid, área e
 * pontos, agora responsivo via `ResizeObserver` em vez de leitura única.
 */
export function LineChart({ series, xLabels, height = 220, currency }: LineChartProps) {
  const { ref, width: w } = useContainerWidth();
  const uid = useId();
  const padL = 40;
  const padB = 22;
  const padT = 14;
  const padR = 14;
  const innerW = Math.max(w - padL - padR, 1);
  const innerH = height - padT - padB;
  const allVals = series.flatMap((s) => s.data);
  const max = Math.max(...allVals, 1) * 1.2;
  const n = series[0]?.data.length ?? 0;
  const stepX = n > 1 ? innerW / (n - 1) : 0;

  const gridCount = 4;
  const grid = Array.from({ length: gridCount + 1 }, (_, i) => {
    const y = padT + (innerH / gridCount) * i;
    const val = Math.round(max - (max / gridCount) * i);
    return { y, val };
  });

  const fmt = (v: number) => (currency ? formatarMoeda(v).replace(",00", "") : v >= 1000 ? `${Math.round(v / 1000)}k` : String(v));

  return (
    <div ref={ref} className="w-full">
      <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} role="img" aria-label="Gráfico de linha">
        {grid.map((g, i) => (
          <g key={i}>
            <line x1={padL} y1={g.y} x2={w - padR} y2={g.y} stroke="var(--border)" strokeWidth={1} />
            <text x={padL - 8} y={g.y + 4} fontSize={10} textAnchor="end" fill="var(--muted-faint)">
              {fmt(g.val)}
            </text>
          </g>
        ))}
        {series.map((s, si) => {
          const pts = s.data.map((v, i) => {
            const x = padL + stepX * i;
            const y = padT + innerH - (v / max) * innerH;
            return [x, y] as const;
          });
          const d = pts.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(" ");
          const areaD = `${d} L ${pts[pts.length - 1][0]} ${padT + innerH} L ${pts[0][0]} ${padT + innerH} Z`;
          return (
            <g key={si}>
              {s.area !== false && <path d={areaD} fill={s.color} opacity={0.08} />}
              <path d={d} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
              {pts.map((p, i) => (
                <circle key={i} cx={p[0]} cy={p[1]} r={3} fill="var(--card)" stroke={s.color} strokeWidth={2}>
                  <title>
                    {(s.labels?.[i] ?? "") + ": " + (currency ? formatarMoeda(s.data[i]) : s.data[i])}
                  </title>
                </circle>
              ))}
            </g>
          );
        })}
        {xLabels?.map((lab, i) => (
          <text key={i + uid} x={padL + stepX * i} y={height - 4} fontSize={10} textAnchor="middle" fill="var(--muted-faint)">
            {lab}
          </text>
        ))}
      </svg>
    </div>
  );
}
