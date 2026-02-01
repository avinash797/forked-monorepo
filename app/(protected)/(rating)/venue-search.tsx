import { SearchInput } from '@/components/rating/search-input';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { GooglePlaceSuggestion } from '@/hooks/use-address-search';
import { SearchResultItem, useVenueSearch } from '@/hooks/use-venue-search';
import { Database } from '@/types/database.types';
import { Stack, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];

export default function VenueSearchScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);

    const {
        searchQuery,
        setSearchQuery,
        combinedResults,
        nearbyRestaurants,
        isSearching,
        isSelecting,
        selectRestaurant,
        selectGooglePlace,
        hasEmptyResults,
    } = useVenueSearch();

    const iconColor = theme.color.textTertiary;

    const handleRestaurantSelect = useCallback(
        (restaurant: Restaurant) => {
            selectRestaurant(restaurant);
            router.push('/(protected)/(rating)/dish-selection');
        },
        [selectRestaurant, router]
    );

    const handleAddressSelect = useCallback(
        async (suggestion: GooglePlaceSuggestion) => {
            try {
                await selectGooglePlace(suggestion);
                router.push('/(protected)/(rating)/dish-selection');
            } catch (err) {
                Alert.alert(
                    'Error',
                    'Could not select this restaurant. Please try again.'
                );
            }
        },
        [selectGooglePlace, router]
    );

    const handleCreateRestaurant = () => {
        router.push('/(protected)/(rating)/create-venue');
    };

    const renderItem = useCallback(
        ({ item }: { item: SearchResultItem }) => {
            if (item.type === 'restaurant') {
                return (
                    <Pressable
                        style={({ pressed }) => [
                            styles.restaurantItem,
                            pressed && styles.restaurantItemPressed,
                        ]}
                        onPress={() => handleRestaurantSelect(item.data)}
                    >
                        <View style={styles.restaurantContent}>
                            <ThemedText
                                style={styles.restaurantName}
                                numberOfLines={1}
                            >
                                {item.data.name}
                            </ThemedText>
                            {item.data.address && (
                                <ThemedText
                                    style={styles.restaurantAddress}
                                    numberOfLines={1}
                                >
                                    {item.data.address}
                                </ThemedText>
                            )}
                        </View>
                        <IconSymbol
                            name="chevron-forward"
                            size={20}
                            color={iconColor}
                        />
                    </Pressable>
                );
            } else {
                // Google Place Suggestion
                const { structuredFormat } = item.data.placePrediction;
                const mainText = structuredFormat.mainText.text;
                const secondaryText = structuredFormat.secondaryText?.text;

                return (
                    <Pressable
                        style={({ pressed }) => [
                            styles.mapboxItem,
                            pressed && styles.mapboxItemPressed,
                        ]}
                        onPress={() => handleAddressSelect(item.data)}
                    >
                        <View style={styles.mapboxContent}>
                            <ThemedText
                                style={styles.mapboxName}
                                numberOfLines={1}
                            >
                                {mainText}
                            </ThemedText>
                            {secondaryText && (
                                <ThemedText
                                    style={styles.mapboxAddress}
                                    numberOfLines={1}
                                >
                                    {secondaryText}
                                </ThemedText>
                            )}
                            <ThemedText style={styles.mapboxMeta}>
                                Google Place
                            </ThemedText>
                        </View>
                        <IconSymbol
                            name="chevron-forward"
                            size={20}
                            color={iconColor}
                        />
                    </Pressable>
                );
            }
        },
        [styles, iconColor, handleRestaurantSelect, handleAddressSelect]
    );

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Find Restaurant',
                    headerBackTitle: 'Back',
                }}
            />
            <ThemedView style={styles.container}>
                <SearchInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search for a restaurant..."
                    isLoading={isSearching || isSelecting}
                />

                {!searchQuery && nearbyRestaurants.length > 0 && (
                    <View style={styles.listContent}>
                        <ThemedText style={styles.emptyHint}>
                            Nearby Restaurants
                        </ThemedText>
                    </View>
                )}

                {combinedResults.length > 0 && (
                    <FlatList
                        data={combinedResults}
                        keyExtractor={(item) =>
                            item.type === 'restaurant'
                                ? `restaurant-${item.data.id}`
                                : `google-${item.data.placePrediction.placeId}`
                        }
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    />
                )}

                {hasEmptyResults && (
                    <ThemedView style={styles.emptyState}>
                        <ThemedText style={styles.emptyText}>
                            No results found for "{searchQuery}"
                        </ThemedText>
                        <ThemedButton
                            variant="secondary"
                            onPress={handleCreateRestaurant}
                            style={styles.createButton}
                        >
                            Manually Add Restaurant
                        </ThemedButton>
                    </ThemedView>
                )}
            </ThemedView>
        </>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        container: {
            flex: 1,
            padding: theme.space.md,
            backgroundColor: theme.color.bg,
        },
        listContent: {
            paddingVertical: theme.space.md,
            gap: theme.space.sm,
        },
        emptyState: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: theme.space.xl,
            gap: theme.space.sm,
        },
        emptyText: {
            fontSize: theme.font.size.lg,
            fontWeight: '600',
            color: theme.color.textPrimary,
            textAlign: 'center',
        },
        emptyHint: {
            fontSize: theme.font.size.md,
            color: theme.color.textSecondary,
            textAlign: 'center',
        },
        createButton: {
            marginTop: theme.space.md,
        },
        restaurantItem: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: theme.space.md,
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: theme.color.border,
        },
        restaurantItemPressed: {
            backgroundColor: theme.color.surface2,
        },
        restaurantContent: {
            flex: 1,
        },
        restaurantName: {
            fontSize: theme.font.size.md,
            fontWeight: '600',
            color: theme.color.textPrimary,
        },
        restaurantAddress: {
            fontSize: theme.font.size.sm,
            color: theme.color.textSecondary,
            marginTop: 2,
        },
        mapboxItem: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: theme.space.md,
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: theme.color.accent,
            borderStyle: 'dashed',
        },
        mapboxItemPressed: {
            backgroundColor: theme.color.surface2,
        },
        mapboxIcon: {
            marginRight: theme.space.sm,
        },
        mapboxContent: {
            flex: 1,
        },
        mapboxName: {
            fontSize: theme.font.size.md,
            fontWeight: '600',
            color: theme.color.textPrimary,
        },
        mapboxAddress: {
            fontSize: theme.font.size.sm,
            color: theme.color.textSecondary,
            marginTop: 2,
        },
        mapboxMeta: {
            fontSize: theme.font.size.xs,
            color: theme.color.accent,
            fontWeight: '600',
            marginTop: 4,
        },
    });
