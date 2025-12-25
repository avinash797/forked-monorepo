import { useState } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { Link } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedButton } from '@/components/themed-button';
import { useAuth } from '@/hooks/use-auth';
import { validateEmail, validatePassword } from '@/lib/validators';

export default function LoginScreen() {
  const { login } = useAuth();

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
      setErrors({ general: error.message || 'Invalid email or password' });
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
            <ThemedText type="title">Welcome Back</ThemedText>
            <ThemedText style={styles.subtitle}>
              Sign in to continue
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

            <TouchableOpacity>
              <Link href="/(auth)/reset-password" asChild>
                <ThemedText type="link" style={styles.forgotPassword}>
                  Forgot Password?
                </ThemedText>
              </Link>
            </TouchableOpacity>

            <ThemedButton
              title="Login"
              onPress={handleLogin}
              loading={isLoading}
              style={styles.loginButton}
            />

            <View style={styles.signupContainer}>
              <ThemedText>Don't have an account? </ThemedText>
              <Link href="/(auth)/signup" asChild>
                <TouchableOpacity>
                  <ThemedText type="link">Sign Up</ThemedText>
                </TouchableOpacity>
              </Link>
            </View>
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
  },
  form: {
    width: '100%',
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
