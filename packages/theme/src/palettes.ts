/**
 * Color palettes for the Forked apps.
 *
 * webPalette is intentionally converged with mobilePalette — same accent
 * (brick red), same neutrals, field-for-field identical values. They used
 * to diverge (web was orange on warm neutrals); that divergence was
 * reverted by design. Keep them in sync: edit mobilePalette first, then
 * mirror the change into webPalette.
 */

export type ThemeMode = 'light' | 'dark';

/** Palette used by the Expo app (was apps/mobile/lib/theme/token.default.ts). */
export const mobilePalette = {
    name: 'default',
    mode: {
        dark: {
            color: {
                accent: '#C0392B', // brick red (premium)
                accentOn: '#0F0F10',
                accentSoft: '#24110F',

                bg: '#0F0F10',
                surface: '#171719',
                surface2: '#1E1E21',
                overlay: 'rgba(0,0,0,0.62)',

                textPrimary: '#F3F1EE',
                textSecondary: '#B8B1A8',
                textTertiary: '#8E877F',
                textOnImage: '#FFFFFF',

                border: 'rgba(255,255,255,0.10)',
                divider: 'rgba(255,255,255,0.08)',

                inputBg: '#171719',
                inputBorder: 'rgba(255,255,255,0.12)',
                placeholder: '#8E877F',

                success: '#2ECC71',
                warning: '#E67E22',
                danger: '#E74C3C',
                error: '#ff0000',
                info: '#4AA3DF',

                focusRing: 'rgba(192,57,43,0.40)',
                selection: 'rgba(192,57,43,0.18)',

                // Medals / Boarders
                gold: '#FBBF24',
                silver: '#D1D5DB',
                bronze: '#CD7F32',

                badgeBg: '#1E1E21',
                badgeText: '#F3F1EE',
            },
            rating: {
                starFilled: '#F4C430', // warm gold
                starEmpty: 'rgba(255,255,255,0.22)',
                top1: '#F4C430',
                top2: '#C0C6CF',
                top3: '#C9895B',
            },
        },

        light: {
            color: {
                accent: '#B83227',
                accentOn: '#FFFFFF',
                accentSoft: '#FFE6E2',

                bg: '#FFFFFF',
                surface: '#FBF7F2', // warm off-white
                surface2: '#FFFFFF',
                overlay: 'rgba(0,0,0,0.45)',

                textPrimary: '#1A1714',
                textSecondary: '#4A443D',
                textTertiary: '#6D665E',
                textOnImage: '#FFFFFF',

                border: 'rgba(26,23,20,0.10)',
                divider: 'rgba(26,23,20,0.08)',

                inputBg: '#FFFFFF',
                inputBorder: 'rgba(26,23,20,0.14)',
                placeholder: '#6D665E',

                success: '#1F8A4C',
                warning: '#B35C00',
                danger: '#C81E1E',
                error: '#ff0000',
                info: '#1A73E8',

                focusRing: 'rgba(184,50,39,0.28)',
                selection: 'rgba(184,50,39,0.14)',

                // Medals / Boarders
                gold: '#F59E0B',
                silver: '#9CA3AF',
                bronze: '#B45309',

                badgeBg: '#FFFFFF',
                badgeText: '#1A1714',
            },
            rating: {
                starFilled: '#B88700',
                starEmpty: 'rgba(26,23,20,0.22)',
                top1: '#B88700',
                top2: '#7B8794',
                top3: '#9A5E3A',
            },
        },
    },
} as const;

/**
 * Palette used by the Next.js app (was hand-written in apps/web/src/app/globals.css).
 * Rendered to CSS custom properties in theme.css via `npm run gen:theme`.
 *
 * Converged with mobilePalette (see note above) — every color value below is
 * copied verbatim from mobilePalette's matching field. Edit mobilePalette and
 * mirror the change here rather than letting the two drift again.
 */
export const webPalette = {
    name: 'web',
    mode: {
        light: {
            color: {
                accent: '#B83227',
                accentOn: '#FFFFFF',
                accentSoft: '#FFE6E2',

                bg: '#FFFFFF',
                surface: '#FBF7F2',
                surface2: '#FFFFFF',
                overlay: 'rgba(0,0,0,0.45)',

                textPrimary: '#1A1714',
                textSecondary: '#4A443D',
                textTertiary: '#6D665E',
                textOnImage: '#FFFFFF',

                border: 'rgba(26,23,20,0.10)',
                divider: 'rgba(26,23,20,0.08)',

                inputBg: '#FFFFFF',
                inputBorder: 'rgba(26,23,20,0.14)',
                placeholder: '#6D665E',

                success: '#1F8A4C',
                warning: '#B35C00',
                danger: '#C81E1E',
                info: '#1A73E8',

                focusRing: 'rgba(184,50,39,0.28)',
                selection: 'rgba(184,50,39,0.14)',

                gold: '#F59E0B',
                silver: '#9CA3AF',
                bronze: '#B45309',

                badgeBg: '#FFFFFF',
                badgeText: '#1A1714',
            },
        },
        dark: {
            color: {
                accent: '#C0392B',
                accentOn: '#0F0F10',
                accentSoft: '#24110F',

                bg: '#0F0F10',
                surface: '#171719',
                surface2: '#1E1E21',
                overlay: 'rgba(0,0,0,0.62)',

                textPrimary: '#F3F1EE',
                textSecondary: '#B8B1A8',
                textTertiary: '#8E877F',
                textOnImage: '#FFFFFF',

                border: 'rgba(255,255,255,0.10)',
                divider: 'rgba(255,255,255,0.08)',

                inputBg: '#171719',
                inputBorder: 'rgba(255,255,255,0.12)',
                placeholder: '#8E877F',

                success: '#2ECC71',
                warning: '#E67E22',
                danger: '#E74C3C',
                info: '#4AA3DF',

                focusRing: 'rgba(192,57,43,0.40)',
                selection: 'rgba(192,57,43,0.18)',

                gold: '#FBBF24',
                silver: '#D1D5DB',
                bronze: '#CD7F32',

                badgeBg: '#1E1E21',
                badgeText: '#F3F1EE',
            },
        },
    },
} as const;

export type MobilePalette = typeof mobilePalette;
export type WebPalette = typeof webPalette;
