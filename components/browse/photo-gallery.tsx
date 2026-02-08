import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/contexts/theme-provider';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

interface PhotoGalleryProps {
    photos: string[];
    onPhotoPress?: (index: number) => void;
    maxVisible?: number;
}

export function PhotoGallery({
    photos,
    onPhotoPress,
    maxVisible = 6,
}: PhotoGalleryProps) {
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);

    if (!photos || photos.length === 0) {
        return null;
    }

    const visiblePhotos = photos.slice(0, maxVisible);
    const remainingCount = photos.length - maxVisible;
    const hasMore = remainingCount > 0;

    return (
        <View style={styles.container}>
            <View style={styles.grid}>
                {visiblePhotos.map((photoUrl, index) => {
                    const isLast = index === visiblePhotos.length - 1;
                    const showOverlay = isLast && hasMore;

                    return (
                        <Pressable
                            key={index}
                            onPress={() => onPhotoPress?.(index)}
                            style={({ pressed }) => [
                                styles.photoContainer,
                                pressed && { opacity: 0.8 },
                            ]}
                            disabled={!onPhotoPress}
                            android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
                        >
                            <Image
                                source={{ uri: photoUrl }}
                                style={styles.photo}
                                contentFit="cover"
                                transition={200}
                            />

                            {/* "+N more" overlay on last photo */}
                            {showOverlay && (
                                <View style={styles.overlay}>
                                    <ThemedText style={styles.overlayText}>
                                        +{remainingCount} more
                                    </ThemedText>
                                </View>
                            )}
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        container: {
            marginVertical: theme.space.xs,
        },
        grid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: theme.space.xs,
        },
        photoContainer: {
            width: '31%', // 3 columns with gap
            aspectRatio: 1,
            borderRadius: theme.radius.sm,
            overflow: 'hidden',
            backgroundColor: theme.color.border + '40',
        },
        photo: {
            width: '100%',
            height: '100%',
        },
        overlay: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            alignItems: 'center',
            justifyContent: 'center',
        },
        overlayText: {
            color: '#FFFFFF',
            fontSize: theme.font.size.md,
            fontWeight: theme.font.weight.semibold,
        },
    });
