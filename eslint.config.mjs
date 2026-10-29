import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-warning-comments": ["error", { terms: ["todo", "fixme", "xxx", "hack"], location: "anywhere" }],
      "react/jsx-no-comment-textnodes": "error",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "src/lib/supabase/database.types.ts"]),
]);

export default eslintConfig;
