/**
 * Hook for getting theme colors with optional light/dark overrides
 *
 * @deprecated Consider using `useTheme()` from '@/contexts/theme-provider' directly for new code.
 * This hook is maintained for backwards compatibility.
 */

import { useTheme } from "@/contexts/theme-provider";

// Legacy color name mapping to new theme tokens
const COLOR_MAP = {
  text: (t: any) => t.color.textPrimary,
  background: (t: any) => t.color.bg,
  tint: (t: any) => t.color.accent,
  icon: (t: any) => t.color.textTertiary,
  tabIconDefault: (t: any) => t.color.textTertiary,
  tabIconSelected: (t: any) => t.color.accent,
  primary: (t: any) => t.color.accent,
  primaryDark: () => '#d95a1a',
  secondary: (t: any) => t.color.textSecondary,
  success: (t: any) => t.color.success,
  warning: (t: any) => t.color.warning,
  error: (t: any) => t.color.danger,
  surface: (t: any) => t.color.surface,
  input: (t: any) => t.color.inputBg,
  muted: (t: any) => t.color.textSecondary,
} as const;

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof COLOR_MAP
): string {
  const { theme, colorScheme } = useTheme();
  const colorFromProps = props[colorScheme];

  if (colorFromProps) {
    return colorFromProps;
  }

  // Get color from active theme using the mapping
  const colorGetter = COLOR_MAP[colorName];
  return colorGetter ? colorGetter(theme) : theme.color.textPrimary;
}
