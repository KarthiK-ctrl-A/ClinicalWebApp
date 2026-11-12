import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

// export default eslintConfig;

export default [
  {
    rules: {
      // 1. Catch AI type-safety bypasses
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        { assertionStyle: "never" } // Flags 'as Type' hacks
      ],

      // 2. Catch silent error swallowing & floating promises
      "@typescript-eslint/no-floating-promises": "error",
      "no-empty": ["error", { allowEmptyCatch: false }],

      // 3. Catch bloated AI "God" functions
      "complexity": ["warn", 12],
      "max-lines-per-function": ["warn", { max: 50, skipBlankLines: true, skipComments: true }]
    }
  }
];