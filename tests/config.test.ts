import { afterEach, describe, expect, it, vi } from "vitest";
import { loadConfig } from "../src/config";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("loadConfig", () => {
  it("loads valid Slack config and defaults optional demo flags", () => {
    vi.stubEnv("SLACK_BOT_TOKEN", "xoxb-valid-token");
    vi.stubEnv("SLACK_APP_TOKEN", "xapp-valid-token");
    vi.stubEnv("SLACK_COORDINATION_CHANNEL_ID", "CCOORD");
    vi.stubEnv("SENTINEL_USE_LLM", "");
    vi.stubEnv("SENTINEL_FORCE_MOCKS", "yes");
    vi.stubEnv("GOOGLE_API_KEY", "");
    vi.stubEnv("GEMINI_MODEL", "");
    vi.stubEnv("LOG_LEVEL", "");

    expect(loadConfig()).toMatchObject({
      slackBotToken: "xoxb-valid-token",
      slackAppToken: "xapp-valid-token",
      coordinationChannelId: "CCOORD",
      useLlm: false,
      forceMocks: true,
      geminiModel: "gemini-3.5-flash",
      logLevel: "info"
    });
  });

  it("rejects tokens with the wrong Slack prefixes", () => {
    vi.stubEnv("SLACK_BOT_TOKEN", "bad-bot-token");
    vi.stubEnv("SLACK_APP_TOKEN", "bad-app-token");

    expect(() => loadConfig()).toThrow(/SLACK_BOT_TOKEN must start with xoxb-/);
    expect(() => loadConfig()).toThrow(/SLACK_APP_TOKEN must start with xapp-/);
  });

  it("rejects missing required Slack tokens with a setup hint", () => {
    vi.stubEnv("SLACK_BOT_TOKEN", "");
    vi.stubEnv("SLACK_APP_TOKEN", "");

    expect(() => loadConfig()).toThrow(/Copy \.env\.example to \.env/);
  });

  it("rejects invalid log levels", () => {
    vi.stubEnv("SLACK_BOT_TOKEN", "xoxb-valid-token");
    vi.stubEnv("SLACK_APP_TOKEN", "xapp-valid-token");
    vi.stubEnv("LOG_LEVEL", "verbose");

    expect(() => loadConfig()).toThrow(/Invalid enum value/);
  });

  it("parses explicit boolean flags and custom Gemini model", () => {
    vi.stubEnv("SLACK_BOT_TOKEN", "xoxb-valid-token");
    vi.stubEnv("SLACK_APP_TOKEN", "xapp-valid-token");
    vi.stubEnv("SENTINEL_USE_LLM", "ON");
    vi.stubEnv("SENTINEL_FORCE_MOCKS", "no");
    vi.stubEnv("GEMINI_MODEL", "models/gemini-test");

    expect(loadConfig()).toMatchObject({
      useLlm: true,
      forceMocks: false,
      geminiModel: "models/gemini-test"
    });
  });
});
