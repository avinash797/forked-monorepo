import ForkedBrandingHeader from "@/components/forked-branding-header";
import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedTextInput } from "@/components/themed-text-input";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { useThemeColor } from "@/hooks/use-theme-color";
import { validateEmail, validatePassword } from "@/lib/validators";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { useState } from "react";
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    // Validate
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setErrors({
        email: emailError || "",
        password: passwordError || "",
      });
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      await login(email, password);
      // Router will automatically navigate to (tabs) due to conditional rendering
    } catch (error: any) {
      setErrors({ general: error.message || "Invalid email or password" });
    } finally {
      setIsLoading(false);
    }
  };

  const backgroundColor = useThemeColor(
    { light: Colors.dark.background },
    "background"
  ) as string;

  return (
    <ImageBackground
      source={require("@/assets/images/auth/auth-bg.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <LinearGradient
        colors={["rgba(0,0,0,0.4)", "rgba(0,0,0,0.7)"]}
        style={styles.gradient}
      >
        <View style={styles.container}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.header}>
                <ForkedBrandingHeader style={{ marginVertical: 20 }} />
                <ThemedText lightColor="#FFFFFF" type="title">
                  Welcome to Forked
                </ThemedText>
                <ThemedText lightColor="#FFFFFF" style={styles.subtitle}>
                  Sign in to continue making your dining experience better
                </ThemedText>
              </View>

              <LinearGradient
                colors={[
                  "rgba(0,0,0,0.5)",
                  "rgba(0,0,0,0.6)",
                  "rgba(0,0,0,0.8)",
                  backgroundColor,
                ]}
                style={styles.form}
              >
                <ThemedTextInput
                  label="Email"
                  placeholder="your@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  error={errors.email}
                  lightLabelColor="#FFFFFF"
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
                  lightLabelColor="#FFFFFF"
                />

                {errors.general && (
                  <ThemedText lightColor="#FFFFFF" style={styles.generalError}>
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
                  onPress={handleLogin}
                  loading={isLoading}
                  style={styles.loginButton}
                >
                  Login
                </ThemedButton>

                <View style={styles.signupContainer}>
                  <ThemedText lightColor="#FFFFFF">
                    Don&apos;t have an account?{" "}
                  </ThemedText>
                  <Link href="/(auth)/signup" asChild>
                    <TouchableOpacity>
                      <ThemedText type="link">Sign Up</ThemedText>
                    </TouchableOpacity>
                  </Link>
                </View>
              </LinearGradient>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingTop: 24,
  },
  header: {
    alignItems: "center",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
  },
  form: {
    width: "100%",
    padding: 24,
    paddingBottom: 48,
  },
  generalError: {
    marginBottom: 16,
    textAlign: "center",
  },
  forgotPassword: {
    textAlign: "right",
    marginBottom: 24,
  },
  loginButton: {
    marginBottom: 24,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});
