/**
 * Color palettes for the Forked apps.
 *
 * NOTE: the mobile and web palettes have historically diverged (mobile is
 * brick-red on near-black, web is orange on warm neutrals). Both are kept
 * here verbatim so each app renders exactly as before — converging them is
 * a deliberate design decision, made by editing this one file.
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
 */
export const webPalette = {
    name: 'web',
    mode: {
        light: {
            color: {
                accent: '#ee6c2b',
                accentOn: '#FFFFFF',
                accentSoft: '#FEE8DF',

                bg: '#f8f6f6',
                surface: '#ffffff',
                surface2: '#F3F4F6',
                overlay: 'rgba(0, 0, 0, 0.45)',

                textPrimary: '#221610',
                textSecondary: '#4B5563',
                textTertiary: '#687076',
                textOnImage: '#FFFFFF',

                border: 'rgba(34, 22, 16, 0.10)',
                divider: 'rgba(34, 22, 16, 0.08)',

                inputBg: '#ffffff',
                inputBorder: '#E5E7EB',
                placeholder: '#9CA3AF',

                success: '#10B981',
                warning: '#F59E0B',
                danger: '#EF4444',
                info: '#3B82F6',

                focusRing: 'rgba(238, 107, 43, 0.28)',
                selection: 'rgba(238, 107, 43, 0.14)',

                gold: '#F59E0B',
                silver: '#9CA3AF',
                bronze: '#B45309',

                badgeBg: '#ffffff',
                badgeText: '#221610',
            },
        },
        dark: {
            color: {
                accent: '#FF4D00',
                accentOn: '#FFFFFF',
                accentSoft: '#2A1813',

                bg: '#050505',
                surface: '#0a0a0a',
                surface2: '#111111',
                overlay: 'rgba(0, 0, 0, 0.60)',

                textPrimary: '#ECEDEE',
                textSecondary: 'rgba(255, 255, 255, 0.50)',
                textTertiary: 'rgba(255, 255, 255, 0.30)',
                textOnImage: '#FFFFFF',

                border: 'rgba(255, 255, 255, 0.10)',
                divider: 'rgba(255, 255, 255, 0.05)',

                inputBg: 'rgba(255, 255, 255, 0.05)',
                inputBorder: 'rgba(255, 255, 255, 0.10)',
                placeholder: 'rgba(255, 255, 255, 0.30)',

                success: '#34D399',
                warning: '#FBBF24',
                danger: '#F87171',
                info: '#60A5FA',

                focusRing: 'rgba(255, 77, 0, 0.40)',
                selection: 'rgba(255, 77, 0, 0.18)',

                gold: '#FBBF24',
                silver: '#D1D5DB',
                bronze: '#CD7F32',

                badgeBg: 'rgba(255, 255, 255, 0.05)',
                badgeText: '#ECEDEE',
            },
        },
    },
} as const;

export type MobilePalette = typeof mobilePalette;
export type WebPalette = typeof webPalette;
