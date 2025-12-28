// theme/index.ts
import { critics } from "./token.critics";
import { defaultTheme } from "./token.default";
import { foodies } from "./token.foodies";
import { genZ } from "./token.genZ";

export type ThemeName = "default" | "genZ" | "foodies" | "critics";
export type ThemeMode = "light" | "dark";

const themes = { default: defaultTheme, genZ, foodies, critics } as const;

export function getTheme(name: ThemeName, mode: ThemeMode) {
    const t = themes[name];
    return {
        ...t,
        mode,
        color: t.mode[mode].color,
        rating: t.mode[mode].rating,
    } as const;
}
