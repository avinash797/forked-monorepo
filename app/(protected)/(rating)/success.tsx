import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRatingFlow } from '@/contexts/rating-flow-context';
import { useTheme } from '@/contexts/theme-provider';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function SuccessScreen() {
    const router = useRouter();
    const { reset } = useRatingFlow();
    const { theme } = useTheme();
    const successColor = theme.color.success;

    const handleRateAnother = () => {
        reset();
        router.replace('/(protected)/(rating)/venue-search');
    };

    const handleGoHome = () => {
        reset();
        router.replace('/(protected)/(tabs)');
    };

    return (
        <ThemedView style={styles.container}>
            <ThemedView style={styles.content}>
                <IconSymbol
                    name="check-circle"
                    size={80}
                    color={successColor}
                    style={styles.icon}
                />

                <ThemedText type="title" style={styles.title}>
                    Review Submitted!
                </ThemedText>

                <ThemedText
                    style={styles.message}
                    lightColor="#666"
                    darkColor="#999"
                >
                    Thank you for sharing your food experience. Your review will
                    help others discover great dishes.
                </ThemedText>

                <ThemedText
                    style={styles.info}
                    lightColor="#666"
                    darkColor="#999"
                >
                    Your review is pending moderation and will be visible soon.
                </ThemedText>

                <ThemedButton onPress={handleRateAnother} style={styles.button}>
                    Rate Another Dish
                </ThemedButton>

                <ThemedButton
                    variant="secondary"
                    onPress={handleGoHome}
                    style={styles.button}
                >
                    Back to Home
                </ThemedButton>
            </ThemedView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    icon: {
        marginBottom: 24,
    },
    title: {
        marginBottom: 16,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 24,
    },
    info: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 32,
    },
    button: {
        width: '100%',
        marginBottom: 12,
    },
});
