import { afterEach, describe, expect, it, vi } from "vitest";
import type { AppConfig } from "../src/config";
import { createFallbackPlan, type PlannerInput } from "../src/planner/fallbackPlanner";
import { refinePlanWithLlm } from "../src/planner/llm";
import { createIncidentPlan } from "../src/planner/planner";
import { buildPlannerRefinementPrompt } from "../src/planner/prompt";
import { parseIncidentReport } from "../src/planner/incidentParser";
import { findZone, loadLocalData, loadMockContext } from "../src/tools/localData";

const makeInput = (): PlannerInput => {
  const localData = loadLocalData();
  const incident = parseIncidentReport("@SentinelSwarm heavy rain near Zone B, 25 people need evacuation, Route R2 blocked");
  return {
    zone: findZone(localData.zones, incident.zoneInput),
    localData,
    incident,
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
  };
};

const makeConfig = (overrides: Partial<AppConfig> = {}): AppConfig => ({
  slackBotToken: "xoxb-test",
  slackAppToken: "xapp-test",
  coordinationChannelId: "C123",
  useLlm: false,
  googleApiKey: undefined,
  geminiModel: "gemini-3.5-flash",
  forceMocks: true,
  logLevel: "info",
  ...overrides
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createIncidentPlan", () => {
  it("keeps deterministic planner mode when LLM is disabled", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const result = await createIncidentPlan(makeInput(), makeConfig());

    expect(result.mode).toBe("deterministic");
    expect(result.plan.statuses.planner).toBe("deterministic");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("falls back to deterministic planner when LLM is enabled without a key", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const result = await createIncidentPlan(makeInput(), makeConfig({ useLlm: true }));

    expect(result.mode).toBe("deterministic");
    expect(result.reason).toContain("GOOGLE_API_KEY");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("refinePlanWithLlm", () => {
  it("retries once after invalid LLM JSON and accepts a valid repair response", async () => {
    const input = makeInput();
    const deterministicPlan = createFallbackPlan(input);
    const patch = {
      summary: "LLM refined Zone B response with clearer evacuation priority.",
      confidence: 0.81,
      severity: deterministicPlan.severity,
      incidents: deterministicPlan.incidents,
      routeActions: deterministicPlan.routeActions,
      resourceMatches: deterministicPlan.resourceMatches,
      recommendedActions: deterministicPlan.recommendedActions,
      handover: "LLM handover: maintain human approval and avoid blocked Route R2."
    };
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ output_text: "not json" }), {
          status: 200
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ output_text: JSON.stringify(patch) }), {
          status: 200
        })
      );
    vi.stubGlobal("fetch", fetchSpy);

    const result = await refinePlanWithLlm(
      makeConfig({
        useLlm: true,
        googleApiKey: "test-key"
      }),
      input,
      deterministicPlan
    );

    expect(result.usedLlm).toBe(true);
    expect(result.plan.statuses.planner).toBe("llm");
    expect(result.plan.summary).toContain("LLM refined");
    expect(result.plan.evidence).toEqual(deterministicPlan.evidence);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const [url, request] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const headers = request.headers as Record<string, string>;
    const body = JSON.parse(String(request.body)) as { model: string };
    expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/interactions");
    expect(headers["x-goog-api-key"]).toBe("test-key");
    expect(body.model).toBe("gemini-3.5-flash");
  });

  it("falls back when both LLM attempts fail validation", async () => {
    const input = makeInput();
    const deterministicPlan = createFallbackPlan(input);
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ output_text: JSON.stringify({ summary: "missing required fields" }) }), {
        status: 200
      })
    );
    vi.stubGlobal("fetch", fetchSpy);

    const result = await refinePlanWithLlm(
      makeConfig({
        useLlm: true,
        googleApiKey: "test-key"
      }),
      input,
      deterministicPlan
    );

    expect(result.usedLlm).toBe(false);
    expect(result.plan).toEqual(deterministicPlan);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("redacts Slack ids, links, and permalinks from the optional LLM prompt", () => {
    const input = makeInput();
    const deterministicPlan = createFallbackPlan({
      ...input,
      evidence: [
        {
          id: "e1",
          source: "Current Slack field report",
          channel: "<#C12345|field-reports>",
          text: "<@U12345> says water rising near https://example.com/private",
          permalink: "https://example.slack.com/archives/C12345/p123",
          confidence: 0.9,
          sourceType: "slack"
        }
      ]
    });

    const prompt = buildPlannerRefinementPrompt(input, deterministicPlan);

    expect(prompt).toContain("@slack-user");
    expect(prompt).toContain("[link-redacted]");
    expect(prompt).not.toContain("U12345");
    expect(prompt).not.toContain("C12345");
    expect(prompt).not.toContain("example.slack.com");
  });
});
