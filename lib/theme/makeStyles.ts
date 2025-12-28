// theme/makeStyles.ts
import { Platform, StyleSheet } from "react-native";

export type ActiveTheme = ReturnType<typeof import("./index").getTheme>;

export function makeShadow(t: ActiveTheme, size: "sm" | "md" | "lg") {
    const s = t.shadow[size];
    return Platform.select({
        ios: {
            shadowColor: "#000",
            shadowOpacity: s.opacity,
            shadowRadius: s.radius,
            shadowOffset: { width: 0, height: s.y },
        },
        android: {
            elevation: size === "sm" ? 2 : size === "md" ? 4 : 8,
        },
        default: {},
    });
}

export function createStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
    fn: (t: ActiveTheme) => T,
    t: ActiveTheme
) {
    return StyleSheet.create(fn(t));
}
