/**
 * Generates ../theme.css (CSS custom properties for the web app) from the
 * web palette + scales. Run via `npm run gen:theme` at the repo root.
 *
 * Requires Node >= 22.18 (built-in TypeScript type stripping).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webPalette } from '../src/palettes.ts';
import { scales } from '../src/scales.ts';

const toKebab = (key: string): string =>
    key
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/([a-zA-Z])(\d)/g, '$1-$2')
        .toLowerCase();

const colorBlock = (selector: string, colors: Record<string, string>): string => {
    const lines = Object.entries(colors)
        .map(([key, value]) => `  --${toKebab(key)}: ${value};`)
        .join('\n');
    return `${selector} {\n${lines}\n}`;
};

const radiusLines = Object.entries(scales.radius)
    .map(([key, value]) => `  --fk-radius-${key}: ${value}px;`)
    .join('\n');

const css = `/*
 * GENERATED FILE — do not edit by hand.
 * Source: packages/theme/src/palettes.ts + scales.ts
 * Regenerate: npm run gen:theme (repo root)
 */

/* Light mode (default) */
${colorBlock(':root,\n.light', webPalette.mode.light.color)}

/* Dark mode */
${colorBlock('.dark', webPalette.mode.dark.color)}

/* Shared scales */
:root {
${radiusLines}
}
`;

const outPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'theme.css');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, css);
console.log(`Wrote ${outPath}`);
