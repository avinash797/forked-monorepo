import { SSOButtons } from '@/components/sso-buttons';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { useTheme } from '@/contexts/theme-provider';
import { useAuth } from '@/hooks/use-auth';
import { validateEmail, validatePassword } from '@forked/utils';
import { Link } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';

export default function LoginScreen() {
    const { login } = useAuth();
    const { theme } = useTheme();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        // Validate
        const emailError = validateEmail(email);
        const passwordError = validatePassword(password);

        if (emailError || passwordError) {
            setErrors({
                email: emailError || '',
                password: passwordError || '',
            });
            return;
        }

        setErrors({});
        setIsLoading(true);

        try {
            await login(email, password);
            // Router will automatically navigate to (tabs) due to conditional rendering
        } catch (error: any) {
            setErrors({
                general: error.message || 'Invalid email or password',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <ThemedText type="title">Welcome back!</ThemedText>
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
                            error={errors.email}
                        />

                        <ThemedTextInput
                            label="Password"
                            placeholder="Enter your password"
                            value={password}
                            onChangeText={setPassword}
                            showPasswordToggle
                            autoCapitalize="none"
                            autoComplete="password"
                            error={errors.password}
                        />

                        {errors.general && (
                            <ThemedText style={styles.generalError}>
                                {errors.general}
                            </ThemedText>
                        )}

                        <Pressable>
                            <Link href="/(auth)/reset-password" asChild>
                                <ThemedText
                                    type="link"
                                    style={styles.forgotPassword}
                                >
                                    Forgot Password?
                                </ThemedText>
                            </Link>
                        </Pressable>

                        <ThemedButton
                            onPress={handleLogin}
                            loading={isLoading}
                            style={styles.loginButton}
                        >
                            Login
                        </ThemedButton>

                        <SSOButtons
                            mode="login"
                            onError={(message) =>
                                setErrors({ general: message })
                            }
                            onStart={() => setErrors({})}
                        />

                        <View style={styles.signupContainer}>
                            <ThemedText>
                                Don&apos;t have an account?{' '}
                            </ThemedText>
                            <Link href="/(auth)/signup" asChild>
                                <Pressable>
                                    <ThemedText type="link">Sign Up</ThemedText>
                                </Pressable>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
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
        paddingTop: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },

    form: {
        width: '100%',
        padding: 24,
        paddingBottom: 48,
    },
    generalError: {
        marginBottom: 16,
        textAlign: 'center',
    },
    forgotPassword: {
        textAlign: 'right',
        marginBottom: 24,
    },
    loginButton: {
        marginBottom: 24,
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
