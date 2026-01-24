import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { City, useCities } from '@/hooks/use-location';
import { useLocationFilterStore } from '@/stores';
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { forwardRef, useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

interface LocationBottomSheetProps {
    onClose: () => void;
}

interface CityItemProps {
    city: City;
    isExpanded: boolean;
    onToggle: () => void;
    onCitySelect: () => void;
    onNeighborhoodSelect: (neighborhoodId: string, neighborhoodName: string) => void;
    selectedCityId: string | null;
    selectedNeighborhoodId: string | null;
    filterType: 'city' | 'neighborhood' | null;
}

function CityItem({
    city,
    isExpanded,
    onToggle,
    onCitySelect,
    onNeighborhoodSelect,
    selectedCityId,
    selectedNeighborhoodId,
    filterType,
}: CityItemProps) {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    const isCitySelected = filterType === 'city' && selectedCityId === city.id;
    const hasNeighborhoods = city.neighborhoods.length > 0;

    // Animation for expansion
    const expansionProgress = useSharedValue(isExpanded ? 1 : 0);

    const animatedContainerStyle = useAnimatedStyle(() => {
        expansionProgress.value = withTiming(isExpanded ? 1 : 0, { duration: 250 });
        const neighborhoodHeight = 44; // Height per neighborhood item
        const maxHeight = 52 + city.neighborhoods.length * neighborhoodHeight;
        return {
            height: 52 + expansionProgress.value * (city.neighborhoods.length * neighborhoodHeight),
            maxHeight,
            overflow: 'hidden',
        };
    }, [isExpanded, city.neighborhoods.length]);

    const animatedNeighborhoodsStyle = useAnimatedStyle(() => ({
        opacity: expansionProgress.value,
    }));

    return (
        <Animated.View
            style={[
                styles.cityItem,
                isCitySelected && {
                    backgroundColor: theme.color.accent + '15',
                    borderColor: theme.color.accent,
                },
                animatedContainerStyle,
            ]}
        >
            {/* City Header */}
            <View style={styles.cityHeader}>
                <Pressable
                    onPress={onCitySelect}
                    style={({ pressed }) => [
                        styles.cityTitlePressable,
                        pressed && { opacity: theme.opacity.pressed },
                    ]}
                >
                    <View style={styles.itemTitleContainer}>
                        <IconSymbol
                            name="business"
                            size={20}
                            color={
                                isCitySelected
                                    ? theme.color.accent
                                    : theme.color.textSecondary
                            }
                        />
                        <ThemedText
                            style={[
                                styles.cityName,
                                {
                                    color: isCitySelected
                                        ? theme.color.accent
                                        : theme.color.textPrimary,
                                },
                            ]}
                        >
                            {city.name}
                        </ThemedText>
                    </View>
                    {isCitySelected && (
                        <IconSymbol
                            name="checkmark-circle"
                            size={20}
                            color={theme.color.accent}
                        />
                    )}
                </Pressable>

                {hasNeighborhoods && (
                    <Pressable
                        onPress={onToggle}
                        style={({ pressed }) => [
                            styles.expandButton,
                            pressed && { opacity: theme.opacity.pressed },
                        ]}
                    >
                        <IconSymbol
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color={theme.color.textSecondary}
                        />
                    </Pressable>
                )}
            </View>

            {/* Neighborhoods */}
            {hasNeighborhoods && (
                <Animated.View style={[styles.neighborhoodsContainer, animatedNeighborhoodsStyle]}>
                    {city.neighborhoods.map((neighborhood) => {
                        const isNeighborhoodSelected =
                            filterType === 'neighborhood' &&
                            selectedNeighborhoodId === neighborhood.id;

                        return (
                            <Pressable
                                key={neighborhood.id}
                                onPress={() =>
                                    onNeighborhoodSelect(neighborhood.id, neighborhood.name)
                                }
                                style={({ pressed }) => [
                                    styles.neighborhoodItem,
                                    isNeighborhoodSelected && {
                                        backgroundColor: theme.color.accent + '10',
                                    },
                                    pressed && { opacity: theme.opacity.pressed },
                                ]}
                            >
                                <ThemedText
                                    style={[
                                        styles.neighborhoodName,
                                        {
                                            color: isNeighborhoodSelected
                                                ? theme.color.accent
                                                : theme.color.textSecondary,
                                        },
                                    ]}
                                >
                                    {neighborhood.name}
                                </ThemedText>
                                {isNeighborhoodSelected && (
                                    <IconSymbol
                                        name="checkmark-circle"
                                        size={18}
                                        color={theme.color.accent}
                                    />
                                )}
                            </Pressable>
                        );
                    })}
                </Animated.View>
            )}
        </Animated.View>
    );
}

export const LocationBottomSheet = forwardRef<
    BottomSheet,
    LocationBottomSheetProps
>((props, ref) => {
    const { onClose } = props;
    const { theme } = useTheme();
    const {
        filterType,
        selectedCityId,
        selectedNeighborhoodId,
        setCityFilter,
        setNeighborhoodFilter,
        resetFilter,
    } = useLocationFilterStore();

    const { data: cities = [], isLoading: isLoadingCities } = useCities();
    const [expandedCityId, setExpandedCityId] = useState<string | null>(null);

    const styles = createStyles(theme);
    const snapPoints = ['60%', '80%'];

    const handleCityToggle = useCallback((cityId: string) => {
        setExpandedCityId((prev) => (prev === cityId ? null : cityId));
    }, []);

    const handleCitySelect = useCallback(
        (city: City) => {
            setCityFilter(city.id, city.name);
            onClose();
        },
        [setCityFilter, onClose]
    );

    const handleNeighborhoodSelect = useCallback(
        (city: City, neighborhoodId: string, neighborhoodName: string) => {
            setNeighborhoodFilter(city.id, city.name, neighborhoodId, neighborhoodName);
            onClose();
        },
        [setNeighborhoodFilter, onClose]
    );

    const handleClearFilter = useCallback(() => {
        resetFilter();
        onClose();
    }, [resetFilter, onClose]);

    const renderBackdrop = useCallback(
        (props: BottomSheetDefaultBackdropProps) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.5}
            />
        ),
        []
    );

    const hasActiveFilter = filterType !== null;

    return (
        <BottomSheet
            ref={ref}
            index={-1}
            snapPoints={snapPoints}
            enablePanDownToClose
            onClose={onClose}
            backgroundStyle={{
                backgroundColor: theme.color.bg,
            }}
            handleIndicatorStyle={{
                backgroundColor: theme.color.border,
            }}
            backdropComponent={renderBackdrop}
            enableContentPanningGesture
        >
            <BottomSheetScrollView
                style={{ backgroundColor: theme.color.bg, flex: 1 }}
            >
                {/* Header */}
                <View style={styles.header}>
                    <ThemedText type="title" style={styles.title}>
                        Filter by Location
                    </ThemedText>
                    <Pressable onPress={onClose}>
                        <IconSymbol
                            name="close"
                            size={24}
                            color={theme.color.textTertiary}
                        />
                    </Pressable>
                </View>

                {/* Clear Filter Button */}
                {hasActiveFilter && (
                    <View style={styles.clearFilterContainer}>
                        <Pressable
                            onPress={handleClearFilter}
                            style={({ pressed }) => [
                                styles.clearFilterButton,
                                pressed && { opacity: theme.opacity.pressed },
                            ]}
                        >
                            <IconSymbol
                                name="close-circle"
                                size={18}
                                color={theme.color.textSecondary}
                            />
                            <ThemedText style={styles.clearFilterText}>
                                Clear filter
                            </ThemedText>
                        </Pressable>
                    </View>
                )}

                {/* Cities List */}
                <View style={styles.section}>
                    {isLoadingCities ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator color={theme.color.accent} />
                            <ThemedText style={styles.loadingText}>
                                Loading locations...
                            </ThemedText>
                        </View>
                    ) : cities.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <ThemedText style={styles.emptyText}>
                                No cities available
                            </ThemedText>
                        </View>
                    ) : (
                        <View style={styles.citiesList}>
                            {cities.map((city) => (
                                <CityItem
                                    key={city.id}
                                    city={city}
                                    isExpanded={expandedCityId === city.id}
                                    onToggle={() => handleCityToggle(city.id)}
                                    onCitySelect={() => handleCitySelect(city)}
                                    onNeighborhoodSelect={(neighborhoodId, neighborhoodName) =>
                                        handleNeighborhoodSelect(city, neighborhoodId, neighborhoodName)
                                    }
                                    selectedCityId={selectedCityId}
                                    selectedNeighborhoodId={selectedNeighborhoodId}
                                    filterType={filterType}
                                />
                            ))}
                        </View>
                    )}
                </View>
            </BottomSheetScrollView>
        </BottomSheet>
    );
});

LocationBottomSheet.displayName = 'LocationBottomSheet';

const createStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: theme.space.md,
            paddingVertical: theme.space.md,
            borderBottomWidth: theme.border.hairline,
            borderBottomColor: theme.color.border,
        },
        title: {
            fontSize: theme.font.size.lg,
        },
        clearFilterContainer: {
            paddingHorizontal: theme.space.md,
            paddingTop: theme.space.sm,
        },
        clearFilterButton: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space.xxs,
            alignSelf: 'flex-start',
            paddingVertical: theme.space.xxs,
            paddingHorizontal: theme.space.xs,
            borderRadius: theme.radius.xs,
            backgroundColor: theme.color.inputBg,
        },
        clearFilterText: {
            fontSize: theme.font.size.sm,
            color: theme.color.textSecondary,
        },
        section: {
            padding: theme.space.md,
        },
        citiesList: {
            gap: theme.space.xs,
        },
        cityItem: {
            borderRadius: theme.radius.sm,
            borderWidth: theme.border.hairline,
            borderColor: theme.color.border,
            backgroundColor: theme.color.inputBg,
        },
        cityHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            height: 52,
        },
        cityTitlePressable: {
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingLeft: theme.space.md,
            paddingRight: theme.space.xs,
            height: '100%',
        },
        itemTitleContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space.sm,
        },
        cityName: {
            fontSize: theme.font.size.md - 1,
            fontWeight: theme.font.weight.medium,
        },
        expandButton: {
            padding: theme.space.sm,
            paddingRight: theme.space.md,
        },
        neighborhoodsContainer: {
            paddingLeft: theme.space.lg + theme.space.md,
            paddingRight: theme.space.md,
            paddingBottom: theme.space.xs,
        },
        neighborhoodItem: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: theme.space.sm,
            paddingHorizontal: theme.space.sm,
            borderRadius: theme.radius.xs,
        },
        neighborhoodName: {
            fontSize: theme.font.size.sm,
        },
        loadingContainer: {
            padding: theme.space.lg,
            alignItems: 'center',
            gap: theme.space.sm,
        },
        loadingText: {
            fontSize: theme.font.size.sm,
            color: theme.color.textSecondary,
        },
        emptyContainer: {
            padding: theme.space.lg,
            alignItems: 'center',
        },
        emptyText: {
            fontSize: theme.font.size.sm,
            color: theme.color.textSecondary,
        },
    });
