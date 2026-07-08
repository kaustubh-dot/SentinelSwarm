import type { App } from "@slack/bolt";
import type { AppConfig } from "../config";
import { parseIncidentReport, shouldOpenIncidentControlRoom, type ParsedIncidentReport } from "../planner/incidentParser";
import { createIncidentPlan } from "../planner/planner";
import type { Evidence, IncidentPlan } from "../planner/schema";
import { getFloodRisk } from "../tools/flood";
import { findZone, loadLocalData } from "../tools/localData";
import { getWeatherRisk } from "../tools/weather";
import { renderIncidentControlRoom } from "./blocks";
import { createLocalPlanStore, type LocalPlanStore } from "./planStore";
import { postPlanToCoordination } from "./postPlan";
import { searchSlackContext } from "./rts";

const planStore = createLocalPlanStore();

type SlackClientLike = {
  chat: {
    postEphemeral: (args: Record<string, unknown>) => Promise<unknown>;
    postMessage: (args: Record<string, unknown>) => Promise<unknown>;
    update: (args: Record<string, unknown>) => Promise<unknown>;
  };
};

type LoggerLike = {
  error: (error: unknown) => void;
};

type ActionHandlerDeps = {
  body: any;
  client: SlackClientLike;
  logger?: LoggerLike;
  planStore: Pick<LocalPlanStore, "get" | "set">;
};

type PostPlanDeps = ActionHandlerDeps & {
  config: Pick<AppConfig, "coordinationChannelId">;
};

const userLabel = (body: any): string => {
  return body.user?.username ?? body.user?.name ?? body.user?.id ?? "coordinator";
};

const actionChannelId = (body: any, fallback?: string): string | undefined => {
  return body.container?.channel_id ?? body.channel?.id ?? fallback;
};

const actionMessageTs = (body: any, fallback?: string): string | undefined => {
  return body.container?.message_ts ?? body.message?.ts ?? fallback;
};

const actionThreadTs = (body: any, fallback?: string): string | undefined => {
  return fallback ?? body.message?.thread_ts ?? body.container?.thread_ts ?? actionMessageTs(body);
};

const createReportEvidence = (incident: ParsedIncidentReport, channelId: string): Evidence => ({
  id: "field-report-current",
  source: "Current Slack field report",
  channel: `<#${channelId}>`,
  text: incident.normalizedText,
  confidence: 0.94,
  sourceType: "slack"
});

const slackError = (error: unknown): string => {
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = (error as { data?: { error?: string } }).data;
    if (data?.error) {
      return data.error;
    }
  }

  return error instanceof Error ? error.message : "unknown_error";
};

export const handleApprovePlanAction = async ({ body, client, logger, planStore }: ActionHandlerDeps): Promise<void> => {
  const planId = body.actions?.[0]?.value;
  const stored = await planStore.get(planId);
  const channel = actionChannelId(body);

  if (!stored) {
    await client.chat.postEphemeral({
      channel,
      user: body.user.id,
      text: "I could not find that plan. Please rerun the analysis."
    });
    return;
  }

  const updateChannel = actionChannelId(body, stored.sourceChannel);
  const updateTs = actionMessageTs(body, stored.messageTs);

  stored.state = "approved";
  stored.approvedBy = userLabel(body);
  await planStore.set(planId, stored);

  try {
    await client.chat.update({
      channel: updateChannel,
      ts: updateTs,
      text: `${stored.plan.zoneName} plan approved.`,
      blocks: renderIncidentControlRoom(stored.plan, {
        state: "approved",
        approvedBy: stored.approvedBy
      })
    });
  } catch (error) {
    logger?.error(error);
    await client.chat.postEphemeral({
      channel: updateChannel,
      user: body.user.id,
      text: `Plan approved, but I could not update the control room card (${slackError(error)}). You can still click Post to Coordination.`
    });
  }
};

export const handlePostPlanAction = async ({ body, client, logger, planStore, config }: PostPlanDeps): Promise<void> => {
  const planId = body.actions?.[0]?.value;
  const stored = await planStore.get(planId);
  const channel = actionChannelId(body);

  if (!stored) {
    await client.chat.postEphemeral({
      channel,
      user: body.user.id,
      text: "I could not find that plan. Please rerun the analysis."
    });
    return;
  }

  if (stored.state !== "approved") {
    await client.chat.postEphemeral({
      channel,
      user: body.user.id,
      text: "Approve the plan before posting it to coordination."
    });
    return;
  }

  if (!config.coordinationChannelId) {
    await client.chat.postEphemeral({
      channel,
      user: body.user.id,
      text: "Missing SLACK_COORDINATION_CHANNEL_ID. Add the #coordination channel ID to .env."
    });
    return;
  }

  try {
    await postPlanToCoordination(client as any, config.coordinationChannelId, stored.plan, stored.approvedBy ?? userLabel(body));
  } catch (error) {
    logger?.error(error);
    await client.chat.postEphemeral({
      channel,
      user: body.user.id,
      text: `Could not post to coordination (${slackError(error)}). The plan is still approved. Check SLACK_COORDINATION_CHANNEL_ID, chat:write, and bot membership in #coordination.`
    });
    return;
  }

  stored.state = "posted";
  await planStore.set(planId, stored);
  const updateChannel = actionChannelId(body, stored.sourceChannel);
  const updateTs = actionMessageTs(body, stored.messageTs);

  try {
    await client.chat.update({
      channel: updateChannel,
      ts: updateTs,
      text: `${stored.plan.zoneName} plan posted to coordination.`,
      blocks: renderIncidentControlRoom(stored.plan, {
        state: "posted",
        approvedBy: stored.approvedBy
      })
    });
  } catch (error) {
    logger?.error(error);
    await client.chat.postEphemeral({
      channel: updateChannel,
      user: body.user.id,
      text: `The plan was posted to coordination, but I could not update this control room card (${slackError(error)}).`
    });
  }
};

export const handleGenerateHandoverAction = async ({ body, client, planStore }: ActionHandlerDeps): Promise<void> => {
  const planId = body.actions?.[0]?.value;
  const stored = await planStore.get(planId);
  const channel = actionChannelId(body);

  if (!stored) {
    await client.chat.postEphemeral({
      channel,
      user: body.user.id,
      text: "I could not find that plan. Please rerun the analysis."
    });
    return;
  }

  await client.chat.postMessage({
    channel: actionChannelId(body, stored.sourceChannel),
    thread_ts: actionThreadTs(body, stored.threadTs),
    text: `*Handover Summary*\n${stored.plan.handover}`
  });
};

export const registerHandlers = (app: App, config: AppConfig): void => {
  app.event("app_mention", async ({ event, client, say, logger }) => {
    const eventAny = event as any;
    const text = String(eventAny.text ?? "");
    const threadTs = eventAny.thread_ts ?? eventAny.ts;

    if (/ping/i.test(text)) {
      await say({
        text: "SentinelSwarm is online. Try `@SentinelSwarm analyze Zone B risk`.",
        thread_ts: threadTs
      });
      return;
    }

    if (!shouldOpenIncidentControlRoom(text)) {
      await say({
        text: "Try `@SentinelSwarm analyze Zone B risk` or report a zone incident like `@SentinelSwarm heavy rain near Zone A, 25 people need evacuation, route blocked`.",
        thread_ts: threadTs
      });
      return;
    }

    try {
      const incident = parseIncidentReport(text);
      const localData = loadLocalData();
      const zone = findZone(localData.zones, incident.zoneInput);
      const context = await searchSlackContext(client, eventAny.action_token, zone.name, config.forceMocks);
      const weather = await getWeatherRisk(zone, config.forceMocks);
      const flood = await getFloodRisk(zone, config.forceMocks);
      const reportEvidence = createReportEvidence(incident, eventAny.channel);

      const planner = await createIncidentPlan(
        {
          zone,
          localData,
          evidence: [reportEvidence, ...context.evidence],
          contextStatus: context.status,
          weather,
          flood,
          incident
        },
        config
      );
      const plan = planner.plan;

      const response = await say({
        text: plan.summary,
        thread_ts: threadTs,
        blocks: renderIncidentControlRoom(plan)
      });

      await planStore.set(plan.planId, {
        plan,
        state: "draft",
        messageTs: (response as any).ts,
        sourceChannel: eventAny.channel,
        threadTs
      });

      if (context.reason) {
        logger.info(`Context fallback reason: ${context.reason}`);
      }
      if (planner.reason) {
        logger.info(`Planner mode: ${planner.mode}; ${planner.reason}`);
      }
    } catch (error) {
      logger.error(error);
      await say({
        text: "SentinelSwarm could not build the Incident Control Room. Check local data and app logs.",
        thread_ts: threadTs
      });
    }
  });

  app.action("approve_plan", async ({ ack, body, client, logger }) => {
    await ack();
    await handleApprovePlanAction({ body, client: client as any, logger, planStore });
  });

  app.action("post_plan", async ({ ack, body, client, logger }) => {
    await ack();
    await handlePostPlanAction({ body, client: client as any, logger, planStore, config });
  });

  app.action("generate_handover", async ({ ack, body, client }) => {
    await ack();
    await handleGenerateHandoverAction({ body, client: client as any, planStore });
  });
};
