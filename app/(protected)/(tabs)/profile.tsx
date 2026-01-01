import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTheme } from "@/contexts/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "expo-router";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { user, profile } = useAuth();
  const { theme } = useTheme();

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName =
    profile?.display_name ||
    user?.display_name ||
    user?.email?.split("@")[0] ||
    "User";
  const avatarUrl = profile?.avatar_url || user?.avatar_url;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          <Link href="/(protected)/settings" asChild>
            <Pressable style={styles.settingsButton}>
              <IconSymbol
                name="settings"
                size={28}
                color={theme.color.textPrimary}
              />
            </Pressable>
          </Link>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <ThemedView
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: theme.color.surface },
                ]}
              >
                <ThemedText style={styles.avatarInitials}>
                  {getInitials(displayName)}
                </ThemedText>
              </ThemedView>
            )}
          </View>

          <ThemedText type="title" style={styles.name}>
            {displayName}
          </ThemedText>

          <View style={styles.charmsSection}>
            <ThemedText type="subtitle" style={styles.charmsTitle}>
              Charms Earned
            </ThemedText>
            <View style={styles.charmsContainer}>
              {profile?.charms && profile.charms.length > 0 ? (
                profile.charms.map((charm, index) => (
                  <View
                    key={index}
                    style={[
                      styles.charmBadge,
                      { backgroundColor: theme.color.surface },
                    ]}
                  >
                    <IconSymbol
                      name="emoji-events"
                      size={24}
                      color={theme.color.accent}
                    />
                  </View>
                ))
              ) : (
                <ThemedText style={styles.noCharmsText}>
                  No charms yet
                </ThemedText>
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  settingsButton: {
    padding: 8,
    marginRight: -8, // Align icon visually with the edge
  },
  profileSection: {
    flex: 1,
    alignItems: "center",
    paddingTop: 16,
    paddingHorizontal: 24,
  },
  avatarContainer: {
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.1)",
  },
  avatarInitials: {
    fontSize: 40,
    fontWeight: "bold",
  },
  name: {
    marginBottom: 48,
    textAlign: "center",
    fontSize: 28,
  },
  charmsSection: {
    width: "100%",
  },
  charmsTitle: {
    marginBottom: 16,
    opacity: 0.8,
  },
  charmsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  charmBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  noCharmsText: {
    opacity: 0.5,
    fontStyle: "italic",
    marginTop: 8,
  },
});

