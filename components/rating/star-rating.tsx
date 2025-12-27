import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  size?: number;
  readonly?: boolean;
  lightColor?: string;
  darkColor?: string;
}

export function StarRating({
  value,
  onChange,
  size = 32,
  readonly = false,
  lightColor,
  darkColor,
}: StarRatingProps) {
  const activeColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'primary'
  );
  const inactiveColor = useThemeColor({}, 'muted');

  const handlePress = (rating: number) => {
    if (!readonly) {
      onChange(rating);
    }
  };

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => handlePress(star)}
          disabled={readonly}
          activeOpacity={readonly ? 1 : 0.7}
          accessibilityLabel={`${star} star${star > 1 ? 's' : ''}`}
          accessibilityRole="button"
          accessibilityState={{ disabled: readonly }}
        >
          <IconSymbol
            name="star"
            size={size}
            color={star <= value ? activeColor : inactiveColor}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
});
