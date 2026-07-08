import { App, LogLevel } from "@slack/bolt";
import { loadConfig } from "./config";
import { registerHandlers } from "./slack/handlers";

const toSlackLogLevel = (level: string): LogLevel => {
  switch (level) {
    case "debug":
      return LogLevel.DEBUG;
    case "warn":
      return LogLevel.WARN;
    case "error":
      return LogLevel.ERROR;
    default:
      return LogLevel.INFO;
  }
};

const main = async (): Promise<void> => {
  const config = loadConfig();
  const app = new App({
    token: config.slackBotToken,
    appToken: config.slackAppToken,
    socketMode: true,
    logLevel: toSlackLogLevel(config.logLevel)
  });

  registerHandlers(app, config);

  await app.start();
  console.log("SentinelSwarm is running in Socket Mode.");
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
