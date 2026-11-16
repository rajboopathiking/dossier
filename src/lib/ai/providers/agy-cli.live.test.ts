import { describe, expect, it } from "vitest";
import { z } from "zod";

import { AgyCliProvider } from "./agy-cli";

describe.skipIf(!process.env.AGY_LIVE_TEST)("AgyCliProvider Live Test", () => {
  it("connects and extracts structured JSON using agy CLI without effort conflict", async () => {
    const provider = new AgyCliProvider("gemini-3.8-flash-high");

    // 1. Connection check
    const testResult = await provider.test();
    expect(testResult.model).toContain("gemini-3.8-flash-high");
    expect(testResult.latencyMs).toBeGreaterThan(0);

    // 2. Structured extraction with effort: "low" (which previously conflicted with -high)
    const schema = z.object({
      role: z.string(),
      company: z.string(),
      location: z.string(),
    });

    const result = await provider.complete({
      task: "extract-posting",
      system: "Extract role, company, and location as JSON.",
      messages: [{ role: "user", content: "Senior AI Engineer at Acme Corp in New York, NY." }],
      schema,
      schemaName: "job_info",
      effort: "low",
    });

    expect(result.role).toBe("Senior AI Engineer");
    expect(result.company).toBe("Acme Corp");
    expect(result.location).toContain("New York");
  }, 60_000);
});
