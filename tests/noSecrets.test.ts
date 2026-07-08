import { describe, expect, it } from "vitest";
import { scanTextForSecrets } from "../scripts/no-secrets";

describe("no-secrets scanner", () => {
  it("allows documented placeholder tokens", () => {
    const findings = scanTextForSecrets(
      ".env.example",
      ["SLACK_BOT_TOKEN=xoxb-your-bot-token", "SLACK_APP_TOKEN=xapp-your-app-level-token", "GOOGLE_API_KEY=..."].join("\n")
    );

    expect(findings).toEqual([]);
  });

  it("flags realistic Slack and Google token shapes", () => {
    const slackBotToken = `xoxb-${"123456789012"}-${"abcdefghijklmnop"}`;
    const slackAppToken = `xapp-${"1"}-${"A1234567890"}-${"abcdefghijklmnop"}`;
    const googleApiKey = `AIza${"SyDummydummydummydummydummy"}`;
    const findings = scanTextForSecrets(
      "notes.txt",
      [
        `SLACK_BOT_TOKEN=${slackBotToken}`,
        `SLACK_APP_TOKEN=${slackAppToken}`,
        `GOOGLE_API_KEY=${googleApiKey}`
      ].join("\n")
    );

    expect(findings.map((finding) => finding.label)).toEqual(["Slack bot token", "Slack app token", "Google API key", "Assigned Google API key"]);
  });
});
