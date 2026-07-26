/**
 * Slug helpers.
 *
 * Foundry ships `String.prototype.slugify`, but it is a prototype extension
 * that only exists inside a running Foundry client — the sandbox and vitest
 * would break on it. This is our own equivalent, used by the item `slug` field
 * and by the ki technique roll options.
 */

/** "Golpe del Águila" → "golpe-del-aguila". */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
