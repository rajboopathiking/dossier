import { describe, expect, it, vi } from "vitest";

import { AUTOMATION_PRESETS, testCustomAutomationConnection } from "./automation";

describe("AUTOMATION_PRESETS", () => {
  it("defines presets for opencode, agy, and custom with expected defaults", () => {
    expect(AUTOMATION_PRESETS.opencode.defaultUrl).toBe("http://localhost:4096/v1");
    expect(AUTOMATION_PRESETS.opencode.defaultModel).toBe("opencode");
    expect(AUTOMATION_PRESETS.agy.defaultUrl).toBe("local");
    expect(AUTOMATION_PRESETS.agy.defaultModel).toBe("gemini-3.8-flash-high");
    expect(AUTOMATION_PRESETS.custom.defaultUrl).toBe("");
  });
});

describe("testCustomAutomationConnection", () => {
  it("rejects empty base URL without crashing", async () => {
    const result = await testCustomAutomationConnection({
      baseUrl: "",
      model: "test-model",
      apiKey: null,
    });
    expect(result.connected).toBe(false);
    expect(typeof result.message).toBe("string");
  });

  it("handles local agy CLI test without crashing", async () => {
    const result = await testCustomAutomationConnection({
      baseUrl: "local",
      model: "gemini-3.8-flash-high",
      apiKey: null,
    });
    expect(result).toBeDefined();
    expect(typeof result.connected).toBe("boolean");
  });

  it("rejects empty model without crashing", async () => {
    const result = await testCustomAutomationConnection({
      baseUrl: "https://api.example.com/v1",
      model: "",
      apiKey: null,
    });
    expect(result.connected).toBe(false);
    expect(result.message).toContain("Model name is required");
  });

  it("catches network or unreachable errors gracefully without throwing", async () => {
    const result = await testCustomAutomationConnection({
      baseUrl: "http://127.0.0.1:54321/v1",
      model: "dummy-model",
      apiKey: null,
      timeoutSeconds: 5,
    });
    expect(result.connected).toBe(false);
    expect(typeof result.message).toBe("string");
  });
});
