#!/usr/bin/env node
/**
 * ============================================================================
 * SYNC THEME — deriva los colores de Tailwind desde client.config.ts
 * ============================================================================
 *
 * Por qué existe este script:
 * Tailwind v4 genera las clases de color (bg-brand-accent, text-brand-ink,
 * etc.) a partir del bloque `@theme` de src/app/globals.css EN TIEMPO DE
 * BUILD — Tailwind escanea ese archivo CSS de forma estática, no puede
 * ejecutar TypeScript ni leer un objeto en runtime. Por eso los colores
 * "reales" que usan los componentes tienen que vivir en un CSS.
 *
 * Pero queremos que un cliente nuevo edite un SOLO archivo (client.config.ts)
 * para nombre, paleta y datos dinámicos — sin tener que saber que Tailwind
 * existe. Este script cierra esa brecha: lee `clientConfig.brand.colors` de
 * client.config.ts (con una extracción simple por regex, sin ejecutar TS) y
 * reescribe las 5 líneas `--color-brand-*` de globals.css con esos valores.
 *
 * Se corre solo (no hace falta acordarse de invocarlo a mano): está
 * enganchado como `predev` y `prebuild` en package.json, así que cada
 * `pnpm dev` / `pnpm build` sincroniza el CSS automáticamente antes de
 * arrancar. Si client.config.ts no cambió, reescribe los mismos valores —
 * no rompe nada, es idempotente.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(__dirname, "..", "src", "config", "client.config.ts");
const CSS_PATH = path.join(__dirname, "..", "src", "app", "globals.css");

// Claves de clientConfig.brand.colors -> variable CSS que le corresponde en
// el @theme de globals.css. Si se agrega un color nuevo a ClientConfig,
// agregarlo acá también.
const COLOR_KEYS = [
  ["accent", "--color-brand-accent"],
  ["accentDark", "--color-brand-accent-dark"],
  ["ink", "--color-brand-ink"],
  ["paper", "--color-brand-paper"],
  ["neutral", "--color-brand-neutral"],
];

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function extractColors(configSource) {
  // El archivo define primero la interface ClientConfig (colors: { accent:
  // string; ... }, sin comillas) y DESPUÉS el objeto real
  // `export const clientConfig = { ... }` (colors: { accent: "#5DCAA5" }).
  // Hay que arrancar a buscar recién desde "export const clientConfig" —
  // si no, el regex de abajo matchea la interface (solo tipos, sin
  // valores) y nunca encuentra los hex reales.
  const constMarker = configSource.indexOf("export const clientConfig");
  if (constMarker === -1) {
    throw new Error(
      "No se encontró `export const clientConfig` en client.config.ts — revisá que la estructura no haya cambiado.",
    );
  }
  const valuesSource = configSource.slice(constMarker);

  // Aísla el bloque "colors: { ... }" dentro de "brand: { ... }" — evita
  // matchear un campo "accent"/"ink" de algún otro objeto que pueda
  // agregarse a ClientConfig en el futuro.
  const brandMatch = valuesSource.match(/brand:\s*{[\s\S]*?colors:\s*{([\s\S]*?)}/);
  if (!brandMatch) {
    throw new Error(
      "No se encontró clientConfig.brand.colors en client.config.ts — revisá que la estructura no haya cambiado.",
    );
  }
  const colorsBlock = brandMatch[1];

  const colors = {};
  for (const [key] of COLOR_KEYS) {
    const valueMatch = colorsBlock.match(new RegExp(`${key}\\s*:\\s*"([^"]+)"`));
    if (!valueMatch) {
      throw new Error(`No se encontró el color "${key}" dentro de brand.colors en client.config.ts.`);
    }
    const value = valueMatch[1].trim();
    if (!HEX_RE.test(value)) {
      throw new Error(
        `El color "${key}" en client.config.ts ("${value}") no es un hex válido (#rgb o #rrggbb).`,
      );
    }
    colors[key] = value;
  }
  return colors;
}

function applyColors(cssSource, colors) {
  let updated = cssSource;
  for (const [key, cssVar] of COLOR_KEYS) {
    const value = colors[key];
    const lineRe = new RegExp(`(${cssVar}:\\s*)#[0-9a-fA-F]{3,6};`);
    if (!lineRe.test(updated)) {
      throw new Error(
        `No se encontró la línea "${cssVar}: ...;" en globals.css — revisá que el bloque @theme no haya cambiado de forma.`,
      );
    }
    updated = updated.replace(lineRe, `$1${value};`);
  }
  return updated;
}

function main() {
  const configSource = readFileSync(CONFIG_PATH, "utf8");
  const cssSource = readFileSync(CSS_PATH, "utf8");

  const colors = extractColors(configSource);
  const updatedCss = applyColors(cssSource, colors);

  if (updatedCss === cssSource) {
    console.log("[sync-theme] Colores ya sincronizados — sin cambios.");
    return;
  }

  writeFileSync(CSS_PATH, updatedCss, "utf8");
  console.log("[sync-theme] Colores de globals.css actualizados desde client.config.ts:");
  for (const [key, cssVar] of COLOR_KEYS) {
    console.log(`  ${cssVar}: ${colors[key]}`);
  }
}

main();
