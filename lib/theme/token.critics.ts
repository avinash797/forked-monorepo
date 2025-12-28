// tokens.critics.ts
export const critics = {
    name: "critics",
    mode: {
        dark: {
            color: {
                accent: "#8E2C2C",        // wine / editorial
                accentOn: "#0E0E10",
                accentSoft: "#221112",

                bg: "#0E0E10",
                surface: "#151518",
                surface2: "#1C1C20",
                overlay: "rgba(0,0,0,0.65)",

                textPrimary: "#F2F2F4",
                textSecondary: "#B3B3BC",
                textTertiary: "#84848E",
                textOnImage: "#FFFFFF",

                border: "rgba(255,255,255,0.12)",
                divider: "rgba(255,255,255,0.08)",

                inputBg: "#151518",
                inputBorder: "rgba(255,255,255,0.14)",
                placeholder: "#84848E",

                success: "#2AAE6A",        // calmer, less neon
                warning: "#D18B2A",
                danger: "#D64545",
                info: "#3A86FF",

                focusRing: "rgba(142,44,44,0.42)",
                selection: "rgba(142,44,44,0.18)",

                badgeBg: "#1C1C20",
                badgeText: "#F2F2F4",
            },
            rating: {
                starFilled: "#D4A017",     // muted gold
                starEmpty: "rgba(255,255,255,0.22)",
                top1: "#D4A017",
                top2: "#AEB6C2",
                top3: "#B97A57",
            },
        },

        light: {
            color: {
                accent: "#7A1F1F",
                accentOn: "#FFFFFF",
                accentSoft: "#F7E6E6",

                bg: "#FFFFFF",
                surface: "#F6F6F8",       // neutral editorial
                surface2: "#FFFFFF",
                overlay: "rgba(0,0,0,0.45)",

                textPrimary: "#101014",
                textSecondary: "#3F3F47",
                textTertiary: "#61616A",
                textOnImage: "#FFFFFF",

                border: "rgba(16,16,20,0.12)",
                divider: "rgba(16,16,20,0.08)",

                inputBg: "#FFFFFF",
                inputBorder: "rgba(16,16,20,0.16)",
                placeholder: "#61616A",

                success: "#1F7D52",
                warning: "#A06614",
                danger: "#B42318",
                info: "#1A73E8",

                focusRing: "rgba(122,31,31,0.30)",
                selection: "rgba(122,31,31,0.14)",

                badgeBg: "#FFFFFF",
                badgeText: "#101014",
            },
            rating: {
                starFilled: "#9A6B00",
                starEmpty: "rgba(16,16,20,0.22)",
                top1: "#9A6B00",
                top2: "#7B8794",
                top3: "#8D5A3E",
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
