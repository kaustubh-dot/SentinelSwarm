import { describe, expect, it } from "vitest";
import { renderIncidentControlRoom } from "../src/slack/blocks";
import { createFallbackPlan } from "../src/planner/fallbackPlanner";
import { findZone, loadLocalData, loadMockContext } from "../src/tools/localData";

describe("renderIncidentControlRoom", () => {
  const actionIds = (blocks: any[]): string[] => {
    const actionBlock = blocks.find((block) => block.type === "actions");
    return actionBlock?.elements?.map((element: { action_id?: string }) => element.action_id).filter(Boolean) ?? [];
  };

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
    expect(rendered).toContain("Slack scan evidence");
    expect(rendered).toContain("Fallback");
    expect(rendered).not.toContain("example.slack.com");
    expect(rendered).toContain("Approve Plan");
    expect(rendered).not.toContain("Post to Coordination");
    expect(rendered).toContain("Refresh Analysis");
  });

  it("renders stable action IDs for draft, approved, and posted states", () => {
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

    expect(actionIds(renderIncidentControlRoom(plan, { state: "draft" }))).toEqual(["approve_plan", "refresh_plan", "generate_handover"]);
    expect(actionIds(renderIncidentControlRoom(plan, { state: "approved" }))).toEqual(["post_plan", "refresh_plan", "generate_handover"]);
    expect(actionIds(renderIncidentControlRoom(plan, { state: "posted" }))).toEqual(["generate_handover"]);
  });

  it("shows post action only after approval and renders provenance", () => {
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

    const rendered = JSON.stringify(
      renderIncidentControlRoom(plan, {
        state: "approved",
        approvedBy: "coordinator",
        contextProvenance: {
          rts: {
            attempted: true,
            matched: 0,
            reason: "RTS returned no usable message results"
          },
          fallback: "mockContext.json",
          slackScan: {
            attempted: true,
            matched: 2
          }
        }
      })
    );

    expect(rendered).toContain("Approved by coordinator");
    expect(rendered).toContain("Post to Coordination");
    expect(rendered).toContain("RTS tried");
    expect(rendered).toContain("mock fallback");
    expect(rendered).toContain("Slack scan +2");
  });

  it("renders refresh state when a plan has been updated", () => {
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

    const rendered = JSON.stringify(
      renderIncidentControlRoom(plan, {
        state: "draft",
        refreshCount: 2,
        lastRefreshedAt: "2026-07-09T10:00:00.000Z"
      })
    );

    expect(rendered).toContain("Updated after refresh. Awaiting human approval");
    expect(rendered).toContain("2 updates");
    expect(rendered).toContain("09 Jul 2026, 10:00 UTC");
    expect(rendered).not.toContain("2026-07-09T10:00:00.000Z");
  });

  it("renders a What Changed section after refresh when changes are supplied", () => {
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

    const rendered = JSON.stringify(
      renderIncidentControlRoom(plan, {
        state: "draft",
        changeSummary: ["R2 via Riverside Lane changed from BLOCKED to CAUTION."]
      })
    );

    expect(rendered).toContain("What Changed");
    expect(rendered).toContain("R2 via Riverside Lane changed");
  });

  it("removes approval and post buttons after a plan has been posted", () => {
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

    const rendered = JSON.stringify(renderIncidentControlRoom(plan, { state: "posted" }));

    expect(rendered).toContain("Posted to #coordination");
    expect(rendered).not.toContain("Approve Plan");
    expect(rendered).not.toContain("Post to Coordination");
    expect(rendered).toContain("Generate Handover");
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
