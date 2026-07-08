import type { WebClient } from "@slack/web-api";
import type { Evidence } from "../planner/schema";
import { loadMockContext } from "../tools/localData";

export type ContextResult = {
  status: "rts" | "slack" | "mock";
  evidence: Evidence[];
  reason?: string;
};

const DEMO_CHANNEL_NAMES = new Set(["field-reports", "alerts", "routes", "shelters", "supplies", "volunteers", "coordination"]);

const CRISIS_TERMS = ["flood", "rain", "water", "route", "shelter", "volunteer", "suppl", "evacuat", "blocked", "rescue", "overflow"];

const fallbackContext = (zoneName: string, reason: string): ContextResult => {
  const lowerZone = zoneName.toLowerCase();
  const evidence = loadMockContext().filter((item) => item.text.toLowerCase().includes(lowerZone));
  return {
    status: "mock",
    evidence,
    reason
  };
};

const normalizeRtsMessage = (item: any, index: number): Evidence => {
  const channelName = item.channel_name ?? item.channel?.name ?? item.channel_id ?? "Slack search";
  const text = messageText(item);
  if (!text) {
    throw new Error("RTS result did not contain message text");
  }

  return {
    id: `rts-${index + 1}`,
    source: "Real-Time Search",
    channel: `#${String(channelName).replace(/^#/, "")}`,
    text,
    permalink: item.permalink ?? item.url,
    confidence: 0.86,
    sourceType: "rts"
  };
};

const normalizeSlackMessage = (item: any, index: number, source: string, channelFallback = "Slack search"): Evidence => {
  const channelName = item.channel_name ?? item.channel?.name ?? item.channel_id ?? item.channel ?? channelFallback;
  const text = messageText(item);
  if (!text) {
    throw new Error("Slack result did not contain message text");
  }

  return {
    id: `slack-${index + 1}`,
    source,
    channel: String(channelName).startsWith("#") ? String(channelName) : `#${String(channelName).replace(/^#/, "")}`,
    text,
    permalink: item.permalink ?? item.url,
    confidence: 0.78,
    sourceType: "slack"
  };
};

const messageText = (item: any): string | undefined => {
  const value = item.content ?? item.text ?? item.message?.text ?? item.title;
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const isRelevant = (text: string, zoneName: string): boolean => {
  const lower = text.toLowerCase();
  const mentionedZones = Array.from(lower.matchAll(/\bzone\s*([a-z])\b/g)).map((match) => `zone ${match[1]}`);
  const currentZone = zoneName.toLowerCase();

  if (mentionedZones.length > 0) {
    return mentionedZones.includes(currentZone);
  }

  return CRISIS_TERMS.some((term) => lower.includes(term));
};

const flattenRtsResults = (value: any): any[] => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenRtsResults(item));
  }

  const nested = [
    ...flattenRtsResults(value.messages),
    ...flattenRtsResults(value.items),
    ...flattenRtsResults(value.context_messages?.before),
    ...flattenRtsResults(value.context_messages?.after)
  ];

  if (messageText(value)) {
    return [value, ...nested];
  }

  if (nested.length > 0) {
    return nested;
  }

  return [value];
};

const searchRealtimeContext = async (client: WebClient, actionToken: string, zoneName: string): Promise<Evidence[]> => {
  const response = await client.apiCall("assistant.search.context", {
    action_token: actionToken,
    query: `${zoneName} flood OR route OR shelter OR volunteer OR supplies`,
    content_types: ["messages"],
    channel_types: ["public_channel"],
    sort: "timestamp",
    sort_dir: "desc",
    include_context_messages: true,
    limit: 8
  });

  const rawMessages =
    (response as any).results?.messages ??
    (response as any).messages ??
    (response as any).results?.items ??
    (response as any).results ??
    [];

  return flattenRtsResults(rawMessages)
    .filter((item) => {
      const text = messageText(item);
      return text ? isRelevant(text, zoneName) : false;
    })
    .map(normalizeRtsMessage)
    .slice(0, 4);
};

const scanDemoChannels = async (client: WebClient, zoneName: string): Promise<Evidence[]> => {
  const listResponse = await client.apiCall("conversations.list", {
    types: "public_channel",
    exclude_archived: true,
    limit: 1000
  });

  const channels = (listResponse as any).channels ?? [];
  if (!Array.isArray(channels)) {
    return [];
  }

  const evidence: Evidence[] = [];
  for (const channel of channels) {
    const channelId = String(channel.id ?? "");
    const channelName = String(channel.name ?? "");
    if (!channelId || !DEMO_CHANNEL_NAMES.has(channelName)) {
      continue;
    }

    try {
      const historyResponse = await client.apiCall("conversations.history", {
        channel: channelId,
        limit: 25
      });
      const messages = (historyResponse as any).messages ?? [];
      if (!Array.isArray(messages)) {
        continue;
      }

      for (const message of messages) {
        const text = String(message.text ?? "");
        if (!text || !isRelevant(text, zoneName)) {
          continue;
        }
        evidence.push(
          normalizeSlackMessage(
            {
              ...message,
              channel_name: channelName
            },
            evidence.length,
            "Live Slack channel scan",
            channelName
          )
        );
      }
    } catch {
      // Some channels may require bot membership. Keep scanning the rest.
    }
  }

  return evidence.slice(0, 6);
};

export const searchSlackContext = async (
  client: WebClient,
  actionToken: string | undefined,
  zoneName: string,
  forceMock: boolean
): Promise<ContextResult> => {
  if (forceMock) {
    return fallbackContext(zoneName, "SENTINEL_FORCE_MOCKS=true");
  }

  const fallbackReasons: string[] = [];

  if (actionToken) {
    try {
      const evidence = await searchRealtimeContext(client, actionToken, zoneName);
      if (evidence.length > 0) {
        return {
          status: "rts",
          evidence
        };
      }
      fallbackReasons.push("RTS returned no usable message results");
    } catch (error) {
      fallbackReasons.push(error instanceof Error ? `RTS failed: ${error.message}` : "RTS failed");
    }
  } else {
    fallbackReasons.push("No action_token in app_mention event");
  }

  try {
    const evidence = await scanDemoChannels(client, zoneName);
    if (evidence.length > 0) {
      return {
        status: "slack",
        evidence,
        reason: fallbackReasons.join("; ")
      };
    }
    fallbackReasons.push("Slack channel scan returned no usable results");
  } catch (error) {
    fallbackReasons.push(error instanceof Error ? `Slack channel scan failed: ${error.message}` : "Slack channel scan failed");
  }

  return fallbackContext(zoneName, fallbackReasons.join("; "));
};
