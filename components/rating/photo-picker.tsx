import { View, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface PhotoPickerProps {
  photos: string[];
  onAddPhoto: (uri: string) => void;
  onRemovePhoto: (uri?: string) => void;
  maxPhotos?: number;
  isLoading?: boolean;
  required?: boolean;
}

export function PhotoPicker({
  photos,
  onAddPhoto,
  onRemovePhoto,
  maxPhotos = 5,
  isLoading = false,
  required = false,
}: PhotoPickerProps) {
  const primaryColor = useThemeColor({}, 'primary');
  const backgroundColor = useThemeColor({}, 'surface');
  const textColor = useThemeColor({}, 'text');

  const handleAddPress = () => {
    if (photos.length >= maxPhotos) {
      Alert.alert('Maximum photos reached', `You can only upload up to ${maxPhotos} photos.`);
      return;
    }

    Alert.alert(
      'Add Photo',
      'Choose photo source',
      [
        {
          text: 'Camera',
          onPress: () => onAddPhoto('camera'),
        },
        {
          text: 'Gallery',
          onPress: () => onAddPhoto('gallery'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleRemovePress = (uri: string) => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onRemovePhoto(uri),
        },
      ]
    );
  };

  return (
    <ThemedView>
      <View style={styles.header}>
        <ThemedText type="defaultSemiBold">
          Photos {required && <ThemedText lightColor="#ee6c2b" darkColor="#ff8c50">*</ThemedText>}
        </ThemedText>
        <ThemedText style={styles.count} lightColor="#666" darkColor="#999">
          {photos.length}/{maxPhotos}
        </ThemedText>
      </View>

      <View style={styles.grid}>
        {photos.map((uri) => (
          <View key={uri} style={styles.photoContainer}>
            <Image source={{ uri }} style={styles.photo} />
            <TouchableOpacity
              style={[styles.removeButton, { backgroundColor: '#ee6c2b' }]}
              onPress={() => handleRemovePress(uri)}
              activeOpacity={0.8}
            >
              <IconSymbol name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}

        {photos.length < maxPhotos && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor, borderColor: primaryColor }]}
            onPress={handleAddPress}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator color={primaryColor} />
            ) : (
              <IconSymbol name="camera-alt" size={32} color={primaryColor} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {required && photos.length === 0 && (
        <ThemedText style={styles.required} lightColor="#ee6c2b" darkColor="#ff8c50">
          At least one photo is required
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  count: {
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  required: {
    fontSize: 13,
    marginTop: 8,
  },
});
