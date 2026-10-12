import { describe, expect, it } from "vitest";
import { buildPaletteItems } from "./palette";

describe("buildPaletteItems", () => {
  it("lists pages, then clients, then projects with their client as the hint", () => {
    const items = buildPaletteItems([{ id: 2, name: "Acme" }], [{ id: 7, name: "Site rebuild", clientName: "Acme" }]);
    expect(items.slice(0, 4).map((i) => i.href)).toEqual(["/", "/clients", "/digest", "/design"]);
    expect(items.find((i) => i.id === "client-2")).toMatchObject({ group: "Clients", href: "/clients/2" });
    expect(items.find((i) => i.id === "project-7")).toMatchObject({ group: "Projects", hint: "Acme", href: "/projects/7" });
  });

  it("still offers the pages when there are no clients or projects", () => {
    expect(buildPaletteItems([], [])).toHaveLength(4);
  });
});
