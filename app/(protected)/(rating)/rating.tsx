import { ForkLogo } from '@/components/fork-logo';
import { LocationStatusBanner } from '@/components/rating/location-status-banner';
import { PhotoPicker } from '@/components/rating/photo-picker';
import { RatingInput } from '@/components/rating/rating-input';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/contexts/theme-provider';
import { useAuth } from '@/hooks/use-auth';
import { useGPSVerification, useLocation } from '@/hooks/use-location';
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
        rating,
        reviewText,
        photoUri,
        selectedTags,
        setRating,
        setReviewText,
        setPhotoUri,
        setSelectedTags,
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
    const { data: locationData } = useLocation();
    const location = locationData?.location ?? null;

    // Get taste tags for the selected dish type
    const { data: tasteTags } = useTasteTags(selectedDishType?.id || null);

    // GPS verification
    const gpsStatus = useGPSVerification(
        location,
        null // Restaurant coordinates not available in flat format yet
    );

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

    // useEffect(() => {
    //     if (!selectedRestaurant || !selectedDishType) {
    //         router.back();
    //     }
    // }, [selectedRestaurant, selectedDishType, router]);

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

    const handleRemovePhoto = () => {
        setPhotoUri(null);
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Rating Required', 'Please select a rating (1-10)');
            return;
        }

        if (!photoUri) {
            Alert.alert(
                'Photo Required',
                'A photo is mandatory to submit a rating'
            );
            return;
        }

        if (!user) {
            Alert.alert('Error', 'You must be logged in to submit a rating');
            return;
        }

        const uploaded = await uploadPhoto(photoUri, 'dish', user.id);

        if (!uploaded) {
            Alert.alert(
                'Upload Error',
                'Failed to upload photo. Please try again.'
            );
            return;
        }

        try {
            const result = await createRating({
                restaurant_id: selectedRestaurant.id,
                dish_type_id: selectedDishType.id,
                raw_score: rating,
                photo_url: uploaded.url,
                photo_storage_path: uploaded.storagePath,
                notes: reviewText.trim() || undefined,
                // location_verified: gpsStatus.isVerified ?? true,
                //TODO: Remove this when GPS verification is implemented
                location_verified: true,
                taste_tag_ids:
                    selectedTags.length > 0 ? selectedTags : undefined,
            });

            console.log(result);
            // If comparison should be triggered, navigate to compare screen
            if (result.should_compare && result.comparison_candidate_id) {
                console.log('Comparison should be triggered');
                // Navigate to compare screen - don't reset rating state yet
                // The compare screen will handle cleanup when done
                router.push({
                    pathname: '/(protected)/(rating)/compare',
                    params: {
                        newRatingId: result.rating_id,
                        comparisonRatingId: result.comparison_candidate_id,
                        dishTypeId: selectedDishType.id,
                    },
                });
            } else {
                console.log('Comparison should not be triggered');
                // Reset rating state and go back to home
                resetRating();
                router.dismissAll();
                router.replace('/(protected)/(tabs)');
            }
        } catch (error: any) {
            await deletePhoto(uploaded.storagePath);
            resetRating();
            Alert.alert(
                'Error',
                error.message?.includes('duplicate')
                    ? 'You have already rated this dish at this restaurant'
                    : 'Failed to submit rating. Please try again.'
            );
        }
    };

    const canSubmit = rating > 0 && photoUri && !isSubmitting && !isUploading;

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

                <LocationStatusBanner status={gpsStatus} />

                {/* Photo Section - Required */}
                <ThemedView style={styles.section}>
                    <PhotoPicker
                        photos={photoUri ? [photoUri] : []}
                        onAddPhoto={handleAddPhoto}
                        onRemovePhoto={handleRemovePhoto}
                        maxPhotos={1}
                        isLoading={isUploading}
                        required
                    />
                </ThemedView>

                {/* Rating Section */}
                <ThemedView style={styles.section}>
                    <ThemedText type="defaultSemiBold" style={styles.label}>
                        Your Rating (1-10){' '}
                        <ThemedText lightColor="#ee6c2b" darkColor="#ff8c50">
                            *
                        </ThemedText>
                    </ThemedText>
                    <View style={styles.ratingContainer}>
                        <RatingInput
                            value={rating}
                            onChange={setRating}
                            step={1}
                            thumbComponent={
                                <ForkLogo
                                    color={
                                        rating > 7
                                            ? theme.color.gold
                                            : rating > 3
                                              ? theme.color.silver
                                              : theme.color.bronze
                                    }
                                />
                            }
                        />
                    </View>
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
                                            isSelected && {
                                                backgroundColor:
                                                    theme.color.accent,
                                                borderColor: theme.color.accent,
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

                {!gpsStatus.isVerified && gpsStatus.hasPermission && (
                    <ThemedText
                        style={styles.warningText}
                        lightColor="#666"
                        darkColor="#999"
                    >
                        Your rating will be submitted without GPS verification.
                    </ThemedText>
                )}
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
    ratingContainer: {
        paddingHorizontal: 16,
    },
    label: {
        marginBottom: 12,
    },
    tagHint: {
        fontSize: 13,
        color: '#999',
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
        borderWidth: 1,
        borderColor: '#ddd',
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
    warningText: {
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 32,
    },
});
