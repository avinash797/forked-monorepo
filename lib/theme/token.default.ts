// token.default.ts - Original Forked theme
export const defaultTheme = {
    name: "default",
    mode: {
        dark: {
            color: {
                // Brand - using existing orange (#ee6c2b)
                accent: "#ee6c2b",
                accentOn: "#FFFFFF",
                accentSoft: "#2A1813",

                // Backgrounds
                bg: "#221610",
                surface: "#342219",
                surface2: "#3d2a1f",
                overlay: "rgba(0,0,0,0.60)",

                // Text
                textPrimary: "#ECEDEE",
                textSecondary: "#c9a492",
                textTertiary: "#9BA1A6",
                textOnImage: "#FFFFFF",

                // Borders / dividers
                border: "rgba(236,237,238,0.10)",
                divider: "rgba(236,237,238,0.08)",

                // Inputs
                inputBg: "#482f23",
                inputBorder: "rgba(236,237,238,0.12)",
                placeholder: "#9CA3AF",

                // States
                success: "#34D399",
                warning: "#FBBF24",
                danger: "#F87171",
                info: "#60A5FA",

                // Focus / highlight
                focusRing: "rgba(238,108,43,0.40)",
                selection: "rgba(238,108,43,0.18)",

                // Badges
                badgeBg: "#342219",
                badgeText: "#ECEDEE",
            },

            rating: {
                starFilled: "#FBBF24",
                starEmpty: "rgba(236,237,238,0.22)",
                top1: "#FBBF24",
                top2: "#D1D5DB",
                top3: "#CD7F32",
            },
        },

        light: {
            color: {
                // Brand
                accent: "#ee6c2b",
                accentOn: "#FFFFFF",
                accentSoft: "#FEE8DF",

                // Backgrounds
                bg: "#f8f6f6",
                surface: "#ffffff",
                surface2: "#F3F4F6",
                overlay: "rgba(0,0,0,0.45)",

                // Text
                textPrimary: "#221610",
                textSecondary: "#4B5563",
                textTertiary: "#687076",
                textOnImage: "#FFFFFF",

                // Borders / dividers
                border: "rgba(34,22,16,0.10)",
                divider: "rgba(34,22,16,0.08)",

                // Inputs
                inputBg: "#ffffff",
                inputBorder: "#E5E7EB",
                placeholder: "#9CA3AF",

                // States
                success: "#10B981",
                warning: "#F59E0B",
                danger: "#EF4444",
                info: "#3B82F6",

                // Focus / highlight
                focusRing: "rgba(238,108,43,0.28)",
                selection: "rgba(238,108,43,0.14)",

                // Badges
                badgeBg: "#ffffff",
                badgeText: "#221610",
            },

            rating: {
                starFilled: "#F59E0B",
                starEmpty: "rgba(34,22,16,0.22)",
                top1: "#F59E0B",
                top2: "#6B7280",
                top3: "#CD7F32",
            },
        },
    },

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
        weight: { regular: "400", medium: "500", semibold: "600", bold: "700" },
    },

    shadow: {
        sm: { opacity: 0.12, radius: 6, y: 3 },
        md: { opacity: 0.16, radius: 10, y: 6 },
        lg: { opacity: 0.20, radius: 16, y: 10 },
    },

    opacity: { disabled: 0.45, pressed: 0.80, subtle: 0.10 },
} as const;
