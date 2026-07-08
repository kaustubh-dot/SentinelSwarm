import { WebClient } from "@slack/web-api";

export type DemoSeedMessage = {
  channel: string;
  text: string;
};

type SlackApiClient = {
  apiCall(method: string, params: Record<string, unknown>): Promise<unknown>;
};

export const DEMO_SEED_MESSAGES: DemoSeedMessage[] = [
  {
    channel: "alerts",
    text: "Weather desk: rainfall intensity is increasing near Zone B for the next 90 minutes. Riverside Lane and the old bus depot area should be treated as high risk."
  },
  {
    channel: "alerts",
    text: "Drainage watch: runoff is backing up near the low-lying blocks in Zone B. Recheck access routes before sending volunteer vehicles."
  },
  {
    channel: "routes",
    text: "Zone B route update: Route R2 via Riverside Lane is blocked by debris and standing water. Avoid for the next 4 hours."
  },
  {
    channel: "routes",
    text: "Route R4 via Hill School Road is open for light vehicles and is the safest path to the Zone B shelter."
  },
  {
    channel: "routes",
    text: "Route R6 via Market Road is passable but slow because of waterlogging near the bus depot."
  },
  {
    channel: "shelters",
    text: "Hill School shelter has 18 free spaces, blankets available, and needs drinking water by evening for Zone B evacuees."
  },
  {
    channel: "shelters",
    text: "Community Hall shelter is full and cannot accept more families right now."
  },
  {
    channel: "supplies",
    text: "Main depot has 40 water cans, 25 blankets, and 12 first-aid kits. Driver available if the Zone B route is confirmed."
  },
  {
    channel: "supplies",
    text: "Field locker has 3 portable lights ready for teams working after sunset."
  },
  {
    channel: "volunteers",
    text: "Anika and Dev are available with a 4x4 from 5pm to 9pm for Zone B support. Both are first-aid trained."
  },
  {
    channel: "volunteers",
    text: "Maya can coordinate phone check-ins for Zone B households for the next 3 hours."
  },
  {
    channel: "field-reports",
    text: "Zone B update: water is rising near Riverside Lane. Two homes requesting evacuation support. Elderly residents present."
  },
  {
    channel: "field-reports",
    text: "Field team reports knee-deep water near the old bus depot in Zone B. Need route check before sending volunteers."
  }
];

export const seedChannelNames = (messages: DemoSeedMessage[] = DEMO_SEED_MESSAGES): string[] =>
  Array.from(new Set(messages.map((message) => message.channel)));

export const formatSeedPlan = (messages: DemoSeedMessage[] = DEMO_SEED_MESSAGES): string[] => {
  const counts = new Map<string, number>();
  for (const message of messages) {
    counts.set(message.channel, (counts.get(message.channel) ?? 0) + 1);
  }

  return seedChannelNames(messages).map((channel) => `#${channel}: ${counts.get(channel) ?? 0} message(s)`);
};

export const resolveSeedChannels = async (
  client: SlackApiClient,
  channelNames: string[] = seedChannelNames()
): Promise<{ channelIds: Map<string, string>; missing: string[]; notMember: string[] }> => {
  const channels: Array<{ id?: string; name?: string; is_member?: boolean }> = [];
  let cursor: string | undefined;

  do {
    const response = await client.apiCall("conversations.list", {
      types: "public_channel",
      exclude_archived: true,
      limit: 1000,
      ...(cursor ? { cursor } : {})
    });
    const page = response as {
      channels?: Array<{ id?: string; name?: string; is_member?: boolean }>;
      response_metadata?: { next_cursor?: string };
    };
    channels.push(...(page.channels ?? []));
    cursor = page.response_metadata?.next_cursor?.trim() || undefined;
  } while (cursor);

  const channelIds = new Map<string, string>();
  const notMember: string[] = [];

  for (const channel of channels) {
    if (channel.id && channel.name && channelNames.includes(channel.name)) {
      channelIds.set(channel.name, channel.id);
      if (channel.is_member === false) {
        notMember.push(channel.name);
      }
    }
  }

  return {
    channelIds,
    missing: channelNames.filter((channelName) => !channelIds.has(channelName)),
    notMember
  };
};

const sleep = (delayMs: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, delayMs));

export const postDemoSeedMessages = async (
  client: SlackApiClient,
  channelIds: Map<string, string>,
  messages: DemoSeedMessage[] = DEMO_SEED_MESSAGES,
  delayMs = 250
): Promise<number> => {
  let posted = 0;
  for (const message of messages) {
    const channelId = channelIds.get(message.channel);
    if (!channelId) {
      throw new Error(`Missing channel ID for #${message.channel}`);
    }

    await client.apiCall("chat.postMessage", {
      channel: channelId,
      text: message.text
    });
    posted += 1;

    if (delayMs > 0) {
      await sleep(delayMs);
    }
  }

  return posted;
};

const printPlan = (): void => {
  console.log("SentinelSwarm demo seed plan:");
  for (const line of formatSeedPlan()) {
    console.log(`- ${line}`);
  }
  console.log("");
  console.log("Dry run only. To post these fictional messages into Slack, run:");
  console.log("npm.cmd run seed:slack -- --post");
};

const slackError = (error: unknown): string => {
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = (error as { data?: { error?: string } }).data;
    if (data?.error) {
      return data.error;
    }
  }

  return error instanceof Error ? error.message : "unknown_error";
};

const loadSeedBotToken = async (): Promise<string> => {
  const dotenv = await import("dotenv");
  dotenv.default.config({ quiet: true });

  const token = process.env.SLACK_BOT_TOKEN;
  if (!token?.startsWith("xoxb-")) {
    throw new Error("SLACK_BOT_TOKEN must be set and start with xoxb- before posting seed messages.");
  }

  return token;
};

export const main = async (argv = process.argv.slice(2)): Promise<void> => {
  const shouldPost = argv.includes("--post");
  if (!shouldPost) {
    printPlan();
    return;
  }

  const client = new WebClient(await loadSeedBotToken());
  const { channelIds, missing, notMember } = await resolveSeedChannels(client);

  if (missing.length > 0) {
    throw new Error(`Missing demo channels: ${missing.map((channel) => `#${channel}`).join(", ")}. Create them and invite SentinelSwarm first.`);
  }
  if (notMember.length > 0) {
    throw new Error(`SentinelSwarm is not a member of: ${notMember.map((channel) => `#${channel}`).join(", ")}. Invite the bot before seeding.`);
  }

  const posted = await postDemoSeedMessages(client, channelIds);
  console.log(`Posted ${posted} fictional demo seed message(s).`);
  console.log("Now trigger the demo from #field-reports with: @SentinelSwarm analyze Zone B risk");
};

if (require.main === module) {
  main().catch((error) => {
    console.error(`[FAIL] Demo seed failed: ${slackError(error)}`);
    process.exitCode = 1;
  });
}
