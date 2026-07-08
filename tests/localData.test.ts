import { describe, expect, it } from "vitest";
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
});
