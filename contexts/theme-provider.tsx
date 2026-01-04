import { getTheme, type ThemeMode, type ThemeName } from '@/lib/theme';
import type { ActiveTheme } from '@/lib/theme/makeStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { useColorScheme } from 'react-native';

const THEME_STORAGE_KEY = '@forked/theme-name';
const THEME_PREFERENCE_STORAGE_KEY = '@forked/theme-preference';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextValue {
    /** The active theme object with all tokens */
    theme: ActiveTheme;
    /** The current theme name (default, genZ, foodies, critics) */
    themeName: ThemeName;
    /** The user's preferred color scheme setting */
    themePreference: ThemePreference;
    /** The actual active color scheme (light or dark) */
    colorScheme: ThemeMode;
    /** Change the theme variant */
    setThemeName: (name: ThemeName) => void;
    /** Change the color scheme preference */
    setThemePreference: (pref: ThemePreference) => void;
    /** Check if the theme is currently using dark mode */
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
    children: React.ReactNode;
    /** Override the initial theme name (useful for testing) */
    initialThemeName?: ThemeName;
}

export function ThemeProvider({
    children,
    initialThemeName = 'default',
}: ThemeProviderProps) {
    const [themeName, setThemeNameState] =
        useState<ThemeName>(initialThemeName);
    const [themePreference, setThemePreferenceState] =
        useState<ThemePreference>('system');

    const systemColorScheme = useColorScheme();

    // Determine the effective color scheme based on preference and system setting
    const colorScheme: ThemeMode = useMemo(() => {
        if (themePreference === 'system') {
            return systemColorScheme ?? 'light';
        }
        return themePreference;
    }, [themePreference, systemColorScheme]);

    // Load persisted theme preference on mount
    useEffect(() => {
        Promise.all([
            AsyncStorage.getItem(THEME_STORAGE_KEY),
            AsyncStorage.getItem(THEME_PREFERENCE_STORAGE_KEY),
        ])
            .then(([storedName, storedPreference]) => {
                if (storedName && isValidThemeName(storedName)) {
                    setThemeNameState(storedName as ThemeName);
                }
                if (
                    storedPreference &&
                    isValidThemePreference(storedPreference)
                ) {
                    setThemePreferenceState(
                        storedPreference as ThemePreference
                    );
                }
            })
            .catch((error) => {
                console.warn('Failed to load theme settings:', error);
            });
    }, []);

    // Persist theme preference when it changes
    const setThemeName = (name: ThemeName) => {
        setThemeNameState(name);
        AsyncStorage.setItem(THEME_STORAGE_KEY, name).catch((error) => {
            console.warn('Failed to save theme name:', error);
        });
    };

    const setThemePreference = (pref: ThemePreference) => {
        setThemePreferenceState(pref);
        AsyncStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, pref).catch(
            (error) => {
                console.warn('Failed to save theme preference:', error);
            }
        );
    };

    // Memoize the theme object to avoid recalculating on every render
    const theme = useMemo(() => {
        return getTheme(themeName, colorScheme);
    }, [themeName, colorScheme]);

    const value = useMemo<ThemeContextValue>(
        () => ({
            theme,
            themeName,
            themePreference,
            colorScheme,
            setThemeName,
            setThemePreference,
            isDark: colorScheme === 'dark',
        }),
        [theme, themeName, themePreference, colorScheme]
    );

    return (
        <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    );
}

/**
 * Hook to consume the active theme
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, setThemeName, isDark } = useTheme();
 *
 *   return (
 *     <View style={{ backgroundColor: theme.color.bg }}>
 *       <Text style={{ color: theme.color.textPrimary }}>
 *         Hello World
 *       </Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useTheme(): ThemeContextValue {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

function isValidThemeName(name: string): name is ThemeName {
    return ['default', 'genZ', 'foodies', 'critics'].includes(name);
}

function isValidThemePreference(pref: string): pref is ThemePreference {
    return ['light', 'dark', 'system'].includes(pref);
}
