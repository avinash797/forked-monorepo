import { useTheme } from '@/contexts/theme-provider';
import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetView,
} from '@gorhom/bottom-sheet';
import type { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
    type StyleProp,
    type ViewStyle,
} from 'react-native';
import { ThemedText } from './themed-text';
import { IconSymbol } from './ui/icon-symbol';

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

    const backgroundColor =
        colorScheme === 'light' ? lightColor : darkColor || theme.color.inputBg;

    const textColor = theme.color.textPrimary;
    const errorColor = theme.color.danger;
    const mutedColor = theme.color.textSecondary;
    const surfaceColor = theme.color.surface;
    const borderColor = error ? errorColor : 'transparent';

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
                    pressed && { opacity: 0.7 },
                    style,
                ]}
                android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
            >
                <ThemedText
                    style={[
                        styles.selectText,
                        !selectedOption && { color: mutedColor },
                    ]}
                >
                    {displayText}
                </ThemedText>
                <IconSymbol
                    name="arrow-drop-down"
                    size={20}
                    color={mutedColor}
                />
            </Pressable>
            {error && (
                <ThemedText
                    lightColor={lightLabelColor}
                    darkColor={darkLabelColor}
                    style={[styles.error, { color: errorColor }]}
                >
                    {error}
                </ThemedText>
            )}

            <BottomSheetModal
                ref={bottomSheetRef}
                snapPoints={['50%', '70%']}
                backdropComponent={renderBackdrop}
                onDismiss={handleClose}
                backgroundStyle={{ backgroundColor: surfaceColor }}
                handleIndicatorStyle={{ backgroundColor: mutedColor }}
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
                                color={textColor}
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
                                        color: textColor,
                                        borderColor: mutedColor,
                                    },
                                ]}
                                placeholder={searchPlaceholder}
                                placeholderTextColor={mutedColor}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus
                            />
                        </View>
                    )}
                    <ScrollView style={styles.optionsList}>
                        {filteredOptions.length === 0 ? (
                            <View style={styles.emptyState}>
                                <ThemedText
                                    style={[
                                        styles.emptyText,
                                        { color: mutedColor },
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
                                        pressed && { opacity: 0.7 },
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
                                            name="check"
                                            size={20}
                                            color={textColor}
                                        />
                                    )}
                                </Pressable>
                            ))
                        )}
                    </ScrollView>
                </BottomSheetView>
            </BottomSheetModal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    selectButton: {
        height: 50,
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    selectText: {
        fontSize: 16,
    },
    error: {
        fontSize: 12,
        marginTop: 4,
    },
    bottomSheetContent: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    optionsList: {
        maxHeight: 400,
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    },
    optionText: {
        fontSize: 16,
    },
    searchContainer: {
        padding: 16,
        paddingTop: 8,
        paddingBottom: 8,
    },
    searchInput: {
        height: 44,
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        borderWidth: 1,
    },
    emptyState: {
        padding: 32,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
    },
});
