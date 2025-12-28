import { Text, type TextProps } from 'react-native';
import { useMemo } from 'react';

import { useTheme } from '@/contexts/theme-provider';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const { theme, colorScheme } = useTheme();

  // Support legacy lightColor/darkColor props for backwards compatibility
  const color = useMemo(() => {
    if (lightColor && colorScheme === 'light') return lightColor;
    if (darkColor && colorScheme === 'dark') return darkColor;
    // Use theme tokens
    return type === 'link' ? theme.color.accent : theme.color.textPrimary;
  }, [lightColor, darkColor, colorScheme, type, theme]);

  // Build typography styles from theme tokens
  const typeStyle = useMemo(() => {
    switch (type) {
      case 'title':
        return {
          fontSize: theme.font.size.xxl,
          lineHeight: theme.font.line.xxl,
          fontWeight: theme.font.weight.bold as any,
        };
      case 'subtitle':
        return {
          fontSize: theme.font.size.xl,
          lineHeight: theme.font.line.xl,
          fontWeight: theme.font.weight.bold as any,
        };
      case 'defaultSemiBold':
        return {
          fontSize: theme.font.size.md,
          lineHeight: theme.font.line.md,
          fontWeight: theme.font.weight.semibold as any,
        };
      case 'link':
        return {
          fontSize: theme.font.size.md,
          lineHeight: theme.font.line.lg,
        };
      case 'default':
      default:
        return {
          fontSize: theme.font.size.md,
          lineHeight: theme.font.line.md,
        };
    }
  }, [type, theme]);

  return (
    <Text
      style={[
        { color },
        typeStyle,
        style,
      ]}
      {...rest}
    />
  );
}
