/**
 * Build LevelDB compendium packs for the Anima Beyond Fantasy system.
 *
 * Compiles every directory under src/packs/_source/<name> into a LevelDB
 * database at dist/packs/<name>, using the official Foundry CLI. The JSON
 * files under _source are the single source of truth for system content
 * (categories included).
 *
 * Run via `npm run build:packs` (tsx), after `vite build` has created dist/.
 */
import { compilePack } from "@foundryvtt/foundryvtt-cli";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "fs";
import { createHash } from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const SOURCE_ROOT = path.join(root, "src", "packs", "_source");
const DEST_ROOT = path.join(root, "dist", "packs");

const ID_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/** Deterministic, well-distributed 16-char alphanumeric Foundry id. */
function makeId(seed: string): string {
  const digest = createHash("sha1").update(seed).digest();
  let out = "";
  for (let i = 0; i < 16; i++) {
    out += ID_CHARS[digest[i] % ID_CHARS.length];
  }
  return out;
}

/** Pack names declared in system.json, so every declared pack gets a LevelDB. */
function declaredPackNames(): string[] {
  const sys = JSON.parse(readFileSync(path.join(root, "src", "system.json"), "utf-8"));
  return (sys.packs ?? []).map((p: { name: string }) => p.name);
}

const STAGE_ROOT = path.join(root, ".pack_build");

/**
 * Copy a pack's source JSON into a staging dir, injecting the `_key` that the
 * Foundry CLI requires (`!items!<id>`) and an `_id` if missing. Authors only
 * need to write name/type/system in their source files.
 */
function stagePackSource(name: string): string {
  const src = path.join(SOURCE_ROOT, name);
  const stage = path.join(STAGE_ROOT, name);
  rmSync(stage, { recursive: true, force: true });
  mkdirSync(stage, { recursive: true });

  if (!existsSync(src)) return stage; // empty but valid pack

  const jsonFiles = readdirSync(src).filter((f) => f.endsWith(".json"));
  for (const file of jsonFiles) {
    const doc = JSON.parse(readFileSync(path.join(src, file), "utf-8"));
    if (!doc._id) doc._id = makeId(`${name}:${file}`);
    doc._key = `!items!${doc._id}`;
    writeFileSync(path.join(stage, file), JSON.stringify(doc), "utf-8");
  }
  return stage;
}

async function compileAll(): Promise<void> {
  mkdirSync(DEST_ROOT, { recursive: true });
  rmSync(STAGE_ROOT, { recursive: true, force: true });

  // Union of declared packs and any source dirs that exist on disk.
  const onDisk = existsSync(SOURCE_ROOT)
    ? readdirSync(SOURCE_ROOT, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
    : [];
  const names = Array.from(new Set([...declaredPackNames(), ...onDisk]));

  for (const name of names) {
    const stage = stagePackSource(name);
    const dest = path.join(DEST_ROOT, name);
    // compilePack syncs in place (adds source keys, deletes stale ones), so we
    // avoid rm'ing the dir — that would fail with EBUSY while Foundry holds the
    // LevelDB lock.
    try {
      await compilePack(stage, dest);
      console.log(`[packs] compiled ${name} -> dist/packs/${name}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/lock|EBUSY|not open/i.test(msg)) {
        throw new Error(
          `[packs] could not write '${name}': the pack is locked. ` +
            `Close Foundry VTT (or the world using this system) and rebuild.`,
        );
      }
      throw err;
    }
  }

  rmSync(STAGE_ROOT, { recursive: true, force: true });
}

async function main(): Promise<void> {
  if (!existsSync(SOURCE_ROOT)) {
    mkdirSync(SOURCE_ROOT, { recursive: true });
  }
  await compileAll();
  console.log("[packs] done");
}

main().catch((err) => {
  console.error("[packs] build failed:", err);
  process.exit(1);
});
