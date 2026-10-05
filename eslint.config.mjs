// ESLint is the deterministic producer for most frontend-standards rules.
// Each block names the rules it checks.
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import pluginQuery from "@tanstack/eslint-plugin-query";
import boundaries from "eslint-plugin-boundaries";
import checkFile from "eslint-plugin-check-file";
import jsxA11y from "eslint-plugin-jsx-a11y";

const sameFeature = { feature: "{{ from.element.captured.feature }}" };

/** FE-STRUCT-007 */
const ENV_READS = [
  {
    object: "process",
    property: "env",
    message: "Read configuration from src/config/*-env.ts (FE-STRUCT-007).",
  },
];

/** FE-UI-007 */
const HTML_INJECTION = ["innerHTML", "outerHTML", "insertAdjacentHTML"].map((property) => ({
  property,
  message: "Render data as text, never as markup (FE-UI-007).",
}));

/** FE-UI-008 */
const FORMATTING = [
  ...["DateTimeFormat", "NumberFormat", "RelativeTimeFormat"].map((property) => ({
    object: "Intl",
    property,
  })),
  ...["toLocaleDateString", "toLocaleTimeString", "toLocaleString"].map((property) => ({
    property,
  })),
].map((restriction) => ({ ...restriction, message: "Format through @/lib/format (FE-UI-008)." }));

/** FE-DATA-002 */
const QUERY_DECLARATIONS = [
  {
    selector:
      "CallExpression[callee.name=/^(useQuery|useSuspenseQuery|useInfiniteQuery|useSuspenseInfiniteQuery|useQueries|useMutation|queryOptions|infiniteQueryOptions)$/]",
    message: "Declare queries and mutations in the feature's queries.ts (FE-DATA-002).",
  },
  {
    selector: "Property[key.name='queryKey'] > ArrayExpression",
    message: "Build query keys with the feature's key factory (FE-DATA-002).",
  },
];

/** FE-STRUCT-002, -003, -004: who may import whom. Default is disallow. */
const importPolicies = [
  // Packages and Node built-ins are not boundaries.
  { allow: { to: { module: { origin: ["external", "core"] } } } },

  // Route tree: features through their public surfaces, and shared code.
  {
    from: { element: { type: "app" } },
    allow: {
      to: [
        { element: { type: "feature" }, file: { categories: { anyOf: ["public", "server"] } } },
        { element: { types: { anyOf: ["app", "components", "lib", "config"] } } },
      ],
    },
  },

  // Inside one feature: view -> state -> transport; declarations from anywhere in it.
  {
    from: { element: { type: "feature" }, file: { categories: "view" } },
    allow: {
      to: {
        element: { type: "feature", captured: sameFeature },
        file: { categories: { anyOf: ["view", "state", "decl"] } },
      },
    },
  },
  {
    from: { element: { type: "feature" }, file: { categories: "state" } },
    allow: {
      to: {
        element: { type: "feature", captured: sameFeature },
        file: { categories: { anyOf: ["state", "transport", "decl"] } },
      },
    },
  },
  {
    from: { element: { type: "feature" }, file: { categories: "transport" } },
    allow: {
      to: { element: { type: "feature", captured: sameFeature }, file: { categories: "decl" } },
    },
  },
  {
    from: { element: { type: "feature" }, file: { categories: "server" } },
    allow: {
      to: {
        element: { type: "feature", captured: sameFeature },
        file: { categories: { anyOf: ["state", "transport", "decl"] } },
      },
    },
  },
  {
    from: { element: { type: "feature" }, file: { categories: "public" } },
    allow: {
      to: {
        element: { type: "feature", captured: sameFeature },
        file: { categories: { anyOf: ["view", "state", "decl"] } },
      },
    },
  },
  {
    from: { element: { type: "feature" }, file: { categories: "decl" } },
    allow: {
      to: { element: { type: "feature", captured: sameFeature }, file: { categories: "decl" } },
    },
  },
  {
    from: { element: { type: "feature" }, file: { categories: "test" } },
    allow: { to: { element: { type: "feature", captured: sameFeature } } },
  },

  // Between features: only another feature's public surface (FE-STRUCT-003).
  {
    from: {
      element: { type: "feature" },
      file: { categories: { anyOf: ["view", "state", "server"] } },
    },
    allow: { to: { element: { type: "feature" }, file: { categories: "public" } } },
  },

  // Features use shared code.
  {
    from: { element: { type: "feature" } },
    allow: { to: { element: { types: { anyOf: ["components", "lib", "config"] } } } },
  },

  // Shared code knows no feature and no route (FE-STRUCT-004).
  {
    from: { element: { type: "components" } },
    allow: { to: { element: { types: { anyOf: ["components", "lib", "config"] } } } },
  },
  {
    from: { element: { type: "lib" } },
    allow: { to: { element: { types: { anyOf: ["lib", "config"] } } } },
  },
  {
    from: { element: { type: "config" } },
    allow: { to: { element: { type: "config" } } },
  },
  {
    from: { file: { categories: "root" } },
    allow: { to: { element: { types: { anyOf: ["lib", "config"] } } } },
  },

  // The view layer never holds an API client: it reads and writes through queries (FE-STRUCT-002).
  {
    from: { element: { type: "feature" }, file: { categories: "view" } },
    disallow: { to: { file: { categories: "api-client" } } },
  },
];

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  ...pluginQuery.configs["flat/recommended"],
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
    "src/lib/api/schema.d.ts", // generated (FE-API-002)
  ]),

  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries, "check-file": checkFile },
    settings: {
      "boundaries/elements": [
        { type: "app", pattern: "src/app", partialMatch: false },
        { type: "feature", pattern: "src/features/*", capture: ["feature"], partialMatch: false },
        { type: "components", pattern: "src/components", partialMatch: false },
        { type: "lib", pattern: "src/lib", partialMatch: false },
        { type: "config", pattern: "src/config", partialMatch: false },
      ],
      "boundaries/files": [
        { category: "test", pattern: "src/**/*.test.{ts,tsx}", exclusive: true },
        { category: "public", pattern: "src/features/*/index.ts", exclusive: true },
        { category: "server", pattern: "src/features/*/server.ts", exclusive: true },
        { category: "view", pattern: "src/features/*/components/**" },
        {
          category: "state",
          pattern: "src/features/*/{queries,hooks,store}{.ts,.tsx,/**}",
        },
        { category: "transport", pattern: "src/features/*/api{.ts,/**}" },
        {
          category: "decl",
          pattern: "src/features/*/{schemas,types,constants,utils}{.ts,/**}",
        },
        { category: "api-client", pattern: "src/lib/api/{browser,server,client}.ts" },
        { category: "root", pattern: "src/*.ts" }, // proxy.ts, instrumentation.ts
      ],
      "import/resolver": { typescript: { alwaysTryTypes: true } },
    },
    rules: {
      // checkInternals: imports inside one feature are checked too (view -> state -> transport).
      "boundaries/dependencies": [
        "error",
        { default: "disallow", checkInternals: true, policies: importPolicies },
      ],

      // FE-STRUCT-006: kebab-case files and folders (route segment brackets and groups excepted).
      "check-file/filename-naming-convention": [
        "error",
        { "src/**/*.{ts,tsx}": "KEBAB_CASE" },
        { ignoreMiddleExtensions: true },
      ],
      "check-file/folder-naming-convention": [
        "error",
        { "src/!(app)/**/": "KEBAB_CASE", "src/app/**/": "NEXT_JS_APP_ROUTER_CASE" },
      ],

      // FE-STRUCT-008
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-expect-error": "allow-with-description" },
      ],

      // FE-UI-006: the strict accessibility set (plugin already registered by next's config).
      ...jsxA11y.flatConfigs.strict.rules,

      // FE-UI-007, FE-UI-009
      "react/no-danger": "error",
      "@next/next/no-img-element": "error",
      "@next/next/no-html-link-for-pages": "error",

      // FE-STRUCT-007, FE-UI-007, FE-UI-008
      "no-restricted-properties": ["error", ...ENV_READS, ...HTML_INJECTION, ...FORMATTING],

      // FE-DATA-002: queries and mutations are declared in a feature's queries.ts.
      "no-restricted-syntax": ["error", ...QUERY_DECLARATIONS],

      // FE-API-001
      "no-restricted-globals": [
        "error",
        { name: "fetch", message: "Use the API client from @/lib/api (FE-API-001)." },
        { name: "XMLHttpRequest", message: "Use the API client from @/lib/api (FE-API-001)." },
      ],

      // FE-API-001, FE-UI-002, FE-UI-008, FE-STRUCT-003
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "axios", message: "Use the API client from @/lib/api (FE-API-001)." },
            { name: "openapi-fetch", message: "Only src/lib/api creates clients (FE-API-001)." },
            { name: "date-fns", message: "Format through @/lib/format (FE-UI-008)." },
            { name: "radix-ui", message: "Use the primitive in @/components/ui (FE-UI-002)." },
            {
              name: "sonner",
              message:
                "Use @/components/ui/sonner or toast from @/components/feedback (FE-UI-002).",
            },
            { name: "vaul", message: "Use @/components/ui/drawer (FE-UI-002)." },
            {
              name: "cmdk",
              message: "Use @/components/form/searchable-select or @/components/ui/command (FE-UI-002).",
            },
            { name: "@tanstack/react-table", message: "Use @/components/data-table (FE-UI-002)." },
          ],
          patterns: [
            {
              group: ["@/features/*/*", "!@/features/*/server"],
              message:
                "Import another feature through its index or server surface (FE-STRUCT-003).",
            },
            { group: ["date-fns/*"], message: "Format through @/lib/format (FE-UI-008)." },
            {
              group: ["@radix-ui/*"],
              message: "Use the primitive in @/components/ui (FE-UI-002).",
            },
          ],
        },
      ],
    },
  },

  // Where a restricted thing is the point of the file.
  {
    files: ["src/config/client-env.ts", "src/config/server-env.ts"],
    rules: { "no-restricted-properties": ["error", ...HTML_INJECTION, ...FORMATTING] },
  },
  {
    // The formatting module, and generated primitives that format internally (the date picker).
    files: ["src/lib/format/**", "src/components/ui/**"],
    rules: { "no-restricted-properties": ["error", ...ENV_READS, ...HTML_INJECTION] },
  },
  {
    // The session query is shared by every feature, so it lives in shared code (FE-DATA-002).
    files: ["src/features/*/queries.ts", "src/features/*/queries/**", "src/lib/auth/**"],
    rules: { "no-restricted-syntax": "off" },
  },
  {
    files: ["src/lib/api/**", "src/lib/auth/**", "src/app/**/route.ts"],
    rules: { "no-restricted-globals": "off" },
  },
  {
    files: ["src/lib/api/**"],
    rules: { "no-restricted-imports": "off" },
  },
  {
    files: ["src/lib/format/**"],
    rules: { "no-restricted-imports": "off" },
  },
  {
    // Shared primitives wrap the vendor libraries (FE-UI-002).
    files: ["src/components/**"],
    rules: { "no-restricted-imports": "off" },
  },
  {
    // Generated by shadcn; their accessibility is the library's (FE-UI-006 do-not-flag).
    files: ["src/components/ui/**"],
    rules: Object.fromEntries(
      Object.keys(jsxA11y.flatConfigs.strict.rules).map((rule) => [rule, "off"]),
    ),
  },
]);
