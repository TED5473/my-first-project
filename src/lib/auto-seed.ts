import "server-only";
import { prisma } from "./db";

/**
 * First-boot auto-seed + re-seed on data version bump.
 *
 * Flow:
 *   - If DATABASE has never been populated → run the seed.
 *   - If DATABASE has been populated but the stamped SEED_VERSION differs
 *     from CURRENT_SEED_VERSION → wipe + reseed. This is how we roll out
 *     new calibrations (e.g. switching from the hand-curated demo data to
 *     cartube-sourced real 2026 prices/volumes) without any manual step.
 *
 * The stamp lives in the Alert table as a sentinel row with a known title
 * prefix; we keep it there to avoid a new migration just to track state.
 */

const CURRENT_SEED_VERSION = "2026-04-cartube-v1";
const STAMP_PREFIX = "__ilcl_seed_version:";

let bootstrapped = false;
let bootstrapPromise: Promise<void> | null = null;

export class DatabaseNotReadyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseNotReadyError";
  }
}

export async function ensureSeeded(): Promise<void> {
  if (bootstrapped) return;
  if (process.env.ILCL_SKIP_AUTOSEED === "1") {
    bootstrapped = true;
    return;
  }
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = (async () => {
    try {
      let brandCount = 0;
      let storedVersion: string | null = null;
      try {
        brandCount = await prisma.brand.count();
        const stamp = await prisma.alert.findFirst({
          where: { title: { startsWith: STAMP_PREFIX } },
        });
        if (stamp) storedVersion = stamp.title.slice(STAMP_PREFIX.length);
      } catch (err) {
        throw new DatabaseNotReadyError(String((err as Error).message ?? err));
      }

      const needsSeed = brandCount === 0 || storedVersion !== CURRENT_SEED_VERSION;

      if (needsSeed) {
        if (brandCount === 0) {
          console.log("[ilcl] empty database — running first-boot seed…");
        } else {
          console.log(
            `[ilcl] seed version mismatch (${storedVersion ?? "none"} → ${CURRENT_SEED_VERSION}) — reseeding…`,
          );
        }
        const { runSeed } = await import("../../prisma/seed-core");
        await runSeed(prisma);

        // Stamp the new version.
        await prisma.alert.create({
          data: {
            severity: "info",
            title: `${STAMP_PREFIX}${CURRENT_SEED_VERSION}`,
            body: `Seed stamped at ${new Date().toISOString()}`,
          },
        });
        console.log("[ilcl] seed complete, version stamped.");
      }

      bootstrapped = true;
    } finally {
      bootstrapPromise = null;
    }
  })();

  return bootstrapPromise;
}
