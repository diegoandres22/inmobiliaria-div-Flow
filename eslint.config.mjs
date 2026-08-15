import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Antes esto pasaba "next/core-web-vitals"/"next/typescript" (strings legacy)
// por FlatCompat. eslint-config-next 16 ya publica flat config nativo, y
// envolverlo en FlatCompat duplica el plugin react-hooks (que se
// autoreferencia en su config) — eso es lo que producía el
// "Converting circular structure to JSON" al validar el schema. Import
// directo de los flat configs, sin capa de compatibilidad: es además el
// setup que documenta Next.js 16 (next lint fue removido en esta versión).
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
