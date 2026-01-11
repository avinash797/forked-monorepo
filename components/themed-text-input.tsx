import { useMemo, useState } from 'react';
import {
    TextInput,
    TouchableOpacity,
    View,
    type TextInputProps,
} from 'react-native';

import { useTheme } from '@/contexts/theme-provider';
import { ThemedText } from './themed-text';
import { IconSymbol } from './ui/icon-symbol';

export type ThemedTextInputProps = TextInputProps & {
    /** @deprecated Use theme variants instead */
    lightColor?: string;
    /** @deprecated Use theme variants instead */
    darkColor?: string;
    lightLabelColor?: string;
    darkLabelColor?: string;
    error?: string;
    label?: string;
    showPasswordToggle?: boolean;
};

export function ThemedTextInput({
    style,
    lightColor,
    darkColor,
    lightLabelColor,
    darkLabelColor,
    error,
    label,
    showPasswordToggle = false,
    secureTextEntry,
    ...rest
}: ThemedTextInputProps) {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const { theme, colorScheme } = useTheme();

    // Support legacy color props (deprecated)
    const customBgColor = useMemo(() => {
        if (lightColor && colorScheme === 'light') return lightColor;
        if (darkColor && colorScheme === 'dark') return darkColor;
        return null;
    }, [lightColor, darkColor, colorScheme]);

    // Build input styles from theme tokens
    const inputStyles = useMemo(
        () => ({
            backgroundColor: customBgColor || theme.color.inputBg,
            textColor: theme.color.textPrimary,
            errorColor: theme.color.danger,
            placeholderColor: theme.color.placeholder,
            borderColor: error ? theme.color.danger : theme.color.inputBorder,
            height: 50,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.space.md,
            fontSize: theme.font.size.md,
            marginBottom: theme.space.md,
            labelFontSize: theme.font.size.sm,
            labelMarginBottom: theme.space.xs,
            errorFontSize: theme.font.size.xs,
            errorMarginTop: theme.space.xxs,
        }),
        [theme, error, customBgColor]
    );

    const shouldSecureText = showPasswordToggle
        ? !isPasswordVisible
        : secureTextEntry;

    return (
        <View style={{ marginBottom: inputStyles.marginBottom }}>
            {label && (
                <ThemedText
                    lightColor={lightLabelColor}
                    darkColor={darkLabelColor}
                    style={{
                        fontSize: inputStyles.labelFontSize,
                        fontWeight: theme.font.weight.semibold as any,
                        marginBottom: inputStyles.labelMarginBottom,
                    }}
                >
                    {label}
                </ThemedText>
            )}
            <View style={{ position: 'relative' }}>
                <TextInput
                    style={[
                        {
                            height: inputStyles.height,
                            borderRadius: inputStyles.borderRadius,
                            paddingHorizontal: inputStyles.paddingHorizontal,
                            fontSize: inputStyles.fontSize,
                            borderWidth: theme.border.hairline,
                            backgroundColor: inputStyles.backgroundColor,
                            color: inputStyles.textColor,
                            borderColor: inputStyles.borderColor,
                        },
                        showPasswordToggle && { paddingRight: 50 },
                        style,
                    ]}
                    placeholderTextColor={inputStyles.placeholderColor}
                    secureTextEntry={shouldSecureText}
                    {...rest}
                />
                {showPasswordToggle && (
                    <TouchableOpacity
                        style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            height: inputStyles.height,
                            width: 50,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <IconSymbol
                            name={
                                isPasswordVisible
                                    ? 'eye-off-outline'
                                    : 'eye-outline'
                            }
                            size={20}
                            color={inputStyles.placeholderColor}
                        />
                    </TouchableOpacity>
                )}
            </View>
            {error && (
                <ThemedText
                    lightColor={lightLabelColor}
                    darkColor={darkLabelColor}
                    style={{
                        color: inputStyles.errorColor,
                        fontSize: inputStyles.errorFontSize,
                        marginTop: inputStyles.errorMarginTop,
                    }}
                >
                    {error}
                </ThemedText>
            )}
        </View>
    );
}
