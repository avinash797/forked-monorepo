import { DishCard } from "@/components/rating/dish-card";
import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedTextInput } from "@/components/themed-text-input";
import { ThemedView } from "@/components/themed-view";
import { useRatingFlow } from "@/contexts/rating-flow-context";
import { useCreateDish, useVenueDishes } from "@/hooks/use-dishes";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity } from "react-native";

export default function DishSelectionScreen() {
  const router = useRouter();
  const { state, setDish } = useRatingFlow();
  const { dishes, isLoading, error } = useVenueDishes(
    state.selectedVenue?.id ?? null
  );
  const { createDish, isLoading: isCreating } = useCreateDish();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [newDish, setNewDish] = useState({
    name: "",
    category: "",
    variety: "",
    current_price: "",
    description: "",
    dietary_tags: "",
    spice_level: "0",
  });

  if (!state.selectedVenue) {
    router.back();
    return null;
  }

  const handleDishSelect = (dish: any) => {
    setDish(dish);
    router.push("/(rating)/rating");
  };

  const handleCreateDish = async () => {
    if (!newDish.name.trim() || !newDish.category.trim()) {
      Alert.alert("Validation Error", "Dish name and category are required");
      return;
    }

    const dietaryTags = newDish.dietary_tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const price = newDish.current_price
      ? parseFloat(newDish.current_price)
      : null;

    const spiceLevel = parseInt(newDish.spice_level, 10);
    if (spiceLevel < 0 || spiceLevel > 5) {
      Alert.alert("Validation Error", "Spice level must be between 0 and 5");
      return;
    }

    createDish({
      venue_id: state.selectedVenue!.id,
      name: newDish.name.trim(),
      category: newDish.category.trim(),
      variety: newDish.variety.trim() || null,
      current_price: price,
      description: newDish.description.trim() || null,
      dietary_tags: dietaryTags,
      spice_level: spiceLevel,
    }).then((dish) => {
      if (dish) {
        setDish(dish);
        router.push("/(rating)/rating");
      }
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={100} // Adjust based on header height
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <ThemedView style={styles.container}>
          <ThemedText style={styles.venueText} lightColor="#666" darkColor="#999">
            At {state.selectedVenue.name}
          </ThemedText>

          {!showAddForm && (
            <>
              {isLoading && (
                <ThemedText style={styles.loadingText}>
                  Loading dishes...
                </ThemedText>
              )}

              {!isLoading && dishes.length === 0 && (
                <ThemedView style={styles.emptyState}>
                  <ThemedText
                    style={styles.emptyText}
                    lightColor="#666"
                    darkColor="#999"
                  >
                    No dishes found for this venue
                  </ThemedText>
                  <ThemedButton
                    variant="secondary"
                    onPress={() => setShowAddForm(true)}
                    style={styles.addButton}
                  >
                    Add a New Dish
                  </ThemedButton>
                </ThemedView>
              )}

              {dishes.length > 0 && (
                <>
                  <FlatList
                    data={dishes}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <DishCard
                        dish={item}
                        onPress={() => handleDishSelect(item)}
                      />
                    )}
                    contentContainerStyle={styles.listContent}
                    scrollEnabled={false} // Nested FlatList in ScrollView needs this disabled or formatted differently, but here dishes list is conditional. 
                  // Wait, if I wrap everything in ScrollView, FlatList inside is bad practice unless list is small. 
                  // The original code had ScrollView wrapping everything.
                  // The 'dishes' view has a FlatList. 
                  // Ideally we shouldn't nest FlatList in ScrollView.
                  // But I will stick to wrapping the existing structure for now to minimize refactor risk, 
                  // assuming the list isn't huge or the user is fine with it (it was already there).
                  />

                  <ThemedButton
                    variant="secondary"
                    onPress={() => setShowAddForm(true)}
                    style={styles.bottomButton}
                  >
                    Add a New Dish
                  </ThemedButton>
                </>
              )}

              {error && (
                <ThemedText
                  style={styles.errorText}
                  lightColor="#f44336"
                  darkColor="#ff6b6b"
                >
                  {error}
                </ThemedText>
              )}
            </>
          )}

          {showAddForm && (

            <ThemedView style={styles.form}>
              <ThemedText style={styles.formTitle}>Add New Dish</ThemedText>

              <ThemedTextInput
                label="Dish Name"
                value={newDish.name}
                onChangeText={(value) =>
                  setNewDish((prev) => ({ ...prev, name: value }))
                }
                placeholder="e.g., Margherita Pizza"
              />

              <ThemedTextInput
                label="Category"
                value={newDish.category}
                onChangeText={(value) =>
                  setNewDish((prev) => ({ ...prev, category: value }))
                }
                placeholder="e.g., Pizza, Pasta, Burger"
              />

              {newDish.name.length > 0 && newDish.category.length > 0 && (
                <TouchableOpacity onPress={() => setShowAdvanced(!showAdvanced)} style={styles.advancedToggle}>
                  <ThemedText type="defaultSemiBold" style={styles.advancedToggleText}>
                    {showAdvanced ? "Hide Optional Details" : "Show Optional Details (Price, Description, etc.)"}
                  </ThemedText>
                </TouchableOpacity>
              )}

              {showAdvanced && (
                <>
                  <ThemedTextInput
                    label="Variety (optional)"
                    value={newDish.variety}
                    onChangeText={(value) =>
                      setNewDish((prev) => ({ ...prev, variety: value }))
                    }
                    placeholder="e.g., Large, Extra Cheese"
                  />

                  <ThemedTextInput
                    label="Price (optional)"
                    value={newDish.current_price}
                    onChangeText={(value) =>
                      setNewDish((prev) => ({ ...prev, current_price: value }))
                    }
                    placeholder="12.99"
                    keyboardType="decimal-pad"
                  />

                  <ThemedTextInput
                    label="Description (optional)"
                    value={newDish.description}
                    onChangeText={(value) =>
                      setNewDish((prev) => ({ ...prev, description: value }))
                    }
                    placeholder="Brief description of the dish"
                    multiline
                    numberOfLines={3}
                  />

                  <ThemedTextInput
                    label="Dietary Tags (comma-separated, optional)"
                    value={newDish.dietary_tags}
                    onChangeText={(value) =>
                      setNewDish((prev) => ({ ...prev, dietary_tags: value }))
                    }
                    placeholder="Vegetarian, Vegan, Gluten-Free"
                  />

                  <ThemedTextInput
                    label="Spice Level (0-5)"
                    value={newDish.spice_level}
                    onChangeText={(value) =>
                      setNewDish((prev) => ({ ...prev, spice_level: value }))
                    }
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </>
              )}

              <ThemedButton
                onPress={handleCreateDish}
                loading={isCreating}
                style={styles.createButton}
              >
                Create & Rate Dish
              </ThemedButton>

              <ThemedButton
                variant="secondary"
                onPress={() => setShowAddForm(false)}
                style={styles.cancelButton}
              >
                Cancel
              </ThemedButton>
            </ThemedView>
          )}
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  venueText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  loadingText: {
    textAlign: "center",
    marginTop: 32,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  addButton: {
    marginTop: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  bottomButton: {
    marginTop: 16,
  },
  form: {
    flex: 1,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  createButton: {
    marginTop: 24,
  },
  cancelButton: {
    marginTop: 12,
    marginBottom: 32,
  },
  advancedToggle: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  advancedToggleText: {
    color: '#0a7ea4',
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },
});
