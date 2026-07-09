import { afterEach, describe, expect, it, vi } from "vitest";
import { getFloodRisk } from "../src/tools/flood";
import { getWeatherRisk } from "../src/tools/weather";
import { findZone, loadLocalData } from "../src/tools/localData";

const zoneB = () => findZone(loadLocalData().zones, "Zone B");

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("risk tools", () => {
  it("does not call network when mock mode is forced", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const weather = await getWeatherRisk(zoneB(), true);
    const flood = await getFloodRisk(zoneB(), true);

    expect(weather.signal.source).toBe("mock");
    expect(flood.signal.source).toBe("mock");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("falls back to mock signals when live APIs fail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down"))
    );

    const weather = await getWeatherRisk(zoneB(), false);
    const flood = await getFloodRisk(zoneB(), false);

    expect(weather.signal.source).toBe("mock");
    expect(flood.signal.source).toBe("mock");
    expect(weather.precipitationMm).toBeGreaterThan(0);
    expect(flood.floodRiskIndex).toBeGreaterThan(0);
  });

  it("falls back to mock signals when live APIs return malformed success payloads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ hourly: { precipitation: [] } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ daily: { river_discharge: [], river_discharge_mean: [] } })
        })
    );

    const weather = await getWeatherRisk(zoneB(), false);
    const flood = await getFloodRisk(zoneB(), false);

    expect(weather.signal.source).toBe("mock");
    expect(flood.signal.source).toBe("mock");
    expect(weather.precipitationMm).toBeGreaterThan(0);
    expect(flood.floodRiskIndex).toBeGreaterThan(0);
  });
});
