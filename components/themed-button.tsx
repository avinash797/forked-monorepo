import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
} from "react-native";

import { useTheme } from "@/contexts/theme-provider";
import { ThemedText } from "./themed-text";

export type ThemedButtonProps = PressableProps & {
  children: ReactNode;
  variant?: "primary" | "secondary";
  loading?: boolean;
  /** @deprecated Use theme variants instead */
  lightColor?: string;
  /** @deprecated Use theme variants instead */
  darkColor?: string;
};

export function ThemedButton({
  children,
  variant = "primary",
  loading = false,
  disabled,
  lightColor,
  darkColor,
  style,
  ...rest
}: ThemedButtonProps) {
  const { theme, colorScheme } = useTheme();

  // Support legacy color props (deprecated)
  const customColor = useMemo(() => {
    if (lightColor && colorScheme === 'light') return lightColor;
    if (darkColor && colorScheme === 'dark') return darkColor;
    return null;
  }, [lightColor, darkColor, colorScheme]);

  // Build button style from theme tokens
  const buttonStyle = useMemo(() => {
    const isPrimary = variant === "primary";
    const backgroundColor = customColor || (isPrimary ? theme.color.accent : theme.color.surface2);
    const textColor = isPrimary ? theme.color.accentOn : theme.color.textPrimary;
    const borderColor = theme.color.border;

    return {
      backgroundColor,
      textColor,
      borderColor,
      height: 50,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.space.lg,
      fontSize: theme.font.size.md,
      fontWeight: theme.font.weight.semibold,
    };
  }, [variant, theme, customColor]);

  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={({ pressed }) => [
        {
          height: buttonStyle.height,
          borderRadius: buttonStyle.borderRadius,
          backgroundColor: buttonStyle.backgroundColor,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: buttonStyle.paddingHorizontal,
          opacity: isDisabled ? theme.opacity.disabled : pressed ? theme.opacity.pressed : 1,
        },
        variant === "secondary" && {
          borderWidth: theme.border.hairline,
          borderColor: buttonStyle.borderColor,
        },
        typeof style === 'function' ? style({ pressed } as any) : style,
      ]}
      disabled={isDisabled}
      android_ripple={{
        color: variant === "primary" ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
      }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={buttonStyle.textColor} />
      ) : typeof children === "string" ? (
        <ThemedText
          style={{
            color: buttonStyle.textColor,
            fontSize: buttonStyle.fontSize,
            fontWeight: buttonStyle.fontWeight as any,
          }}
        >
          {children}
        </ThemedText>
      ) : (
        children
      )}
    </Pressable>
  );
}
