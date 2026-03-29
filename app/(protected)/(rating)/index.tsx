import { SearchInput } from '@/components/rating/search-input';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { GooglePlaceSuggestion } from '@/hooks/use-address-search';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { SearchResultItem, useVenueSearch } from '@/hooks/use-venue-search';
import { Database } from '@/types/database.types';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];

export default function VenueSearchScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const isOnline = useOnlineStatus();
    const styles = createThemedStyles(theme);

    const {
        searchQuery,
        setSearchQuery,
        combinedResults,
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
            const isRestaurant = item.type === 'restaurant';

            let name: string;
            let address: string | undefined;
            let handlePress: () => void;
            let distance: number | undefined;

            if (isRestaurant) {
                name = item.data.name;
                address = item.data.address || undefined;
                handlePress = () => handleRestaurantSelect(item.data);
                distance = item.data.distance_meters;
            } else {
                const { structuredFormat } = item.data.placePrediction;
                name = structuredFormat.mainText.text;
                address = structuredFormat.secondaryText?.text;
                handlePress = () => handleAddressSelect(item.data);
            }

            return (
                <Pressable
                    style={({ pressed }) => [
                        styles.restaurantItem,
                        pressed && styles.restaurantItemPressed,
                    ]}
                    onPress={handlePress}
                >
                    <View style={styles.restaurantContent}>
                        <ThemedText
                            style={styles.restaurantName}
                            numberOfLines={1}
                        >
                            {name}
                        </ThemedText>
                        {address && (
                            <ThemedText
                                style={styles.restaurantAddress}
                                numberOfLines={1}
                            >
                                {address}
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
        },
        [
            styles,
            iconColor,
            handleRestaurantSelect,
            handleAddressSelect,
            theme.color.accent,
        ]
    );

    return (
        <ThemedView style={styles.container}>
            <SearchInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search for a restaurant..."
                isLoading={isSearching || isSelecting}
            />

            {!isOnline && (
                <View style={styles.offlineBanner}>
                    <IconSymbol name="cloud-offline-outline" size={16} color="#7A6B2E" />
                    <ThemedText style={styles.offlineText} lightColor="#7A6B2E" darkColor="#7A6B2E">
                        You're offline — showing saved results only
                    </ThemedText>
                </View>
            )}

            {combinedResults.length > 0 && !searchQuery && (
                <View style={styles.sectionHeader}>
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
                    contentInsetAdjustmentBehavior="automatic"
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
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        container: {
            flex: 1,
            padding: theme.space.md,
            backgroundColor: theme.color.bg,
        },
        sectionHeader: {
            paddingTop: theme.space.md,
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
        offlineBanner: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space.xs,
            paddingVertical: theme.space.xs,
            paddingHorizontal: theme.space.sm,
            marginTop: theme.space.sm,
            backgroundColor: '#FFF8E1',
            borderRadius: theme.radius.md,
        },
        offlineText: {
            fontSize: theme.font.size.xs,
            fontWeight: theme.font.weight.medium,
        },
    });
