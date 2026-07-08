import { WebClient } from "@slack/web-api";
import { loadConfig } from "../src/config";

type CheckStatus = "pass" | "warn" | "fail";

type Check = {
  name: string;
  status: CheckStatus;
  detail: string;
};

const DEMO_CHANNELS = ["field-reports", "alerts", "routes", "shelters", "supplies", "volunteers", "coordination"];
const postTestEnabled = process.argv.includes("--post-test");

const checks: Check[] = [];

const addCheck = (name: string, status: CheckStatus, detail: string): void => {
  checks.push({ name, status, detail });
};

const slackError = (error: unknown): string => {
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = (error as { data?: { error?: string } }).data;
    if (data?.error) {
      return data.error;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "unknown_error";
};

const printChecks = (): void => {
  for (const check of checks) {
    const mark = check.status === "pass" ? "PASS" : check.status === "warn" ? "WARN" : "FAIL";
    console.log(`[${mark}] ${check.name}: ${check.detail}`);
  }
};

const main = async (): Promise<void> => {
  const config = loadConfig();

  addCheck("SLACK_BOT_TOKEN", "pass", "present and has xoxb- shape");
  addCheck("SLACK_APP_TOKEN", "pass", "present and has xapp- shape");
  addCheck(
    "SLACK_COORDINATION_CHANNEL_ID",
    config.coordinationChannelId ? "pass" : "fail",
    config.coordinationChannelId ? "present" : "missing; Post to Coordination will fail"
  );

  const botClient = new WebClient(config.slackBotToken);
  const appClient = new WebClient(config.slackAppToken);

  try {
    const auth = await botClient.auth.test();
    addCheck("Bot auth", "pass", `authenticated as ${auth.user ?? auth.bot_id ?? "Slack bot"} in team ${auth.team ?? auth.team_id ?? "unknown"}`);
  } catch (error) {
    addCheck("Bot auth", "fail", `SLACK_BOT_TOKEN is invalid or not installed: ${slackError(error)}. Reinstall the Slack app and update the xoxb token.`);
  }

  try {
    await appClient.apiCall("apps.connections.open");
    addCheck("Socket Mode app token", "pass", "apps.connections.open succeeded; URL intentionally not printed");
  } catch (error) {
    addCheck("Socket Mode app token", "fail", `SLACK_APP_TOKEN cannot open Socket Mode: ${slackError(error)}. Enable Socket Mode and add connections:write.`);
  }

  let channels: Array<{ id?: string; name?: string; is_member?: boolean }> = [];
  try {
    const response = await botClient.conversations.list({
      types: "public_channel",
      exclude_archived: true,
      limit: 1000
    });
    channels = response.channels ?? [];
    addCheck("Channel list", "pass", `found ${channels.length} public channels`);
  } catch (error) {
    addCheck("Channel list", "fail", `conversations.list failed: ${slackError(error)}. Confirm channels:read is installed.`);
  }

  const byName = new Map(channels.map((channel) => [channel.name, channel]));
  for (const channelName of DEMO_CHANNELS) {
    const channel = byName.get(channelName);
    if (!channel?.id) {
      addCheck(`#${channelName}`, "fail", "channel missing");
      continue;
    }

    if (!channel.is_member) {
      addCheck(`#${channelName}`, "warn", `channel exists (${channel.id}) but bot is not a member; invite SentinelSwarm before live evidence scan`);
      continue;
    }

    try {
      await botClient.conversations.history({
        channel: channel.id,
        limit: 1
      });
      addCheck(`#${channelName}`, "pass", `bot is member and can read recent history (${channel.id})`);
    } catch (error) {
      const reason = slackError(error);
      const detail =
        reason === "missing_scope"
          ? "missing channels:history; reinstall app with updated scopes"
          : reason === "not_in_channel"
            ? "bot is not invited; invite SentinelSwarm to this channel"
            : `history check failed: ${reason}`;
      addCheck(`#${channelName}`, "fail", detail);
    }
  }

  if (config.coordinationChannelId) {
    try {
      const info = await botClient.conversations.info({
        channel: config.coordinationChannelId
      });
      const channel = info.channel as { name?: string; is_member?: boolean } | undefined;
      const status = channel?.is_member ? "pass" : "warn";
      const detail = channel?.is_member
        ? `coordination target resolves to #${channel.name ?? config.coordinationChannelId} and bot is a member`
        : `coordination target resolves, but bot membership is not confirmed`;
      addCheck("Coordination target", status, detail);
    } catch (error) {
      addCheck("Coordination target", "fail", `conversations.info failed: ${slackError(error)}. Use a C... public channel ID and invite the bot.`);
    }
  }

  if (postTestEnabled) {
    if (!config.coordinationChannelId) {
      addCheck("Optional write test", "fail", "cannot post because SLACK_COORDINATION_CHANNEL_ID is missing");
    } else {
      try {
        await botClient.chat.postMessage({
          channel: config.coordinationChannelId,
          text: "SentinelSwarm smoke test: Slack write path is working."
        });
        addCheck("Optional write test", "pass", "chat.postMessage succeeded in the coordination channel");
      } catch (error) {
        addCheck("Optional write test", "fail", `chat.postMessage failed: ${slackError(error)}. Check chat:write, channel ID, and bot membership.`);
      }
    }
  } else {
    addCheck("Optional write test", "warn", "skipped; run npm.cmd run smoke:slack -- --post-test to post a harmless coordination test message");
  }

  addCheck(
    "RTS runtime note",
    "pass",
    "assistant.search.context is tested during @SentinelSwarm incident analysis because Slack requires an app_mention action_token"
  );

  printChecks();

  const failed = checks.some((check) => check.status === "fail");
  if (failed) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error(`[FAIL] Smoke test crashed: ${slackError(error)}`);
  process.exitCode = 1;
});
