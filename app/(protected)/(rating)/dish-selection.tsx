import { DishCard } from "@/components/rating/dish-card";
import { ThemedButton } from "@/components/themed-button";
import { ThemedSelect } from "@/components/themed-select";
import { ThemedText } from "@/components/themed-text";
import { ThemedTextInput } from "@/components/themed-text-input";
import { ThemedView } from "@/components/themed-view";
import { useRatingFlow } from "@/contexts/rating-flow-context";
import { useCreateDish, useDishTypes, useVenueDishes } from "@/hooks/use-dishes";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FlatList, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { z } from "zod";

const dishFormSchema = z.object({
  name: z.string().min(1, "Dish name is required"),
  category: z.string().min(1, "Category is required"),
  dish_type_id: z.string().min(1, "Dish type is required"),
  variety: z.string().optional(),
  current_price: z.string().optional().refine(
    (val) => {
      if (!val || val === "") return true;
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0;
    },
    { message: "Price must be a valid number" }
  ),
  description: z.string().optional(),
  dietary_tags: z.string().optional(),
  spice_level: z.string().refine(
    (val) => {
      if (!val || val === "") return true;
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 0 && num <= 5;
    },
    { message: "Spice level must be between 0 and 5" }
  ),
});

type DishFormData = z.infer<typeof dishFormSchema>;

export default function DishSelectionScreen() {
  const router = useRouter();
  const { state, setDish } = useRatingFlow();
  const { dishes, isLoading, error } = useVenueDishes(
    state.selectedVenue?.id ?? null
  );
  const { dishTypes, isLoading: isDishTypesLoading } = useDishTypes();
  const { createDish, isLoading: isCreating } = useCreateDish();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DishFormData>({
    resolver: zodResolver(dishFormSchema),
    defaultValues: {
      name: "",
      category: "",
      dish_type_id: "",
      variety: "",
      current_price: "",
      description: "",
      dietary_tags: "",
      spice_level: "0",
    },
  });

  useEffect(() => {
    if (!state.selectedVenue) {
      router.back();
    }
  }, [state.selectedVenue, router]);

  if (!state.selectedVenue) return null;

  const handleDishSelect = (dish: any) => {
    setDish(dish);
    router.push("/(protected)/(rating)/rating");
  };

  const onSubmit = async (data: DishFormData) => {
    const dietaryTags = data.dietary_tags
      ? data.dietary_tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
      : [];

    const price =
      data.current_price && data.current_price !== ""
        ? parseFloat(data.current_price)
        : null;

    const spiceLevel =
      data.spice_level && data.spice_level !== ""
        ? parseInt(data.spice_level, 10)
        : 0;

    const dish = await createDish({
      venue_id: state.selectedVenue!.id,
      name: data.name.trim(),
      category: data.category.trim(),
      dish_type_id: data.dish_type_id,
      variety: data.variety?.trim() || null,
      current_price: price,
      description: data.description?.trim() || null,
      dietary_tags: dietaryTags,
      spice_level: spiceLevel,
    });

    if (dish) {
      setDish(dish);
      router.push("/(protected)/(rating)/rating");
    }
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
                    onPress={() => {
                      reset();
                      setShowAddForm(true);
                    }}
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
                    scrollEnabled={false}
                  />

                  <ThemedButton
                    variant="secondary"
                    onPress={() => {
                      reset();
                      setShowAddForm(true);
                    }}
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

              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <ThemedTextInput
                    label="Dish Name"
                    value={value}
                    onChangeText={onChange}
                    placeholder="e.g., Margherita Pizza"
                    error={errors.name?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="category"
                render={({ field: { onChange, value } }) => (
                  <ThemedTextInput
                    label="Category"
                    value={value}
                    onChangeText={onChange}
                    placeholder="e.g., Appetizer, Main Course, Dessert, etc."
                    error={errors.category?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="dish_type_id"
                render={({ field: { onChange, value } }) => (
                  <ThemedSelect
                    label="Dish Type"
                    value={value}
                    onValueChange={onChange}
                    options={dishTypes.map((dt) => ({
                      label: dt.name,
                      value: dt.id,
                    }))}
                    placeholder={isDishTypesLoading ? "Loading..." : "Select a dish type"}
                    error={errors.dish_type_id?.message}
                    searchable
                    searchPlaceholder="Search dish types..."
                  />
                )}
              />

              <TouchableOpacity
                onPress={() => setShowAdvanced(!showAdvanced)}
                style={styles.advancedToggle}
              >
                <ThemedText type="defaultSemiBold" style={styles.advancedToggleText}>
                  {showAdvanced
                    ? "Hide Optional Details"
                    : "Show Optional Details (Price, Description, etc.)"}
                </ThemedText>
              </TouchableOpacity>

              {showAdvanced && (
                <>
                  <Controller
                    control={control}
                    name="variety"
                    render={({ field: { onChange, value } }) => (
                      <ThemedTextInput
                        label="Variety (optional)"
                        value={value}
                        onChangeText={onChange}
                        placeholder="e.g., Large, Extra Cheese"
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="current_price"
                    render={({ field: { onChange, value } }) => (
                      <ThemedTextInput
                        label="Price (optional)"
                        value={value}
                        onChangeText={onChange}
                        placeholder="12.99"
                        keyboardType="decimal-pad"
                        error={errors.current_price?.message}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="description"
                    render={({ field: { onChange, value } }) => (
                      <ThemedTextInput
                        label="Description (optional)"
                        value={value}
                        onChangeText={onChange}
                        placeholder="Brief description of the dish"
                        multiline
                        numberOfLines={3}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="dietary_tags"
                    render={({ field: { onChange, value } }) => (
                      <ThemedTextInput
                        label="Dietary Tags (comma-separated, optional)"
                        value={value}
                        onChangeText={onChange}
                        placeholder="Vegetarian, Vegan, Gluten-Free"
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="spice_level"
                    render={({ field: { onChange, value } }) => (
                      <ThemedTextInput
                        label="Spice Level (0-5)"
                        value={value}
                        onChangeText={onChange}
                        placeholder="0"
                        keyboardType="numeric"
                        error={errors.spice_level?.message}
                      />
                    )}
                  />
                </>
              )}

              <ThemedButton
                onPress={handleSubmit(onSubmit)}
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
    alignItems: "center",
  },
  advancedToggleText: {
    color: "#0a7ea4",
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },
});
