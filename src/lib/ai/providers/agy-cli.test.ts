import { describe, expect, it, vi } from "vitest";

import { AgyCliProvider, findAgyBinary, DEFAULT_AGY_MODELS } from "./agy-cli";

describe("findAgyBinary", () => {
  it("resolves the local agy CLI binary", () => {
    const binary = findAgyBinary();
    expect(binary).not.toBeNull();
    expect(binary).toMatch(/agy$/);
  });
});

describe("AgyCliProvider", () => {
  it("initializes with default model and available binary", () => {
    const provider = new AgyCliProvider();
    expect(provider.model).toBe("gemini-3.8-flash-high");
    expect(provider.kind).toBe("LOCAL");
  });

  it("lists default AGY models", async () => {
    const provider = new AgyCliProvider();
    const models = await provider.listModels();
    expect(models).toEqual(expect.arrayContaining([...DEFAULT_AGY_MODELS]));
  });
});
