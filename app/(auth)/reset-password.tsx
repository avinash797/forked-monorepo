import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/hooks/use-auth';
import { validateEmail } from '@/lib/validators';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';

export default function ResetPasswordScreen() {
    const router = useRouter();
    const { resetPassword } = useAuth();

    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleResetPassword = async () => {
        // Validate
        const emailError = validateEmail(email);
        if (emailError) {
            setError(emailError);
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            await resetPassword(email);
            // Show success message
            Alert.alert(
                'Check Your Email',
                'We have sent you a password reset link. Please check your email and follow the instructions.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.back(),
                    },
                ]
            );
        } catch (error: any) {
            setError(error.message || 'Failed to send reset email');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <ThemedText type="title">Reset Password</ThemedText>
                        <ThemedText style={styles.subtitle}>
                            Enter your email address and we&apos;ll send you a
                            link to reset your password.
                        </ThemedText>
                    </View>

                    <View style={styles.form}>
                        <ThemedTextInput
                            label="Email"
                            placeholder="your@email.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            error={error}
                        />

                        <ThemedButton
                            onPress={handleResetPassword}
                            loading={isLoading}
                            style={styles.resetButton}
                        >
                            Send Reset Link
                        </ThemedButton>

                        <ThemedButton
                            variant="secondary"
                            onPress={() => router.back()}
                        >
                            Back to Login
                        </ThemedButton>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    subtitle: {
        marginTop: 8,
        fontSize: 16,
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    resetButton: {
        marginBottom: 16,
    },
});
