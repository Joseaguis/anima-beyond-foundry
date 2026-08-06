/**
 * The only thing the dice resolvers know about the outside world: something
 * that can roll one die. Keeping it behind this interface is what lets the
 * whole mechanic (open rolls, fumbles, mastery) be plain functions that vitest
 * can drive with a fixed sequence — the same trick the prep pipeline uses to
 * stay testable without Foundry (see tests/prep-pipeline.test.ts).
 *
 * Implementations:
 * - `foundryBackend()`   — evaluates a real `Die`, so Dice So Nice animates
 *                          every roll of an open chain. Lives in ./AnimaRoll.
 * - `randomBackend()`    — Math.random; used by the sandbox.
 * - `sequenceBackend()`  — fixed results; used by tests.
 */
export interface RollBackend {
  /** Roll a single die and return a result in [1, faces]. */
  rollDie(faces: number): Promise<number>;
}

/** Math.random-backed dice. Good enough for the sandbox and for previews. */
export function randomBackend(): RollBackend {
  return {
    async rollDie(faces: number): Promise<number> {
      return Math.floor(Math.random() * faces) + 1;
    },
  };
}

/**
 * Deterministic dice for tests: yields the given results in order. Throws when
 * the sequence runs out, so a test that rolls more times than it expected fails
 * loudly instead of silently drifting into random numbers.
 */
export function sequenceBackend(results: readonly number[]): RollBackend {
  let index = 0;
  return {
    async rollDie(faces: number): Promise<number> {
      if (index >= results.length) {
        throw new Error(
          `sequenceBackend exhausted: ${results.length} results provided, ${index + 1} requested`,
        );
      }
      const result = results[index++];
      if (result < 1 || result > faces) {
        throw new Error(`sequenceBackend: ${result} is not a valid d${faces} result`);
      }
      return result;
    },
  };
}
