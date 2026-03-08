import { PhotoPicker } from '@/components/rating/photo-picker';
import { SentimentPicker } from '@/components/rating/sentiment-picker';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/contexts/theme-provider';
import { useAuth } from '@/hooks/use-auth';
import { usePhotoUpload } from '@/hooks/use-photo-upload';
import { useCreateRating, useTasteTags } from '@/hooks/use-ratings';
import { useRatingStore } from '@/stores';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

export default function RatingScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const { user } = useAuth();
    const {
        selectedRestaurant,
        selectedDishType,
        selectedVariationId,
        sentiment,
        reviewText,
        photoUri,
        selectedTags,
        setSentiment,
        setReviewText,
        setPhotoUri,
        setSelectedTags,
        setBattleState,
        resetRating,
    } = useRatingStore();

    const { mutateAsync: createRating, isPending: isSubmitting } =
        useCreateRating();
    const {
        pickImage,
        takePhoto,
        uploadPhoto,
        deletePhoto,
        isLoading: isUploading,
    } = usePhotoUpload();

    const { data: tasteTags } = useTasteTags(selectedDishType?.id || null);

    const toggleTag = useCallback(
        (tagId: string) => {
            if (selectedTags.includes(tagId)) {
                setSelectedTags(selectedTags.filter((t) => t !== tagId));
            } else if (selectedTags.length < 5) {
                setSelectedTags([...selectedTags, tagId]);
            }
        },
        [selectedTags, setSelectedTags]
    );

    if (!selectedRestaurant || !selectedDishType) {
        return null;
    }

    const handleAddPhoto = async (source: string) => {
        let uri: string | null = null;

        if (source === 'camera') {
            uri = await takePhoto();
        } else if (source === 'gallery') {
            uri = await pickImage();
        }

        if (uri) {
            setPhotoUri(uri);
        }
    };

    const handleRemovePhoto = (_uri?: string) => {
        setPhotoUri(null);
    };

    const handleSubmit = async () => {
        if (!sentiment) {
            Alert.alert('Rating Required', 'Please select how the dish was');
            return;
        }

        if (!user) {
            Alert.alert('Error', 'You must be logged in to submit a rating');
            return;
        }

        let uploadedUrl: string | undefined;
        let uploadedStoragePath: string | undefined;

        if (photoUri) {
            const uploaded = await uploadPhoto(photoUri, 'dish', user.id);

            if (!uploaded) {
                Alert.alert(
                    'Upload Error',
                    'Failed to upload photo. Please try again.'
                );
                return;
            }
            uploadedUrl = uploaded.url;
            uploadedStoragePath = uploaded.storagePath;
        }

        try {
            const result = await createRating({
                restaurant_id: selectedRestaurant.id,
                dish_type_id: selectedDishType.id,
                sentiment,
                photo_url: uploadedUrl,
                photo_storage_path: uploadedStoragePath,
                variation_id: selectedVariationId ?? undefined,
                notes: reviewText.trim() || undefined,
                taste_tag_ids: selectedTags,
            });

            if (!result.battle_complete && result.battle_id && result.opponent) {
                const totalCandidates = result.total_candidates ?? 1;
                const maxSteps = Math.floor(Math.log2(totalCandidates)) + 1;
                setBattleState({
                    battleId: result.battle_id,
                    ratingId: result.rating_id,
                    maxSteps,
                    currentStep: 1,
                    opponent: result.opponent,
                });
                router.push({
                    pathname: '/(protected)/(rating)/compare',
                    params: {
                        yourPhoto: uploadedUrl ?? '',
                        yourRestaurant: selectedRestaurant.name,
                        dishTypeName: selectedDishType.name,
                        dishTypeId: selectedDishType.id,
                    },
                });
            } else {
                resetRating();
                router.dismissAll();
                router.replace('/(protected)/(tabs)');
            }
        } catch (error: any) {
            if (uploadedStoragePath) {
                await deletePhoto(uploadedStoragePath);
            }
            Alert.alert(
                'Error',
                'Failed to submit rating. Please try again.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            resetRating();
                            router.dismissAll();
                            router.replace('/(protected)/(tabs)');
                        },
                    },
                ]
            );
        }
    };

    const canSubmit = sentiment !== null && !isSubmitting && !isUploading;

    return (
        <ScrollView style={styles.container}>
            <ThemedView style={styles.content}>
                <View style={styles.header}>
                    <ThemedText style={styles.emoji}>
                        {selectedDishType.emoji}
                    </ThemedText>
                    <ThemedText style={styles.dishTypeName} type="title">
                        {selectedDishType.name}
                    </ThemedText>
                </View>

                <ThemedText
                    style={styles.restaurantText}
                    lightColor="#666"
                    darkColor="#999"
                >
                    at {selectedRestaurant.name}
                </ThemedText>

                {/* Sentiment Section */}
                <ThemedView style={styles.section}>
                    <ThemedText type="defaultSemiBold" style={styles.label}>
                        How was it?{' '}
                        <ThemedText lightColor="#ee6c2b" darkColor="#ff8c50">
                            *
                        </ThemedText>
                    </ThemedText>
                    <SentimentPicker
                        value={sentiment}
                        onChange={setSentiment}
                        disabled={isSubmitting}
                    />
                </ThemedView>

                {/* Photo Section */}
                <ThemedView style={styles.section}>
                    <PhotoPicker
                        photos={photoUri ? [photoUri] : []}
                        onAddPhoto={handleAddPhoto}
                        onRemovePhoto={handleRemovePhoto}
                        maxPhotos={1}
                        isLoading={isUploading}
                        subtitle="Add a photo to increase the weight of your rating"
                    />
                </ThemedView>

                {/* Taste Tags Section */}
                {tasteTags && tasteTags.length > 0 && (
                    <ThemedView style={styles.section}>
                        <ThemedText type="defaultSemiBold" style={styles.label}>
                            Taste Tags (optional)
                        </ThemedText>
                        <ThemedText style={styles.tagHint}>
                            Select up to 5 that describe this dish
                        </ThemedText>
                        <View style={styles.tagsContainer}>
                            {tasteTags.map((tag) => {
                                const isSelected = selectedTags.includes(
                                    tag.id
                                );
                                return (
                                    <Pressable
                                        key={tag.id}
                                        style={[
                                            styles.tag,
                                            { borderColor: isSelected ? theme.color.accent : theme.color.border },
                                            isSelected && {
                                                backgroundColor:
                                                    theme.color.accent,
                                            },
                                        ]}
                                        onPress={() => toggleTag(tag.id)}
                                    >
                                        <ThemedText
                                            style={[
                                                styles.tagText,
                                                isSelected && {
                                                    color: theme.color.accentOn,
                                                },
                                            ]}
                                        >
                                            {tag.name}
                                        </ThemedText>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </ThemedView>
                )}

                {/* Notes Section */}
                <ThemedView style={styles.section}>
                    <ThemedTextInput
                        label="Notes (optional)"
                        value={reviewText}
                        onChangeText={setReviewText}
                        placeholder="Any thoughts about this dish..."
                        multiline
                        numberOfLines={3}
                    />
                </ThemedView>

                <ThemedButton
                    onPress={handleSubmit}
                    loading={isSubmitting || isUploading}
                    disabled={!canSubmit}
                    style={styles.submitButton}
                >
                    {isUploading ? 'Uploading Photo...' : 'Submit Rating'}
                </ThemedButton>
            </ThemedView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 4,
    },
    emoji: {
        fontSize: 32,
    },
    dishTypeName: {
        fontSize: 24,
        fontWeight: '700',
    },
    restaurantText: {
        fontSize: 16,
        marginBottom: 20,
    },
    section: {
        marginBottom: 24,
    },
    label: {
        marginBottom: 12,
    },
    tagHint: {
        fontSize: 13,
        color: undefined, // uses ThemedText default
        opacity: 0.6,
        marginBottom: 12,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderCurve: 'continuous',
        borderWidth: 1,
        backgroundColor: 'transparent',
    },
    tagText: {
        fontSize: 14,
        fontWeight: '500',
    },
    submitButton: {
        marginTop: 8,
        marginBottom: 16,
    },
});
