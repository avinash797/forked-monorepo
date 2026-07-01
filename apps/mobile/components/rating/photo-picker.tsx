import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { useMemo } from 'react';
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
    const styles = useMemo(() => createThemedStyles(theme), [theme]);

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
                <ThemedText type="defaultSemiBold" style={styles.title}>
                    Photos{' '}
                    {required && (
                        <ThemedText style={styles.accent}>*</ThemedText>
                    )}
                </ThemedText>
                <ThemedText style={styles.count}>
                    {photos.length}/{maxPhotos}
                </ThemedText>
            </View>

            {subtitle && photos.length === 0 && (
                <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
            )}

            <View style={styles.grid}>
                {photos.map((uri) => (
                    <View key={uri} style={styles.photoContainer}>
                        <Image source={{ uri }} style={styles.photo} />
                        <Pressable
                            style={({ pressed }) => [
                                styles.removeButton,
                                pressed && { opacity: theme.opacity.pressed },
                            ]}
                            onPress={() => handleRemovePress(uri)}
                            android_ripple={{
                                color: 'rgba(255, 255, 255, 0.3)',
                                radius: 16,
                                borderless: true,
                            }}
                        >
                            <IconSymbol
                                name="close"
                                size={16}
                                color={theme.color.accentOn}
                            />
                        </Pressable>
                    </View>
                ))}

                {photos.length < maxPhotos && (
                    <Pressable
                        style={({ pressed }) => [
                            styles.addButton,
                            pressed && { opacity: theme.opacity.pressed },
                        ]}
                        onPress={handleAddPress}
                        disabled={isLoading}
                        android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={theme.color.accent} />
                        ) : (
                            <IconSymbol
                                name="camera-outline"
                                size={32}
                                color={theme.color.accent}
                            />
                        )}
                    </Pressable>
                )}
            </View>

            {required && photos.length === 0 && (
                <ThemedText style={styles.required}>
                    At least one photo is required
                </ThemedText>
            )}
        </ThemedView>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.space.xxs,
        },
        accent: {
            color: theme.color.accent,
        },
        count: {
            fontSize: theme.font.size.sm,
            color: theme.color.textSecondary,
        },
        grid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: theme.space.sm,
        },
        photoContainer: {
            position: 'relative',
            width: 100,
            height: 100,
        },
        photo: {
            width: 100,
            height: 100,
            borderRadius: theme.radius.sm,
            borderCurve: 'continuous',
        },
        removeButton: {
            position: 'absolute',
            top: -6,
            right: -6,
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: theme.color.accent,
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: `0px ${theme.shadow.sm.y}px ${theme.shadow.sm.radius}px rgba(0, 0, 0, ${theme.shadow.sm.opacity})`,
        },
        addButton: {
            width: 100,
            height: 100,
            borderRadius: theme.radius.sm,
            borderCurve: 'continuous',
            borderWidth: theme.border.thick,
            borderStyle: 'dashed',
            borderColor: theme.color.accent,
            backgroundColor: theme.color.surface,
            justifyContent: 'center',
            alignItems: 'center',
        },
        title: {
            marginBottom: 0,
        },
        subtitle: {
            fontSize: theme.font.size.xs + 1,
            color: theme.color.textSecondary,
            marginBottom: theme.space.xs,
        },
        required: {
            fontSize: theme.font.size.xs + 1,
            color: theme.color.accent,
            marginTop: theme.space.xs,
        },
    });
