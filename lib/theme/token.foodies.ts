// tokens.foodies.ts
export const foodies = {
    name: "foodies",
    mode: {
        dark: {
            color: {
                accent: "#C0392B",        // brick red (premium)
                accentOn: "#0F0F10",
                accentSoft: "#24110F",

                bg: "#0F0F10",
                surface: "#171719",
                surface2: "#1E1E21",
                overlay: "rgba(0,0,0,0.62)",

                textPrimary: "#F3F1EE",
                textSecondary: "#B8B1A8",
                textTertiary: "#8E877F",
                textOnImage: "#FFFFFF",

                border: "rgba(255,255,255,0.10)",
                divider: "rgba(255,255,255,0.08)",

                inputBg: "#171719",
                inputBorder: "rgba(255,255,255,0.12)",
                placeholder: "#8E877F",

                success: "#2ECC71",
                warning: "#E67E22",
                danger: "#E74C3C",
                info: "#4AA3DF",

                focusRing: "rgba(192,57,43,0.40)",
                selection: "rgba(192,57,43,0.18)",

                // Medals / Boarders
                gold: "#FBBF24",
                silver: "#D1D5DB",
                bronze: "#CD7F32",

                badgeBg: "#1E1E21",
                badgeText: "#F3F1EE",
            },
            rating: {
                starFilled: "#F4C430",     // warm gold
                starEmpty: "rgba(255,255,255,0.22)",
                top1: "#F4C430",
                top2: "#C0C6CF",
                top3: "#C9895B",
            },
        },

        light: {
            color: {
                accent: "#B83227",
                accentOn: "#FFFFFF",
                accentSoft: "#FFE6E2",

                bg: "#FFFFFF",
                surface: "#FBF7F2",       // warm off-white
                surface2: "#FFFFFF",
                overlay: "rgba(0,0,0,0.45)",

                textPrimary: "#1A1714",
                textSecondary: "#4A443D",
                textTertiary: "#6D665E",
                textOnImage: "#FFFFFF",

                border: "rgba(26,23,20,0.10)",
                divider: "rgba(26,23,20,0.08)",

                inputBg: "#FFFFFF",
                inputBorder: "rgba(26,23,20,0.14)",
                placeholder: "#6D665E",

                success: "#1F8A4C",
                warning: "#B35C00",
                danger: "#C81E1E",
                info: "#1A73E8",

                focusRing: "rgba(184,50,39,0.28)",
                selection: "rgba(184,50,39,0.14)",

                // Medals / Boarders
                gold: "#F59E0B",
                silver: "#9CA3AF",
                bronze: "#B45309",

                badgeBg: "#FFFFFF",
                badgeText: "#1A1714",
            },
            rating: {
                starFilled: "#B88700",
                starEmpty: "rgba(26,23,20,0.22)",
                top1: "#B88700",
                top2: "#7B8794",
                top3: "#9A5E3A",
            },
        },
    },

    radius: { xs: 6, sm: 10, md: 14, lg: 18, xl: 24, pill: 999 },
    space: { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32 },
    border: { hairline: 1, thin: 1.5, thick: 2 },

    font: {
        family: { regular: undefined, medium: undefined, semibold: undefined, bold: undefined, mono: undefined },
        size: { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, xxl: 28 },
        line: { xs: 16, sm: 18, md: 22, lg: 24, xl: 28, xxl: 34 },
        weight: { regular: "400", medium: "500", semibold: "600", bold: "700" },
    },

    shadow: {
        sm: { opacity: 0.10, radius: 6, y: 3 },
        md: { opacity: 0.14, radius: 10, y: 6 },
        lg: { opacity: 0.18, radius: 16, y: 10 },
    },

    opacity: { disabled: 0.45, pressed: 0.82, subtle: 0.10 },
} as const;
