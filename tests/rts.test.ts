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

  it("falls back to live channel history when RTS action token is missing", async () => {
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

    expect(context.status).toBe("slack");
    expect(context.reason).toContain("No action_token");
    expect(context.evidence[0].source).toBe("Live Slack channel scan");
    expect(context.evidence[0].text).toContain("R2");
  });

  it("uses mock context when live context is forced", async () => {
    const client = createClient(async () => {
      throw new Error("Should not call Slack when mocks are forced");
    });

    const context = await searchSlackContext(client, undefined, "Zone B", true);

    expect(context.status).toBe("mock");
    expect(context.reason).toBe("SENTINEL_FORCE_MOCKS=true");
    expect(context.evidence.length).toBeGreaterThan(0);
  });
});

