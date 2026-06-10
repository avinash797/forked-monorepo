import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/contexts/theme-provider';
import { AuthCancelledError, useAuth } from '@/hooks/use-auth';
import { AntDesign } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';

interface Props {
    mode: 'login' | 'signup';
    onError: (message: string) => void;
    onStart?: () => void;
}

export function SSOButtons({ mode, onError, onStart }: Props) {
    const { signInWithApple, signInWithGoogle } = useAuth();
    const { theme, isDark } = useTheme();
    const [appleAvailable, setAppleAvailable] = useState(false);
    const [loading, setLoading] = useState<'apple' | 'google' | null>(null);

    useEffect(() => {
        if (Platform.OS !== 'ios') return;
        AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }, []);

    const run = async (
        which: 'apple' | 'google',
        fn: () => Promise<void>,
        genericMsg: string
    ) => {
        onStart?.();
        setLoading(which);
        try {
            await fn();
        } catch (e: any) {
            if (e instanceof AuthCancelledError) return;
            onError(e?.message || genericMsg);
        } finally {
            setLoading(null);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.dividerRow}>
                <View
                    style={[
                        styles.dividerLine,
                        { backgroundColor: theme.color.divider },
                    ]}
                />
                <ThemedText
                    style={[
                        styles.dividerText,
                        { color: theme.color.textTertiary },
                    ]}
                >
                    or
                </ThemedText>
                <View
                    style={[
                        styles.dividerLine,
                        { backgroundColor: theme.color.divider },
                    ]}
                />
            </View>

            {Platform.OS === 'ios' && appleAvailable && (
                <AppleAuthentication.AppleAuthenticationButton
                    buttonType={
                        mode === 'signup'
                            ? AppleAuthentication.AppleAuthenticationButtonType
                                  .SIGN_UP
                            : AppleAuthentication.AppleAuthenticationButtonType
                                  .SIGN_IN
                    }
                    buttonStyle={
                        isDark
                            ? AppleAuthentication.AppleAuthenticationButtonStyle
                                  .WHITE
                            : AppleAuthentication.AppleAuthenticationButtonStyle
                                  .BLACK
                    }
                    cornerRadius={8}
                    style={styles.appleButton}
                    onPress={() =>
                        run('apple', signInWithApple, 'Apple sign-in failed')
                    }
                />
            )}

            <Pressable
                onPress={() =>
                    run('google', signInWithGoogle, 'Google sign-in failed')
                }
                disabled={loading !== null}
                style={({ pressed }) => [
                    styles.googleButton,
                    {
                        backgroundColor: '#FFFFFF',
                        borderColor: '#DADCE0',
                        opacity: pressed || loading !== null ? 0.85 : 1,
                    },
                ]}
            >
                {loading === 'google' ? (
                    <ActivityIndicator color="#1F1F1F" />
                ) : (
                    <>
                        <AntDesign
                            name="google"
                            size={18}
                            color="#1F1F1F"
                            style={styles.googleIcon}
                        />
                        <ThemedText style={styles.googleText}>
                            {mode === 'signup'
                                ? 'Sign up with Google'
                                : 'Continue with Google'}
                        </ThemedText>
                    </>
                )}
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 12,
        marginBottom: 24,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginVertical: 4,
    },
    dividerLine: {
        flex: 1,
        height: StyleSheet.hairlineWidth,
    },
    dividerText: {
        fontSize: 13,
    },
    appleButton: {
        width: '100%',
        height: 48,
    },
    googleButton: {
        width: '100%',
        height: 48,
        borderRadius: 8,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    googleIcon: {
        marginRight: 4,
    },
    googleText: {
        color: '#1F1F1F',
        fontSize: 16,
        fontWeight: '600',
    },
});
