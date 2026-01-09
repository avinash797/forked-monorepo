import { EmptyState } from '@/components/browse/empty-state';
import { CompactDishCardWithRating } from '@/components/browse/search-dish-card';
import { SectionHeader } from '@/components/browse/section-header';
import { SearchInput } from '@/components/rating/search-input';
import { VenueCard } from '@/components/rating/venue-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { useSearch } from '@/hooks/use-search';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SearchScreen() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);

    const {
        data: results = [],
        isFetching: isLoading,
        error: searchError,
    } = useSearch(query);
    const error = searchError ? (searchError as Error).message : null;

    // Group results by type
    const dishResults = results.filter((r) => r.type === 'dish');
    const venueResults = results.filter((r) => r.type === 'venue');

    // Create sections for SectionList
    const sections: any = useMemo(() => {
        const sectionData = [];

        if (dishResults.length > 0) {
            sectionData.push({
                title: 'Dishes',
                subtitle: `${dishResults.length} ${dishResults.length === 1 ? 'result' : 'results'}`,
                data: dishResults,
                type: 'dish' as const,
            });
        }

        if (venueResults.length > 0) {
            sectionData.push({
                title: 'Venues',
                subtitle: `${venueResults.length} ${venueResults.length === 1 ? 'result' : 'results'}`,
                data: venueResults,
                type: 'venue' as const,
            });
        }

        return sectionData;
    }, [dishResults, venueResults]);

    // Navigate to dish detail
    const handleDishPress = (dishId: string) => {
        router.push({
            pathname: '/(protected)/(browse)/dish-detail',
            params: { dishId },
        });
    };

    // Navigate to venue detail
    const handleVenuePress = (venueId: string) => {
        router.push({
            pathname: '/(protected)/(browse)/venue-detail',
            params: { venueId },
        });
    };

    // Render empty state when no query
    const renderEmptyQuery = () => (
        <View style={styles.emptyContainer}>
            <EmptyState
                icon="search"
                title="Search for dishes and venues"
                message="Find your favorite dishes or discover new places to eat"
            />
        </View>
    );

    // Render no results state
    const renderNoResults = () => (
        <View style={styles.emptyContainer}>
            <EmptyState
                icon="search"
                title={`No results for "${query}"`}
                message="Try adjusting your search or browse top dishes"
                actionLabel="Browse Dishes"
                onActionPress={() => router.back()}
            />
        </View>
    );

    // Render error state
    const renderError = () => (
        <View style={styles.emptyContainer}>
            <EmptyState
                icon="error"
                title="Search failed"
                message={error || 'Please try again'}
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ThemedView style={styles.container}>
                {/* Custom Header with Back Button and Search */}
                <View style={styles.header}>
                    <Pressable
                        onPress={() => router.back()}
                        style={({ pressed }) => [
                            styles.backButton,
                            pressed && { opacity: 0.7 },
                        ]}
                        android_ripple={{
                            color: 'rgba(0, 0, 0, 0.1)',
                            radius: 20,
                            borderless: true,
                        }}
                    >
                        <IconSymbol
                            name="arrow-back"
                            size={24}
                            color={theme.color.textPrimary}
                        />
                    </Pressable>

                    <View style={styles.searchInputContainer}>
                        <SearchInput
                            value={query}
                            onChangeText={setQuery}
                            placeholder="Search dishes and venues..."
                            isLoading={isLoading}
                            autoFocus={true}
                        />
                    </View>
                </View>

                {/* Search Results using SectionList */}
                <SectionList
                    sections={sections}
                    keyExtractor={(item) => item.data.id}
                    renderItem={({ item, section }) => {
                        if (section.type === 'dish') {
                            return (
                                <CompactDishCardWithRating
                                    dish={item.data}
                                    onPress={() =>
                                        handleDishPress(item.data.id)
                                    }
                                    showVenue={true}
                                />
                            );
                        } else {
                            return (
                                <VenueCard
                                    venue={item.data}
                                    onPress={() =>
                                        handleVenuePress(item.data.id)
                                    }
                                    showDistance={false}
                                />
                            );
                        }
                    }}
                    renderSectionHeader={({ section }) => (
                        <SectionHeader
                            title={section.title}
                            subtitle={section.subtitle}
                        />
                    )}
                    stickySectionHeadersEnabled={false}
                    contentContainerStyle={styles.sectionListContent}
                    contentInsetAdjustmentBehavior="automatic"
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={() => {
                        if (error) return renderError();
                        if (query.length === 0) return renderEmptyQuery();
                        if (
                            query.length >= 2 &&
                            !isLoading &&
                            results.length === 0
                        )
                            return renderNoResults();
                        if (query.length > 0 && query.length < 2) {
                            return (
                                <View style={styles.hintContainer}>
                                    <ThemedText style={styles.hintText}>
                                        Type at least 2 characters to search
                                    </ThemedText>
                                </View>
                            );
                        }
                        return null;
                    }}
                />
            </ThemedView>
        </SafeAreaView>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        safeArea: {
            flex: 1,
        },
        container: {
            flex: 1,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: theme.space.md,
            paddingVertical: theme.space.sm,
            borderBottomWidth: theme.border.hairline,
            borderBottomColor: theme.color.border,
        },
        backButton: {
            marginRight: theme.space.sm,
            padding: theme.space.xxs,
        },
        searchInputContainer: {
            flex: 1,
        },
        sectionListContent: {
            paddingHorizontal: theme.space.sm,
            paddingTop: theme.space.xs,
        },
        emptyContainer: {
            flex: 1,
            paddingTop: 120,
            paddingHorizontal: theme.space.md,
        },
        hintContainer: {
            paddingHorizontal: theme.space.md,
            paddingTop: theme.space.xxl,
            alignItems: 'center',
        },
        hintText: {
            fontSize: theme.font.size.sm,
            opacity: theme.opacity.pressed - 0.1,
            textAlign: 'center',
        },
    });
