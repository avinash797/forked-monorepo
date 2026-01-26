import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { Image } from 'expo-image';
import React from 'react';
import {
    Linking,
    Platform,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';

export interface MapCardProps {
    latitude: number;
    longitude: number;
    title?: string;
    address?: string;
    height?: number;
    zoom?: number;
    showDirections?: boolean;
    style?: any;
    onPress?: () => void;
}

// Static map using OpenStreetMap tiles (no API key required)
function getStaticMapUrl(
    latitude: number,
    longitude: number,
    zoom: number = 15,
    width: number = 400,
    height: number = 200,
    isDark: boolean = false
): string {
    // Use OpenStreetMap static map service
    const baseUrl = 'https://staticmap.openstreetmap.de/staticmap.php';
    const marker = `${longitude},${latitude},red-pushpin`;
    return `${baseUrl}?center=${latitude},${longitude}&zoom=${zoom}&size=${width}x${height}&markers=${marker}`;
}

export function MapCard({
    latitude,
    longitude,
    title,
    address,
    height = 200,
    zoom = 15,
    showDirections = true,
    style,
    onPress,
}: MapCardProps) {
    const { theme, colorScheme } = useTheme();

    const openInMaps = () => {
        const url = Platform.select({
            ios: `maps:0,0?q=${title || 'Location'}@${latitude},${longitude}`,
            android: `geo:0,0?q=${latitude},${longitude}(${title || 'Location'})`,
            default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
        });

        if (url) {
            Linking.openURL(url);
        }
    };

    const mapImageUrl = getStaticMapUrl(
        latitude,
        longitude,
        zoom,
        400,
        height,
        colorScheme === 'dark'
    );

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            openInMaps();
        }
    };

    return (
        <ThemedView
            variant="surface"
            style={[styles.container, { height: height + 70 }, style]}
        >
            <Pressable onPress={handlePress} style={styles.mapContainer}>
                <Image
                    source={{ uri: mapImageUrl }}
                    style={[styles.map, { height }]}
                    contentFit="cover"
                    transition={300}
                />
                {/* Overlay marker for better visibility */}
                <View style={styles.markerOverlay}>
                    <View
                        style={[
                            styles.markerContainer,
                            { backgroundColor: theme.color.accent },
                        ]}
                    >
                        <IconSymbol
                            name="location"
                            size={16}
                            color={theme.color.accentOn}
                        />
                    </View>
                </View>
            </Pressable>

            {(title || address || showDirections) && (
                <View style={styles.contentContainer}>
                    <View style={styles.infoRow}>
                        <View style={styles.textContainer}>
                            {title && (
                                <ThemedText
                                    type="defaultSemiBold"
                                    numberOfLines={1}
                                >
                                    {title}
                                </ThemedText>
                            )}
                            {address && (
                                <ThemedText
                                    type="default"
                                    style={styles.addressText}
                                    numberOfLines={1}
                                >
                                    {address}
                                </ThemedText>
                            )}
                        </View>
                        {showDirections && (
                            <Pressable
                                style={[
                                    styles.directionsButton,
                                    { backgroundColor: theme.color.accentSoft },
                                ]}
                                onPress={openInMaps}
                            >
                                <IconSymbol
                                    name="navigate"
                                    size={20}
                                    color={theme.color.accent}
                                />
                            </Pressable>
                        )}
                    </View>
                </View>
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    mapContainer: {
        position: 'relative',
    },
    map: {
        width: '100%',
    },
    markerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
    },
    markerContainer: {
        padding: 6,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    contentContainer: {
        padding: 12,
        backgroundColor: 'transparent',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    textContainer: {
        flex: 1,
        marginRight: 12,
    },
    addressText: {
        opacity: 0.7,
        fontSize: 13,
    },
    directionsButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
