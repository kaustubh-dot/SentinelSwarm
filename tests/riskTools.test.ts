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

  it("parses successful live weather and flood payloads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            hourly: {
              precipitation: [0.2, 4.4, 8.1],
              rain: [1, 2, 3]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            daily: {
              river_discharge: [8, 12],
              river_discharge_mean: [10, 20]
            }
          })
        })
    );

    const weather = await getWeatherRisk(zoneB(), false);
    const flood = await getFloodRisk(zoneB(), false);

    expect(weather.signal.source).toBe("live");
    expect(weather.precipitationMm).toBe(8.1);
    expect(weather.signal.scoreImpact).toBeCloseTo(16.2);
    expect(flood.signal.source).toBe("live");
    expect(flood.floodRiskIndex).toBeCloseTo(0.6);
    expect(flood.signal.scoreImpact).toBeCloseTo(15);
  });

  it("uses live rain values when precipitation is absent and filters non-finite weather values", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          hourly: {
            precipitation: [Number.NaN, Number.POSITIVE_INFINITY],
            rain: [0, Number.NaN, 5.5]
          }
        })
      })
    );

    const weather = await getWeatherRisk(zoneB(), false);

    expect(weather.signal.source).toBe("live");
    expect(weather.precipitationMm).toBe(5.5);
    expect(weather.signal.scoreImpact).toBe(11);
  });

  it("filters invalid flood values and clamps high live flood risk", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          daily: {
            river_discharge: [Number.NaN, 20, Number.POSITIVE_INFINITY],
            river_discharge_mean: [0, Number.NaN, 10]
          }
        })
      })
    );

    const flood = await getFloodRisk(zoneB(), false);

    expect(flood.signal.source).toBe("live");
    expect(flood.floodRiskIndex).toBe(1.5);
    expect(flood.signal.scoreImpact).toBe(25);
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
