import { useTheme } from '@/contexts/theme-provider';
import { buildComponentStyles } from '@/lib/theme/componentStyles';
import type { Dish } from '@/types/rating';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface DishCardProps {
  dish: Dish;
  onPress: () => void;
}

export function DishCard({ dish, onPress }: DishCardProps) {
  const formatPrice = (price: number | null) => {
    if (price === null) return null;
    return `$${price.toFixed(2)}`;
  };
  const { theme } = useTheme();
  const builtStyles = buildComponentStyles(theme);
  const styles = createThemedStyles(theme);


  const price = formatPrice(dish.current_price);
  const variety = dish.variety ? ` (${dish.variety})` : '';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && { opacity: 0.7 }]}
      android_ripple={{ color: 'rgba(0, 0, 0, 0.05)' }}
    >
      <View style={builtStyles.card}>
        <View style={styles.header}>
          <Text style={builtStyles.h3}>
            {dish.name}{variety}
          </Text>
          {price && (
            <Text style={builtStyles.body}>{price}</Text>
          )}
        </View>

        <Text style={builtStyles.caption}>
          {dish.category}
        </Text>

        {dish.dietary_tags.length > 0 && (
          <View style={styles.tags}>
            {dish.dietary_tags.map((tag) => (
              <View key={tag} style={builtStyles.badge}>
                <Text style={builtStyles.badgeText}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}

        {dish.description && (
          <Text style={builtStyles.caption} numberOfLines={2}>
            {dish.description}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.space.xs,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.xxs,
    marginBottom: theme.space.xxs,
  },
});
