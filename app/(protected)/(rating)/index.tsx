import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { useRatingStore } from '@/stores';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

export default function TakePhotoScreen() {
    const router = useRouter();
    const { setPhotoUri } = useRatingStore();
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const { theme } = useTheme();
    const primaryColor = theme.color.accent;
    const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('off');

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
                <IconSymbol
                    name="camera-outline"
                    size={64}
                    color={primaryColor}
                />
                <ThemedText style={styles.permissionText}>
                    Camera access is required to take photos of your dishes
                </ThemedText>
                <ThemedButton
                    onPress={requestPermission}
                    style={styles.permissionButton}
                >
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
                setPhotoUri(photo.uri);
                router.push('/(protected)/(rating)/venue-search');
            }
        } catch (error: any) {
            Alert.alert('Error', 'Failed to take photo. Please try again.');
            console.error('Camera error:', error);
        }
    };

    async function handlePickFromGallery() {
        try {
            const { status } =
                await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Camera roll permission is required to select photos'
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [9, 16],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setPhotoUri(result.assets[0].uri);
                router.push('/(protected)/(rating)/venue-search');
            }
        } catch (error: any) {
            Alert.alert('Error', 'Failed to open gallery. Please try again.');
            console.error('Gallery error:', error);
        }
    }

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
                    onPress: () =>
                        router.push('/(protected)/(rating)/venue-search'),
                },
            ]
        );
    };

    const handleToggleFlash = () => {
        setFlashMode((current: 'off' | 'on' | 'auto') => {
            if (current === 'off') return 'on';
            if (current === 'on') return 'auto';
            return 'off';
        });
    };

    const getFlashIconName = () => {
        switch (flashMode) {
            case 'on':
                return 'flash';
            case 'auto':
                return 'flash-outline';
            default:
                return 'flash-off';
        }
    };

    return (
        <View style={styles.container}>
            <>
                {/* Live Camera View */}
                <CameraView
                    ref={cameraRef}
                    style={styles.camera}
                    facing="back"
                    pictureSize="16:9"
                    flash={flashMode}
                />
                {/* Camera Top Controls */}
                <View style={styles.topControls}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.galleryButton,
                            pressed && { opacity: 0.7 },
                        ]}
                        onPress={() => router.back()}
                        android_ripple={{
                            color: 'rgba(0, 0, 0, 0.1)',
                            radius: 25,
                            borderless: true,
                        }}
                    >
                        <IconSymbol
                            name="close"
                            size={32}
                            color={primaryColor}
                        />
                    </Pressable>
                    <Pressable
                        style={({ pressed }) => [
                            styles.galleryButton,
                            pressed && { opacity: 0.7 },
                        ]}
                        onPress={handleToggleFlash}
                        android_ripple={{
                            color: 'rgba(0, 0, 0, 0.1)',
                            radius: 25,
                            borderless: true,
                        }}
                    >
                        <IconSymbol
                            name={getFlashIconName()}
                            size={32}
                            color={primaryColor}
                        />
                    </Pressable>
                </View>

                {/* Camera Controls */}
                <View style={[styles.controls]}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.galleryButton,
                            pressed && { opacity: 0.7 },
                        ]}
                        onPress={handlePickFromGallery}
                        android_ripple={{
                            color: 'rgba(0, 0, 0, 0.1)',
                            radius: 35,
                        }}
                    >
                        <IconSymbol
                            name="images"
                            size={32}
                            color={primaryColor}
                        />
                        <ThemedText style={styles.galleryText}>
                            Gallery
                        </ThemedText>
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [
                            styles.captureButton,
                            { borderColor: primaryColor },
                            pressed && { opacity: 0.8 },
                        ]}
                        onPress={handleTakePhoto}
                        android_ripple={{
                            color: 'rgba(255, 255, 255, 0.3)',
                            radius: 40,
                        }}
                    >
                        <View
                            style={[
                                styles.captureInner,
                                { backgroundColor: primaryColor },
                            ]}
                        />
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [
                            styles.skipButton,
                            pressed && { opacity: 0.7 },
                        ]}
                        onPress={handleSkip}
                        android_ripple={{
                            color: 'rgba(0, 0, 0, 0.1)',
                            radius: 30,
                        }}
                    >
                        <ThemedText
                            style={styles.skipText}
                            lightColor="#666"
                            darkColor="#999"
                        >
                            Skip
                        </ThemedText>
                    </Pressable>
                </View>
            </>
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
    topControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 64,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 32,
        paddingBottom: 48,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
