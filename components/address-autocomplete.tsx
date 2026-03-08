import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/contexts/theme-provider';
import { AddressData, useAddressSearch } from '@/hooks/use-address-search';
import { useLocation } from '@/hooks/use-location';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';

interface AddressAutocompleteProps {
    onSelect: (address: AddressData) => void;
    placeholder?: string;
    error?: string;
}

export function AddressAutocomplete({
    onSelect,
    placeholder = 'Search for venue address...',
    error: externalError,
}: AddressAutocompleteProps) {
    const { data: locationData } = useLocation();
    const location = locationData?.location;
    const {
        query,
        setQuery,
        suggestions,
        loading,
        error,
        selectAddress,
        clearSearch,
    } = useAddressSearch({
        proximity: location
            ? { longitude: location.longitude, latitude: location.latitude }
            : null,
    });
    const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const { theme } = useTheme();

    const textColor = theme.color.textPrimary;
    const backgroundColor = theme.color.bg;
    const borderColor = theme.color.border;
    const placeholderColor = theme.color.placeholder;
    const suggestionBg = theme.color.surface;

    const handleSelect = async (suggestionId: string) => {
        setShowSuggestions(false);
        setQuery('');

        const addressData = await selectAddress(suggestionId);
        if (addressData) {
            setSelectedAddress(addressData.full_address);
            onSelect(addressData);
        }
    };

    const handleClear = () => {
        clearSearch();
        setSelectedAddress(null);
        setShowSuggestions(false);
    };

    const handleFocus = () => {
        if (!selectedAddress) {
            setShowSuggestions(true);
        }
    };

    const handleChangeText = (text: string) => {
        setQuery(text);
        setSelectedAddress(null);
        setShowSuggestions(true);
    };

    return (
        <ThemedView style={styles.container}>
            <View style={styles.inputContainer}>
                <TextInput
                    style={[
                        styles.input,
                        {
                            color: textColor,
                            backgroundColor,
                            borderColor: externalError
                                ? '#ff4444'
                                : borderColor,
                        },
                    ]}
                    value={query}
                    onChangeText={handleChangeText}
                    onFocus={handleFocus}
                    placeholder={
                        selectedAddress
                            ? 'Search for a different address...'
                            : placeholder
                    }
                    placeholderTextColor={placeholderColor}
                    autoCapitalize="none"
                    autoCorrect={false}
                />

                {query.length > 0 && (
                    <Pressable
                        style={styles.clearButton}
                        onPress={handleClear}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <ThemedText style={styles.clearButtonText}>
                            ✕
                        </ThemedText>
                    </Pressable>
                )}
            </View>

            {selectedAddress && (
                <View style={styles.selectedAddressContainer}>
                    <ThemedText style={styles.selectedAddressLabel}>
                        Selected Address:
                    </ThemedText>
                    <ThemedText style={styles.selectedAddressText}>
                        {selectedAddress}
                    </ThemedText>
                </View>
            )}

            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={textColor} />
                    <ThemedText style={styles.loadingText}>
                        Searching...
                    </ThemedText>
                </View>
            )}

            {(error || externalError) && (
                <ThemedText style={styles.errorText}>
                    {error || externalError}
                </ThemedText>
            )}

            {showSuggestions && suggestions.length > 0 && !selectedAddress && (
                <View
                    style={[
                        styles.suggestionsContainer,
                        {
                            backgroundColor,
                            borderColor,
                        },
                    ]}
                >
                    {suggestions.map((item, index) => (
                        <View key={item.mapbox_id}>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.suggestionItem,
                                    { backgroundColor: suggestionBg },
                                    pressed && { opacity: 0.7 },
                                ]}
                                onPress={() => handleSelect(item.mapbox_id)}
                            >
                                <ThemedText
                                    style={styles.suggestionName}
                                    numberOfLines={1}
                                >
                                    {item.name}
                                </ThemedText>
                                <ThemedText
                                    style={styles.suggestionAddress}
                                    numberOfLines={1}
                                >
                                    {item.full_address}
                                </ThemedText>
                            </Pressable>
                            {index < suggestions.length - 1 && (
                                <View
                                    style={[
                                        styles.separator,
                                        { backgroundColor: borderColor },
                                    ]}
                                />
                            )}
                        </View>
                    ))}
                </View>
            )}

            {showSuggestions &&
                suggestions.length === 0 &&
                !loading &&
                query.length > 2 &&
                !selectedAddress && (
                    <ThemedView
                        style={[
                            styles.noResultsContainer,
                            {
                                borderColor,
                            },
                        ]}
                    >
                        <ThemedText style={styles.noResultsText}>
                            No addresses found. Try a different search.
                        </ThemedText>
                    </ThemedView>
                )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        zIndex: 1000,
    },
    inputContainer: {
        position: 'relative',
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingRight: 40,
        fontSize: 16,
    },
    clearButton: {
        position: 'absolute',
        right: 12,
        top: 12,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        width: 24,
        height: 24,
    },
    clearButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    selectedAddressContainer: {
        marginTop: 12,
        padding: 12,
        borderRadius: 8,
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
    },
    selectedAddressLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
        opacity: 0.7,
    },
    selectedAddressText: {
        fontSize: 14,
        fontWeight: '500',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingHorizontal: 4,
    },
    loadingText: {
        marginLeft: 8,
        fontSize: 14,
    },
    errorText: {
        color: '#ff4444',
        fontSize: 14,
        marginTop: 4,
        paddingHorizontal: 4,
    },
    suggestionsContainer: {
        marginTop: 4,
        borderWidth: 1,
        borderRadius: 8,
        maxHeight: 250,
        overflow: 'hidden',
    },
    suggestionItem: {
        padding: 12,
    },
    suggestionName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    suggestionAddress: {
        fontSize: 14,
        opacity: 0.7,
    },
    separator: {
        height: 1,
    },
    noResultsContainer: {
        marginTop: 4,
        borderWidth: 1,
        borderRadius: 8,
        padding: 16,
    },
    noResultsText: {
        fontSize: 14,
        textAlign: 'center',
        opacity: 0.7,
    },
});
