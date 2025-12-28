import ForkedBrandingHeader from "@/components/forked-branding-header";
import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/contexts/theme-provider";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { ImageBackground, StyleSheet, View } from "react-native";

export default function OnboardingScreen() {
  const { theme } = useTheme();

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
          {/* Logo/Brand Section */}
          <ForkedBrandingHeader />

          {/* Content Section */}
          <View style={styles.content}>
            <View style={styles.textContainer}>
              <ThemedText style={styles.tagline}>
                Fork the restaurant.
              </ThemedText>
              <ThemedText style={styles.tagline}>Rate the dish.</ThemedText>
              <ThemedText style={styles.subtitle}>
                Discover restaurants, share your reviews, and help build the
                ultimate community-driven food guide.
              </ThemedText>
            </View>
          </View>

          {/* Buttons Section */}
          <View style={styles.buttonContainer}>
            <Link href="/(auth)/login" asChild>
              <ThemedButton
                style={[
                  styles.signInButton,
                ]}
              >
                Sign in
              </ThemedButton>
            </Link>
            <Link href="/(auth)/signup" asChild>
              <ThemedButton variant="secondary" style={styles.signUpButton}>
                Sign up
              </ThemedButton>
            </Link>
          </View>
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
    padding: 24,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 36,
    alignItems: "center",
  },
  textContainer: {
    alignItems: "center",
  },
  tagline: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.85)",
    textAlign: "center",
    marginTop: 20,
    lineHeight: 24,
    paddingHorizontal: 30,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 40,
  },
  signInButton: {
    // backgroundColor applied via theme in component
  },
  signUpButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
});
