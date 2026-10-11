import { formatDuration } from "@/lib/format";

const W = 320;
const H = 72;
const PAD = 6;

/** Daily hours for the week as a hand-built SVG line with a dot per day. */
export function Sparkline({ points }: { points: { day: string; minutes: number }[] }) {
  const top = Math.max(60, ...points.map((p) => p.minutes));
  const x = (i: number) => PAD + (i / Math.max(1, points.length - 1)) * (W - PAD * 2);
  const y = (m: number) => PAD + (1 - m / top) * (H - PAD * 2);
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.minutes).toFixed(1)}`).join(" ");
  const label = `Daily hours this week: ${points.map((p) => `${p.day} ${formatDuration(p.minutes)}`).join(", ")}.`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="text-primary h-auto w-full">
      <line x1={PAD} x2={W - PAD} y1={y(0)} y2={y(0)} className="stroke-border" strokeWidth={1} />
      <path d={line} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={p.day} cx={x(i)} cy={y(p.minutes)} r={3} fill="currentColor" />
      ))}
    </svg>
  );
}
