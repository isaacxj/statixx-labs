import { formatLatency } from "@/lib/monitors";
import type { Bucket } from "@/lib/uptime";

const W = 720;
const H = 200;
const PAD = { l: 58, r: 8, t: 8, b: 24 };

function fmtTick(ms: number, withDate: boolean) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", ...(withDate ? { month: "short", day: "numeric" } : { hour: "numeric", minute: "2-digit" }) }).format(new Date(ms));
}

export function ResponseChart({ buckets, label, withDate }: { buckets: Bucket[]; label: string; withDate: boolean }) {
  const vals = buckets.map((b) => b.avgLatencyMs).filter((v): v is number => v !== null);
  if (vals.length === 0) {
    return <p className="text-muted-foreground flex h-48 items-center justify-center text-sm">No successful checks in this range yet.</p>;
  }
  const max = Math.max(...vals) * 1.1 || 1;
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (buckets.length === 1 ? iw / 2 : (i / (buckets.length - 1)) * iw);
  const y = (v: number) => PAD.t + ih - (v / max) * ih;
  // A gap (bucket without a successful check) starts a new sub-path.
  let d = "";
  let pen = false;
  buckets.forEach((b, i) => {
    if (b.avgLatencyMs === null) { pen = false; return; }
    d += `${pen ? "L" : "M"}${x(i).toFixed(1)} ${y(b.avgLatencyMs).toFixed(1)}`;
    pen = true;
  });
  const ticks = [0, 0.5, 1].map((f) => Math.round(max * f));
  return (
    <div className="overflow-x-auto">
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="h-auto min-w-[34rem] w-full">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth="1" />
          <text x={PAD.l - 6} y={y(t) + 4} textAnchor="end" className="fill-muted-foreground font-mono text-[13px]">{formatLatency(t)}</text>
        </g>
      ))}
      <path d={d} fill="none" stroke="var(--primary)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      {buckets.map((b, i) =>
        b.failures > 0 ? (
          <g key={b.start}>
            <title>{`${fmtTick(b.start, true)}: ${b.failures} failed of ${b.checks} checks`}</title>
            <line x1={x(i)} x2={x(i)} y1={PAD.t} y2={PAD.t + ih} stroke="var(--status-down)" strokeWidth="2" strokeDasharray="3 3" />
            <circle cx={x(i)} cy={PAD.t + ih} r="3.5" fill="var(--status-down)" />
          </g>
        ) : null,
      )}
      <text x={PAD.l} y={H - 6} className="fill-muted-foreground font-mono text-[13px]">{fmtTick(buckets[0].start, withDate)}</text>
      <text x={W - PAD.r} y={H - 6} textAnchor="end" className="fill-muted-foreground font-mono text-[13px]">Now</text>
    </svg>
    </div>
  );
}
