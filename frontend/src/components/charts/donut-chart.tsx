export interface DonutChartDatum {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutChartDatum[];
  size?: number;
  stroke?: number;
  totalLabel?: string;
}

/** Gráfico de rosca em SVG puro (Clone do Protótipo 1) — porta fiel do Protótipo 1 (`donutChart`). */
export function DonutChart({ data, size = 168, stroke = 22, totalLabel = "total" }: DonutChartProps) {
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const total = data.reduce((a, d) => a + d.value, 0);

  const segmentos = data.reduce<Array<DonutChartDatum & { len: number; offset: number }>>((acc, d) => {
    const anterior = acc[acc.length - 1];
    const offset = anterior ? anterior.offset + anterior.len : 0;
    const frac = total > 0 ? d.value / total : 0;
    const len = frac * circumference;
    return [...acc, { ...d, len, offset }];
  }, []);

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Gráfico de rosca">
        {segmentos.map((d, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={stroke}
            strokeDasharray={`${d.len} ${circumference - d.len}`}
            strokeDashoffset={-d.offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          >
            <title>{`${d.label}: ${d.value}`}</title>
          </circle>
        ))}
        <text x={cx} y={cy - 3} textAnchor="middle" fontSize={18} fontWeight={800} fill="var(--foreground)">
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={10} fill="var(--muted-faint)">
          {totalLabel}
        </text>
      </svg>
      <div className="flex flex-col gap-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: d.color }} />
            {d.label} <strong className="ml-0.5 text-foreground">{d.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
