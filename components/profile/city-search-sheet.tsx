import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { CitySuggestion, useCitySearch } from '@/hooks/use-city-search';
import {
    BottomSheetBackdrop,
    BottomSheetFlatList,
    BottomSheetModal,
    BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CitySearchSheetProps {
    onSelect: (result: { cityId: string; displayName: string }) => void;
    onClose: () => void;
}

export const CitySearchSheet = forwardRef<
    BottomSheetModal,
    CitySearchSheetProps
>((props, ref) => {
    const { onSelect, onClose } = props;
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const { bottom } = useSafeAreaInsets();
    const snapPoints = useMemo(() => ['55%', '85%'], []);
    const internalRef = useRef<BottomSheetModal>(null);

    useImperativeHandle(ref, () => internalRef.current!, []);

    const {
        query,
        setQuery,
        suggestions,
        isSearching,
        selectCity,
        isSelecting,
    } = useCitySearch();

    const renderBackdrop = useCallback(
        (backdropProps: BottomSheetDefaultBackdropProps) => (
            <BottomSheetBackdrop
                {...backdropProps}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.5}
            />
        ),
        []
    );

    const handleDismiss = useCallback(() => {
        internalRef.current?.dismiss();
        setQuery('');
        onClose();
    }, [setQuery, onClose]);

    const handleSelect = useCallback(
        async (item: CitySuggestion) => {
            try {
                const result = await selectCity(item);
                onSelect(result);
                setQuery('');
                internalRef.current?.dismiss();
            } catch {
                // Error is available via the hook's error state
            }
        },
        [selectCity, onSelect, setQuery]
    );

    const renderItem = useCallback(
        ({ item }: { item: CitySuggestion }) => (
            <Pressable
                onPress={() => handleSelect(item)}
                disabled={isSelecting}
                style={({ pressed }) => [
                    styles.resultItem,
                    pressed && styles.resultItemPressed,
                ]}
            >
                <View style={styles.resultIcon}>
                    <IconSymbol
                        name="location-outline"
                        size={20}
                        color={theme.color.accent}
                    />
                </View>
                <View style={styles.resultContent}>
                    <ThemedText style={styles.resultCity} numberOfLines={1}>
                        {item.city}
                    </ThemedText>
                    {item.state ? (
                        <ThemedText
                            style={styles.resultState}
                            numberOfLines={1}
                        >
                            {item.state}
                        </ThemedText>
                    ) : null}
                </View>
                <IconSymbol
                    name="chevron-forward"
                    size={16}
                    color={theme.color.textTertiary}
                />
            </Pressable>
        ),
        [handleSelect, isSelecting, styles, theme]
    );

    const renderEmpty = () => {
        if (isSearching) {
            return (
                <View style={styles.stateContainer}>
                    <ActivityIndicator color={theme.color.accent} />
                    <ThemedText style={styles.stateText}>
                        Searching cities...
                    </ThemedText>
                </View>
            );
        }

        if (query.trim().length > 0 && suggestions.length === 0) {
            return (
                <View style={styles.stateContainer}>
                    <IconSymbol
                        name="alert-circle-outline"
                        size={32}
                        color={theme.color.textTertiary}
                    />
                    <ThemedText style={styles.stateText}>
                        No cities found
                    </ThemedText>
                    <ThemedText style={styles.stateHint}>
                        Try a different search term
                    </ThemedText>
                </View>
            );
        }

        return (
            <View style={styles.stateContainer}>
                <IconSymbol
                    name="search"
                    size={32}
                    color={theme.color.textTertiary}
                />
                <ThemedText style={styles.stateText}>
                    Search for a US city
                </ThemedText>
                <ThemedText style={styles.stateHint}>
                    Start typing to find your city
                </ThemedText>
            </View>
        );
    };

    return (
        <BottomSheetModal
            ref={internalRef}
            index={0}
            snapPoints={snapPoints}
            enablePanDownToClose
            onDismiss={handleDismiss}
            bottomInset={bottom}
            backgroundStyle={{ backgroundColor: theme.color.bg }}
            handleIndicatorStyle={{ backgroundColor: theme.color.border }}
            backdropComponent={renderBackdrop}
            enableContentPanningGesture={false}
            enableDynamicSizing={false}
            keyboardBehavior="extend"
            keyboardBlurBehavior="restore"
            android_keyboardInputMode="adjustResize"
        >
            {/* Header */}
            <View style={styles.header}>
                <ThemedText style={styles.title}>Select City</ThemedText>
                <Pressable
                    onPress={handleDismiss}
                    hitSlop={12}
                    style={({ pressed }) => [
                        styles.closeButton,
                        pressed && { opacity: 0.6 },
                    ]}
                >
                    <IconSymbol
                        name="close"
                        size={20}
                        color={theme.color.textSecondary}
                    />
                </Pressable>
            </View>

            {/* Search input */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <IconSymbol
                        name="search"
                        size={18}
                        color={theme.color.textTertiary}
                    />
                    <BottomSheetTextInput
                        style={styles.searchInput}
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Search US cities..."
                        placeholderTextColor={theme.color.placeholder}
                        autoCapitalize="words"
                        autoCorrect={false}
                        autoFocus
                    />
                    {isSearching && (
                        <ActivityIndicator
                            size="small"
                            color={theme.color.textTertiary}
                        />
                    )}
                    {!isSearching && query.length > 0 && (
                        <Pressable
                            onPress={() => setQuery('')}
                            hitSlop={8}
                            style={({ pressed }) => [
                                pressed && { opacity: 0.6 },
                            ]}
                        >
                            <IconSymbol
                                name="close-circle"
                                size={18}
                                color={theme.color.textTertiary}
                            />
                        </Pressable>
                    )}
                </View>
            </View>

            {/* Results or empty state */}
            {suggestions.length > 0 ? (
                <BottomSheetFlatList
                    data={suggestions}
                    keyExtractor={(item: CitySuggestion) => item.placeId}
                    renderItem={renderItem}
                    contentContainerStyle={[
                        styles.listContent,
                        { paddingBottom: bottom + theme.space.md },
                    ]}
                    keyboardShouldPersistTaps="handled"
                />
            ) : (
                <View style={{ flex: 1 }}>{renderEmpty()}</View>
            )}

            {/* Selecting overlay */}
            {isSelecting && (
                <View style={styles.selectingOverlay}>
                    <View style={styles.selectingCard}>
                        <ActivityIndicator
                            size="small"
                            color={theme.color.accent}
                        />
                        <ThemedText style={styles.selectingText}>
                            Setting your city...
                        </ThemedText>
                    </View>
                </View>
            )}
        </BottomSheetModal>
    );
});

CitySearchSheet.displayName = 'CitySearchSheet';

const createStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: theme.space.lg,
            paddingBottom: theme.space.sm,
        },
        title: {
            fontSize: theme.font.size.lg,
            fontWeight: theme.font.weight.bold as any,
            color: theme.color.textPrimary,
        },
        closeButton: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: theme.color.surface,
            justifyContent: 'center',
            alignItems: 'center',
        },
        searchContainer: {
            paddingHorizontal: theme.space.lg,
            paddingBottom: theme.space.md,
        },
        searchInputWrapper: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.color.inputBg,
            borderRadius: theme.radius.md,
            borderCurve: 'continuous',
            borderWidth: theme.border.hairline,
            borderColor: theme.color.inputBorder,
            paddingHorizontal: theme.space.sm,
            gap: theme.space.xs,
            height: 44,
        },
        searchInput: {
            flex: 1,
            fontSize: theme.font.size.md,
            color: theme.color.textPrimary,
            padding: 0,
        },
        listContent: {
            paddingHorizontal: theme.space.lg,
            gap: theme.space.xs,
        },
        resultItem: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: theme.space.md,
            paddingHorizontal: theme.space.sm,
            borderRadius: theme.radius.md,
            borderCurve: 'continuous',
            backgroundColor: theme.color.surface,
            borderWidth: theme.border.hairline,
            borderColor: theme.color.border,
            gap: theme.space.sm,
        },
        resultItemPressed: {
            backgroundColor: theme.color.surface2,
        },
        resultIcon: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: theme.color.accentSoft,
            justifyContent: 'center',
            alignItems: 'center',
        },
        resultContent: {
            flex: 1,
        },
        resultCity: {
            fontSize: theme.font.size.md,
            fontWeight: theme.font.weight.semibold as any,
            color: theme.color.textPrimary,
        },
        resultState: {
            fontSize: theme.font.size.sm,
            color: theme.color.textSecondary,
            marginTop: 1,
        },
        stateContainer: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: theme.space.xxl,
            gap: theme.space.sm,
        },
        stateText: {
            fontSize: theme.font.size.md,
            fontWeight: theme.font.weight.medium as any,
            color: theme.color.textSecondary,
        },
        stateHint: {
            fontSize: theme.font.size.sm,
            color: theme.color.textTertiary,
        },
        selectingOverlay: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0,0,0,0.3)',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: theme.radius.lg,
        },
        selectingCard: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space.sm,
            backgroundColor: theme.color.bg,
            paddingVertical: theme.space.md,
            paddingHorizontal: theme.space.lg,
            borderRadius: theme.radius.md,
            borderCurve: 'continuous',
            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
        },
        selectingText: {
            fontSize: theme.font.size.sm,
            fontWeight: theme.font.weight.medium as any,
            color: theme.color.textPrimary,
        },
    });
