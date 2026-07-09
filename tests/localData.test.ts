import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { findZone, loadLocalData, loadMockContext, loadMockFlood, loadMockWeather } from "../src/tools/localData";

describe("localData", () => {
  it("loads all required demo datasets and Zone B fallback signals", () => {
    const data = loadLocalData();
    const zone = findZone(data.zones, "Zone B");

    expect(zone.name).toBe("Zone B");
    expect(data.volunteers.length).toBeGreaterThan(0);
    expect(data.supplies.length).toBeGreaterThan(0);
    expect(data.routes.some((route) => route.zoneId === zone.id)).toBe(true);
    expect(data.shelters.some((shelter) => shelter.zoneId === zone.id)).toBe(true);
    expect(loadMockContext().some((item) => item.text.includes("Zone B"))).toBe(true);
    expect(loadMockWeather(zone.id).summary).toBeTruthy();
    expect(loadMockFlood(zone.id).summary).toBeTruthy();
  });

  it("uses built-in fallback data when local JSON files are missing", () => {
    const originalCwd = process.cwd();
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sentinelswarm-data-"));

    try {
      process.chdir(tempDir);

      const data = loadLocalData();
      const zone = findZone(data.zones, "Zone B");

      expect(zone.name).toBe("Zone B");
      expect(data.volunteers.some((volunteer) => volunteer.zonePreference === zone.id)).toBe(true);
      expect(data.routes.some((route) => route.zoneId === zone.id && route.status === "blocked")).toBe(true);
      expect(loadMockContext().some((item) => item.text.includes("Zone B"))).toBe(true);
      expect(loadMockWeather(zone.id).source).toBe("mock");
      expect(loadMockFlood(zone.id).source).toBe("mock");
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
