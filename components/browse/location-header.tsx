import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { useLocationFilterStore } from '@/stores';
import { Pressable, StyleSheet, View } from 'react-native';
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

            {/* Search Input */}
            <View style={styles.searchWrapper}>
                <SearchInput
                    value=""
                    onChangeText={() => {}}
                    placeholder="Search what you want..."
                    onFocus={onSearchPress}
                    isLoading={false}
                />
            </View>
        </View>
    );
}

const createStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space.xs,
            paddingVertical: theme.space.xxs,
            paddingHorizontal: theme.space.md,
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
            flex: 1,
        },
    });
