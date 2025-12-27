import { IconSymbol } from "@/components/ui/icon-symbol";
import { useThemeColor } from "@/hooks/use-theme-color";
import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";
import { StyleSheet, View } from "react-native";

export function CenterTabButton(props: BottomTabBarButtonProps) {
  const primaryColor = useThemeColor({}, "primary");
  const backgroundColor = useThemeColor({}, "background");

  return (
    <View style={styles.container}>
      <PlatformPressable
        {...props}
        style={[styles.button, { backgroundColor: primaryColor }]}
        onPressIn={(ev) => {
          if (process.env.EXPO_OS === "ios") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          props.onPressIn?.(ev);
        }}
      >
        <View style={[styles.innerButton, { backgroundColor: primaryColor }]}>
          <IconSymbol name="add" size={32} color="#fff" />
        </View>
      </PlatformPressable>
      {/* Spacer to push other tabs to the side */}
      <View style={[styles.spacer, { backgroundColor: "transparent" }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  button: {
    position: "absolute",
    top: -20,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: "#fff",
  },
  innerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  spacer: {
    width: 64,
    height: 1,
  },
});
