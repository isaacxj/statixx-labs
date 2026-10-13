import { formatUptime, type DayUptime } from "@/lib/uptime";

function tone(pct: number | null) {
  if (pct === null) return "bg-muted";
  if (pct >= 99.9) return "bg-status-up";
  if (pct >= 95) return "bg-status-degraded";
  return "bg-status-down";
}

export function UptimeBars({ days }: { days: DayUptime[] }) {
  const withData = days.filter((d) => d.pct !== null);
  const avg = withData.length ? withData.reduce((s, d) => s + (d.pct as number), 0) / withData.length : null;
  return (
    <div>
      <div className="flex h-10 gap-px" role="img" aria-label={`Daily uptime for the last ${days.length} days, average ${formatUptime(avg)}`}>
        {days.map((d) => (
          <div key={d.day} title={`${d.day}: ${d.pct === null ? "no data" : `${formatUptime(d.pct)} (${d.checks} checks)`}`} className={`${tone(d.pct)} min-w-0 flex-1 rounded-[1px]`} />
        ))}
      </div>
      <div className="text-muted-foreground mt-2 flex items-center justify-between font-mono text-xs tabular-nums">
        <span>{days.length} days ago</span>
        <span>{formatUptime(avg)} average</span>
        <span>Today</span>
      </div>
    </div>
  );
}
