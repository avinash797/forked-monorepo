import { useTheme } from '@/contexts/theme-provider';
import { View, type ViewProps } from 'react-native';

export type ThemedViewProps = ViewProps & {
    lightColor?: string;
    darkColor?: string;
    variant?: 'default' | 'surface' | 'surface2';
};

export function ThemedView({
    style,
    lightColor,
    darkColor,
    variant = 'default',
    ...otherProps
}: ThemedViewProps) {
    const { theme, colorScheme } = useTheme();

    const backgroundColor =
        colorScheme === 'light'
            ? lightColor
            : darkColor ||
              (variant === 'surface'
                  ? theme.color.surface
                  : variant === 'surface2'
                    ? theme.color.surface2
                    : theme.color.bg);

    return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
