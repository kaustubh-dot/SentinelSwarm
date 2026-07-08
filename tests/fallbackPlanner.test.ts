import { describe, expect, it } from "vitest";
import { createFallbackPlan } from "../src/planner/fallbackPlanner";
import { parseIncidentReport } from "../src/planner/incidentParser";
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
    expect(plan.resourceMatches.some((match) => match.type === "supply" && match.name === "water cans")).toBe(true);
    expect(plan.resourceMatches.some((match) => match.type === "supply" && match.name === "water bottles")).toBe(false);
    expect(plan.recommendedActions.length).toBeGreaterThanOrEqual(3);
  });

  it("does not mutate local shelter ordering while choosing the best shelter", () => {
    const localData = loadLocalData();
    const originalShelterOrder = localData.shelters.map((shelter) => shelter.id);
    const zone = findZone(localData.zones, "Zone B");

    createFallbackPlan({
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

    expect(localData.shelters.map((shelter) => shelter.id)).toEqual(originalShelterOrder);
  });

  it("adapts Zone A route guidance from live-style Slack evidence", () => {
    const localData = loadLocalData();
    const incident = parseIncidentReport("heavy rain near Zone A, water rising, 25 people need evacuation, route bridge blocked");
    const zone = findZone(localData.zones, incident.zoneInput);
    const plan = createFallbackPlan({
      zone,
      localData,
      incident,
      evidence: [
        {
          id: "current-report",
          source: "Current Slack field report",
          channel: "#field-reports",
          text: "Zone A field update: heavy rain, rising water, 25 people need evacuation.",
          confidence: 0.94,
          sourceType: "slack"
        },
        {
          id: "route-update",
          source: "Live Slack channel scan",
          channel: "#routes",
          text: "Zone A route update: Route R2 over Canal Bridge is blocked. Route R4 via East Bypass is open for emergency vehicles.",
          confidence: 0.78,
          sourceType: "slack"
        }
      ],
      contextStatus: "slack",
      weather: {
        precipitationMm: 8.4,
        signal: {
          label: "Weather",
          summary: "Live weather",
          source: "live",
          scoreImpact: 16
        }
      },
      flood: {
        floodRiskIndex: 0.75,
        signal: {
          label: "Flood",
          summary: "Live flood",
          source: "live",
          scoreImpact: 19
        }
      }
    });

    expect(plan.zoneName).toBe("Zone A");
    expect(plan.summary).toContain("25 reported affected people");
    expect(plan.statuses.context).toBe("slack");
    expect(plan.routeActions.find((route) => route.routeName.includes("R2"))?.status).toBe("blocked");
    expect(plan.routeActions.find((route) => route.routeName.includes("R4"))?.status).toBe("open");
    expect(plan.resourceMatches.some((match) => match.type === "supply" && match.name === "water bottles")).toBe(true);
    expect(plan.resourceMatches.some((match) => match.type === "supply" && match.name === "water cans")).toBe(false);
  });

  it("does not let same-number routes from another zone override the selected zone", () => {
    const localData = loadLocalData();
    const incident = parseIncidentReport("heavy rain near Zone A, water rising, 25 people need evacuation");
    const zone = findZone(localData.zones, incident.zoneInput);
    const plan = createFallbackPlan({
      zone,
      localData,
      incident,
      evidence: [
        {
          id: "current-report",
          source: "Current Slack field report",
          channel: "#field-reports",
          text: "Zone A field update: heavy rain, rising water, 25 people need evacuation.",
          confidence: 0.94,
          sourceType: "slack"
        },
        {
          id: "other-zone-route",
          source: "Live Slack channel scan",
          channel: "#routes",
          text: "Zone B route update: Route R4 via Hill School Road is blocked by debris.",
          confidence: 0.78,
          sourceType: "slack"
        }
      ],
      contextStatus: "slack",
      weather: {
        precipitationMm: 8.4,
        signal: {
          label: "Weather",
          summary: "Live weather",
          source: "live",
          scoreImpact: 16
        }
      },
      flood: {
        floodRiskIndex: 0.75,
        signal: {
          label: "Flood",
          summary: "Live flood",
          source: "live",
          scoreImpact: 19
        }
      }
    });

    expect(plan.routeActions.find((route) => route.routeName.includes("East Bypass"))?.status).toBe("open");
  });
});
