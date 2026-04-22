/**
 * Unified build entrypoint. Runs in a single Node process so env-var
 * mutations made by prepare-env.mjs propagate into the child commands
 * (prisma + next) via inherited process.env.
 *
 * Steps:
 *   1. Resolve DATABASE_URL / DIRECT_URL from whatever naming convention
 *      the user's Postgres provider used (see prepare-env.mjs).
 *   2. prisma generate — always required to build the Prisma client.
 *   3. prisma migrate deploy — best-effort; if the DB isn't reachable the
 *      app falls back to a friendly "Getting things ready…" screen.
 *   4. next build.
 */

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prepareEnv = path.join(__dirname, "prepare-env.mjs");

await runScript(prepareEnv);
await run("npx", ["prisma", "generate"]);

try {
  await run("npx", ["prisma", "migrate", "deploy"]);
} catch {
  console.log(
    "[ilcl] skipping migrate (database not reachable yet — the app will show a first-boot screen until it is)",
  );
}

await run("npx", ["next", "build"]);

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
      env: process.env,
    });
    child.on("exit", (code) => {
      if (code === 0) resolve(undefined);
      else reject(new Error(`${cmd} ${args.join(" ")} exited ${code}`));
    });
  });
}

async function runScript(file) {
  // Load the script as a module so its top-level mutations to process.env
  // persist into the parent process (this one), which then forwards them
  // to the prisma / next child processes above.
  await import(file);
}
