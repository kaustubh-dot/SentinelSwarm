import { describe, expect, it, vi } from "vitest";
import { createFallbackPlan } from "../src/planner/fallbackPlanner";
import type { StoredPlan } from "../src/slack/planStore";
import { handleGenerateHandoverAction, handlePostPlanAction } from "../src/slack/handlers";
import { findZone, loadLocalData, loadMockContext } from "../src/tools/localData";

const makePlan = () => {
  const localData = loadLocalData();
  return createFallbackPlan({
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
};

const makeBody = (planId = "plan-1") => ({
  actions: [{ value: planId }],
  channel: { id: "CSOURCE" },
  user: { id: "UCOORD", username: "coordinator" },
  message: { ts: "1710000000.000100" }
});

const makeClient = () => ({
  chat: {
    postEphemeral: vi.fn().mockResolvedValue({ ok: true }),
    postMessage: vi.fn().mockResolvedValue({ ok: true }),
    update: vi.fn().mockResolvedValue({ ok: true })
  }
});

const makeStore = (stored: StoredPlan | undefined) => ({
  value: stored,
  get: vi.fn(async () => stored),
  set: vi.fn(async (_planId: string, next: StoredPlan) => {
    stored = next;
  })
});

const makeStoredPlan = (state: StoredPlan["state"]): StoredPlan => ({
  plan: makePlan(),
  state,
  threadTs: "1710000000.000100",
  approvedBy: state === "approved" ? "coordinator" : undefined,
  updatedAt: "2026-07-08T10:00:00.000Z"
});

describe("Slack action handlers", () => {
  it("refuses to post a plan before approval", async () => {
    const client = makeClient();
    const store = makeStore(makeStoredPlan("draft"));

    await handlePostPlanAction({
      body: makeBody(),
      client,
      planStore: store,
      config: {
        coordinationChannelId: "CCOORD"
      }
    });

    expect(client.chat.postEphemeral).toHaveBeenCalledWith({
      channel: "CSOURCE",
      user: "UCOORD",
      text: "Approve the plan before posting it to coordination."
    });
    expect(client.chat.postMessage).not.toHaveBeenCalled();
  });

  it("returns a readable setup hint when coordination channel ID is missing", async () => {
    const client = makeClient();
    const store = makeStore(makeStoredPlan("approved"));

    await handlePostPlanAction({
      body: makeBody(),
      client,
      planStore: store,
      config: {}
    });

    expect(client.chat.postEphemeral).toHaveBeenCalledWith({
      channel: "CSOURCE",
      user: "UCOORD",
      text: "Missing SLACK_COORDINATION_CHANNEL_ID. Add the #coordination channel ID to .env."
    });
    expect(client.chat.postMessage).not.toHaveBeenCalled();
  });

  it("posts handover into the original analysis thread", async () => {
    const client = makeClient();
    const stored = makeStoredPlan("approved");
    stored.threadTs = "1710000000.000200";
    const store = makeStore(stored);

    await handleGenerateHandoverAction({
      body: makeBody(),
      client,
      planStore: store
    });

    expect(client.chat.postMessage).toHaveBeenCalledWith({
      channel: "CSOURCE",
      thread_ts: "1710000000.000200",
      text: expect.stringContaining("*Handover Summary*")
    });
  });
});
