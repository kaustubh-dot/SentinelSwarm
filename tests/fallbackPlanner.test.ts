import { describe, expect, it } from "vitest";
import { createFallbackPlan } from "../src/planner/fallbackPlanner";
import { loadMockContext, loadLocalData, findZone } from "../src/tools/localData";

describe("createFallbackPlan", () => {
  it("creates a complete Zone B plan from local fallback data", () => {
    const localData = loadLocalData();
    const zone = findZone(localData.zones, "Zone B");
    const plan = createFallbackPlan({
      zone,
      localData,
      evidence: loadMockContext(),
      contextStatus: "mock",
      weather: {
        precipitationMm: 8.4,
        signal: {
          label: "Weather",
          summary: "Mock weather",
          source: "mock",
          scoreImpact: 16
        }
      },
      flood: {
        floodRiskIndex: 0.92,
        signal: {
          label: "Flood",
          summary: "Mock flood",
          source: "mock",
          scoreImpact: 23
        }
      }
    });

    expect(plan.zoneName).toBe("Zone B");
    expect(plan.evidence.length).toBeGreaterThanOrEqual(3);
    expect(plan.routeActions.some((route) => route.status === "blocked")).toBe(true);
    expect(plan.resourceMatches.length).toBeGreaterThanOrEqual(3);
    expect(plan.recommendedActions.length).toBeGreaterThanOrEqual(3);
  });

  it("creates a complete Zone A plan from local fallback data", () => {
    const localData = loadLocalData();
    const zone = findZone(localData.zones, "Zone A");
    const plan = createFallbackPlan({
      zone,
      localData,
      evidence: loadMockContext(),
      contextStatus: "mock",
      weather: {
        precipitationMm: 9.1,
        signal: {
          label: "Weather",
          summary: "Mock Zone A weather",
          source: "mock",
          scoreImpact: 18
        }
      },
      flood: {
        floodRiskIndex: 0.78,
        signal: {
          label: "Flood",
          summary: "Mock Zone A flood",
          source: "mock",
          scoreImpact: 19
        }
      }
    });

    expect(plan.zoneName).toBe("Zone A");
    expect(plan.evidence.length).toBeGreaterThanOrEqual(3);
    expect(plan.routeActions.some((route) => route.routeName.includes("Canal Bridge") && route.status === "blocked")).toBe(true);
    expect(plan.routeActions.some((route) => route.routeName.includes("East Bypass") && route.status === "open")).toBe(true);
    expect(plan.resourceMatches.some((match) => match.name.includes("Hill School"))).toBe(true);
    expect(plan.resourceMatches.some((match) => match.name === "water bottles")).toBe(true);
    expect(plan.recommendedActions.length).toBeGreaterThanOrEqual(3);
  });
});
