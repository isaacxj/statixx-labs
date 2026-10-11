import { formatDuration } from "@/lib/format";
import type { BurnPoint } from "@/lib/budget";

const W = 640;
const H = 220;
const PAD = { l: 44, r: 12, t: 12, b: 24 };

/** Hours logged over time against the budget line. Hand-built SVG. */
export function BurnChart({ points, budgetMinutes, color }: { points: BurnPoint[]; budgetMinutes: number | null; color: string }) {
  if (points.length === 0) return null;
  const maxMin = Math.max(budgetMinutes ?? 0, points[points.length - 1].minutes, 60);
  const top = Math.ceil(maxMin / 60) * 60;
  const x = (i: number) => PAD.l + (points.length === 1 ? (W - PAD.l - PAD.r) / 2 : (i / (points.length - 1)) * (W - PAD.l - PAD.r));
  const y = (m: number) => PAD.t + (1 - m / top) * (H - PAD.t - PAD.b);
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.minutes).toFixed(1)}`).join(" ");
  const ticks = [0, 0.5, 1].map((f) => Math.round(top * f));
  const last = points[points.length - 1];
  const label = `Burn chart: ${formatDuration(last.minutes)} hours logged${budgetMinutes ? ` of ${formatDuration(budgetMinutes)} budgeted` : ""}.`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="text-muted-foreground h-auto w-full">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} className="stroke-border" strokeWidth={1} />
          <text x={PAD.l - 6} y={y(t) + 4} textAnchor="end" className="fill-current font-mono text-[11px]">
            {formatDuration(t)}
          </text>
        </g>
      ))}
      {budgetMinutes !== null && budgetMinutes > 0 && (
        <g>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(budgetMinutes)} y2={y(budgetMinutes)} className="stroke-warning" strokeWidth={1.5} strokeDasharray="5 4" />
          <text x={W - PAD.r} y={y(budgetMinutes) - 5} textAnchor="end" className="fill-warning text-[11px]">
            Budget
          </text>
        </g>
      )}
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(points.length - 1)} cy={y(last.minutes)} r={3.5} fill={color} />
      <text x={PAD.l} y={H - 6} className="fill-current text-[11px]">
        {points[0].day}
      </text>
      <text x={W - PAD.r} y={H - 6} textAnchor="end" className="fill-current text-[11px]">
        {last.day}
      </text>
    </svg>
  );
}
