import { describe, expect, it } from "vitest";
import { searchSlackContext } from "../src/slack/rts";

const createClient = (handler: (method: string, params: Record<string, unknown>) => Promise<unknown>) => {
  return {
    apiCall: handler
  } as any;
};

describe("searchSlackContext", () => {
  it("normalizes Real-Time Search content fields", async () => {
    const client = createClient(async (method) => {
      expect(method).toBe("assistant.search.context");
      return {
        results: [
          {
            content: "Zone A route update: Route R4 via East Bypass is open for emergency vehicles.",
            channel_name: "routes",
            permalink: "https://example.slack.com/rts"
          }
        ]
      };
    });

    const context = await searchSlackContext(client, "action-token", "Zone A", false);

    expect(context.status).toBe("rts");
    expect(context.evidence[0].text).toContain("Route R4");
    expect(context.evidence[0].sourceType).toBe("rts");
  });

  it("uses mock context as the guaranteed fallback and enriches with live channel history", async () => {
    const client = createClient(async (method, params) => {
      if (method === "conversations.list") {
        return {
          channels: [
            {
              id: "CROUTES",
              name: "routes"
            }
          ]
        };
      }

      if (method === "conversations.history") {
        expect(params.channel).toBe("CROUTES");
        return {
          messages: [
            {
              text: "Zone A route update: Route R2 over Canal Bridge is blocked by overflow."
            }
          ]
        };
      }

      throw new Error(`Unexpected method ${method}`);
    });

    const context = await searchSlackContext(client, undefined, "Zone A", false);

    expect(context.status).toBe("mock");
    expect(context.reason).toContain("No action_token");
    expect(context.reason).toContain("Using deterministic mockContext.json fallback");
    expect(context.provenance.rts).toMatchObject({
      attempted: false,
      matched: 0
    });
    expect(context.provenance.fallback).toBe("mockContext.json");
    expect(context.provenance.slackScan).toMatchObject({
      attempted: true,
      matched: 1
    });
    expect(context.evidence.some((item) => item.sourceType === "mock")).toBe(true);
    expect(context.evidence.some((item) => item.source === "Live Slack channel scan" && item.text.includes("R2"))).toBe(true);
  });

  it("does not collect explicit messages for another zone during channel scan", async () => {
    const client = createClient(async (method) => {
      if (method === "conversations.list") {
        return {
          channels: [
            {
              id: "CROUTES",
              name: "routes"
            }
          ]
        };
      }

      if (method === "conversations.history") {
        return {
          messages: [
            {
              text: "Zone B route update: Route R2 through Riverside Lane is blocked."
            },
            {
              text: "Zone A route update: Route R4 via East Bypass is open."
            }
          ]
        };
      }

      throw new Error(`Unexpected method ${method}`);
    });

    const context = await searchSlackContext(client, undefined, "Zone A", false);

    expect(context.status).toBe("mock");
    const liveEvidence = context.evidence.filter((item) => item.source === "Live Slack channel scan");
    expect(liveEvidence).toHaveLength(1);
    expect(liveEvidence[0].text).toContain("Zone A");
  });

  it("ignores unusable RTS wrapper results and falls back to mock context before channel scan enrichment", async () => {
    const client = createClient(async (method) => {
      if (method === "assistant.search.context") {
        return {
          results: [
            {
              channel_name: "routes"
            }
          ]
        };
      }

      if (method === "conversations.list") {
        return {
          channels: [
            {
              id: "CROUTES",
              name: "routes"
            }
          ]
        };
      }

      if (method === "conversations.history") {
        return {
          messages: [
            {
              text: "Zone A route update: Route R4 via East Bypass is open."
            }
          ]
        };
      }

      throw new Error(`Unexpected method ${method}`);
    });

    const context = await searchSlackContext(client, "action-token", "Zone A", false);

    expect(context.status).toBe("mock");
    expect(context.reason).toContain("RTS returned no usable message results");
    expect(context.reason).toContain("Using deterministic mockContext.json fallback");
    expect(context.provenance.rts).toMatchObject({
      attempted: true,
      matched: 0
    });
    expect(context.provenance.slackScan.matched).toBe(1);
    expect(context.evidence.some((item) => item.sourceType === "mock")).toBe(true);
    expect(context.evidence.some((item) => item.source === "Live Slack channel scan" && item.text.includes("Route R4"))).toBe(true);
  });

  it("redacts action_token values from RTS fallback reasons", async () => {
    const token = "xoxe-action-secret-token";
    const client = createClient(async (method) => {
      if (method === "assistant.search.context") {
        throw new Error(`Slack rejected action token ${token}`);
      }

      if (method === "conversations.list") {
        return {
          channels: []
        };
      }

      throw new Error(`Unexpected method ${method}`);
    });

    const context = await searchSlackContext(client, token, "Zone B", false);

    expect(context.status).toBe("mock");
    expect(context.reason).toContain("[redacted-action-token]");
    expect(context.reason).not.toContain(token);
    expect(context.provenance.rts.reason).toContain("[redacted-action-token]");
  });

  it("normalizes nested Real-Time Search result groups", async () => {
    const client = createClient(async (method) => {
      expect(method).toBe("assistant.search.context");
      return {
        results: [
          {
            messages: [
              {
                text: "Zone B shelter update: Hill School shelter has 40 spaces.",
                channel_name: "shelters"
              }
            ]
          }
        ]
      };
    });

    const context = await searchSlackContext(client, "action-token", "Zone B", false);

    expect(context.status).toBe("rts");
    expect(context.evidence[0].channel).toBe("#shelters");
    expect(context.evidence[0].text).toContain("Hill School");
  });

  it("uses mock context when live context is forced", async () => {
    const client = createClient(async () => {
      throw new Error("Should not call Slack when mocks are forced");
    });

    const context = await searchSlackContext(client, undefined, "Zone B", true);

    expect(context.status).toBe("mock");
    expect(context.reason).toBe("SENTINEL_FORCE_MOCKS=true");
    expect(context.evidence.length).toBeGreaterThan(0);
    expect(context.provenance.fallback).toBe("mockContext.json");
  });

  it("paginates production Slack channel scans used for fallback enrichment", async () => {
    const cursors: unknown[] = [];
    const client = createClient(async (method, params) => {
      if (method === "conversations.list") {
        cursors.push(params.cursor);
        if (!params.cursor) {
          return {
            channels: [
              {
                id: "CRANDOM",
                name: "random"
              }
            ],
            response_metadata: {
              next_cursor: "page-2"
            }
          };
        }

        return {
          channels: [
            {
              id: "CROUTES",
              name: "routes"
            }
          ],
          response_metadata: {
            next_cursor: ""
          }
        };
      }

      if (method === "conversations.history") {
        expect(params.channel).toBe("CROUTES");
        return {
          messages: [
            {
              text: "Zone B route update: Route R2 through Riverside Lane is blocked."
            }
          ]
        };
      }

      throw new Error(`Unexpected method ${method}`);
    });

    const context = await searchSlackContext(client, undefined, "Zone B", false);

    expect(cursors).toEqual([undefined, "page-2"]);
    expect(context.status).toBe("mock");
    expect(context.provenance.slackScan.matched).toBe(1);
    expect(context.evidence.some((item) => item.source === "Live Slack channel scan")).toBe(true);
  });

  it("reports inaccessible demo channels during optional Slack enrichment", async () => {
    const client = createClient(async (method) => {
      if (method === "conversations.list") {
        return {
          channels: [
            {
              id: "CFIELD",
              name: "field-reports"
            },
            {
              id: "CROUTES",
              name: "routes"
            }
          ]
        };
      }

      if (method === "conversations.history") {
        throw new Error("not_in_channel");
      }

      throw new Error(`Unexpected method ${method}`);
    });

    const context = await searchSlackContext(client, undefined, "Zone B", false);

    expect(context.status).toBe("mock");
    expect(context.provenance.slackScan).toMatchObject({
      attempted: true,
      matched: 0,
      reason: "No enrichment results; 2 demo channel history requests failed"
    });
    expect(context.reason).toContain("2 demo channel history requests failed");
  });
});
