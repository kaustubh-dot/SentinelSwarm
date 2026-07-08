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
    expect(rendered).toContain("External Signals");
    expect(rendered).toContain("Evidence source: Live Slack channel context");
    expect(rendered).toContain("Fallback");
    expect(rendered).not.toContain("example.slack.com");
    expect(rendered).toContain("Approve Plan");
    expect(rendered).toContain("Post to Coordination");
  });

  it("keeps LLM-influenced section text within Slack Block Kit limits", () => {
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
    const longText = "route and shelter coordination ".repeat(80);
    const blocks = renderIncidentControlRoom({
      ...plan,
      summary: longText,
      incidents: plan.incidents.map((incident) => ({
        ...incident,
        title: longText,
        summary: longText
      })),
      routeActions: plan.routeActions.map((route) => ({
        ...route,
        routeName: longText,
        recommendation: longText
      })),
      resourceMatches: Array.from({ length: 8 }, (_, index) => ({
        type: index % 3 === 0 ? ("volunteer" as const) : index % 3 === 1 ? ("shelter" as const) : ("supply" as const),
        name: longText,
        recommendation: longText
      })),
      recommendedActions: Array.from({ length: 8 }, () => longText)
    });

    const sectionTexts = blocks
      .filter((block) => block.type === "section")
      .map((block) => block.text.text as string);

    expect(sectionTexts.every((text) => text.length <= 3000)).toBe(true);
  });
});
