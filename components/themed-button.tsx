import type { ReactNode } from 'react';
import {
    ActivityIndicator,
    Pressable,
    type PressableProps,
    View,
} from 'react-native';

import { useTheme } from '@/contexts/theme-provider';
import { buildComponentStyles } from '@/lib/theme/componentStyles';
import { ThemedText } from './themed-text';

export type ThemedButtonVariant = 'primary' | 'secondary' | 'text' | 'icon';

export type ThemedButtonProps = PressableProps & {
    children?: ReactNode;
    variant?: ThemedButtonVariant;
    loading?: boolean;
    icon?: ReactNode;
    destructive?: boolean;
};

const variantStyleKey: Record<
    ThemedButtonVariant,
    'buttonPrimary' | 'buttonSecondary' | 'buttonText' | 'buttonIcon'
> = {
    primary: 'buttonPrimary',
    secondary: 'buttonSecondary',
    text: 'buttonText',
    icon: 'buttonIcon',
};

const variantTextStyleKey: Record<
    Exclude<ThemedButtonVariant, 'icon'>,
    'buttonPrimaryText' | 'buttonSecondaryText' | 'buttonTextText'
> = {
    primary: 'buttonPrimaryText',
    secondary: 'buttonSecondaryText',
    text: 'buttonTextText',
};

const rippleColor: Record<ThemedButtonVariant, string> = {
    primary: 'rgba(255, 255, 255, 0.2)',
    secondary: 'rgba(0, 0, 0, 0.1)',
    text: 'rgba(0, 0, 0, 0.08)',
    icon: 'rgba(0, 0, 0, 0.08)',
};

export function ThemedButton({
    children,
    variant = 'primary',
    loading = false,
    disabled,
    style,
    icon,
    destructive = false,
    ...rest
}: ThemedButtonProps) {
    const { theme } = useTheme();
    const builtStyles = buildComponentStyles(theme);

    const isDisabled = disabled || loading;

    const loaderColor =
        variant === 'primary'
            ? theme.color.accentOn
            : theme.color.textPrimary;

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
                builtStyles[variantStyleKey[variant]],
                destructive && {
                    backgroundColor: theme.color.error,
                },
                typeof style === 'function' ? style({ pressed } as any) : style,
            ]}
            disabled={isDisabled}
            android_ripple={{ color: rippleColor[variant] }}
            {...rest}
        >
            {loading ? (
                <ActivityIndicator color={loaderColor} />
            ) : variant === 'icon' ? (
                icon
            ) : (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    {icon}
                    {typeof children === 'string' ? (
                        <ThemedText
                            style={
                                builtStyles[
                                    variantTextStyleKey[
                                        variant as Exclude<
                                            ThemedButtonVariant,
                                            'icon'
                                        >
                                    ]
                                ]
                            }
                        >
                            {children}
                        </ThemedText>
                    ) : (
                        children
                    )}
                </View>
            )}
        </Pressable>
    );
}
