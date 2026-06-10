import { useTheme } from '@/contexts/theme-provider';
import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetScrollView,
    BottomSheetView,
} from '@gorhom/bottom-sheet';
import type { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
    Dimensions,
    Pressable,
    StyleSheet,
    TextInput,
    View,
    type StyleProp,
    type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from './themed-text';
import { IconSymbol } from './ui/icon-symbol';

type Theme = ReturnType<typeof useTheme>['theme'];

export type SelectOption = {
    readonly label: string;
    readonly value: string;
};

export type ThemedSelectProps = {
    lightColor?: string;
    darkColor?: string;
    lightLabelColor?: string;
    darkLabelColor?: string;
    error?: string;
    label?: string;
    placeholder?: string;
    value?: string;
    options: readonly SelectOption[];
    onValueChange?: (value: string) => void;
    style?: StyleProp<ViewStyle>;
    searchable?: boolean;
    searchPlaceholder?: string;
};

export function ThemedSelect({
    style,
    lightColor,
    darkColor,
    lightLabelColor,
    darkLabelColor,
    error,
    label,
    placeholder = 'Select an option',
    value,
    options,
    onValueChange,
    searchable = false,
    searchPlaceholder = 'Search...',
}: ThemedSelectProps) {
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const { theme, colorScheme } = useTheme();
    const styles = useMemo(() => createThemedStyles(theme), [theme]);
    const { bottom } = useSafeAreaInsets();
    const screenHeight = Dimensions.get('window').height;

    // Calculate snap point based on content height
    // Each option row ~53px, header ~57px, handle ~24px, search ~60px
    const OPTION_HEIGHT = 53;
    const HEADER_HEIGHT = 57;
    const HANDLE_HEIGHT = 24;
    const SEARCH_HEIGHT = searchable ? 60 : 0;
    const BOTTOM_PADDING = bottom * 3;

    const snapPoints = useMemo(() => {
        const contentHeight =
            HANDLE_HEIGHT +
            HEADER_HEIGHT +
            SEARCH_HEIGHT +
            options.length * OPTION_HEIGHT +
            BOTTOM_PADDING;
        const maxHeight = screenHeight * 0.9;
        const snappedHeight = Math.min(contentHeight, maxHeight);
        const percentage = Math.round((snappedHeight / screenHeight) * 100);
        return [`${percentage}%`];
    }, [options.length, screenHeight, SEARCH_HEIGHT, BOTTOM_PADDING]);

    const backgroundColor = theme.color.inputBg;

    const borderColor = error ? theme.color.danger : theme.color.inputBorder;

    const selectedOption = options.find((opt) => opt.value === value);
    const displayText = selectedOption?.label || placeholder;

    const filteredOptions = useMemo(() => {
        if (!searchable || !searchQuery.trim()) {
            return options;
        }
        const query = searchQuery.toLowerCase();
        return options.filter((opt) => opt.label.toLowerCase().includes(query));
    }, [options, searchQuery, searchable]);

    const handleSelect = (optionValue: string) => {
        onValueChange?.(optionValue);
        bottomSheetRef.current?.dismiss();
        setSearchQuery('');
    };

    const handleOpen = () => {
        bottomSheetRef.current?.present();
    };

    const handleClose = () => {
        setSearchQuery('');
    };

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
        <View style={styles.container}>
            {label && (
                <ThemedText
                    lightColor={lightLabelColor}
                    darkColor={darkLabelColor}
                    style={styles.label}
                >
                    {label}
                </ThemedText>
            )}
            <Pressable
                onPress={handleOpen}
                style={({ pressed }) => [
                    styles.selectButton,
                    { backgroundColor, borderColor },
                    pressed && { opacity: theme.opacity.pressed },
                    style,
                ]}
                android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
            >
                <ThemedText
                    style={[
                        styles.selectText,
                        !selectedOption && { color: theme.color.textSecondary },
                    ]}
                >
                    {displayText}
                </ThemedText>
                <IconSymbol name="chevron-down" size={20} color={theme.color.textSecondary} />
            </Pressable>
            {error && (
                <ThemedText
                    lightColor={lightLabelColor}
                    darkColor={darkLabelColor}
                    style={[styles.error, { color: theme.color.danger }]}
                >
                    {error}
                </ThemedText>
            )}

            <BottomSheetModal
                ref={bottomSheetRef}
                snapPoints={snapPoints}
                enableDynamicSizing={false}
                backdropComponent={renderBackdrop}
                onDismiss={handleClose}
                enablePanDownToClose
                backgroundStyle={{ backgroundColor: theme.color.surface }}
                handleIndicatorStyle={{ backgroundColor: theme.color.textSecondary }}
            >
                <BottomSheetView style={styles.bottomSheetContent}>
                    <View style={styles.modalHeader}>
                        <ThemedText style={styles.modalTitle}>
                            {label || 'Select an option'}
                        </ThemedText>
                        <Pressable
                            onPress={() => bottomSheetRef.current?.dismiss()}
                            hitSlop={{
                                top: 10,
                                bottom: 10,
                                left: 10,
                                right: 10,
                            }}
                            android_ripple={{
                                color: 'rgba(0, 0, 0, 0.1)',
                                radius: 20,
                                borderless: true,
                            }}
                        >
                            <IconSymbol
                                name="close"
                                size={24}
                                color={theme.color.textPrimary}
                            />
                        </Pressable>
                    </View>
                    {searchable && (
                        <View style={styles.searchContainer}>
                            <TextInput
                                style={[
                                    styles.searchInput,
                                    {
                                        backgroundColor,
                                        color: theme.color.textPrimary,
                                        borderColor: theme.color.inputBorder,
                                    },
                                ]}
                                placeholder={searchPlaceholder}
                                placeholderTextColor={theme.color.placeholder}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus
                            />
                        </View>
                    )}
                    <BottomSheetScrollView
                        style={styles.optionsList}
                        contentContainerStyle={{ paddingBottom: bottom * 3 }}
                    >
                        {filteredOptions.length === 0 ? (
                            <View style={styles.emptyState}>
                                <ThemedText
                                    style={[
                                        styles.emptyText,
                                        { color: theme.color.textSecondary },
                                    ]}
                                >
                                    No options found
                                </ThemedText>
                            </View>
                        ) : (
                            filteredOptions.map((option) => (
                                <Pressable
                                    key={option.value}
                                    style={({ pressed }) => [
                                        styles.option,
                                        option.value === value && {
                                            backgroundColor,
                                        },
                                        pressed && { opacity: theme.opacity.pressed },
                                    ]}
                                    onPress={() => handleSelect(option.value)}
                                    android_ripple={{
                                        color: 'rgba(0, 0, 0, 0.05)',
                                    }}
                                >
                                    <ThemedText style={styles.optionText}>
                                        {option.label}
                                    </ThemedText>
                                    {option.value === value && (
                                        <IconSymbol
                                            name="checkmark"
                                            size={20}
                                            color={theme.color.textPrimary}
                                        />
                                    )}
                                </Pressable>
                            ))
                        )}
                    </BottomSheetScrollView>
                </BottomSheetView>
            </BottomSheetModal>
        </View>
    );
}

const createThemedStyles = (theme: Theme) =>
    StyleSheet.create({
        container: {
            marginBottom: theme.space.md,
        },
        label: {
            fontSize: theme.font.size.sm,
            fontFamily: theme.font.family.semibold,
            marginBottom: theme.space.xs,
        },
        selectButton: {
            height: 50,
            borderRadius: theme.radius.sm,
            paddingHorizontal: theme.space.md,
            borderWidth: theme.border.hairline,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        selectText: {
            fontSize: theme.font.size.md,
        },
        error: {
            fontSize: theme.font.size.xs,
            marginTop: theme.space.xxs,
        },
        bottomSheetContent: {},
        modalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: theme.space.md,
            borderBottomWidth: theme.border.hairline,
            borderBottomColor: theme.color.divider,
        },
        modalTitle: {
            fontSize: theme.font.size.lg,
            fontFamily: theme.font.family.semibold,
        },
        optionsList: {},
        option: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: theme.space.md,
            borderBottomWidth: theme.border.hairline,
            borderBottomColor: theme.color.divider,
        },
        optionText: {
            fontSize: theme.font.size.md,
        },
        searchContainer: {
            padding: theme.space.md,
            paddingTop: theme.space.xs,
            paddingBottom: theme.space.xs,
        },
        searchInput: {
            height: 44,
            borderRadius: theme.radius.sm,
            paddingHorizontal: theme.space.md,
            fontSize: theme.font.size.md,
            borderWidth: theme.border.hairline,
        },
        emptyState: {
            padding: theme.space.xxl,
            alignItems: 'center',
        },
        emptyText: {
            fontSize: theme.font.size.sm,
        },
    });
