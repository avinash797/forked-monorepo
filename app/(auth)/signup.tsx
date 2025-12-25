import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/hooks/use-auth';
import { validateDisplayName, validateEmail, validatePassword } from '@/lib/validators';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function SignupScreen() {
  const router = useRouter();
  const { signup } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    // Validate
    const nameError = validateDisplayName(displayName);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (nameError || emailError || passwordError) {
      setErrors({
        displayName: nameError || '',
        email: emailError || '',
        password: passwordError || '',
      });
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      await signup(email, password, displayName);
      // Show success message
      // Alert.alert(
      //   'Success!',
      //   'Your account has been created. Please check your email to verify your account.',
      //   [
      //     {
      //       text: 'OK',
      //       onPress: () => router.back(),
      //     },
      //   ]
      // );
    } catch (error: any) {
      setErrors({ general: error.message || 'Failed to create account' });
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
            <ThemedText type="title">Create Account</ThemedText>
            <ThemedText style={styles.subtitle}>
              Sign up to get started
            </ThemedText>
          </View>

          <View style={styles.form}>
            <ThemedTextInput
              label="Display Name"
              placeholder="Your name"
              value={displayName}
              onChangeText={setDisplayName}
              autoComplete="name"
              error={errors.displayName}
            />

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
              placeholder="At least 8 characters"
              value={password}
              onChangeText={setPassword}
              showPasswordToggle
              autoCapitalize="none"
              autoComplete="password-new"
              error={errors.password}
            />

            {errors.general && (
              <ThemedText style={styles.generalError}>
                {errors.general}
              </ThemedText>
            )}

            <ThemedButton
              title="Sign Up"
              onPress={handleSignup}
              loading={isLoading}
              style={styles.signupButton}
            />

            <View style={styles.loginContainer}>
              <ThemedText>Already have an account? </ThemedText>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <ThemedText type="link">Login</ThemedText>
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
  signupButton: {
    marginBottom: 24,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
