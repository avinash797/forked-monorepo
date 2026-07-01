# @forked/theme

Single source of truth for Forked design tokens.

- `scales` — platform-neutral spacing / radius / typography / shadow / opacity scales. Shared by both apps.
- `mobilePalette` — colors + rating accents for the Expo app (`apps/mobile/lib/theme` builds its theme object from this).
- `webPalette` — colors for the Next.js app. Rendered to CSS custom properties in `theme.css`, which `apps/web/src/app/globals.css` imports and maps into Tailwind via `@theme inline`.

## Editing tokens

1. Edit `src/palettes.ts` (colors) or `src/scales.ts` (scales).
2. If you touched the web palette or scales, run `npm run gen:theme` at the repo root to regenerate `theme.css` (checked in, like the generated DB types).

Never edit `theme.css` by hand.

## Palette divergence

The two palettes are intentionally kept verbatim from before the monorepo
merge: mobile is brick-red on near-black, web is orange on warm neutrals.
They render exactly as they did pre-merge. If/when the brand converges,
point both apps at one palette here — it's a one-file change.
