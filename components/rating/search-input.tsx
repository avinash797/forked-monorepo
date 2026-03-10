import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';

interface SearchInputProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    isLoading?: boolean;
    onFocus?: () => void;
    autoFocus?: boolean;
}

export function SearchInput({
    value,
    onChangeText,
    placeholder = 'Search...',
    isLoading = false,
    onFocus,
    autoFocus = false,
}: SearchInputProps) {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    const handleClear = () => {
        onChangeText('');
    };

    return (
        <View style={styles.container}>
            <IconSymbol
                name="search"
                size={20}
                color={theme.color.textTertiary}
            />

            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={theme.color.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="never"
                onFocus={onFocus}
                autoFocus={autoFocus}
            />

            {isLoading && (
                <ActivityIndicator
                    size="small"
                    color={theme.color.textTertiary}
                />
            )}

            {!isLoading && value.length > 0 && (
                <Pressable
                    onPress={handleClear}
                    style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                    android_ripple={{
                        color: 'rgba(0, 0, 0, 0.1)',
                        radius: 16,
                        borderless: true,
                    }}
                >
                    <IconSymbol
                        name="trash-outline"
                        size={20}
                        color={theme.color.textTertiary}
                    />
                </Pressable>
            )}
        </View>
    );
}

const createStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: theme.space.sm,
            borderRadius: theme.radius.sm,
            gap: theme.space.xs,
            borderWidth: theme.border.hairline,
            borderColor: theme.color.border,
            backgroundColor: theme.color.inputBg,
        },
        input: {
            flex: 1,
            fontSize: theme.font.size.md,
            padding: 0,
            color: theme.color.textPrimary,
            paddingVertical: theme.space.sm,
        },
    });
