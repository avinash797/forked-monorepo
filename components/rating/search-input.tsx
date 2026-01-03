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

    const backgroundColor = theme.color.inputBg;
    const textColor = theme.color.textPrimary;
    const placeholderColor = theme.color.textSecondary;
    const iconColor = theme.color.textTertiary;

    const handleClear = () => {
        onChangeText('');
    };

    return (
        <View style={[styles.container, { backgroundColor }]}>
            <IconSymbol name="search" size={20} color={iconColor} />

            <TextInput
                style={[styles.input, { color: textColor }]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={placeholderColor}
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="never"
                onFocus={onFocus}
                autoFocus={autoFocus}
            />

            {isLoading && <ActivityIndicator size="small" color={iconColor} />}

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
                        name="cancel"
                        size={20}
                        color={placeholderColor}
                    />
                </Pressable>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        padding: 0,
    },
});
