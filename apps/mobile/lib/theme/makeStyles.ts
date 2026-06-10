// theme/makeStyles.ts
import { StyleSheet } from 'react-native';

export type ActiveTheme = ReturnType<typeof import('./index').getTheme>;

export function makeShadow(t: ActiveTheme, size: 'sm' | 'md' | 'lg') {
    const s = t.shadow[size];
    return { boxShadow: `0px ${s.y}px ${s.radius}px rgba(0, 0, 0, ${s.opacity})` };
}

export function createStyles<
    T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>,
>(fn: (t: ActiveTheme) => T, t: ActiveTheme) {
    return StyleSheet.create(fn(t));
}
