import { useThemeColor } from "@/hooks/use-theme-color";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { ThemedText } from "./themed-text";
import { IconSymbol } from "./ui/icon-symbol";

export type SelectOption = {
  readonly label: string;
  readonly value: string;
};

export type ThemedSelectProps = {
  lightColor?: string;
  darkColor?: string;
  lightLabelColor?: string;
  darkLabelColor?: string;
  error?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  options: readonly SelectOption[];
  onValueChange?: (value: string) => void;
  style?: StyleProp<ViewStyle>;
};

export function ThemedSelect({
  style,
  lightColor,
  darkColor,
  lightLabelColor,
  darkLabelColor,
  error,
  label,
  placeholder = "Select an option",
  value,
  options,
  onValueChange,
}: ThemedSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "input"
  ) as string;
  const textColor = useThemeColor({}, "text") as string;
  const errorColor = useThemeColor({}, "error") as string;
  const mutedColor = useThemeColor({}, "muted") as string;
  const surfaceColor = useThemeColor({}, "surface") as string;
  const borderColor = error ? errorColor : "transparent";

  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption?.label || placeholder;

  const handleSelect = (optionValue: string) => {
    onValueChange?.(optionValue);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      {label && (
        <ThemedText
          lightColor={lightLabelColor}
          darkColor={darkLabelColor}
          style={styles.label}
        >
          {label}
        </ThemedText>
      )}
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        style={[
          styles.selectButton,
          { backgroundColor, borderColor },
          style,
        ]}
      >
        <ThemedText
          style={[
            styles.selectText,
            !selectedOption && { color: mutedColor },
          ]}
        >
          {displayText}
        </ThemedText>
        <IconSymbol
          name="arrow-drop-down"
          size={20}
          color={mutedColor}
        />
      </TouchableOpacity>
      {error && (
        <ThemedText
          lightColor={lightLabelColor}
          darkColor={darkLabelColor}
          style={[styles.error, { color: errorColor }]}
        >
          {error}
        </ThemedText>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsOpen(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: surfaceColor },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                {label || "Select an option"}
              </ThemedText>
              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <IconSymbol name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.optionsList}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    option.value === value && {
                      backgroundColor,
                    },
                  ]}
                  onPress={() => handleSelect(option.value)}
                >
                  <ThemedText style={styles.optionText}>
                    {option.label}
                  </ThemedText>
                  {option.value === value && (
                    <IconSymbol
                      name="check"
                      size={20}
                      color={textColor}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  selectButton: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: {
    fontSize: 16,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    borderRadius: 12,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  optionsList: {
    maxHeight: 400,
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  optionText: {
    fontSize: 16,
  },
});
