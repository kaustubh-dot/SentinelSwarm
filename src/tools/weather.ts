import type { Zone } from "./localData";
import { loadMockWeather } from "./localData";
import type { RiskSignal } from "../planner/schema";

export type WeatherRisk = {
  precipitationMm: number;
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

export const getWeatherRisk = async (zone: Zone, forceMock: boolean): Promise<WeatherRisk> => {
  if (forceMock) {
    const mock = loadMockWeather(zone.id);
    return {
      precipitationMm: mock.precipitationMm,
      signal: {
        label: "Weather",
        summary: mock.summary,
        source: "mock",
        scoreImpact: Math.min(mock.precipitationMm * 2, 20)
      }
    };
  }

  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(zone.latitude));
    url.searchParams.set("longitude", String(zone.longitude));
    url.searchParams.set("hourly", "precipitation,rain");
    url.searchParams.set("forecast_days", "1");

    const response = await timeoutFetch(url.toString(), 3000);
    if (!response.ok) {
      throw new Error(`Open-Meteo weather returned ${response.status}`);
    }

    const payload = (await response.json()) as { hourly?: { precipitation?: number[]; rain?: number[] } };
    const precipitationValues = payload.hourly?.precipitation ?? payload.hourly?.rain ?? [];
    const precipitationMm = Math.max(0, ...precipitationValues.filter((value) => Number.isFinite(value)));

    return {
      precipitationMm,
      signal: {
        label: "Weather",
        summary: `Live forecast peak precipitation is ${precipitationMm.toFixed(1)} mm this cycle.`,
        source: "live",
        scoreImpact: Math.min(precipitationMm * 2, 20)
      }
    };
  } catch {
    const mock = loadMockWeather(zone.id);
    return {
      precipitationMm: mock.precipitationMm,
      signal: {
        label: "Weather",
        summary: mock.summary,
        source: "mock",
        scoreImpact: Math.min(mock.precipitationMm * 2, 20)
      }
    };
  }
};
