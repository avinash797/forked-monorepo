// theme/index.ts — assembles the app theme from the shared @forked/theme tokens.
import { mobilePalette, scales, type ThemeMode } from '@forked/theme';

export type ThemeName = 'default';
export type { ThemeMode };

const themes = {
    default: { ...scales, name: mobilePalette.name, mode: mobilePalette.mode },
} as const;

export function getTheme(name: ThemeName, mode: ThemeMode) {
    const t = themes[name];
    return {
        ...t,
        mode,
        color: t.mode[mode].color,
        rating: t.mode[mode].rating,
    } as const;
}
