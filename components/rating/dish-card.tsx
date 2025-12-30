import { Pressable, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import type { Dish } from '@/types/rating';

interface DishCardProps {
  dish: Dish;
  onPress: () => void;
}

export function DishCard({ dish, onPress }: DishCardProps) {
  const formatPrice = (price: number | null) => {
    if (price === null) return null;
    return `$${price.toFixed(2)}`;
  };

  const price = formatPrice(dish.current_price);
  const variety = dish.variety ? ` (${dish.variety})` : '';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && { opacity: 0.7 }]}
      android_ripple={{ color: 'rgba(0, 0, 0, 0.05)' }}
    >
      <ThemedView style={styles.card}>
        <ThemedView style={styles.header}>
          <ThemedText type="defaultSemiBold" style={styles.name}>
            {dish.name}{variety}
          </ThemedText>
          {price && (
            <ThemedText style={styles.price}>{price}</ThemedText>
          )}
        </ThemedView>

        <ThemedText style={styles.category} lightColor="#666" darkColor="#999">
          {dish.category}
        </ThemedText>

        {dish.dietary_tags.length > 0 && (
          <ThemedView style={styles.tags}>
            {dish.dietary_tags.map((tag) => (
              <ThemedView key={tag} style={styles.tag}>
                <ThemedText style={styles.tagText} lightColor="#666" darkColor="#999">
                  {tag}
                </ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
        )}

        {dish.description && (
          <ThemedText style={styles.description} lightColor="#666" darkColor="#999" numberOfLines={2}>
            {dish.description}
          </ThemedText>
        )}
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 16,
    flex: 1,
  },
  price: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  category: {
    fontSize: 14,
    marginBottom: 6,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  tagText: {
    fontSize: 12,
  },
  description: {
    fontSize: 14,
    marginTop: 4,
  },
});
