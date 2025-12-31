import { EmptyState } from '@/components/browse/empty-state';
import { LeaderboardItem } from '@/components/browse/leaderboard-item';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/contexts/theme-provider';
import { useLeaderboard } from '@/hooks/use-leaderboard';
import type { LeaderboardItem as LeaderboardItemType } from '@/types/browse';
import { Stack, useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  FadeInDown
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaterialCommunityIcons } from '@expo/vector-icons';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList) as any;
const HEADER_HEIGHT = 100;

const DISH_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  burger: 'hamburger',
  pizza: 'pizza',
  coffee: 'coffee',
  tea: 'tea',
  dessert: 'cake-variant',
  icecream: 'ice-cream',
  drink: 'glass-cocktail',
  alcohol: 'glass-wine',
  beer: 'beer',
  taco: 'taco',
  burrito: 'taco', // Close enough
  noodle: 'noodles',
  ramen: 'noodles',
  pasta: 'pasta', // Check if valid, fallback to noodles if not, but 'noodles' is safe. 'pasta' exists in newer MCI? Let's check. Safer to stick to 'noodles' or 'food-variant' for pasta if unsure. Actually 'pasta' is in MCI.
  rice: 'rice',
  steak: 'food-steak', // 'food-steak' exists
  beef: 'cow',
  chicken: 'food-drumstick',
  fish: 'fish',
  seafood: 'fish',
  sushi: 'fish', // or 'food-variant'
  salad: 'leaf',
  vegan: 'leaf',
  vegetarian: 'leaf',
  bread: 'bread-slice',
  sandwich: 'food-outline', // generic food
  soup: 'pot-steam',
  curry: 'bowl-mix',
  asian: 'rice',
  mexican: 'taco',
  italian: 'pizza',
  breakfast: 'egg-fried',
};

function getDishIcon(name: string): keyof typeof MaterialCommunityIcons.glyphMap {
  const normalized = name.toLowerCase().trim();

  // Direct match
  if (DISH_ICONS[normalized]) {
    return DISH_ICONS[normalized];
  }

  // Partial match keys
  for (const key of Object.keys(DISH_ICONS)) {
    if (normalized.includes(key)) {
      return DISH_ICONS[key];
    }
  }

  return 'silverware-fork-knife';
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createThemedStyles(theme, insets), [theme, insets]);

  const {
    dishTypes,
    selectedDishTypeId,
    leaderboardItems,
    isLoadingDishTypes,
    isLoadingLeaderboard,
    error,
    selectDishType,
    refetch,
  } = useLeaderboard();


  const handleDishPress = (dishId: string, venueId: string) => {
    router.push({
      pathname: '/(protected)/(browse)/dish-detail',
      params: { dishId, venueId },
    });
  };

  if (isLoadingDishTypes) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.color.accent} />
          <ThemedText style={styles.loadingText}>Loading leaderboard...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <EmptyState
          icon="warning"
          title="Error Loading Leaderboard"
          message={error}
          actionLabel="Try Again"
          onActionPress={refetch}
        />
      </ThemedView>
    );
  }

  const renderLeaderboardItem: ListRenderItem<LeaderboardItemType> = ({ item, index }) => (
    <Animated.View
      entering={FadeInDown.delay(300 + index * 80).duration(500)}
    >
      <LeaderboardItem
        item={item}
        onPress={() => handleDishPress(item.dish.id, item.venue.id)}
      />
    </Animated.View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.listHeader}>
        <View style={styles.titleSection}>
          <ThemedText style={styles.mainTitle}>Rankings</ThemedText>
          <ThemedText style={styles.mainSubtitle}>The best dishes in the city</ThemedText>
        </View>

        {/* Dish Type Chip Selector */}
        <View style={styles.chipContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipScrollContent}
          >
            {dishTypes.map((dishType, index) => {
              const isSelected = dishType.id === selectedDishTypeId;
              return (
                <Animated.View
                  key={dishType.id}
                  entering={FadeInDown.delay(index * 50).duration(400)}
                >
                  <Animated.View
                    style={[
                      styles.chip,
                      isSelected && styles.chipSelected,
                      isSelected && styles.chipWrapperSelected
                    ]}
                  >
                    <Pressable
                      onPress={() => selectDishType(dishType.id)}
                      style={({ pressed }) => [
                        styles.chipPressable,
                        pressed && Platform.OS === 'ios' && { opacity: 0.7 }
                      ]}
                      android_ripple={{
                        color: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                        borderless: false,
                        foreground: true
                      }}
                    >
                      <MaterialCommunityIcons
                        name={getDishIcon(dishType.name)}
                        size={20}
                        color={isSelected ? theme.color.accentOn : theme.color.textSecondary}
                      />
                      <ThemedText
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}
                      >
                        {dishType.name}
                      </ThemedText>
                    </Pressable>
                  </Animated.View>
                </Animated.View>
              );
            })}
          </ScrollView>
        </View>
      </View>
      <AnimatedFlatList
        data={leaderboardItems}
        keyExtractor={(item: LeaderboardItemType) => item.dish.id}
        scrollEventThrottle={16}
        renderItem={renderLeaderboardItem}
        ListEmptyComponent={
          !isLoadingLeaderboard ? (
            <View style={styles.emptyContainer}>
              <EmptyState
                icon="restaurant"
                title="No Rankings Yet"
                message="This category doesn't have enough rated dishes yet (min 3)."
                actionLabel="Explore More"
                onActionPress={() => router.push('/(protected)/(tabs)')}
              />
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingLeaderboard}
            onRefresh={refetch}
            tintColor={theme.color.accent}
            progressViewOffset={insets.top + 20}
          />
        }
      />
      {isLoadingLeaderboard && leaderboardItems.length > 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={theme.color.accent} />
        </View>
      )}
    </ThemedView>
  );
}

const createThemedStyles = (
  theme: ReturnType<typeof useTheme>['theme'],
  insets: ReturnType<typeof useSafeAreaInsets>
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.color.bg,
    },
    headerContent: {
      alignItems: 'center',
      paddingHorizontal: theme.space.md,
    },
    stickyTitle: {
      fontSize: theme.font.size.lg,
      fontWeight: theme.font.weight.bold,
      color: theme.color.textPrimary,
    },
    listHeader: {
      paddingTop: insets.top + theme.space.xl,
      marginBottom: theme.space.sm,
    },
    titleSection: {
      paddingHorizontal: theme.space.md,
      marginBottom: theme.space.sm,
    },
    mainTitle: {
      fontSize: theme.font.size.xxl + 8,
      fontWeight: theme.font.weight.bold,
      color: theme.color.textPrimary,
      letterSpacing: -1,
      lineHeight: theme.font.size.xxl + 8 + 4,
    },
    mainSubtitle: {
      fontSize: theme.font.size.md,
      color: theme.color.textSecondary,
      marginTop: 4,
      lineHeight: theme.font.size.md + 4,
    },
    chipContainer: {
      marginTop: theme.space.sm,
    },
    chipScrollContent: {
      paddingHorizontal: theme.space.md,
    },
    chip: {
      borderRadius: theme.radius.pill,
      backgroundColor: theme.color.surface,
      borderWidth: 1.5,
      borderColor: theme.color.border,
      marginRight: theme.space.xs,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
      overflow: 'hidden',
    },
    chipPressable: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.space.md,
      paddingVertical: theme.space.sm - 2,
      gap: theme.space.xs,
    },
    chipWrapperSelected: {
      transform: [{ scale: 1.05 }],
      zIndex: 1,
    },
    chipSelected: {
      backgroundColor: theme.color.accent,
      borderColor: theme.color.accent,
      shadowColor: theme.color.accent,
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    chipText: {
      fontSize: theme.font.size.md,
      fontWeight: theme.font.weight.semibold,
      color: theme.color.textPrimary,
    },
    chipTextSelected: {
      color: theme.color.accentOn,
    },

    listContent: {
      paddingHorizontal: theme.space.md,
      paddingBottom: insets.bottom + theme.space.xl,
      paddingTop: theme.space.xl,
    },
    emptyContainer: {
      paddingTop: 80,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: theme.space.md,
    },
    loadingText: {
      fontSize: theme.font.size.md,
      color: theme.color.textSecondary,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 50,
    },
  });
