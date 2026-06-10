import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useLocationFilterStore } from '@/stores';
import { Pressable, StyleSheet, View } from 'react-native';
import { ForkLogo } from '../fork-logo';
import { SearchInput } from '../rating/search-input';
import { ThemedText } from '../themed-text';

interface LocationHeaderProps {
    onLocationPress: () => void;
    onSearchPress: () => void;
}

export function LocationHeader({
    onLocationPress,
    onSearchPress,
}: LocationHeaderProps) {
    const { theme } = useTheme();
    const isOnline = useOnlineStatus();
    // Subscribe to the actual state values for reactivity
    const displayText = useLocationFilterStore((state) => {
        if (
            state.filterType === 'neighborhood' &&
            state.selectedNeighborhoodName
        ) {
            return state.selectedNeighborhoodName;
        }
        if (state.filterType === 'city' && state.selectedCityName) {
            return state.selectedCityName;
        }
        return 'All Locations';
    });
    const styles = createStyles(theme);

    return (
        <View style={styles.container}>
            <View style={styles.locationWrapper}>
                <View style={styles.logoContainer}>
                    <ForkLogo size={22} />
                    <ThemedText type="title">forked.</ThemedText>
                </View>
                {/* Location Indicator Button */}
                <Pressable
                    onPress={onLocationPress}
                    style={({ pressed }) => [
                        styles.locationButton,
                        {
                            backgroundColor: theme.color.accentSoft,
                        },
                        pressed && { opacity: theme.opacity.pressed },
                    ]}
                    android_ripple={{
                        color: 'rgba(0, 0, 0, 0.1)',
                        borderless: false,
                    }}
                >
                    <IconSymbol
                        name="pin"
                        size={18}
                        color={theme.color.textPrimary}
                    />
                    <ThemedText
                        style={[styles.locationText, { color: theme.color.accent }]}
                        numberOfLines={1}
                    >
                        {displayText}
                    </ThemedText>
                </Pressable>
            </View>


            {/* Search Input */}
            <View style={styles.searchWrapper}>
                <SearchInput
                    value=""
                    onChangeText={() => { }}
                    placeholder="What are you craving?"
                    onFocus={onSearchPress}
                    isLoading={false}
                />
            </View>

            {!isOnline && (
                <View style={styles.offlineBanner}>
                    <IconSymbol
                        name="cloud-offline-outline"
                        size={16}
                        color="#7A6B2E"
                    />
                    <ThemedText
                        style={styles.offlineText}
                        lightColor="#7A6B2E"
                        darkColor="#7A6B2E"
                    >
                        You're offline — showing saved data
                    </ThemedText>
                </View>
            )}
        </View>
    );
}

const createStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        container: {
            gap: theme.space.xs,
            paddingTop: theme.space.xxs,
            paddingBottom: theme.space.sm,
            paddingHorizontal: theme.space.md,
        },
        locationWrapper: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        logoContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space.xxs,
        },
        locationButton: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space.xxs,
            padding: theme.space.xs,
            borderRadius: theme.radius.pill,
        },
        locationText: {
            fontSize: theme.font.size.sm,
            fontWeight: theme.font.weight.medium,
        },
        searchWrapper: {
            width: '100%',
        },
        offlineBanner: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space.xs,
            paddingVertical: theme.space.xs,
            paddingHorizontal: theme.space.sm,
            backgroundColor: '#FFF8E1',
            borderRadius: theme.radius.md,
        },
        offlineText: {
            fontSize: theme.font.size.xs,
            fontWeight: theme.font.weight.medium,
        },
    });
