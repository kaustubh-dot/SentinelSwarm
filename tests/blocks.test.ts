import { describe, expect, it } from "vitest";
import { renderIncidentControlRoom } from "../src/slack/blocks";
import { createFallbackPlan } from "../src/planner/fallbackPlanner";
import { findZone, loadLocalData, loadMockContext } from "../src/tools/localData";

describe("renderIncidentControlRoom", () => {
  it("renders the core Incident Control Room sections", () => {
    const localData = loadLocalData();
    const zone = findZone(localData.zones, "Zone B");
    const plan = createFallbackPlan({
      zone,
      localData,
      evidence: loadMockContext(),
      contextStatus: "slack",
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

    const blocks = renderIncidentControlRoom(plan);
    const rendered = JSON.stringify(blocks);

    expect(rendered).toContain("Incident Control Room");
    expect(rendered).toContain("Evidence Ledger");
    expect(rendered).toContain("Evidence source: Live Slack channel context");
    expect(rendered).toContain("Approve Plan");
    expect(rendered).toContain("Post to Coordination");
  });
});
