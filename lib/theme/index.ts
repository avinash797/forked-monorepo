// theme/index.ts
import { defaultTheme } from './token.default';

export type ThemeName = 'default';
export type ThemeMode = 'light' | 'dark';

const themes = { default: defaultTheme } as const;

export function getTheme(name: ThemeName, mode: ThemeMode) {
    const t = themes[name];
    return {
        ...t,
        mode,
        color: t.mode[mode].color,
        rating: t.mode[mode].rating,
    } as const;
}
