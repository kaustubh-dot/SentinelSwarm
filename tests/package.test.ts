import { describe, expect, it } from "vitest";
import packageJson from "../package.json";

describe("package entrypoints", () => {
  it("starts the compiled Slack app entrypoint", () => {
    expect(packageJson.main).toBe("dist/src/app.js");
    expect(packageJson.scripts.start).toBe("node dist/src/app.js");
  });
});
