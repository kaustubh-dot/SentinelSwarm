import type { App } from "@slack/bolt";
import type { AppConfig } from "../config";
import { parseIncidentReport, shouldOpenIncidentControlRoom, type ParsedIncidentReport } from "../planner/incidentParser";
import { createIncidentPlan } from "../planner/planner";
import type { Evidence, IncidentPlan } from "../planner/schema";
import { getFloodRisk } from "../tools/flood";
import { findZone, loadLocalData } from "../tools/localData";
import { getWeatherRisk } from "../tools/weather";
import { renderIncidentControlRoom } from "./blocks";
import { createLocalPlanStore, type ContextProvenance, type LocalPlanStore } from "./planStore";
import { postPlanToCoordination } from "./postPlan";
import { searchSlackContext } from "./rts";

const planStore = createLocalPlanStore();
const postingPlanIds = new Set<string>();
const postedButUnsavedPlanIds = new Set<string>();

type SlackClientLike = {
  apiCall?: (method: string, params: Record<string, unknown>) => Promise<unknown>;
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

type RefreshPlanArgs = {
  client: SlackClientLike;
  config: AppConfig;
  stored: NonNullable<Awaited<ReturnType<LocalPlanStore["get"]>>>;
  reportEvidence: Evidence;
};

type RefreshedPlanResult = {
  plan: IncidentPlan;
  contextProvenance?: ContextProvenance;
};

type RefreshPlanDeps = ActionHandlerDeps & {
  config: AppConfig;
  refreshPlan?: (args: RefreshPlanArgs) => Promise<IncidentPlan | RefreshedPlanResult>;
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

const currentReportEvidenceId = (eventTs?: string): string => {
  const suffix = eventTs?.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return suffix ? `field-report-current-${suffix}` : "field-report-current";
};

const createReportEvidence = (incident: ParsedIncidentReport, channelId: string, eventTs?: string): Evidence => ({
  id: currentReportEvidenceId(eventTs),
  source: "Current Slack field report",
  channel: `<#${channelId}>`,
  text: incident.normalizedText,
  confidence: 0.94,
  sourceType: "slack"
});

const renderOptionsForStoredPlan = (stored: {
  state: "draft" | "approved" | "posted";
  approvedBy?: string;
  refreshCount?: number;
  lastRefreshedAt?: string;
  lastChangeSummary?: string[];
  contextProvenance?: ContextProvenance;
}) => ({
  state: stored.state,
  approvedBy: stored.approvedBy,
  refreshCount: stored.refreshCount,
  lastRefreshedAt: stored.lastRefreshedAt,
  changeSummary: stored.lastChangeSummary,
  contextProvenance: stored.contextProvenance
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

const createRefreshedPlan = async ({
  client,
  config,
  stored,
  reportEvidence
}: RefreshPlanArgs): Promise<RefreshedPlanResult> => {
  const incident = parseIncidentReport(reportEvidence.text);
  const localData = loadLocalData();
  const zone = findZone(localData.zones, incident.zoneInput || stored.plan.zoneName);
  const context = await searchSlackContext(client as any, undefined, zone.name, config.forceMocks);
  const weather = await getWeatherRisk(zone, config.forceMocks);
  const flood = await getFloodRisk(zone, config.forceMocks);
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

  return {
    plan: {
      ...planner.plan,
      planId: stored.plan.planId
    },
    contextProvenance: context.provenance
  };
};

const asRefreshedPlanResult = (result: IncidentPlan | RefreshedPlanResult, fallbackProvenance?: ContextProvenance): RefreshedPlanResult => {
  return "plan" in result
    ? result
    : {
        plan: result,
        contextProvenance: fallbackProvenance
      };
};

const summarizeRefreshChanges = (before: IncidentPlan, after: IncidentPlan): string[] => {
  const changes: string[] = [];

  if (before.severity !== after.severity) {
    changes.push(`Severity changed from ${before.severity.toUpperCase()} to ${after.severity.toUpperCase()}.`);
  }

  const beforeRoutes = new Map(before.routeActions.map((route) => [route.routeId, route]));
  for (const route of after.routeActions) {
    const previous = beforeRoutes.get(route.routeId);
    if (!previous) {
      changes.push(`Route added: ${route.routeName} is ${route.status.toUpperCase()}.`);
      continue;
    }
    if (previous.status !== route.status) {
      changes.push(`${route.routeName} changed from ${previous.status.toUpperCase()} to ${route.status.toUpperCase()}.`);
    } else if (previous.recommendation !== route.recommendation) {
      changes.push(`${route.routeName} guidance was updated.`);
    }
  }

  const beforeIncidents = new Set(before.incidents.map((incident) => incident.id));
  const beforeIncidentById = new Map(before.incidents.map((incident) => [incident.id, incident]));
  const addedIncidents = after.incidents.filter((incident) => !beforeIncidents.has(incident.id));
  if (addedIncidents.length > 0) {
    changes.push(`New priority incident: ${addedIncidents[0].title}.`);
  }
  for (const incident of after.incidents) {
    const previous = beforeIncidentById.get(incident.id);
    if (!previous) {
      continue;
    }
    const evidenceChanged = previous.evidenceIds.join(",") !== incident.evidenceIds.join(",");
    if (previous.recommendedOwner !== incident.recommendedOwner) {
      changes.push(`${incident.title} owner changed from ${previous.recommendedOwner} to ${incident.recommendedOwner}.`);
    } else if (previous.summary !== incident.summary || evidenceChanged) {
      changes.push(`${incident.title} evidence or guidance was updated.`);
    }
  }

  const beforeResources = new Set(before.resourceMatches.map((match) => `${match.type}:${match.name}`));
  const beforeResourceById = new Map(before.resourceMatches.map((match) => [`${match.type}:${match.name}`, match]));
  const addedResource = after.resourceMatches.find((match) => !beforeResources.has(`${match.type}:${match.name}`));
  if (addedResource) {
    changes.push(`New resource match: ${addedResource.type} ${addedResource.name}.`);
  }
  for (const match of after.resourceMatches) {
    const previous = beforeResourceById.get(`${match.type}:${match.name}`);
    if (previous && previous.recommendation !== match.recommendation) {
      changes.push(`${match.type} ${match.name} recommendation was updated.`);
      break;
    }
  }

  if (Math.abs(before.confidence - after.confidence) >= 0.05) {
    changes.push(`Confidence changed from ${Math.round(before.confidence * 100)}% to ${Math.round(after.confidence * 100)}%.`);
  }

  return changes.length > 0 ? changes.slice(0, 4) : ["No material route, incident, or resource changes detected."];
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

  if (stored.state === "posted" || postedButUnsavedPlanIds.has(planId)) {
    await client.chat.postEphemeral({
      channel: updateChannel,
      user: body.user.id,
      text: "This plan has already been posted to coordination."
    });
    return;
  }

  stored.state = "approved";
  stored.approvedBy = userLabel(body);
  await planStore.set(planId, stored);

  try {
    await client.chat.update({
      channel: updateChannel,
      ts: updateTs,
      text: `${stored.plan.zoneName} plan approved.`,
      blocks: renderIncidentControlRoom(stored.plan, renderOptionsForStoredPlan(stored))
    });
  } catch (error) {
    logger?.error(error);
    try {
      const replacement = await client.chat.postMessage({
        channel: updateChannel,
        thread_ts: actionThreadTs(body, stored.threadTs),
        text: `${stored.plan.zoneName} plan approved.`,
        blocks: renderIncidentControlRoom(stored.plan, renderOptionsForStoredPlan(stored))
      });
      const replacementTs = (replacement as any).ts;
      if (typeof replacementTs === "string" && replacementTs) {
        stored.messageTs = replacementTs;
        await planStore.set(planId, stored);
      }
      await client.chat.postEphemeral({
        channel: updateChannel,
        user: body.user.id,
        text: "Plan approved. I could not update the original card, so I posted a replacement control room card."
      });
    } catch (replacementError) {
      logger?.error(replacementError);
      await client.chat.postEphemeral({
        channel: updateChannel,
        user: body.user.id,
        text: `Plan approved, but I could not refresh or replace the control room card (${slackError(error)}). Rerun the analysis before posting to coordination.`
      });
    }
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

  if (stored.state === "posted" || postedButUnsavedPlanIds.has(planId)) {
    await client.chat.postEphemeral({
      channel,
      user: body.user.id,
      text: postedButUnsavedPlanIds.has(planId)
        ? "This plan has already been posted to coordination, but local posted-state save failed. Avoid duplicate posting and rerun the analysis if you need a fresh card."
        : "This plan has already been posted to coordination."
    });
    return;
  }

  if (postingPlanIds.has(planId)) {
    await client.chat.postEphemeral({
      channel,
      user: body.user.id,
      text: "This plan is already being posted to coordination. Please wait for the card to update."
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

  postingPlanIds.add(planId);
  let postedToCoordination = false;
  try {
    await postPlanToCoordination(client as any, config.coordinationChannelId, stored.plan, stored.approvedBy ?? userLabel(body));
    postedToCoordination = true;
    stored.state = "posted";
    await planStore.set(planId, stored);
    postedButUnsavedPlanIds.delete(planId);
  } catch (error) {
    if (postedToCoordination) {
      postedButUnsavedPlanIds.add(planId);
    }
    logger?.error(error);
    await client.chat.postEphemeral({
      channel,
      user: body.user.id,
      text: postedToCoordination
        ? `The plan was posted to coordination, but I could not save the posted state (${slackError(error)}). Avoid clicking Post again and check local app logs.`
        : `Could not post to coordination (${slackError(error)}). The plan is still approved. Check SLACK_COORDINATION_CHANNEL_ID, chat:write, and bot membership in #coordination.`
    });
    return;
  } finally {
    postingPlanIds.delete(planId);
  }

  const updateChannel = actionChannelId(body, stored.sourceChannel);
  const updateTs = actionMessageTs(body, stored.messageTs);

  try {
    await client.chat.update({
      channel: updateChannel,
      ts: updateTs,
      text: `${stored.plan.zoneName} plan posted to coordination.`,
      blocks: renderIncidentControlRoom(stored.plan, renderOptionsForStoredPlan(stored))
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

export const handleRefreshPlanAction = async ({ body, client, logger, planStore, config, refreshPlan = createRefreshedPlan }: RefreshPlanDeps): Promise<void> => {
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

  if (stored.state === "posted") {
    await client.chat.postEphemeral({
      channel,
      user: body.user.id,
      text: "This plan has already been posted to coordination. Start a new analysis to capture a new incident state."
    });
    return;
  }

  const reportEvidence = stored.reportEvidence ?? stored.plan.evidence.find((item) => item.id === "field-report-current" || item.id.startsWith("field-report-current-"));
  if (!reportEvidence) {
    await client.chat.postEphemeral({
      channel,
      user: body.user.id,
      text: "I could not find the original field report for this plan. Please rerun the analysis."
    });
    return;
  }

  const updateChannel = actionChannelId(body, stored.sourceChannel);
  const updateTs = actionMessageTs(body, stored.messageTs);

  try {
    const refreshResult = asRefreshedPlanResult(
      await refreshPlan({
        client,
        config,
        stored,
        reportEvidence
      }),
      stored.contextProvenance
    );
    const refreshedPlan = refreshResult.plan;
    const changeSummary = summarizeRefreshChanges(stored.plan, refreshedPlan);
    const refreshed = {
      ...stored,
      plan: refreshedPlan,
      reportEvidence,
      contextProvenance: refreshResult.contextProvenance,
      state: "draft" as const,
      approvedBy: undefined,
      refreshCount: (stored.refreshCount ?? 0) + 1,
      lastRefreshedAt: new Date().toISOString(),
      lastChangeSummary: changeSummary
    };

    await planStore.set(planId, refreshed);

    await client.chat.update({
      channel: updateChannel,
      ts: updateTs,
      text: `${refreshed.plan.zoneName} analysis refreshed. Awaiting approval.`,
      blocks: renderIncidentControlRoom(refreshed.plan, renderOptionsForStoredPlan(refreshed))
    });
  } catch (error) {
    logger?.error(error);
    await client.chat.postEphemeral({
      channel: updateChannel,
      user: body.user.id,
      text: `Could not refresh the analysis (${slackError(error)}). The current plan is unchanged.`
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
      const reportEvidence = createReportEvidence(incident, eventAny.channel, eventAny.ts);

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
        reportEvidence,
        contextProvenance: context.provenance,
        state: "draft",
        refreshCount: 0,
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

  app.action("refresh_plan", async ({ ack, body, client, logger }) => {
    await ack();
    await handleRefreshPlanAction({ body, client: client as any, logger, planStore, config });
  });

  app.action("generate_handover", async ({ ack, body, client }) => {
    await ack();
    await handleGenerateHandoverAction({ body, client: client as any, planStore });
  });
};
