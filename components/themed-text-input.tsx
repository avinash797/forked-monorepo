import { useThemeColor } from '@/hooks/use-theme-color';
import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, type TextInputProps } from 'react-native';
import { ThemedText } from './themed-text';
import { IconSymbol } from './ui/icon-symbol';

export type ThemedTextInputProps = TextInputProps & {
  lightColor?: string;
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

  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'input') as string;
  const textColor = useThemeColor({}, 'text') as string;
  const errorColor = useThemeColor({}, 'error') as string;
  const mutedColor = useThemeColor({}, 'muted') as string;
  const borderColor = error ? errorColor : 'transparent';

  const shouldSecureText = showPasswordToggle ? !isPasswordVisible : secureTextEntry;

  return (
    <View style={styles.container}>
      {label && (
        <ThemedText lightColor={lightLabelColor} darkColor={darkLabelColor} style={styles.label}>{label}</ThemedText>
      )}
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            { backgroundColor, color: textColor, borderColor },
            showPasswordToggle && styles.inputWithToggle,
            style,
          ]}
          placeholderTextColor={mutedColor}
          secureTextEntry={shouldSecureText}
          {...rest}
        />
        {showPasswordToggle && (
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconSymbol
              name={isPasswordVisible ? 'visibility-off' : 'visibility'}
              size={20}
              color={mutedColor}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <ThemedText lightColor={lightLabelColor} darkColor={darkLabelColor} style={[styles.error, { color: errorColor }]}>
          {error}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  inputWithToggle: {
    paddingRight: 50,
  },
  toggleButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    height: 50,
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
});
