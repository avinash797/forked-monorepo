import type { ReactNode } from 'react';
import {
    ActivityIndicator,
    Pressable,
    type PressableProps,
} from 'react-native';

import { useTheme } from '@/contexts/theme-provider';
import { buildComponentStyles } from '@/lib/theme/componentStyles';
import { ThemedText } from './themed-text';

export type ThemedButtonProps = PressableProps & {
    children: ReactNode;
    variant?: 'primary' | 'secondary';
    loading?: boolean;
};

export function ThemedButton({
    children,
    variant = 'primary',
    loading = false,
    disabled,
    style,
    ...rest
}: ThemedButtonProps) {
    const { theme } = useTheme();
    const builtStyles = buildComponentStyles(theme);

    const isDisabled = disabled || loading;

    return (
        <Pressable
            style={({ pressed }) => [
                {
                    opacity: isDisabled
                        ? theme.opacity.disabled
                        : pressed
                          ? theme.opacity.pressed
                          : 1,
                },
                typeof style === 'function' ? style({ pressed } as any) : style,
                variant === 'primary'
                    ? builtStyles.buttonPrimary
                    : builtStyles.buttonSecondary,
            ]}
            disabled={isDisabled}
            android_ripple={{
                color:
                    variant === 'primary'
                        ? 'rgba(255, 255, 255, 0.2)'
                        : 'rgba(0, 0, 0, 0.1)',
            }}
            {...rest}
        >
            {loading ? (
                <ActivityIndicator
                    color={
                        variant === 'primary'
                            ? theme.color.accentOn
                            : theme.color.textPrimary
                    }
                />
            ) : typeof children === 'string' ? (
                <ThemedText
                    style={
                        variant === 'primary'
                            ? builtStyles.buttonPrimaryText
                            : builtStyles.buttonSecondaryText
                    }
                >
                    {children}
                </ThemedText>
            ) : (
                children
            )}
        </Pressable>
    );
}
