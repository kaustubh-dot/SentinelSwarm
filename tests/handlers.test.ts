import { describe, expect, it, vi } from "vitest";
import { createFallbackPlan } from "../src/planner/fallbackPlanner";
import type { StoredPlan } from "../src/slack/planStore";
import { handleApprovePlanAction, handleGenerateHandoverAction, handlePostPlanAction, handleRefreshPlanAction } from "../src/slack/handlers";
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
  container: {
    channel_id: "CCONTAINER",
    message_ts: "1710000000.000300"
  },
  user: { id: "UCOORD", username: "coordinator" },
  message: { ts: "1710000000.000100" }
});

const makeClient = () => ({
  apiCall: vi.fn().mockResolvedValue({ ok: true }),
  chat: {
    postEphemeral: vi.fn().mockResolvedValue({ ok: true }),
    postMessage: vi.fn().mockResolvedValue({ ok: true }),
    update: vi.fn().mockResolvedValue({ ok: true })
  }
});

const makeConfig = () =>
  ({
    slackBotToken: "xoxb-test",
    slackAppToken: "xapp-test",
    coordinationChannelId: "CCOORD",
    useLlm: false,
    googleApiKey: undefined,
    geminiModel: "gemini-3.5-flash",
    forceMocks: true,
    logLevel: "info"
  }) as const;

const makeStore = (stored: StoredPlan | undefined) => ({
  value: stored,
  get: vi.fn(async () => stored),
  set: vi.fn(async (_planId: string, next: StoredPlan) => {
    stored = next;
  })
});

const makeStoredPlan = (state: StoredPlan["state"]): StoredPlan => ({
  plan: makePlan(),
  reportEvidence: {
    id: "field-report-current",
    source: "Current Slack field report",
    channel: "#field-reports",
    text: "@SentinelSwarm analyze Zone B risk",
    confidence: 0.94,
    sourceType: "slack"
  },
  state,
  messageTs: "1710000000.000300",
  sourceChannel: "CCONTAINER",
  threadTs: "1710000000.000100",
  approvedBy: state === "approved" ? "coordinator" : undefined,
  refreshCount: 0,
  updatedAt: "2026-07-08T10:00:00.000Z"
});

describe("Slack action handlers", () => {
  it("marks a plan approved and updates the control room using container metadata", async () => {
    const client = makeClient();
    const store = makeStore(makeStoredPlan("draft"));

    await handleApprovePlanAction({
      body: makeBody(),
      client,
      planStore: store
    });

    expect(store.set).toHaveBeenCalledWith(
      "plan-1",
      expect.objectContaining({
        state: "approved",
        approvedBy: "coordinator"
      })
    );
    expect(client.chat.update).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: "CCONTAINER",
        ts: "1710000000.000300",
        text: "Zone B plan approved."
      })
    );
  });

  it("keeps approval state and posts a replacement card if original card update fails", async () => {
    const client = makeClient();
    client.chat.update.mockRejectedValueOnce(new Error("message_not_found"));
    client.chat.postMessage.mockResolvedValueOnce({ ok: true, ts: "1710000000.000400" });
    const store = makeStore(makeStoredPlan("draft"));

    await handleApprovePlanAction({
      body: makeBody(),
      client,
      planStore: store
    });

    expect(store.set).toHaveBeenCalledWith(
      "plan-1",
      expect.objectContaining({
        state: "approved"
      })
    );
    expect(client.chat.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: "CCONTAINER",
        thread_ts: "1710000000.000100",
        text: "Zone B plan approved.",
        blocks: expect.any(Array)
      })
    );
    expect(store.set).toHaveBeenLastCalledWith(
      "plan-1",
      expect.objectContaining({
        state: "approved",
        messageTs: "1710000000.000400"
      })
    );
    expect(client.chat.postEphemeral).toHaveBeenCalledWith({
      channel: "CCONTAINER",
      user: "UCOORD",
      text: "Plan approved. I could not update the original card, so I posted a replacement control room card."
    });
  });

  it("does not reopen a posted plan when a stale approve action arrives", async () => {
    const client = makeClient();
    const store = makeStore(makeStoredPlan("posted"));

    await handleApprovePlanAction({
      body: makeBody(),
      client,
      planStore: store
    });

    expect(store.set).not.toHaveBeenCalled();
    expect(client.chat.postEphemeral).toHaveBeenCalledWith({
      channel: "CCONTAINER",
      user: "UCOORD",
      text: "This plan has already been posted to coordination."
    });
  });

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
      channel: "CCONTAINER",
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
      channel: "CCONTAINER",
      user: "UCOORD",
      text: "Missing SLACK_COORDINATION_CHANNEL_ID. Add the #coordination channel ID to .env."
    });
    expect(client.chat.postMessage).not.toHaveBeenCalled();
  });

  it("refuses to post an already-posted plan with a truthful message", async () => {
    const client = makeClient();
    const store = makeStore(makeStoredPlan("posted"));

    await handlePostPlanAction({
      body: makeBody(),
      client,
      planStore: store,
      config: {
        coordinationChannelId: "CCOORD"
      }
    });

    expect(client.chat.postEphemeral).toHaveBeenCalledWith({
      channel: "CCONTAINER",
      user: "UCOORD",
      text: "This plan has already been posted to coordination."
    });
    expect(client.chat.postMessage).not.toHaveBeenCalled();
  });

  it("posts an approved plan to coordination, saves posted state, and updates the card", async () => {
    const client = makeClient();
    const stored = makeStoredPlan("approved");
    const store = makeStore(stored);

    await handlePostPlanAction({
      body: makeBody(),
      client,
      planStore: store,
      config: {
        coordinationChannelId: "CCOORD"
      }
    });

    expect(client.chat.postMessage).toHaveBeenCalledWith({
      channel: "CCOORD",
      text: expect.stringContaining("approved dispatch handoff")
    });
    expect(store.set).toHaveBeenCalledWith(
      "plan-1",
      expect.objectContaining({
        state: "posted"
      })
    );
    expect(client.chat.update).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: "CCONTAINER",
        ts: "1710000000.000300",
        text: "Zone B plan posted to coordination.",
        blocks: expect.any(Array)
      })
    );
  });

  it("guards against duplicate coordination posts while one post is in flight", async () => {
    const client = makeClient();
    let resolvePost: (() => void) | undefined;
    client.chat.postMessage.mockReturnValue(
      new Promise((resolve) => {
        resolvePost = () => resolve({ ok: true });
      })
    );
    const store = makeStore(makeStoredPlan("approved"));

    const firstPost = handlePostPlanAction({
      body: makeBody(),
      client,
      planStore: store,
      config: {
        coordinationChannelId: "CCOORD"
      }
    });
    const secondPost = handlePostPlanAction({
      body: makeBody(),
      client,
      planStore: store,
      config: {
        coordinationChannelId: "CCOORD"
      }
    });

    await secondPost;
    resolvePost?.();
    await firstPost;

    expect(client.chat.postMessage).toHaveBeenCalledTimes(1);
    expect(client.chat.postEphemeral).toHaveBeenCalledWith({
      channel: "CCONTAINER",
      user: "UCOORD",
      text: "This plan is already being posted to coordination. Please wait for the card to update."
    });
  });

  it("does not duplicate a post when coordination posting succeeds but saving posted state fails", async () => {
    const client = makeClient();
    const stored = makeStoredPlan("approved");
    const store = {
      get: vi.fn(async () => stored),
      set: vi.fn(async (_planId: string, next: StoredPlan) => {
        if (next.state === "posted") {
          throw new Error("disk unavailable");
        }
      })
    };

    await handlePostPlanAction({
      body: makeBody("save-fail-plan"),
      client,
      planStore: store,
      config: {
        coordinationChannelId: "CCOORD"
      }
    });
    await handlePostPlanAction({
      body: makeBody("save-fail-plan"),
      client,
      planStore: store,
      config: {
        coordinationChannelId: "CCOORD"
      }
    });

    expect(client.chat.postMessage).toHaveBeenCalledTimes(1);
    expect(client.chat.postEphemeral).toHaveBeenCalledWith({
      channel: "CCONTAINER",
      user: "UCOORD",
      text: expect.stringContaining("already been posted to coordination")
    });
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
      channel: "CCONTAINER",
      thread_ts: "1710000000.000200",
      text: expect.stringContaining("*Handover Summary*")
    });
  });

  it("refreshes an approved plan, resets it to draft, and updates the card", async () => {
    const client = makeClient();
    const stored = makeStoredPlan("approved");
    const store = makeStore(stored);
    const refreshedPlan = {
      ...stored.plan,
      summary: "Refreshed summary from updated Slack context."
    };
    const refreshPlan = vi.fn().mockResolvedValue(refreshedPlan);

    await handleRefreshPlanAction({
      body: makeBody(),
      client,
      planStore: store,
      config: makeConfig(),
      refreshPlan
    });

    expect(refreshPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        client,
        config: makeConfig(),
        stored,
        reportEvidence: stored.reportEvidence
      })
    );
    expect(store.set).toHaveBeenCalledWith(
      "plan-1",
      expect.objectContaining({
        plan: refreshedPlan,
        state: "draft",
        approvedBy: undefined,
        refreshCount: 1,
        lastRefreshedAt: expect.any(String),
        lastChangeSummary: ["No material route, incident, or resource changes detected."]
      })
    );
    expect(client.chat.update).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: "CCONTAINER",
        ts: "1710000000.000300",
        text: "Zone B analysis refreshed. Awaiting approval.",
        blocks: expect.any(Array)
      })
    );
  });

  it("records refresh changes when existing incidents or resources change", async () => {
    const client = makeClient();
    const stored = makeStoredPlan("approved");
    const store = makeStore(stored);
    const refreshedPlan = {
      ...stored.plan,
      incidents: stored.plan.incidents.map((incident, index) =>
        index === 0
          ? {
              ...incident,
              recommendedOwner: "Dev"
            }
          : incident
      ),
      resourceMatches: stored.plan.resourceMatches.map((match, index) =>
        index === 0
          ? {
              ...match,
              recommendation: "Updated volunteer recommendation from refreshed Slack context."
            }
          : match
      )
    };

    await handleRefreshPlanAction({
      body: makeBody(),
      client,
      planStore: store,
      config: makeConfig(),
      refreshPlan: vi.fn().mockResolvedValue(refreshedPlan)
    });

    expect(store.set).toHaveBeenCalledWith(
      "plan-1",
      expect.objectContaining({
        lastChangeSummary: expect.arrayContaining([
          expect.stringContaining("owner changed"),
          expect.stringContaining("recommendation was updated")
        ])
      })
    );
  });

  it("blocks refresh for a posted plan", async () => {
    const client = makeClient();
    const store = makeStore(makeStoredPlan("posted"));
    const refreshPlan = vi.fn();

    await handleRefreshPlanAction({
      body: makeBody(),
      client,
      planStore: store,
      config: makeConfig(),
      refreshPlan
    });

    expect(refreshPlan).not.toHaveBeenCalled();
    expect(store.set).not.toHaveBeenCalled();
    expect(client.chat.postEphemeral).toHaveBeenCalledWith({
      channel: "CCONTAINER",
      user: "UCOORD",
      text: "This plan has already been posted to coordination. Start a new analysis to capture a new incident state."
    });
  });

  it("reports refresh failures without changing the stored plan", async () => {
    const client = makeClient();
    const store = makeStore(makeStoredPlan("draft"));

    await handleRefreshPlanAction({
      body: makeBody(),
      client,
      planStore: store,
      config: makeConfig(),
      refreshPlan: vi.fn().mockRejectedValue(new Error("refresh unavailable"))
    });

    expect(store.set).not.toHaveBeenCalled();
    expect(client.chat.postEphemeral).toHaveBeenCalledWith({
      channel: "CCONTAINER",
      user: "UCOORD",
      text: "Could not refresh the analysis (refresh unavailable). The current plan is unchanged."
    });
  });
});
