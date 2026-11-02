// Runs every test file in this folder, even if an earlier one fails, and reports each result.
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(here).filter((f) => f.endsWith(".mjs") && !["run.mjs", "lib.mjs"].includes(f)).sort((a, b) => (a === "site.mjs" ? -1 : b === "site.mjs" ? 1 : a.localeCompare(b)));

const failed = [];
for (const file of files) {
  console.log(`\n=== ${file} ===`);
  const { status } = spawnSync(process.execPath, [file], { cwd: here, stdio: "inherit" });
  if (status !== 0) failed.push(file);
}

console.log(`\n${files.length - failed.length} of ${files.length} test files passed${failed.length ? `. Failed: ${failed.join(", ")}` : ""}`);
process.exitCode = failed.length ? 1 : 0;
