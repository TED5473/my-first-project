import "server-only";
import { prisma } from "./db";

/**
 * First-boot auto-seed. Runs once per server process.
 *
 * Flow on a fresh Vercel deploy:
 *   - `build` script has already run `prisma migrate deploy`, so tables
 *      exist (if DATABASE_URL was wired before build).
 *   - On the first page request we notice "zero brands" and populate the
 *     DB with the 2026 IL market snapshot. Takes ~15 s.
 *   - Later requests see bootstrapped=true and no-op.
 *
 * If DATABASE_URL wasn't configured before the first deploy, we throw a
 * recognisable error and the caller renders a FirstBootScreen telling the
 * user to add a database + redeploy.
 *
 * Opt out with ILCL_SKIP_AUTOSEED=1.
 */

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
      try {
        brandCount = await prisma.brand.count();
      } catch (err) {
        // Either DATABASE_URL is missing or the schema hasn't been migrated
        // yet. In both cases the right answer is the first-boot UI.
        throw new DatabaseNotReadyError(String((err as Error).message ?? err));
      }

      if (brandCount === 0) {
        console.log("[ilcl] empty database detected — running first-boot seed…");
        const { runSeed } = await import("../../prisma/seed-core");
        await runSeed(prisma);
        console.log("[ilcl] first-boot seed complete.");
      }

      bootstrapped = true;
    } finally {
      bootstrapPromise = null;
    }
  })();

  return bootstrapPromise;
}
