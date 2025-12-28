// theme/componentStyles.ts
import { createStyles, makeShadow, type ActiveTheme } from "./makeStyles";

export const buildComponentStyles = (t: ActiveTheme) =>
    createStyles((t) => ({
        screen: {
            flex: 1,
            backgroundColor: t.color.bg,
        },

        card: {
            backgroundColor: t.color.surface,
            borderRadius: t.radius.lg,
            borderWidth: t.border.hairline,
            borderColor: t.color.border,
            padding: t.space.md,
            ...(makeShadow(t, "sm") as object),
        },

        h1: {
            color: t.color.textPrimary,
            fontSize: t.font.size.xxl,
            lineHeight: t.font.line.xxl,
            fontWeight: t.font.weight.bold as any,
        },
        h2: {
            color: t.color.textPrimary,
            fontSize: t.font.size.xl,
            lineHeight: t.font.line.xl,
            fontWeight: t.font.weight.semibold as any,
        },
        body: {
            color: t.color.textPrimary,
            fontSize: t.font.size.md,
            lineHeight: t.font.line.md,
            fontWeight: t.font.weight.regular as any,
        },
        caption: {
            color: t.color.textSecondary,
            fontSize: t.font.size.sm,
            lineHeight: t.font.line.sm,
        },

        input: {
            backgroundColor: t.color.inputBg,
            borderColor: t.color.inputBorder,
            borderWidth: t.border.hairline,
            borderRadius: t.radius.md,
            paddingHorizontal: t.space.md,
            paddingVertical: t.space.sm,
            color: t.color.textPrimary,
        },

        buttonPrimary: {
            backgroundColor: t.color.accent,
            borderRadius: t.radius.pill,
            paddingVertical: t.space.sm,
            paddingHorizontal: t.space.lg,
            alignItems: "center",
            justifyContent: "center",
        },
        buttonPrimaryText: {
            color: t.color.accentOn,
            fontSize: t.font.size.md,
            fontWeight: t.font.weight.semibold as any,
        },

        buttonSecondary: {
            backgroundColor: t.color.surface2,
            borderColor: t.color.border,
            borderWidth: t.border.hairline,
            borderRadius: t.radius.pill,
            paddingVertical: t.space.sm,
            paddingHorizontal: t.space.lg,
            alignItems: "center",
            justifyContent: "center",
        },
        buttonSecondaryText: {
            color: t.color.textPrimary,
            fontSize: t.font.size.md,
            fontWeight: t.font.weight.semibold as any,
        },

        badge: {
            alignSelf: "flex-start",
            backgroundColor: t.color.badgeBg,
            borderColor: t.color.border,
            borderWidth: t.border.hairline,
            borderRadius: t.radius.pill,
            paddingHorizontal: t.space.sm,
            paddingVertical: t.space.xxs,
        },
        badgeText: {
            color: t.color.badgeText,
            fontSize: t.font.size.xs,
            lineHeight: t.font.line.xs,
            fontWeight: t.font.weight.medium as any,
        },

        divider: {
            height: 1,
            backgroundColor: t.color.divider,
        },
    }), t);
