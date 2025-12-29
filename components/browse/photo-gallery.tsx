import { ThemedText } from '@/components/themed-text';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';

interface PhotoGalleryProps {
  photos: string[];
  onPhotoPress?: (index: number) => void;
  maxVisible?: number;
}

/**
 * Photo gallery component displaying photos in a 3-column grid
 * Shows "+N more" overlay on last photo if there are more than maxVisible
 * Used in: Review cards, dish detail screen
 */
export function PhotoGallery({
  photos,
  onPhotoPress,
  maxVisible = 6,
}: PhotoGalleryProps) {
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
            <TouchableOpacity
              key={index}
              onPress={() => onPhotoPress?.(index)}
              activeOpacity={0.8}
              style={styles.photoContainer}
              disabled={!onPhotoPress}
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
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoContainer: {
    width: '31%', // 3 columns with gap
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
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
    fontSize: 16,
    fontWeight: '600',
  },
});
