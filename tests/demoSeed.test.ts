import { describe, expect, it, vi } from "vitest";
import { DEMO_SEED_MESSAGES, formatSeedPlan, postDemoSeedMessages, resolveSeedChannels, seedChannelNames } from "../scripts/demo-seed";

describe("demo seed script", () => {
  it("defines a narrow fictional Zone B seed pack without triggering the bot", () => {
    expect(seedChannelNames()).toEqual(["alerts", "routes", "shelters", "supplies", "volunteers", "field-reports"]);
    expect(DEMO_SEED_MESSAGES.length).toBeGreaterThanOrEqual(10);
    expect(DEMO_SEED_MESSAGES.every((message) => message.text.includes("xoxb-") === false)).toBe(true);
    expect(DEMO_SEED_MESSAGES.every((message) => message.text.includes("xapp-") === false)).toBe(true);
    expect(DEMO_SEED_MESSAGES.some((message) => message.text.includes("@SentinelSwarm"))).toBe(false);
    expect(DEMO_SEED_MESSAGES.some((message) => message.text.includes("Zone B"))).toBe(true);
  });

  it("renders dry-run counts by channel", () => {
    expect(formatSeedPlan()).toEqual([
      "#alerts: 2 message(s)",
      "#routes: 3 message(s)",
      "#shelters: 2 message(s)",
      "#supplies: 2 message(s)",
      "#volunteers: 2 message(s)",
      "#field-reports: 2 message(s)"
    ]);
  });

  it("resolves required Slack channels and reports missing ones", async () => {
    const client = {
      apiCall: vi.fn().mockResolvedValue({
        channels: [
          { id: "CALERTS", name: "alerts", is_member: true },
          { id: "CROUTES", name: "routes", is_member: true }
        ]
      })
    };

    const result = await resolveSeedChannels(client, ["alerts", "routes", "field-reports"]);

    expect(client.apiCall).toHaveBeenCalledWith("conversations.list", {
      types: "public_channel",
      exclude_archived: true,
      limit: 1000
    });
    expect(result.channelIds.get("alerts")).toBe("CALERTS");
    expect(result.channelIds.get("routes")).toBe("CROUTES");
    expect(result.missing).toEqual(["field-reports"]);
    expect(result.notMember).toEqual([]);
  });

  it("paginates channel resolution and preflights bot membership", async () => {
    const client = {
      apiCall: vi
        .fn()
        .mockResolvedValueOnce({
          channels: [{ id: "CALERTS", name: "alerts", is_member: true }],
          response_metadata: { next_cursor: "page-2" }
        })
        .mockResolvedValueOnce({
          channels: [{ id: "CFIELD", name: "field-reports", is_member: false }],
          response_metadata: { next_cursor: "" }
        })
    };

    const result = await resolveSeedChannels(client, ["alerts", "field-reports"]);

    expect(client.apiCall).toHaveBeenNthCalledWith(2, "conversations.list", {
      types: "public_channel",
      exclude_archived: true,
      limit: 1000,
      cursor: "page-2"
    });
    expect(result.channelIds.get("field-reports")).toBe("CFIELD");
    expect(result.missing).toEqual([]);
    expect(result.notMember).toEqual(["field-reports"]);
  });

  it("posts seed messages in order to resolved channel IDs", async () => {
    const client = {
      apiCall: vi.fn().mockResolvedValue({ ok: true })
    };
    const channelIds = new Map([
      ["alerts", "CALERTS"],
      ["field-reports", "CFIELD"]
    ]);
    const messages = [
      { channel: "alerts", text: "Weather desk: Zone B rain is increasing." },
      { channel: "field-reports", text: "Zone B update: water rising near Riverside Lane." }
    ];

    const posted = await postDemoSeedMessages(client, channelIds, messages, 0);

    expect(posted).toBe(2);
    expect(client.apiCall).toHaveBeenNthCalledWith(1, "chat.postMessage", {
      channel: "CALERTS",
      text: messages[0].text
    });
    expect(client.apiCall).toHaveBeenNthCalledWith(2, "chat.postMessage", {
      channel: "CFIELD",
      text: messages[1].text
    });
  });
});
