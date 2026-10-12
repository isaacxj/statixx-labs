import { describe, expect, it } from "vitest";
import { initialsFor, resolveViewer } from "./viewer";

describe("viewer", () => {
  it("treats emails in TEAM_EMAILS as team, ignoring case and spacing", () => {
    expect(resolveViewer("Isaac@statixx.dev", "a@x.com, isaac@statixx.dev").variant).toBe("team");
  });
  it("treats any other email as a client", () => {
    expect(resolveViewer("pat@client.com", "isaac@statixx.dev").variant).toBe("client");
    expect(resolveViewer("pat@client.com", undefined).variant).toBe("client");
  });
  it("builds initials from the local part", () => {
    expect(initialsFor("isaac.joseph@x.com")).toBe("IJ");
    expect(initialsFor("dev@localhost")).toBe("DE");
  });
});
