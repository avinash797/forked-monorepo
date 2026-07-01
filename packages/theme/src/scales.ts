/**
 * Platform-neutral design scales shared by every Forked surface.
 * These are identical across mobile and web — color palettes live in palettes.ts.
 */
export const scales = {
    radius: { xs: 6, sm: 10, md: 14, lg: 18, xl: 24, pill: 999 },
    space: { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32 },
    border: { hairline: 1, thin: 1.5, thick: 2 },

    font: {
        family: {
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
        sm: { opacity: 0.1, radius: 6, y: 3 },
        md: { opacity: 0.14, radius: 10, y: 6 },
        lg: { opacity: 0.18, radius: 16, y: 10 },
    },

    opacity: { disabled: 0.45, pressed: 0.82, subtle: 0.1 },
} as const;

export type Scales = typeof scales;
