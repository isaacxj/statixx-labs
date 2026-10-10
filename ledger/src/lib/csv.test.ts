import { describe, expect, it } from "vitest";
import { centsToDecimal, csvCell, toCsv } from "./csv";

describe("csv", () => {
  it("quotes cells with commas, quotes and line breaks", () => {
    expect(csvCell("Park & Sons, Roofing")).toBe('"Park & Sons, Roofing"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("a\nb")).toBe('"a\nb"');
    expect(csvCell(null)).toBe("");
    expect(csvCell(12)).toBe("12");
  });
  it("defuses formula-looking text but not numbers", () => {
    expect(csvCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(csvCell(-5)).toBe("-5");
  });
  it("builds CRLF rows with a BOM", () => {
    expect(toCsv(["a", "b"], [[1, "x,y"]])).toBe('﻿a,b\r\n1,"x,y"\r\n');
  });
  it("formats cents as plain decimals", () => {
    expect(centsToDecimal(125050)).toBe("1250.50");
    expect(centsToDecimal(5)).toBe("0.05");
  });
});
