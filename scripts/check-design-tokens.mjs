// check-design-tokens: FE-UI-001 (visual values come from tokens), FE-UI-005 (no max-* breakpoints).
// Generated primitives (src/components/ui) and the token file itself are not checked.
import { isWaived, read, report, walk } from "./lib.mjs";

const SKIP = [/^src\/components\/ui\//, /^src\/app\/globals\.css$/, /\.d\.ts$/, /\.test\.tsx?$/];
const files = walk("src").filter((f) => /\.(ts|tsx|css)$/.test(f) && !SKIP.some((s) => s.test(f)));

const UTILITY =
  "(?:bg|text|border(?:-[trblxy])?|ring|outline|fill|stroke|from|via|to|shadow|rounded(?:-[trbl]{1,2})?|" +
  "p[trblxy]?|m[trblxy]?|gap(?:-[xy])?|space-[xy]|leading|tracking|text-size)";
const CHECKS = [
  {
    rule: "FE-UI-001",
    pattern: new RegExp(`(?:^|[\\s"'\`:])-?${UTILITY}-\\[[^\\]]+\\]`),
    message: "arbitrary Tailwind value; use a token",
  },
  {
    rule: "FE-UI-001",
    pattern: /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab)\(/,
    message: "raw colour; use a colour token",
  },
  {
    rule: "FE-UI-001",
    pattern:
      /style=\{\{[^}]*\b(?:color|background(?:Color)?|margin\w*|padding\w*|gap|borderRadius|fontSize)\s*:/,
    message: "inline visual style; use token classes",
  },
  {
    rule: "FE-UI-005",
    pattern: /\bmax-(?:sm|md|lg|xl|2xl):/,
    message: "desktop-first max-* variant; write mobile-first",
  },
];

const findings = [];
for (const file of files) {
  const lines = read(file).split("\n");
  lines.forEach((line, i) => {
    for (const { rule, pattern, message } of CHECKS) {
      if (pattern.test(line) && !isWaived(lines, i, rule))
        findings.push({ rule, file, line: i + 1, message });
    }
  });
}

report("check-design-tokens", findings);
