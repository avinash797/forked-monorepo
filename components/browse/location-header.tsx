import { SearchInput } from '@/components/rating/search-input';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { useLocationFilterStore } from '@/stores';
import { Pressable, StyleSheet, View } from 'react-native';
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
        if (state.filterType === 'nearby') {
            return `Nearby (${state.radius}km)`;
        }
        return state.selectedLocation || 'All Locations';
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
                        backgroundColor: theme.color.inputBg,
                        borderColor: theme.color.border,
                    },
                    pressed && { opacity: theme.opacity.pressed },
                ]}
                android_ripple={{
                    color: 'rgba(0, 0, 0, 0.1)',
                    borderless: false,
                }}
            >
                <IconSymbol
                    name="location-pin"
                    size={18}
                    color={theme.color.textPrimary}
                />
                <ThemedText
                    style={[
                        styles.locationText,
                        { color: theme.color.textPrimary },
                    ]}
                    numberOfLines={1}
                >
                    {displayText}
                </ThemedText>
                <IconSymbol
                    name="keyboard-arrow-down"
                    size={16}
                    color={theme.color.textTertiary}
                />
            </Pressable>

            {/* Search Input */}
            <View style={styles.searchWrapper}>
                <SearchInput
                    value=""
                    onChangeText={() => {}}
                    placeholder="What are you craving?"
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
            paddingVertical: theme.space.xs,
            paddingHorizontal: theme.space.md,
        },
        locationButton: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space.xxs,
            paddingHorizontal: theme.space.xxs,
            paddingVertical: theme.space.sm,
            borderRadius: theme.radius.pill,
            borderWidth: theme.border.hairline,
        },
        locationText: {
            fontSize: theme.font.size.sm,
            fontWeight: theme.font.weight.medium,
        },
        searchWrapper: {
            flex: 1,
        },
    });
