import css from "../globals.css?raw";
import { contrastRatio, oklchToLinear, over, parseOklch, readTokens, type Rgb } from "@/lib/contrast";
import { Badge } from "@/components/ui/badge";

// [foreground token, background token, label, minimum ratio]
const pairs: [string, string, string, number][] = [
  ["foreground", "background", "Body text", 4.5],
  ["card-foreground", "card", "Card text", 4.5],
  ["popover-foreground", "popover", "Overlay text", 4.5],
  ["muted-foreground", "background", "Muted text on page", 4.5],
  ["muted-foreground", "muted", "Muted text on muted", 4.5],
  ["secondary-foreground", "secondary", "Secondary button", 4.5],
  ["primary-foreground", "primary", "Primary button", 4.5],
  ["accent-foreground", "accent", "Accent text", 4.5],
  ["sidebar-foreground", "sidebar", "Sidebar text", 4.5],
  ["success", "background", "Success text", 4.5],
  ["warning", "background", "Warning text", 4.5],
  ["destructive", "background", "Danger text", 4.5],
  ["info", "background", "Info text", 4.5],
  ["ring", "background", "Focus ring", 3],
];

// Badges draw their text over a 10% tint of the same color on the page background.
const tinted = ["success", "warning", "destructive", "info"];

function resolve(tokens: Record<string, string>, name: string): Rgb {
  const parsed = parseOklch(tokens[name] ?? "");
  return parsed ? oklchToLinear(parsed) : [0, 0, 0];
}

function audit(tokens: Record<string, string>) {
  const rows = pairs.map(([fg, bg, label, min]) => ({
    label, fg, bg, min, ratio: contrastRatio(resolve(tokens, fg), resolve(tokens, bg)),
  }));
  for (const t of tinted) {
    const bg = over(resolve(tokens, t), 0.1, resolve(tokens, "background"));
    rows.push({ label: `${t} badge`, fg: t, bg: `${t}/10`, min: 4.5, ratio: contrastRatio(resolve(tokens, t), bg) });
  }
  return rows;
}

export function ContrastAudit() {
  const light = readTokens(css, ":root");
  const dark = { ...light, ...readTokens(css, ".dark") };
  const themes = [["Light", audit(light)], ["Dark", audit(dark)]] as const;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {themes.map(([name, rows]) => {
        const failing = rows.filter((r) => r.ratio < r.min).length;
        return (
          <div key={name} className="rounded-md border bg-card">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="text-sm font-medium">{name} theme</span>
              <Badge variant={failing ? "danger" : "success"}>{failing ? `${failing} below target` : "All pass"}</Badge>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="border-b last:border-0">
                    <td className="px-3 py-1.5">{r.label}</td>
                    <td className="tabular px-3 py-1.5 text-right text-muted-foreground">{r.ratio.toFixed(2)}:1</td>
                    <td className="tabular px-3 py-1.5 text-right text-muted-foreground">≥ {r.min}</td>
                    <td className="px-3 py-1.5 text-right">
                      <Badge variant={r.ratio >= r.min ? "success" : "danger"}>{r.ratio >= r.min ? "Pass" : "Fail"}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
