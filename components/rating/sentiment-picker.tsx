import { useTheme } from '@/contexts/theme-provider';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '../themed-text';

export type Sentiment = 'liked' | 'okay' | 'disliked';

interface SentimentOption {
    value: Sentiment;
    label: string;
    emoji: string;
    color: string;
}

const SENTIMENT_OPTIONS: SentimentOption[] = [
    { value: 'liked',    label: 'Liked it!',        emoji: '😋', color: '#22c55e' },
    { value: 'okay',     label: 'It was okay',      emoji: '😐', color: '#f59e0b' },
    { value: 'disliked', label: "Didn't like it",   emoji: '😕', color: '#ef4444' },
];

interface SentimentPickerProps {
    value: Sentiment | null;
    onChange: (sentiment: Sentiment) => void;
    disabled?: boolean;
}

export function SentimentPicker({ value, onChange, disabled }: SentimentPickerProps) {
    const { theme } = useTheme();

    return (
        <View style={styles.container}>
            {SENTIMENT_OPTIONS.map((option) => {
                const isSelected = value === option.value;
                return (
                    <Pressable
                        key={option.value}
                        style={({ pressed }) => [
                            styles.option,
                            {
                                borderColor: isSelected ? option.color : theme.color.border,
                                backgroundColor: isSelected
                                    ? option.color + '20'
                                    : theme.color.surface,
                                opacity: pressed || (disabled && !isSelected) ? 0.7 : 1,
                            },
                        ]}
                        onPress={() => {
                            if (disabled) return;
                            if (process.env.EXPO_OS === 'ios') {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                            onChange(option.value);
                        }}
                        disabled={disabled}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: isSelected }}
                        accessibilityLabel={option.label}
                    >
                        <ThemedText style={styles.emoji}>{option.emoji}</ThemedText>
                        <ThemedText
                            style={[
                                styles.label,
                                {
                                    color: isSelected ? option.color : theme.color.textPrimary,
                                    fontWeight: isSelected ? '700' : '500',
                                },
                            ]}
                        >
                            {option.label}
                        </ThemedText>
                        {isSelected && (
                            <View style={[styles.checkDot, { backgroundColor: option.color }]} />
                        )}
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 12,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 14,
        borderCurve: 'continuous',
        borderWidth: 2,
        gap: 12,
    },
    emoji: {
        fontSize: 28,
    },
    label: {
        fontSize: 17,
        flex: 1,
    },
    checkDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
});
