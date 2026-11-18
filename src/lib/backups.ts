import "server-only";

import { existsSync } from "node:fs";
import { mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildExport } from "@/lib/data-export";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

// Backups (E10-6, E10-7): exports written to DOSSIER_DATA_DIR/backups. They
// never hold the API key in plain text.

export type BackupReason = "before-import" | "nightly";

export const fallbackDataDir = () => path.resolve(process.cwd(), "data");

export function getEffectiveDataDir(): string {
  const preferred = env.DOSSIER_DATA_DIR;
  if (preferred === "/data" && !existsSync("/data")) {
    return fallbackDataDir();
  }
  return preferred;
}

export const backupsDir = () => path.join(getEffectiveDataDir(), "backups");

const pad = (value: number) => String(value).padStart(2, "0");

/** "dossier-backup-nightly-2026-09-28-030000.json", in the server's time zone. */
export function backupFileName(reason: BackupReason, now: Date): string {
  const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `dossier-backup-${reason}-${day}-${time}.json`;
}

/** Writes an export of everything to the backups folder; returns the file's name. */
export async function writeBackup(reason: BackupReason, now = new Date()): Promise<string> {
  const data = await buildExport(prisma, { now });
  let dir = backupsDir();
  try {
    await mkdir(dir, { recursive: true });
  } catch {
    // If the preferred data dir is not writable (e.g. root /data on macOS), fallback to local directory
    dir = path.join(fallbackDataDir(), "backups");
    await mkdir(dir, { recursive: true });
  }
  const name = backupFileName(reason, now);
  await writeFile(path.join(dir, name), JSON.stringify(data, null, 2));
  return name;
}

/** The backup files, newest first. */
export async function listBackups(): Promise<{ name: string; modified: Date }[]> {
  const candidateDirs = [backupsDir()];
  const fallback = path.join(fallbackDataDir(), "backups");
  if (!candidateDirs.includes(fallback) && existsSync(fallback)) {
    candidateDirs.push(fallback);
  }
  const files: { name: string; modified: Date }[] = [];
  const seen = new Set<string>();
  for (const dir of candidateDirs) {
    const names = (await readdir(/*turbopackIgnore: true*/ dir).catch(() => [])).filter((name) => /^dossier-backup-.*\.json$/.test(name));
    for (const name of names) {
      if (!seen.has(name)) {
        seen.add(name);
        try {
          const s = await stat(path.join(dir, name));
          files.push({ name, modified: s.mtime });
        } catch {
          // ignore stat errors on removed files
        }
      }
    }
  }
  return files.sort((a, b) => b.modified.getTime() - a.modified.getTime());
}

/** Deletes every backup file (Delete everything, E10-8). */
export async function deleteAllBackups(): Promise<void> {
  await rm(backupsDir(), { recursive: true, force: true }).catch(() => {});
  const fallback = path.join(fallbackDataDir(), "backups");
  if (fallback !== backupsDir()) {
    await rm(fallback, { recursive: true, force: true }).catch(() => {});
  }
}
