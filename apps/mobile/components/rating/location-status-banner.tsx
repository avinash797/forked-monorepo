import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { StyleSheet } from 'react-native';

export interface LocationCoordinates {
    latitude: number;
    longitude: number;
    accuracy: number | null;
}

export interface GPSVerificationStatus {
    hasPermission: boolean;
    isVerified: boolean;
    distanceMeters: number | null;
    location: LocationCoordinates | null;
    error: string | null;
}

interface LocationStatusBannerProps {
    status: GPSVerificationStatus;
}

export function LocationStatusBanner({ status }: LocationStatusBannerProps) {
    if (!status.hasPermission) {
        return (
            <ThemedView style={[styles.banner, styles.errorBanner]}>
                <IconSymbol name="location-outline" size={20} color="#fff" />
                <ThemedText
                    style={styles.bannerText}
                    lightColor="#fff"
                    darkColor="#fff"
                >
                    Location permission required for verification
                </ThemedText>
            </ThemedView>
        );
    }

    if (status.error) {
        return (
            <ThemedView style={[styles.banner, styles.errorBanner]}>
                <IconSymbol name="warning" size={20} color="#fff" />
                <ThemedText
                    style={styles.bannerText}
                    lightColor="#fff"
                    darkColor="#fff"
                >
                    {status.error}
                </ThemedText>
            </ThemedView>
        );
    }

    if (!status.location) {
        return (
            <ThemedView style={[styles.banner, styles.infoBanner]}>
                <IconSymbol name="location-outline" size={20} color="#fff" />
                <ThemedText
                    style={styles.bannerText}
                    lightColor="#fff"
                    darkColor="#fff"
                >
                    Getting your location...
                </ThemedText>
            </ThemedView>
        );
    }

    if (status.isVerified) {
        return (
            <ThemedView style={[styles.banner, styles.successBanner]}>
                <IconSymbol
                    name="checkmark-circle-outline"
                    size={20}
                    color="#fff"
                />
                <ThemedText
                    style={styles.bannerText}
                    lightColor="#fff"
                    darkColor="#fff"
                >
                    Location verified! You&apos;re at the venue
                </ThemedText>
            </ThemedView>
        );
    }

    const distanceText =
        status.distanceMeters !== null
            ? status.distanceMeters < 1000
                ? `${Math.round(status.distanceMeters)}m`
                : `${(status.distanceMeters / 1000).toFixed(1)}km`
            : 'far';

    return (
        <ThemedView style={[styles.banner, styles.warningBanner]}>
            <IconSymbol name="warning" size={20} color="#333" />
            <ThemedText
                style={styles.bannerText}
                lightColor="#333"
                darkColor="#333"
            >
                You&apos;re {distanceText} from venue. Review won&apos;t be GPS
                verified.
            </ThemedText>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 10,
        marginBottom: 16,
    },
    successBanner: {
        backgroundColor: '#4caf50',
    },
    warningBanner: {
        backgroundColor: '#ffc107',
    },
    errorBanner: {
        backgroundColor: '#f44336',
    },
    infoBanner: {
        backgroundColor: '#2196f3',
    },
    bannerText: {
        fontSize: 14,
        flex: 1,
        fontWeight: '500',
    },
});
