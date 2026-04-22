/** CLI entrypoint — delegates to the reusable runSeed() in seed-core. */
import { runSeed } from "./seed-core";

runSeed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
