import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SliderInput } from '@/components/ui/slider';
import { useTheme } from '@/contexts/theme-provider';
import { useCities } from '@/hooks/use-location';
import { useLocationFilterStore } from '@/stores';
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { forwardRef, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

interface LocationBottomSheetProps {
    onClose: () => void;
}

// TODO: Fetch real cities/neighborhoods from database based on user location
const FALLBACK_LOCATIONS = [
    'Downtown',
    'Midtown',
    'Upper East Side',
    'Brooklyn',
    'Queens',
    'Williamsburg',
    'Chelsea',
    'SoHo',
];

export const LocationBottomSheet = forwardRef<
    BottomSheet,
    LocationBottomSheetProps
>((props, ref) => {
    const { onClose } = props;
    const { theme } = useTheme();
    const {
        filterType,
        radius,
        selectedLocation,
        setNearbyFilter,
        setLocationFilter,
    } = useLocationFilterStore();

    const { data: cities = [], isLoading: isLoadingCities } = useCities();
    const [localRadius, setLocalRadius] = useState(radius);

    const locations = cities.length > 0 ? cities : FALLBACK_LOCATIONS;
    const styles = createStyles(theme);

    // Animation for Nearby expansion
    const isNearbySelected = filterType === 'nearby';
    const expansionProgress = useSharedValue(isNearbySelected ? 1 : 0);

    useEffect(() => {
        expansionProgress.value = withTiming(isNearbySelected ? 1 : 0, {
            duration: 300,
        });
    }, [isNearbySelected, expansionProgress]);

    const animatedNearbyStyle = useAnimatedStyle(() => ({
        height: 52 + expansionProgress.value * 120, // 52 is base height, 120 for expansion
        overflow: 'hidden',
    }));

    const animatedContentStyle = useAnimatedStyle(() => ({
        opacity: expansionProgress.value,
        transform: [{ translateY: (1 - expansionProgress.value) * -10 }],
    }));

    const snapPoints = ['60%', '80%'];

    const handleRadiusChange = useCallback(
        (newRadius: number) => {
            setLocalRadius(newRadius);
            setNearbyFilter(newRadius);
        },
        [setNearbyFilter]
    );

    const handleNearbyPress = useCallback(() => {
        if (filterType !== 'nearby') {
            setNearbyFilter(localRadius);
        }
    }, [filterType, localRadius, setNearbyFilter]);

    const handleLocationSelect = useCallback(
        (location: string) => {
            setLocationFilter(location);
        },
        [setLocationFilter]
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

                {/* Locations List */}
                <View style={styles.section}>
                    <View style={styles.locationsList}>
                        {/* Nearby Item (Animated) */}
                        <Animated.View
                            style={[
                                styles.nearbyItem,
                                isNearbySelected && {
                                    backgroundColor: theme.color.accent + '15',
                                    borderColor: theme.color.accent,
                                },
                                animatedNearbyStyle,
                            ]}
                        >
                            <Pressable
                                onPress={handleNearbyPress}
                                style={({ pressed }) => [
                                    styles.itemHeader,
                                    pressed && {
                                        opacity: theme.opacity.pressed,
                                    },
                                ]}
                            >
                                <View style={styles.itemTitleContainer}>
                                    <IconSymbol
                                        name="location"
                                        size={20}
                                        color={
                                            isNearbySelected
                                                ? theme.color.accent
                                                : theme.color.textSecondary
                                        }
                                    />
                                    <ThemedText
                                        style={[
                                            styles.locationName,
                                            {
                                                color: isNearbySelected
                                                    ? theme.color.accent
                                                    : theme.color.textPrimary,
                                            },
                                        ]}
                                    >
                                        Nearby
                                    </ThemedText>
                                </View>
                                {isNearbySelected && (
                                    <IconSymbol
                                        name="checkmark-circle"
                                        size={20}
                                        color={theme.color.accent}
                                    />
                                )}
                            </Pressable>

                            {/* Radius Slider Content */}
                            <Animated.View
                                style={[
                                    styles.expandedContent,
                                    animatedContentStyle,
                                ]}
                            >
                                <ThemedText style={styles.sliderIntro}>
                                    Adjust search radius:
                                </ThemedText>
                                <View style={styles.sliderContainer}>
                                    <SliderInput
                                        value={localRadius}
                                        onChange={handleRadiusChange}
                                        min={1}
                                        max={50}
                                        step={1}
                                    />

                                    <View style={styles.sliderLabels}>
                                        <ThemedText
                                            style={[
                                                styles.sliderLabel,
                                                {
                                                    color: theme.color
                                                        .textSecondary,
                                                },
                                            ]}
                                        >
                                            1 km
                                        </ThemedText>
                                        <ThemedText
                                            style={[
                                                styles.sliderLabel,
                                                {
                                                    color: theme.color
                                                        .textPrimary,
                                                    fontWeight: '600',
                                                },
                                            ]}
                                        >
                                            {localRadius} km
                                        </ThemedText>
                                        <ThemedText
                                            style={[
                                                styles.sliderLabel,
                                                {
                                                    color: theme.color
                                                        .textSecondary,
                                                },
                                            ]}
                                        >
                                            50 km
                                        </ThemedText>
                                    </View>
                                </View>

                                <Pressable
                                    onPress={onClose}
                                    style={({ pressed }) => [
                                        styles.applyMinimizedButton,
                                        pressed && {
                                            opacity: theme.opacity.pressed,
                                        },
                                    ]}
                                >
                                    <ThemedText style={styles.applyButtonText}>
                                        Apply
                                    </ThemedText>
                                </Pressable>
                            </Animated.View>
                        </Animated.View>

                        {/* Neighborhoods Divider/Header */}
                        {/* <ThemedText
                            type="defaultSemiBold"
                            style={styles.neighborhoodsHeader}
                        >
                            Cities & Neighborhoods
                        </ThemedText> */}

                        {isLoadingCities ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator color={theme.color.accent} />
                                <ThemedText style={styles.loadingText}>
                                    Loading cities...
                                </ThemedText>
                            </View>
                        ) : (
                            locations.map((location) => {
                                const isSelected =
                                    filterType === 'location' &&
                                    selectedLocation === location;

                                return (
                                    <Pressable
                                        key={location}
                                        onPress={() =>
                                            handleLocationSelect(location)
                                        }
                                        style={({ pressed }) => [
                                            styles.locationItem,
                                            {
                                                backgroundColor: isSelected
                                                    ? theme.color.accent + '15'
                                                    : theme.color.inputBg,
                                                borderColor: isSelected
                                                    ? theme.color.accent
                                                    : theme.color.border,
                                                height: 52,
                                            },
                                            pressed && {
                                                opacity: theme.opacity.pressed,
                                            },
                                        ]}
                                    >
                                        <View style={styles.itemTitleContainer}>
                                            <IconSymbol
                                                name="business"
                                                size={20}
                                                color={
                                                    isSelected
                                                        ? theme.color.accent
                                                        : theme.color
                                                              .textSecondary
                                                }
                                            />
                                            <ThemedText
                                                style={[
                                                    styles.locationName,
                                                    {
                                                        color: isSelected
                                                            ? theme.color.accent
                                                            : theme.color
                                                                  .textPrimary,
                                                    },
                                                ]}
                                            >
                                                {location}
                                            </ThemedText>
                                        </View>
                                        {isSelected && (
                                            <IconSymbol
                                                name="checkmark-circle"
                                                size={20}
                                                color={theme.color.accent}
                                            />
                                        )}
                                    </Pressable>
                                );
                            })
                        )}
                    </View>
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
        section: {
            padding: theme.space.md,
        },
        locationsList: {
            gap: theme.space.xs,
        },
        locationItem: {
            borderRadius: theme.radius.sm,
            borderWidth: theme.border.hairline,
            borderColor: theme.color.border,
            backgroundColor: theme.color.inputBg,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: theme.space.md,
        },
        nearbyItem: {
            borderRadius: theme.radius.sm,
            borderWidth: theme.border.hairline,
            borderColor: theme.color.border,
            backgroundColor: theme.color.inputBg,
        },
        itemHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: 52,
            paddingHorizontal: theme.space.md,
        },
        itemTitleContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space.sm,
        },
        locationName: {
            fontSize: theme.font.size.md - 1,
        },
        neighborhoodsHeader: {
            marginTop: theme.space.lg,
            marginBottom: theme.space.xs,
            fontSize: theme.font.size.sm,
            color: theme.color.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 1,
        },
        expandedContent: {
            paddingHorizontal: theme.space.md,
            paddingBottom: theme.space.md,
        },
        sliderIntro: {
            fontSize: theme.font.size.xs,
            color: theme.color.textSecondary,
            marginBottom: theme.space.sm,
        },
        sliderContainer: {
            marginBottom: theme.space.sm,
        },
        sliderLabels: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: theme.space.xxs,
        },
        sliderLabel: {
            fontSize: theme.font.size.xs,
        },
        applyMinimizedButton: {
            backgroundColor: theme.color.accent,
            paddingVertical: theme.space.xs + 2,
            borderRadius: theme.radius.xs,
            alignItems: 'center',
            marginTop: theme.space.xs,
        },
        applyButtonText: {
            color: theme.color.accentOn,
            fontSize: theme.font.size.sm,
            fontWeight: theme.font.weight.semibold,
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
    });
