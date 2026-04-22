/** CLI entrypoint: `npm run scrape` */
import { runIviaRefresh } from "./ivia";
import { runImportersRefresh } from "./importers";

async function main() {
  console.log("→ IL CarLens refresh");
  const ivia = await runIviaRefresh({ demo: true });
  console.log(`  ivia: ${ivia.rows} rows`);
  const imps = await runImportersRefresh({ demo: true });
  console.log(`  importers: ${imps.rows} rows`);
  console.log("✓ done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
