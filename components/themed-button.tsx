import { StyleSheet, TouchableOpacity, ActivityIndicator, type TouchableOpacityProps } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from './themed-text';

export type ThemedButtonProps = TouchableOpacityProps & {
  title: string;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  lightColor?: string;
  darkColor?: string;
};

export function ThemedButton({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  lightColor,
  darkColor,
  style,
  ...rest
}: ThemedButtonProps) {
  const primaryColor = useThemeColor({ light: lightColor, dark: darkColor }, 'primary');
  const surfaceColor = useThemeColor({}, 'surface');
  const textColor = variant === 'primary' ? '#FFFFFF' : primaryColor;
  const backgroundColor = variant === 'primary' ? primaryColor : surfaceColor;

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor, opacity: isDisabled ? 0.5 : 1 },
        variant === 'secondary' && { borderWidth: 1, borderColor: primaryColor },
        style,
      ]}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <ThemedText style={[styles.text, { color: textColor }]}>
          {title}
        </ThemedText>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
