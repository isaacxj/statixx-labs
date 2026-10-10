/** Quotes a cell when it holds a comma, quote, or line break; doubles inner quotes. */
export function csvCell(value: string | number | null | undefined): string {
  let text = value == null ? "" : String(value);
  // Keep spreadsheets from running a cell that starts like a formula.
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Rows to CSV text with CRLF line endings and a leading BOM so Excel reads UTF-8. */
export function toCsv(header: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [header, ...rows].map((r) => r.map(csvCell).join(","));
  return `﻿${lines.join("\r\n")}\r\n`;
}

/** Cents to a plain decimal such as "1250.50", without currency symbols or grouping. */
export const centsToDecimal = (cents: number) => (cents / 100).toFixed(2);
