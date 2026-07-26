/**
 * Regression of the Efecto catalog and the builder against the technique
 * compendium extracted from the Excel (159 techniques from the published trees).
 *
 * Note on CM: the reference sheet stores `CM Base` and `Coste` for these entries
 * as literal values copied from the books, not as formulas (only its own
 * "Técnicas Propias" block computes them). So the book CM is *not* a ground
 * truth for the builder and is only reported here, never asserted. What is
 * asserted is that every Efecto, option and Desventaja the books reference
 * exists in the catalog and that the composition raises no structural error.
 */
import { readdirSync, readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { buildTechnique } from "../src/domains/ki/technique-build";
import type { TechniqueComposition } from "../src/domains/ki/technique-data";

const PACK_DIR = path.resolve(__dirname, "..", "src", "packs", "_source", "kiTechniques");

interface PackDoc {
  name: string;
  system: TechniqueComposition & { bookCm: number | null; bookCost: string };
}

const docs: PackDoc[] = readdirSync(PACK_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(path.join(PACK_DIR, f), "utf-8")) as PackDoc);

/** Errors about the Ki split are expected: the books print only the total. */
const DISTRIBUTION_CODES = new Set(["kiNotDistributed", "upkeepNotDistributed"]);

/**
 * Gaps in the source data, not extraction bugs. The published trees reference a
 * few things the Excel's tables never list: the "Requerimiento" disadvantage
 * (from a supplement), and three options the books abbreviate or invent
 * ("RP 180" for Espejismo's "Ilusión Fantasmal RP 180"; "Desenfundar" and
 * "Especial" for Acciones Adicionales).
 *
 * Asserted as an exact set so that a regression in the extractor — which
 * canonicalises the books' loose capitalisation and accents against the tables —
 * shows up as a new entry here.
 */
const KNOWN_UNKNOWN_DISADVANTAGES = new Set(["requerimiento"]);
const KNOWN_UNKNOWN_OPTIONS = new Set([
  "espejismo/RP 180",
  "acciones-adicionales/Desenfundar",
  "acciones-adicionales/Especial",
]);

/**
 * Book techniques whose printed level is lower than the level their own Efectos
 * require. An inconsistency in the source, reported rather than corrected.
 */
const KNOWN_LEVEL_MISMATCHES = new Set(["Expello", "Obitus", "Yowai"]);

describe("compendio de técnicas", () => {
  it("extrae las 159 técnicas de los árboles publicados", () => {
    expect(docs.length).toBe(159);
  });

  it("todo Efecto que citan los libros existe en el catálogo", () => {
    const unresolved = docs.flatMap((doc) =>
      buildTechnique(doc.system)
        .errors.filter((e) => e.code === "unknownEffect")
        .map((e) => `${doc.name}: ${JSON.stringify(e.data)}`),
    );
    expect(unresolved).toEqual([]);
  });

  it("solo quedan sin resolver los huecos conocidos de la fuente", () => {
    const options = new Set<string>();
    const disadvantages = new Set<string>();
    for (const doc of docs) {
      for (const error of buildTechnique(doc.system).errors) {
        if (error.code === "unknownOption") {
          options.add(`${error.data?.effect}/${error.data?.option}`);
        }
        if (error.code === "unknownDisadvantage") {
          disadvantages.add(String(error.data?.disadvantage));
        }
      }
    }
    expect([...options].sort()).toEqual([...KNOWN_UNKNOWN_OPTIONS].sort());
    expect([...disadvantages].sort()).toEqual([...KNOWN_UNKNOWN_DISADVANTAGES].sort());
  });

  it("ninguna composición del compendio infringe las reglas de estructura", () => {
    const violations: string[] = [];
    for (const doc of docs) {
      for (const error of buildTechnique(doc.system).errors) {
        // The books print only the technique's total Ki, never its per-Efecto
        // split, so an unallocated distribution is expected.
        if (DISTRIBUTION_CODES.has(error.code)) continue;
        if (error.code === "unknownOption" || error.code === "unknownDisadvantage") continue;
        // Recomputing the hand-entered CM of a book technique can push it over
        // its level's ceiling; that divergence is reported below instead.
        if (error.code === "cmExceedsLevel") continue;
        if (
          (error.code === "effectLevelTooHigh" || error.code === "sustainEffectLevel") &&
          KNOWN_LEVEL_MISMATCHES.has(doc.name)
        ) {
          continue;
        }
        violations.push(`${doc.name}: ${error.code} ${JSON.stringify(error.data ?? {})}`);
      }
    }
    expect(violations).toEqual([]);
  });

  it("informa de cuánto se aparta el CM calculado del impreso en los libros", () => {
    let match = 0;
    const diffs: string[] = [];
    for (const doc of docs) {
      const { cm } = buildTechnique(doc.system);
      if (doc.system.bookCm === cm) match++;
      else diffs.push(`${doc.name}: calculado ${cm} vs libro ${doc.system.bookCm}`);
    }
    // Documented, not enforced: the book values are transcriptions, so a
    // mismatch is a data question rather than a builder failure.
    console.info(
      `[compendio] CM coincidente en ${match}/${docs.length} técnicas` +
        (diffs.length ? `; primeras diferencias:\n  ${diffs.slice(0, 10).join("\n  ")}` : ""),
    );
    expect(match + diffs.length).toBe(docs.length);
  });
});
