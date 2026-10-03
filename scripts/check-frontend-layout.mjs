// check-frontend-layout: FE-STRUCT-001, FE-STRUCT-007, FE-BOUND-002, FE-BOUND-003, FE-AUTH-002.
import { existsSync } from "node:fs";
import { entries, read, report, walk } from "./lib.mjs";

const findings = [];
const find = (rule, file, message, line) => findings.push({ rule, file, message, line });

// --- FE-STRUCT-001: closed sets -------------------------------------------------------------
const SRC_TOP = new Set([
  "app",
  "features",
  "components",
  "lib",
  "config",
  "proxy.ts",
  "instrumentation.ts",
]);
const FEATURE_FILES = new Set([
  "index.ts",
  "server.ts",
  "queries.ts",
  "hooks.ts",
  "store.ts",
  "api.ts",
  "schemas.ts",
  "types.ts",
  "constants.ts",
  "utils.ts",
]);
const FEATURE_DIRS = new Set([
  "components",
  "queries",
  "hooks",
  "store",
  "api",
  "schemas",
  "types",
  "constants",
  "utils",
]);
const COMPONENT_DIRS = new Set(["ui", "layout", "feedback", "form", "data-table"]);
const LIB_ENTRIES = new Set([
  "api",
  "query",
  "auth",
  "format",
  "hooks",
  "stores",
  "utils",
  "utils.ts",
]);
const CONFIG_FILES = new Set(["client-env.ts", "server-env.ts", "constants.ts"]);
const APP_FILE = new RegExp(
  "^(page|layout|template|loading|error|global-error|not-found|forbidden|unauthorized|default|route|" +
    "icon\\d*|apple-icon\\d*|opengraph-image\\d*|twitter-image\\d*|sitemap|robots|manifest)" +
    "\\.(tsx|ts|jsx|js|png|jpg|svg|ico|txt|xml|json|webmanifest)$|^globals\\.css$|^favicon\\.ico$",
);
const isTest = (name) => /\.test\.tsx?$/.test(name);

for (const { name } of entries("src")) {
  if (!SRC_TOP.has(name))
    find("FE-STRUCT-001", `src/${name}`, "not in the closed set of src/ entries");
}

if (existsSync("src/features")) {
  for (const feature of entries("src/features")) {
    const base = `src/features/${feature.name}`;
    if (!feature.isDir) {
      find("FE-STRUCT-001", base, "only feature folders live in src/features");
      continue;
    }
    for (const { name, isDir } of entries(base)) {
      const ok = isDir ? FEATURE_DIRS.has(name) : FEATURE_FILES.has(name) || isTest(name);
      if (!ok) find("FE-STRUCT-001", `${base}/${name}`, "not a feature entry");
      if (isDir && name !== "components" && !existsSync(`${base}/${name}/index.ts`)) {
        find("FE-STRUCT-001", `${base}/${name}`, "a directory entry needs an index.ts");
      }
    }
  }
}

for (const { name, isDir } of entries("src/components")) {
  if (!isDir || !COMPONENT_DIRS.has(name))
    find("FE-STRUCT-001", `src/components/${name}`, "not a shared component folder");
}
for (const { name } of entries("src/lib")) {
  if (!LIB_ENTRIES.has(name)) find("FE-STRUCT-001", `src/lib/${name}`, "not a lib entry");
}
for (const { name } of entries("src/config")) {
  if (!CONFIG_FILES.has(name)) find("FE-STRUCT-001", `src/config/${name}`, "not a config module");
}
for (const file of walk("src/app")) {
  const parts = file.split("/");
  const name = parts.at(-1);
  if (parts.some((p) => p.startsWith("_")))
    find("FE-STRUCT-001", file, "no private folders in the route tree");
  else if (!APP_FILE.test(name))
    find("FE-STRUCT-001", file, "only Next.js special files live in src/app");
}

// --- FE-BOUND-002: server-only markers -------------------------------------------------------
const SERVER_ONLY_FILES = [
  "src/config/server-env.ts",
  "src/lib/api/server.ts",
  "src/lib/auth/cookies.ts",
  "src/lib/auth/refresh.ts",
  "src/lib/auth/origin.ts",
  "src/lib/auth/backend-proxy.ts",
  "src/lib/auth/server.ts",
];
const SERVER_IMPORTS = /from\s+["'](next\/headers|@\/config\/server-env|@\/lib\/api\/server)["']/;
const sourceFiles = walk("src").filter((f) => /\.(ts|tsx)$/.test(f) && !f.endsWith(".d.ts"));

for (const file of sourceFiles) {
  const text = read(file);
  const isRouteHandler = /^src\/app\/.*\/route\.ts$/.test(file);
  const required =
    SERVER_ONLY_FILES.includes(file) ||
    /^src\/features\/[^/]+\/server\.ts$/.test(file) ||
    (!isRouteHandler && SERVER_IMPORTS.test(text));
  if (required && !/^import ["']server-only["'];?$/m.test(text)) {
    find("FE-BOUND-002", file, 'must start with import "server-only"');
  }

  // --- FE-BOUND-003: public configuration is read from the environment only in client-env.ts
  if (file !== "src/config/client-env.ts") {
    text.split("\n").forEach((line, i) => {
      if (/process\.env\.NEXT_PUBLIC_|process\.env\[["']NEXT_PUBLIC_/.test(line)) {
        find("FE-BOUND-003", file, "read NEXT_PUBLIC_ variables through clientEnv", i + 1);
      }
    });
  }
}

// --- FE-BOUND-003: no secret or backend address in public variables ---------------------------
const SECRET_NAME = /^NEXT_PUBLIC_\w*(SECRET|TOKEN|PASSWORD|_KEY|API_URL|API_BASE_URL)\w*$/;
for (const file of [".env.example", "Dockerfile"].filter((f) => existsSync(f))) {
  read(file)
    .split("\n")
    .forEach((line, i) => {
      const name = line.match(/(NEXT_PUBLIC_\w+)/)?.[1];
      if (name && SECRET_NAME.test(name))
        find("FE-BOUND-003", file, `${name} must not be public`, i + 1);
    });
}

// --- FE-STRUCT-007: configuration validated with no defaults ----------------------------------
for (const file of ["src/config/server-env.ts", "src/config/client-env.ts"]) {
  read(file)
    .split("\n")
    .forEach((line, i) => {
      if (/\.default\(|\.catch\(|\?\?|\|\|/.test(line))
        find("FE-STRUCT-007", file, "configuration has no defaults", i + 1);
    });
}
if (existsSync(".env.example")) {
  const documented = read(".env.example");
  const used = new Set(
    ["src/config/server-env.ts", "src/config/client-env.ts"].flatMap((f) =>
      [...read(f).matchAll(/\b([A-Z][A-Z0-9_]{2,}):/g)].map((m) => m[1]),
    ),
  );
  for (const name of used) {
    if (!new RegExp(`^${name}=`, "m").test(documented))
      find("FE-STRUCT-007", ".env.example", `${name} is not documented`);
  }
}

// --- FE-AUTH-002: the browser client talks to the app's own server ----------------------------
if (!/createApiClient\(\s*["']\/api\/backend["']\s*\)/.test(read("src/lib/api/browser.ts"))) {
  find(
    "FE-AUTH-002",
    "src/lib/api/browser.ts",
    'the browser client must use the base URL "/api/backend"',
  );
}

report("check-frontend-layout", findings);
