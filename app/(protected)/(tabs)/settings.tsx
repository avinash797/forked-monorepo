import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

export default function SettingsScreen() {
  const { logout, user, profile } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            await logout();
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to logout");
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText type="title">Settings</ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Account
          </ThemedText>

          <View style={styles.infoContainer}>
            <ThemedText style={styles.label}>Display Name</ThemedText>
            <ThemedText style={styles.value}>
              {profile?.display_name || "Not set"}
            </ThemedText>
          </View>

          <View style={styles.infoContainer}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <ThemedText style={styles.value}>{user?.email}</ThemedText>
          </View>

          {profile?.username && (
            <View style={styles.infoContainer}>
              <ThemedText style={styles.label}>Username</ThemedText>
              <ThemedText style={styles.value}>@{profile.username}</ThemedText>
            </View>
          )}

          {profile?.location && (
            <View style={styles.infoContainer}>
              <ThemedText style={styles.label}>Location</ThemedText>
              <ThemedText style={styles.value}>{profile.location}</ThemedText>
            </View>
          )}

          <View style={styles.infoContainer}>
            <ThemedText style={styles.label}>Reputation Score</ThemedText>
            <ThemedText style={styles.value}>
              {profile?.reputation_score || 0}
            </ThemedText>
          </View>

          <View style={styles.infoContainer}>
            <ThemedText style={styles.label}>Charms Earned</ThemedText>
            <ThemedText style={styles.value}>
              {profile?.charms?.length || 0}
            </ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Verification Status
          </ThemedText>

          <View style={styles.infoContainer}>
            <ThemedText style={styles.label}>Email Verified</ThemedText>
            <ThemedText
              style={[
                styles.value,
                profile?.email_verified ? styles.verified : styles.unverified,
              ]}
            >
              {profile?.email_verified ? "✓ Verified" : "✗ Not Verified"}
            </ThemedText>
          </View>

          <View style={styles.infoContainer}>
            <ThemedText style={styles.label}>Phone Verified</ThemedText>
            <ThemedText
              style={[
                styles.value,
                profile?.phone_verified ? styles.verified : styles.unverified,
              ]}
            >
              {profile?.phone_verified ? "✓ Verified" : "✗ Not Verified"}
            </ThemedText>
          </View>
        </View>

        <View style={styles.logoutSection}>
          <ThemedButton
            onPress={handleLogout}
            loading={isLoggingOut}
            variant="secondary"
          >
            Logout
          </ThemedButton>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  infoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  label: {
    fontSize: 16,
    opacity: 0.7,
  },
  value: {
    fontSize: 16,
    fontWeight: "500",
  },
  verified: {
    color: "#10B981",
  },
  unverified: {
    opacity: 0.5,
  },
  logoutSection: {
    marginTop: 16,
    marginBottom: 32,
  },
});
