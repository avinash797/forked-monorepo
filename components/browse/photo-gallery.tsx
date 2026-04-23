import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import ImageViewing from 'react-native-image-viewing';

interface PhotoGalleryProps {
    photos: string[];
    onPhotoPress?: (index: number) => void;
    onReportPhoto?: (photoUrl: string) => void;
    maxVisible?: number;
}

export function PhotoGallery({
    photos,
    onPhotoPress,
    onReportPhoto,
    maxVisible = 6,
}: PhotoGalleryProps) {
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);
    const [viewerIndex, setViewerIndex] = useState<number | null>(null);

    const openViewer = (index: number) => {
        if (onPhotoPress) {
            onPhotoPress(index);
        } else {
            setViewerIndex(index);
        }
    };

    const closeViewer = () => setViewerIndex(null);

    const validPhotos = photos?.filter((url) => url) ?? [];

    if (validPhotos.length === 0) {
        return null;
    }

    const visiblePhotos = validPhotos.slice(0, maxVisible);
    const remainingCount = validPhotos.length - maxVisible;
    const hasMore = remainingCount > 0;

    const images = validPhotos.map((uri) => ({ uri }));

    return (
        <View style={styles.container}>
            <View style={styles.grid}>
                {visiblePhotos.map((photoUrl, index) => {
                    const isLast = index === visiblePhotos.length - 1;
                    const showOverlay = isLast && hasMore;

                    return (
                        <Pressable
                            key={index}
                            onPress={() => openViewer(index)}
                            onLongPress={
                                onReportPhoto
                                    ? () => onReportPhoto(photoUrl)
                                    : undefined
                            }
                            style={({ pressed }) => [
                                styles.photoContainer,
                                pressed && { opacity: 0.8 },
                            ]}
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

            <ImageViewing
                images={images}
                keyExtractor={(item, index) => index.toString() + item}
                imageIndex={viewerIndex ?? 0}
                visible={viewerIndex !== null}
                onRequestClose={closeViewer}
                animationType="fade"
                swipeToCloseEnabled
                FooterComponent={
                    onReportPhoto
                        ? ({ imageIndex }: { imageIndex: number }) => (
                            <View style={styles.viewerFooter}>
                                <Pressable
                                    onPress={() => {
                                        closeViewer();
                                        onReportPhoto(photos[imageIndex]);
                                    }}
                                    style={({ pressed }) => [
                                        styles.reportButton,
                                        pressed && { opacity: 0.7 },
                                    ]}
                                    hitSlop={8}
                                >
                                    <IconSymbol
                                        name="flag-outline"
                                        size={16}
                                        color="#fff"
                                    />
                                    <ThemedText style={styles.reportText}>
                                        Report
                                    </ThemedText>
                                </Pressable>
                            </View>
                        )
                        : undefined
                }
            />
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
        viewerHeader: {
            alignItems: 'flex-end',
            paddingHorizontal: 16,
            paddingTop: 8,
        },
        closeButton: {
            padding: 8,
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.2)',
        },
        viewerFooter: {
            alignItems: 'center',
            paddingBottom: 40,
        },
        reportButton: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.2)',
        },
        reportText: {
            color: '#fff',
            fontSize: theme.font.size.sm,
        },
    });
