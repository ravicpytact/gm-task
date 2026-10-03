// Shared helpers for the repo's own checks (frontend-standards: "tools of ours").
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

export const ROOT = process.cwd();

/** All files under `dir`, as repo-relative POSIX paths. */
export function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(relative(ROOT, full).split(sep).join("/"));
  }
  return out;
}

export function entries(dir) {
  return readdirSync(join(ROOT, dir)).map((name) => ({
    name,
    isDir: statSync(join(ROOT, dir, name)).isDirectory(),
  }));
}

export function read(file) {
  return readFileSync(join(ROOT, file), "utf8");
}

/** A waiver on the same or the previous line, still in date: `waiver RULE-ID: reason (expires YYYY-MM-DD)`. */
export function isWaived(lines, index, ruleId) {
  const pattern = new RegExp(`waiver ${ruleId}:.*\\(expires (\\d{4}-\\d{2}-\\d{2})\\)`);
  for (const line of [lines[index], lines[index - 1]]) {
    const match = line?.match(pattern);
    if (match && new Date(match[1]) >= new Date(new Date().toISOString().slice(0, 10))) return true;
  }
  return false;
}

export function report(tool, findings) {
  for (const f of findings)
    console.error(`${f.rule} · ${f.file}${f.line ? `:${f.line}` : ""} · ${f.message}`);
  if (findings.length > 0) {
    console.error(`\n${tool}: ${findings.length} finding(s).`);
    process.exit(1);
  }
  console.log(`${tool}: no findings.`);
}
