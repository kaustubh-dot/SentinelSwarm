import type { WebClient } from "@slack/web-api";
import type { Evidence } from "../planner/schema";
import { loadMockContext } from "../tools/localData";

export type ContextResult = {
  status: "rts" | "slack" | "mock";
  evidence: Evidence[];
  reason?: string;
  provenance: {
    rts: {
      attempted: boolean;
      matched: number;
      reason?: string;
    };
    fallback: "mockContext.json" | "none";
    slackScan: {
      attempted: boolean;
      matched: number;
      reason?: string;
    };
  };
};

const DEMO_CHANNEL_NAMES = new Set(["field-reports", "alerts", "routes", "shelters", "supplies", "volunteers", "coordination"]);

const CRISIS_TERMS = ["flood", "rain", "water", "route", "shelter", "volunteer", "suppl", "evacuat", "blocked", "rescue", "overflow"];

const redactActionToken = (message: string, actionToken?: string): string => {
  if (!actionToken) {
    return message;
  }

  return message.split(actionToken).join("[redacted-action-token]");
};

const errorMessage = (error: unknown, fallback: string, actionToken?: string): string => {
  const message = error instanceof Error ? error.message : fallback;
  return redactActionToken(message, actionToken);
};

const fallbackEvidence = (zoneName: string): Evidence[] => {
  const lowerZone = zoneName.toLowerCase();
  const mockContext = loadMockContext();
  const evidence = mockContext.filter((item) => item.text.toLowerCase().includes(lowerZone));
  return evidence.length > 0 ? evidence : mockContext;
};

const fallbackContext = (
  zoneName: string,
  reason: string,
  rts: ContextResult["provenance"]["rts"] = {
    attempted: false,
    matched: 0
  },
  slackScan: ContextResult["provenance"]["slackScan"] = {
    attempted: false,
    matched: 0
  },
  evidence = fallbackEvidence(zoneName)
): ContextResult => {
  return {
    status: "mock",
    evidence,
    reason,
    provenance: {
      rts,
      fallback: "mockContext.json",
      slackScan
    }
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

const scanDemoChannels = async (
  client: WebClient,
  zoneName: string
): Promise<{
  evidence: Evidence[];
  channelFailures: number;
}> => {
  const channels: any[] = [];
  let cursor: string | undefined;

  do {
    const listResponse = await client.apiCall("conversations.list", {
      types: "public_channel",
      exclude_archived: true,
      limit: 200,
      ...(cursor ? { cursor } : {})
    });

    const pageChannels = (listResponse as any).channels ?? [];
    if (Array.isArray(pageChannels)) {
      channels.push(...pageChannels);
    }

    const nextCursor = (listResponse as any).response_metadata?.next_cursor;
    cursor = typeof nextCursor === "string" && nextCursor.trim() ? nextCursor : undefined;
  } while (cursor);

  const evidence: Evidence[] = [];
  let channelFailures = 0;
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
      channelFailures += 1;
      // Some channels may require bot membership. Keep scanning the rest.
    }
  }

  return {
    evidence: evidence.slice(0, 6),
    channelFailures
  };
};

const appendLiveScanEvidence = async (
  client: WebClient,
  zoneName: string,
  baseEvidence: Evidence[],
  reasons: string[]
): Promise<{
  evidence: Evidence[];
  slackScan: ContextResult["provenance"]["slackScan"];
}> => {
  try {
    const scan = await scanDemoChannels(client, zoneName);
    const liveEvidence = scan.evidence;
    const failureNote =
      scan.channelFailures > 0
        ? `${scan.channelFailures} demo channel history request${scan.channelFailures === 1 ? "" : "s"} failed`
        : undefined;
    if (liveEvidence.length === 0) {
      const reason = failureNote ? `No enrichment results; ${failureNote}` : "No enrichment results";
      reasons.push(`Optional Slack channel scan returned ${reason.toLowerCase()}`);
      return {
        evidence: baseEvidence,
        slackScan: {
          attempted: true,
          matched: 0,
          reason
        }
      };
    }

    reasons.push(`Optional Slack channel scan added ${liveEvidence.length} enrichment result(s)${failureNote ? `; ${failureNote}` : ""}`);
    return {
      evidence: [...liveEvidence, ...baseEvidence],
      slackScan: {
        attempted: true,
        matched: liveEvidence.length,
        reason: failureNote
      }
    };
  } catch (error) {
    const reason = errorMessage(error, "Slack channel scan failed");
    reasons.push(`Optional Slack channel scan failed: ${reason}`);
    return {
      evidence: baseEvidence,
      slackScan: {
        attempted: true,
        matched: 0,
        reason
      }
    };
  }
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
  const rtsProvenance: ContextResult["provenance"]["rts"] = {
    attempted: Boolean(actionToken),
    matched: 0
  };

  if (actionToken) {
    try {
      const evidence = await searchRealtimeContext(client, actionToken, zoneName);
      rtsProvenance.matched = evidence.length;
      if (evidence.length > 0) {
        return {
          status: "rts",
          evidence,
          provenance: {
            rts: rtsProvenance,
            fallback: "none",
            slackScan: {
              attempted: false,
              matched: 0
            }
          }
        };
      }
      rtsProvenance.reason = "RTS returned no usable message results";
      fallbackReasons.push(rtsProvenance.reason);
    } catch (error) {
      const reason = errorMessage(error, "RTS failed", actionToken);
      rtsProvenance.reason = reason;
      fallbackReasons.push(`RTS failed: ${reason}`);
    }
  } else {
    rtsProvenance.reason = "No action_token in app_mention event";
    fallbackReasons.push(rtsProvenance.reason);
  }

  fallbackReasons.push("Using deterministic mockContext.json fallback");
  const mockEvidence = fallbackEvidence(zoneName);
  const enrichment = await appendLiveScanEvidence(client, zoneName, mockEvidence, fallbackReasons);

  return fallbackContext(zoneName, fallbackReasons.join("; "), rtsProvenance, enrichment.slackScan, enrichment.evidence);
};
