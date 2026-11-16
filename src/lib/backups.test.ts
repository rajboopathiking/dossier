import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    DOSSIER_DATA_DIR: "/data",
    DOSSIER_SECRET: "s".repeat(32),
  },
}));

import { backupFileName, backupsDir, fallbackDataDir, getEffectiveDataDir } from "./backups";

describe("backups directory resolution", () => {
  it("resolves to a valid data directory", () => {
    const dir = getEffectiveDataDir();
    expect(typeof dir).toBe("string");
    expect(path.isAbsolute(dir)).toBe(true);
    // If /data does not exist, it falls back to local data directory
    if (!existsSync("/data")) {
      expect(dir).toBe(fallbackDataDir());
    }
  });

  it("resolves backupsDir inside the effective data directory", () => {
    const bDir = backupsDir();
    expect(bDir).toBe(path.join(getEffectiveDataDir(), "backups"));
  });

  it("formats backup file names properly", () => {
    const date = new Date(2026, 8, 28, 3, 0, 0); // Month is 0-indexed: 8 is Sept
    const nightly = backupFileName("nightly", date);
    expect(nightly).toBe("dossier-backup-nightly-2026-09-28-030000.json");
    const beforeImport = backupFileName("before-import", date);
    expect(beforeImport).toBe("dossier-backup-before-import-2026-09-28-030000.json");
  });
});
