// tokens.genZ.ts
export const genZ = {
    name: 'genZ',
    mode: {
        dark: {
            color: {
                // Brand
                accent: '#FF3B30', // punchy red (camera / primary CTAs)
                accentOn: '#0B0B0C',
                accentSoft: '#2A1210', // subtle accent background

                // Backgrounds / surfaces
                bg: '#0B0B0C',
                surface: '#141416',
                surface2: '#1B1B1F',
                overlay: 'rgba(0,0,0,0.60)',

                // Text
                textPrimary: '#F5F5F7',
                textSecondary: '#B6B6C0',
                textTertiary: '#8A8A95',
                textOnImage: '#FFFFFF',

                // Borders / dividers
                border: 'rgba(255,255,255,0.10)',
                divider: 'rgba(255,255,255,0.08)',

                // Inputs
                inputBg: '#141416',
                inputBorder: 'rgba(255,255,255,0.12)',
                placeholder: '#8A8A95',

                // States
                success: '#34C759',
                warning: '#FF9F0A',
                danger: '#FF453A',
                info: '#5AC8FA',

                // Focus / highlight
                focusRing: 'rgba(255,59,48,0.40)',
                selection: 'rgba(255,59,48,0.18)',

                // Medals / Boarders
                gold: '#FBBF24',
                silver: '#D1D5DB',
                bronze: '#CD7F32',

                // Badges
                badgeBg: '#1B1B1F',
                badgeText: '#F5F5F7',
            },

            rating: {
                starFilled: '#FFD60A', // gold pop
                starEmpty: 'rgba(255,255,255,0.22)',
                top1: '#FFD60A',
                top2: '#D0D4DB',
                top3: '#C9895B',
            },
        },

        light: {
            color: {
                accent: '#E1251B',
                accentOn: '#FFFFFF',
                accentSoft: '#FFE7E5',

                bg: '#FFFFFF',
                surface: '#F7F7FA',
                surface2: '#FFFFFF',
                overlay: 'rgba(0,0,0,0.45)',

                textPrimary: '#111114',
                textSecondary: '#4B4B55',
                textTertiary: '#6D6D78',
                textOnImage: '#FFFFFF',

                border: 'rgba(17,17,20,0.10)',
                divider: 'rgba(17,17,20,0.08)',

                inputBg: '#FFFFFF',
                inputBorder: 'rgba(17,17,20,0.14)',
                placeholder: '#6D6D78',

                success: '#1F8A4C',
                warning: '#B35C00',
                danger: '#C81E1E',
                info: '#0066CC',

                focusRing: 'rgba(225,37,27,0.28)',
                selection: 'rgba(225,37,27,0.14)',

                // Medals / Boarders
                gold: '#F59E0B',
                silver: '#9CA3AF',
                bronze: '#B45309',

                badgeBg: '#FFFFFF',
                badgeText: '#111114',
            },

            rating: {
                starFilled: '#B88700',
                starEmpty: 'rgba(17,17,20,0.22)',
                top1: '#B88700',
                top2: '#7B8794',
                top3: '#9A5E3A',
            },
        },
    },

    radius: { xs: 6, sm: 10, md: 14, lg: 18, xl: 24, pill: 999 },
    space: { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32 },
    border: { hairline: 1, thin: 1.5, thick: 2 },

    font: {
        family: {
            // Use platform defaults unless you ship custom fonts.
            regular: undefined,
            medium: undefined,
            semibold: undefined,
            bold: undefined,
            mono: undefined,
        },
        size: { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, xxl: 28 },
        line: { xs: 16, sm: 18, md: 22, lg: 24, xl: 28, xxl: 34 },
        weight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
    },

    shadow: {
        // iOS uses shadow props, Android uses elevation (provided below in RN mapping)
        sm: { opacity: 0.12, radius: 6, y: 3 },
        md: { opacity: 0.16, radius: 10, y: 6 },
        lg: { opacity: 0.2, radius: 16, y: 10 },
    },

    opacity: { disabled: 0.45, pressed: 0.8, subtle: 0.1 },
} as const;
