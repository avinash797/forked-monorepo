import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRatingFlow } from '@/contexts/rating-flow-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

export default function TakePhotoScreen() {
  const router = useRouter();
  const { addPhoto } = useRatingFlow();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const primaryColor = useThemeColor({}, 'primary');
  const backgroundColor = useThemeColor({}, 'background');

  // Request camera permission on mount
  if (!permission) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Requesting camera permission...</ThemedText>
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.permissionContainer}>
        <IconSymbol name="camera-alt" size={64} color={primaryColor} />
        <ThemedText style={styles.permissionText}>
          Camera access is required to take photos of your dishes
        </ThemedText>
        <ThemedButton onPress={requestPermission} style={styles.permissionButton}>
          Grant Camera Permission
        </ThemedButton>
        <ThemedButton
          variant="secondary"
          onPress={handlePickFromGallery}
          style={styles.galleryButtonAlt}
        >
          Choose from Gallery Instead
        </ThemedButton>
      </ThemedView>
    );
  }

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
        shutterSound: false,
      });

      if (photo) {
        setCapturedImage(photo.uri);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      console.error('Camera error:', error);
    }
  };

  async function handlePickFromGallery() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera roll permission is required to select photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to open gallery. Please try again.');
      console.error('Gallery error:', error);
    }
  }

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleContinue = () => {
    if (capturedImage) {
      addPhoto(capturedImage);
      router.push('/(rating)/venue-search');
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Photo?',
      'A photo helps others see what you ate. Are you sure you want to skip?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: () => router.push('/(rating)/venue-search'),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {!capturedImage ? (
        <>
          {/* Live Camera View */}
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            ratio="16:9"
          />

          {/* Camera Controls */}
          <View style={[styles.controls]}>
            <TouchableOpacity
              style={styles.galleryButton}
              onPress={handlePickFromGallery}
            >
              <IconSymbol name="photo-library" size={32} color={primaryColor} />
              <ThemedText style={styles.galleryText}>Gallery</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.captureButton, { borderColor: primaryColor }]}
              onPress={handleTakePhoto}
            >
              <View style={[styles.captureInner, { backgroundColor: primaryColor }]} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <ThemedText style={styles.skipText} lightColor="#666" darkColor="#999">
                Skip
              </ThemedText>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          {/* Image Preview */}
          <View style={styles.previewContainer}>
            <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          </View>

          {/* Preview Controls */}
          <View style={[styles.previewControls, { backgroundColor }]}>
            <ThemedButton
              variant="secondary"
              onPress={handleRetake}
              style={styles.retakeButton}
            >
              Retake
            </ThemedButton>
            <ThemedButton onPress={handleContinue} style={styles.continueButton}>
              Continue
            </ThemedButton>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  permissionButton: {
    width: '100%',
    marginBottom: 12,
  },
  galleryButtonAlt: {
    width: '100%',
  },
  camera: {
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 32,
    paddingBottom: 48,
  },
  galleryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
  },
  galleryText: {
    fontSize: 12,
    marginTop: 4,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
  },
  skipText: {
    fontSize: 14,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 24,
    paddingBottom: 48,
    gap: 16,
  },
  retakeButton: {
    flex: 1,
  },
  continueButton: {
    flex: 1,
  },
});
