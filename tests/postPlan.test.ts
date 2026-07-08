import { describe, expect, it } from "vitest";
import { createFallbackPlan } from "../src/planner/fallbackPlanner";
import { formatCoordinationPost } from "../src/slack/postPlan";
import { findZone, loadLocalData, loadMockContext } from "../src/tools/localData";

describe("formatCoordinationPost", () => {
  it("includes evidence, assignments, actions, and route guidance", () => {
    const localData = loadLocalData();
    const plan = createFallbackPlan({
      zone: findZone(localData.zones, "Zone B"),
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

    const post = formatCoordinationPost(plan, "Kaustubh");

    expect(post).toContain("Approved by");
    expect(post).toContain("Why");
    expect(post).toContain("Assignments and resources");
    expect(post).toContain("Recommended actions");
    expect(post).toContain("Route guidance");
  });
});
