import type { App } from "@slack/bolt";
import type { AppConfig } from "../config";
import { createFallbackPlan } from "../planner/fallbackPlanner";
import type { IncidentPlan } from "../planner/schema";
import { getFloodRisk } from "../tools/flood";
import { findZone, loadLocalData } from "../tools/localData";
import { getWeatherRisk } from "../tools/weather";
import { renderIncidentControlRoom } from "./blocks";
import { postPlanToCoordination } from "./postPlan";
import { searchSlackContext } from "./rts";

type StoredPlan = {
  plan: IncidentPlan;
  approvedBy?: string;
  messageTs?: string;
  sourceChannel?: string;
  threadTs?: string;
  state: "draft" | "approved" | "posted";
};

const planStore = new Map<string, StoredPlan>();

const parseZoneInput = (text: string): string => {
  const match = text.match(/zone\s+([a-z])/i);
  return match ? `Zone ${match[1].toUpperCase()}` : "Zone B";
};

const userLabel = (body: any): string => {
  return body.user?.username ?? body.user?.name ?? body.user?.id ?? "coordinator";
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

    if (!/analyze/i.test(text)) {
      await say({
        text: "Try `@SentinelSwarm analyze Zone B risk` to open an Incident Control Room.",
        thread_ts: threadTs
      });
      return;
    }

    try {
      const localData = loadLocalData();
      const zone = findZone(localData.zones, parseZoneInput(text));
      const context = await searchSlackContext(client, eventAny.action_token, zone.name, config.forceMocks);
      const weather = await getWeatherRisk(zone, config.forceMocks);
      const flood = await getFloodRisk(zone, config.forceMocks);

      const plan = createFallbackPlan({
        zone,
        localData,
        evidence: context.evidence,
        contextStatus: context.status,
        weather,
        flood
      });

      const response = await say({
        text: plan.summary,
        thread_ts: threadTs,
        blocks: renderIncidentControlRoom(plan)
      });

      planStore.set(plan.planId, {
        plan,
        state: "draft",
        messageTs: (response as any).ts,
        sourceChannel: eventAny.channel,
        threadTs
      });

      if (context.reason) {
        logger.info(`Context fallback reason: ${context.reason}`);
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
    const bodyAny = body as any;
    const planId = bodyAny.actions?.[0]?.value;
    const stored = planStore.get(planId);

    if (!stored) {
      await client.chat.postEphemeral({
        channel: bodyAny.channel.id,
        user: bodyAny.user.id,
        text: "I could not find that plan. Please rerun the analysis."
      });
      return;
    }

    stored.state = "approved";
    stored.approvedBy = userLabel(bodyAny);
    planStore.set(planId, stored);

    try {
      await client.chat.update({
        channel: bodyAny.channel.id,
        ts: bodyAny.message.ts,
        text: `${stored.plan.zoneName} plan approved.`,
        blocks: renderIncidentControlRoom(stored.plan, {
          state: "approved",
          approvedBy: stored.approvedBy
        })
      });
    } catch (error) {
      logger.error(error);
    }
  });

  app.action("post_plan", async ({ ack, body, client }) => {
    await ack();
    const bodyAny = body as any;
    const planId = bodyAny.actions?.[0]?.value;
    const stored = planStore.get(planId);

    if (!stored) {
      await client.chat.postEphemeral({
        channel: bodyAny.channel.id,
        user: bodyAny.user.id,
        text: "I could not find that plan. Please rerun the analysis."
      });
      return;
    }

    if (stored.state !== "approved") {
      await client.chat.postEphemeral({
        channel: bodyAny.channel.id,
        user: bodyAny.user.id,
        text: "Approve the plan before posting it to coordination."
      });
      return;
    }

    if (!config.coordinationChannelId) {
      await client.chat.postEphemeral({
        channel: bodyAny.channel.id,
        user: bodyAny.user.id,
        text: "Missing SLACK_COORDINATION_CHANNEL_ID. Add the #coordination channel ID to .env."
      });
      return;
    }

    await postPlanToCoordination(client, config.coordinationChannelId, stored.plan, stored.approvedBy ?? userLabel(bodyAny));
    stored.state = "posted";
    planStore.set(planId, stored);

    await client.chat.update({
      channel: bodyAny.channel.id,
      ts: bodyAny.message.ts,
      text: `${stored.plan.zoneName} plan posted to coordination.`,
      blocks: renderIncidentControlRoom(stored.plan, {
        state: "posted",
        approvedBy: stored.approvedBy
      })
    });
  });

  app.action("generate_handover", async ({ ack, body, client }) => {
    await ack();
    const bodyAny = body as any;
    const planId = bodyAny.actions?.[0]?.value;
    const stored = planStore.get(planId);

    if (!stored) {
      await client.chat.postEphemeral({
        channel: bodyAny.channel.id,
        user: bodyAny.user.id,
        text: "I could not find that plan. Please rerun the analysis."
      });
      return;
    }

    await client.chat.postMessage({
      channel: bodyAny.channel.id,
      thread_ts: stored.threadTs ?? bodyAny.message.ts,
      text: `*Handover Summary*\n${stored.plan.handover}`
    });
  });
};
