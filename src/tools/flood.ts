import type { Zone } from "./localData";
import { loadMockFlood } from "./localData";
import type { RiskSignal } from "../planner/schema";

export type FloodRisk = {
  floodRiskIndex: number;
  signal: RiskSignal;
};

const timeoutFetch = async (url: string, timeoutMs: number): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const finiteNumbers = (values: unknown): number[] => {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.filter((value): value is number => Number.isFinite(value));
};

export const getFloodRisk = async (zone: Zone, forceMock: boolean): Promise<FloodRisk> => {
  if (forceMock) {
    const mock = loadMockFlood(zone.id);
    return {
      floodRiskIndex: mock.floodRiskIndex,
      signal: {
        label: "Flood",
        summary: mock.summary,
        source: "mock",
        scoreImpact: Math.min(mock.floodRiskIndex * 25, 25)
      }
    };
  }

  try {
    const url = new URL("https://flood-api.open-meteo.com/v1/flood");
    url.searchParams.set("latitude", String(zone.latitude));
    url.searchParams.set("longitude", String(zone.longitude));
    url.searchParams.set("daily", "river_discharge,river_discharge_mean");
    url.searchParams.set("forecast_days", "3");

    const response = await timeoutFetch(url.toString(), 3000);
    if (!response.ok) {
      throw new Error(`Open-Meteo flood returned ${response.status}`);
    }

    const payload = (await response.json()) as {
      daily?: {
        river_discharge?: number[];
        river_discharge_mean?: number[];
      };
    };

    const dischargeValues = finiteNumbers(payload.daily?.river_discharge);
    const meanValues = finiteNumbers(payload.daily?.river_discharge_mean).filter((value) => value > 0);
    if (dischargeValues.length === 0 || meanValues.length === 0) {
      throw new Error("Open-Meteo flood payload did not include discharge values");
    }

    const discharge = Math.max(0, ...dischargeValues);
    const mean = Math.max(1, ...meanValues);
    const floodRiskIndex = Math.min(discharge / mean, 1.5);

    return {
      floodRiskIndex,
      signal: {
        label: "Flood",
        summary: `Live river discharge is ${(floodRiskIndex * 100).toFixed(0)}% of the local risk baseline.`,
        source: "live",
        scoreImpact: Math.min(floodRiskIndex * 25, 25)
      }
    };
  } catch {
    const mock = loadMockFlood(zone.id);
    return {
      floodRiskIndex: mock.floodRiskIndex,
      signal: {
        label: "Flood",
        summary: mock.summary,
        source: "mock",
        scoreImpact: Math.min(mock.floodRiskIndex * 25, 25)
      }
    };
  }
};
