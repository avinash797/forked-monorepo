import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';

interface PhotoPickerProps {
    photos: string[];
    onAddPhoto: (uri: string) => void;
    onRemovePhoto: (uri?: string) => void;
    maxPhotos?: number;
    isLoading?: boolean;
    required?: boolean;
    subtitle?: string;
}

export function PhotoPicker({
    photos,
    onAddPhoto,
    onRemovePhoto,
    maxPhotos = 1,
    isLoading = false,
    required = false,
    subtitle,
}: PhotoPickerProps) {
    const { theme } = useTheme();
    const primaryColor = theme.color.accent;
    const backgroundColor = theme.color.surface;
    const textColor = theme.color.textPrimary;

    const handleAddPress = () => {
        if (photos.length >= maxPhotos) {
            Alert.alert(
                'Maximum photos reached',
                `You can only upload up to ${maxPhotos} photos.`
            );
            return;
        }

        // Alert.alert('Add Photo', 'Choose photo source', [
        //     {
        //         text: 'Choose from Gallery',
        //         onPress: () => onAddPhoto('gallery'),
        //     },
        //     {
        //         text: 'Take a Photo',
        //         onPress: () => onAddPhoto('camera'),
        //     },
        //     {
        //         text: 'Cancel',
        //         style: 'cancel',
        //     },
        // ]);
        onAddPhoto('gallery');
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
                    Photos{' '}
                    {required && (
                        <ThemedText lightColor="#ee6c2b" darkColor="#ff8c50">
                            *
                        </ThemedText>
                    )}
                </ThemedText>
                <ThemedText
                    style={styles.count}
                    lightColor="#666"
                    darkColor="#999"
                >
                    {photos.length}/{maxPhotos}
                </ThemedText>
            </View>

            {subtitle && photos.length === 0 && (
                <ThemedText
                    style={styles.subtitle}
                    lightColor="#666"
                    darkColor="#999"
                >
                    {subtitle}
                </ThemedText>
            )}

            <View style={styles.grid}>
                {photos.map((uri) => (
                    <View key={uri} style={styles.photoContainer}>
                        <Image source={{ uri }} style={styles.photo} />
                        <Pressable
                            style={({ pressed }) => [
                                styles.removeButton,
                                { backgroundColor: '#ee6c2b' },
                                pressed && { opacity: 0.8 },
                            ]}
                            onPress={() => handleRemovePress(uri)}
                            android_ripple={{
                                color: 'rgba(255, 255, 255, 0.3)',
                                radius: 16,
                                borderless: true,
                            }}
                        >
                            <IconSymbol name="close" size={16} color="#fff" />
                        </Pressable>
                    </View>
                ))}

                {photos.length < maxPhotos && (
                    <Pressable
                        style={({ pressed }) => [
                            styles.addButton,
                            { backgroundColor, borderColor: primaryColor },
                            pressed && { opacity: 0.7 },
                        ]}
                        onPress={handleAddPress}
                        disabled={isLoading}
                        android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={primaryColor} />
                        ) : (
                            <IconSymbol
                                name="camera-outline"
                                size={32}
                                color={primaryColor}
                            />
                        )}
                    </Pressable>
                )}
            </View>

            {required && photos.length === 0 && (
                <ThemedText
                    style={styles.required}
                    lightColor="#ee6c2b"
                    darkColor="#ff8c50"
                >
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
    subtitle: {
        fontSize: 13,
        marginBottom: 8,
    },
    required: {
        fontSize: 13,
        marginTop: 8,
    },
});
