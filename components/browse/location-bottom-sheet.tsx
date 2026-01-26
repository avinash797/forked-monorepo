import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { City, useCities } from '@/hooks/use-location';
import { useLocationFilterStore, useLocationStore } from '@/stores';
import {
    BottomSheetBackdrop,
    BottomSheetFlatList,
    BottomSheetModal,
} from '@gorhom/bottom-sheet';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    SectionListRenderItem,
    StyleSheet,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface LocationBottomSheetProps {
    onClose: () => void;
}

export const LocationBottomSheet = forwardRef<
    BottomSheetModal,
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
    } = useLocationFilterStore();

    // Physical location + auto-selection source
    const { currentCity } = useLocationStore();

    const { data: cities = [], isLoading: isLoadingCities } = useCities();
    const [activeTab, setActiveTab] = useState<'cities' | 'neighborhoods'>(
        'cities'
    );

    const styles = createStyles(theme);
    const snapPoints = useMemo(() => ['40%', '60%', '80%'], []);

    // Auto-select closest city if no filter is active and we have a location match
    useEffect(() => {
        if (!filterType && currentCity && !selectedCityId) {
            setCityFilter(currentCity.id, currentCity.name);
        }
    }, [filterType, currentCity, selectedCityId, setCityFilter]);

    const handleCitySelect = useCallback(
        (city: City) => {
            setCityFilter(city.id, city.name);
            onClose();
        },
        [setCityFilter, onClose]
    );

    const handleNeighborhoodSelect = useCallback(
        (city: City, neighborhoodId: string, neighborhoodName: string) => {
            setNeighborhoodFilter(
                city.id,
                city.name,
                neighborhoodId,
                neighborhoodName
            );
            onClose();
        },
        [setNeighborhoodFilter, onClose]
    );

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

    // Prepare sections for Neighborhoods tab
    const neighborhoodSections = useMemo(() => {
        return cities
            .map((city) => ({
                title: city.name,
                data: city.neighborhoods,
                city: city, // keep ref to city for handler
            }))
            .filter((section) => section.data.length > 0);
    }, [cities]);

    const renderCityItem = useCallback(
        ({ item: city }: { item: City }) => {
            const isSelected =
                filterType === 'city' && selectedCityId === city.id;
            return (
                <Pressable
                    onPress={() => handleCitySelect(city)}
                    style={({ pressed }) => [
                        styles.itemContainer,
                        isSelected && styles.itemSelected,
                        pressed && { opacity: theme.opacity.pressed },
                    ]}
                >
                    <ThemedText
                        style={[
                            styles.itemText,
                            isSelected && { color: theme.color.accent },
                        ]}
                    >
                        {city.name}
                    </ThemedText>
                    {isSelected && (
                        <IconSymbol
                            name="checkmark-circle"
                            size={20}
                            color={theme.color.accent}
                        />
                    )}
                </Pressable>
            );
        },
        [filterType, selectedCityId, styles, theme, handleCitySelect]
    );

    const renderNeighborhoodItem: SectionListRenderItem<any, any> = useCallback(
        ({ item, section }) => {
            const isSelected =
                filterType === 'neighborhood' &&
                selectedNeighborhoodId === item.id;
            // section.city is accessible via the section object we created
            const parentCity = section.city;

            return (
                <Pressable
                    onPress={() =>
                        handleNeighborhoodSelect(parentCity, item.id, item.name)
                    }
                    style={({ pressed }) => [
                        styles.neighborhoodItemContainer,
                        isSelected && styles.itemSelected,
                        pressed && { opacity: theme.opacity.pressed },
                    ]}
                >
                    <ThemedText
                        style={[
                            styles.neighborhoodText,
                            isSelected && { color: theme.color.accent },
                        ]}
                    >
                        {item.name}
                    </ThemedText>
                    {isSelected && (
                        <IconSymbol
                            name="checkmark-circle"
                            size={18}
                            color={theme.color.accent}
                        />
                    )}
                </Pressable>
            );
        },
        [
            filterType,
            selectedNeighborhoodId,
            styles,
            theme,
            handleNeighborhoodSelect,
        ]
    );

    const renderSectionHeader = useCallback(
        ({ section: { title } }: any) => (
            <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionHeaderText}>
                    {title}
                </ThemedText>
            </View>
        ),
        [styles]
    );

    const { bottom } = useSafeAreaInsets();

    const renderContent = () => {
        if (isLoadingCities) {
            return (
                <View
                    style={[styles.loadingContainer, { paddingBottom: bottom }]}
                >
                    <ActivityIndicator color={theme.color.accent} />
                    <ThemedText style={styles.loadingText}>
                        Loading locations...
                    </ThemedText>
                </View>
            );
        }

        if (cities.length === 0) {
            return (
                <View
                    style={[styles.emptyContainer, { paddingBottom: bottom }]}
                >
                    <ThemedText style={styles.emptyText}>
                        No locations available
                    </ThemedText>
                </View>
            );
        }

        if (activeTab === 'cities') {
            return (
                <BottomSheetFlatList
                    data={cities}
                    keyExtractor={(item: City) => item.id}
                    renderItem={renderCityItem}
                    contentContainerStyle={[
                        styles.listContent,
                        { paddingBottom: bottom + theme.space.md },
                    ]}
                />
            );
        }

        return (
            // <BottomSheetSectionList
            //     sections={neighborhoodSections}
            //     keyExtractor={(item: Neighborhood) => item.id}
            //     renderItem={renderNeighborhoodItem}
            //     renderSectionHeader={renderSectionHeader}
            //     contentContainerStyle={[
            //         styles.listContent,
            //         { paddingBottom: bottom + theme.space.md },
            //     ]}
            //     stickySectionHeadersEnabled={false}
            // />
            <View style={styles.emptyContainer}>
                <ThemedText>
                    Neighborhood level filtering is coming soon!
                </ThemedText>
            </View>
        );
    };

    return (
        <BottomSheetModal
            ref={ref}
            index={0}
            snapPoints={snapPoints}
            enablePanDownToClose
            onDismiss={onClose}
            backgroundStyle={{
                backgroundColor: theme.color.bg,
            }}
            handleIndicatorStyle={{
                backgroundColor: theme.color.border,
            }}
            backdropComponent={renderBackdrop}
            enableContentPanningGesture={false}
            enableDynamicSizing={false}
        >
            {/* <View style={styles.header}>
                <Pressable onPress={onClose}>
                    <IconSymbol
                        name="close"
                        size={24}
                        color={theme.color.textTertiary}
                    />
                </Pressable>
            </View> */}

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <Pressable
                    style={[
                        styles.tab,
                        activeTab === 'cities' && styles.activeTab,
                    ]}
                    onPress={() => setActiveTab('cities')}
                >
                    <ThemedText
                        style={[
                            styles.tabText,
                            activeTab === 'cities' && styles.activeTabText,
                        ]}
                    >
                        Cities
                    </ThemedText>
                </Pressable>
                <Pressable
                    style={[
                        styles.tab,
                        activeTab === 'neighborhoods' && styles.activeTab,
                    ]}
                    onPress={() => setActiveTab('neighborhoods')}
                >
                    <ThemedText
                        style={[
                            styles.tabText,
                            activeTab === 'neighborhoods' &&
                                styles.activeTabText,
                        ]}
                    >
                        Neighborhoods
                    </ThemedText>
                </Pressable>
            </View>

            <View style={{ flex: 1 }}>{renderContent()}</View>
        </BottomSheetModal>
    );
});

LocationBottomSheet.displayName = 'LocationBottomSheet';

const createStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        header: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingHorizontal: theme.space.md,
            paddingBottom: theme.space.md,
        },
        title: {
            fontSize: theme.font.size.lg,
        },
        tabContainer: {
            flexDirection: 'row',
            marginHorizontal: theme.space.md,
            marginVertical: theme.space.sm,
            backgroundColor: theme.color.inputBg,
            borderRadius: theme.radius.md,
            padding: 4,
        },
        tab: {
            flex: 1,
            paddingVertical: theme.space.sm,
            alignItems: 'center',
            borderRadius: theme.radius.sm,
        },
        activeTab: {
            backgroundColor: theme.color.bg,
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 1,
            },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
        },
        tabText: {
            fontSize: theme.font.size.sm,
            fontWeight: theme.font.weight.medium,
            color: theme.color.textSecondary,
        },
        activeTabText: {
            color: theme.color.textPrimary,
            fontWeight: theme.font.weight.bold,
        },
        listContent: {
            padding: theme.space.md,
            gap: theme.space.xs,
        },
        itemContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: theme.space.md,
            paddingHorizontal: theme.space.sm,
            borderRadius: theme.radius.sm,
            borderBottomWidth: theme.border.hairline,
            borderBottomColor: theme.color.border,
        },
        neighborhoodItemContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: theme.space.sm,
            paddingHorizontal: theme.space.sm,
            paddingLeft: theme.space.lg, // Indentation for neighborhoods
            borderRadius: theme.radius.sm,
        },
        itemSelected: {
            backgroundColor: theme.color.accent + '10', // 10% opacity
            borderBottomWidth: 0,
        },
        itemText: {
            fontSize: theme.font.size.md,
            fontWeight: theme.font.weight.medium,
        },
        neighborhoodText: {
            fontSize: theme.font.size.sm,
            color: theme.color.textSecondary,
        },
        sectionHeader: {
            paddingVertical: theme.space.xs,
            paddingHorizontal: theme.space.sm,
            backgroundColor: theme.color.bg,
            marginTop: theme.space.sm,
        },
        sectionHeaderText: {
            fontSize: theme.font.size.sm,
            fontWeight: theme.font.weight.bold,
            color: theme.color.textPrimary,
            textTransform: 'uppercase',
            opacity: 0.7,
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
