// Downloads the backend's OpenAPI document into openapi.json (FE-API-002).
// Run with `pnpm api:pull`; OPENAPI_URL comes from .env.
import { writeFile } from "node:fs/promises";

const url = process.env.OPENAPI_URL;
if (!url) {
  console.error("OPENAPI_URL is not set. Add it to .env (see .env.example).");
  process.exit(1);
}

const response = await fetch(url);
if (!response.ok) {
  console.error(`GET ${url} failed: ${response.status} ${response.statusText}`);
  process.exit(1);
}

const document = await response.json();
await writeFile("openapi.json", `${JSON.stringify(document, null, 2)}\n`);
console.log(`openapi.json updated from ${url}`);
