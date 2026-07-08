import type { WebClient } from "@slack/web-api";
import type { Evidence } from "../planner/schema";
import { loadMockContext } from "../tools/localData";

export type ContextResult = {
  status: "rts" | "mock";
  evidence: Evidence[];
  reason?: string;
};

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
  return {
    id: `rts-${index + 1}`,
    source: "Real-Time Search",
    channel: `#${String(channelName).replace(/^#/, "")}`,
    text: String(item.text ?? item.message?.text ?? item.title ?? "Slack context result"),
    permalink: item.permalink ?? item.url,
    confidence: 0.86,
    sourceType: "rts"
  };
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

  if (!actionToken) {
    return fallbackContext(zoneName, "No action_token in app_mention event");
  }

  try {
    const response = await client.apiCall("assistant.search.context", {
      action_token: actionToken,
      query: `${zoneName} flood OR route OR shelter OR volunteer OR supplies`,
      content_types: ["messages"],
      channel_types: ["public_channel"],
      include_context_messages: true,
      limit: 8
    });

    const rawMessages =
      (response as any).results?.messages ??
      (response as any).messages ??
      (response as any).results?.items ??
      [];

    const evidence = Array.isArray(rawMessages) ? rawMessages.map(normalizeRtsMessage).slice(0, 4) : [];

    if (evidence.length === 0) {
      return fallbackContext(zoneName, "RTS returned no usable message results");
    }

    return {
      status: "rts",
      evidence
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown RTS error";
    return fallbackContext(zoneName, message);
  }
};
