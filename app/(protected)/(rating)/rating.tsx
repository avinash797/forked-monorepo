import { LocationStatusBanner } from '@/components/rating/location-status-banner';
import { PhotoPicker } from '@/components/rating/photo-picker';
import { RatingInput } from '@/components/rating/rating-input';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/hooks/use-auth';
import { useGPSVerification, useLocation } from '@/hooks/use-location';
import { usePhotoUpload } from '@/hooks/use-photo-upload';
import { useCreateReview } from '@/hooks/use-reviews';
import { useRatingStore } from '@/stores';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

export default function RatingScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const {
        selectedVenue,
        selectedDish,
        rating,
        reviewText,
        photoUri,
        setRating,
        setReviewText,
        setPhotoUri,
    } = useRatingStore();
    const {
        createReview,
        isLoading: isSubmitting,
        error: createReviewError,
    } = useCreateReview();
    const {
        pickImage,
        takePhoto,
        uploadPhoto,
        deletePhoto,
        isLoading: isUploading,
    } = usePhotoUpload();
    const { data: locationData } = useLocation();
    const location = locationData?.location ?? null;
    const gpsStatus = useGPSVerification(
        location,
        selectedVenue
            ? {
                  latitude: selectedVenue.latitude,
                  longitude: selectedVenue.longitude,
              }
            : null
    );

    useEffect(() => {
        if (!selectedVenue || !selectedDish) {
            router.back();
        }
    }, [selectedVenue, selectedDish, router]);

    if (!selectedVenue || !selectedDish) {
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
            Alert.alert('Rating Required', 'Please select a rating (0-10)');
            return;
        }

        if (!photoUri) {
            Alert.alert(
                'Photo Required',
                'A photo is required to submit a review'
            );
            return;
        }

        if (!user) {
            Alert.alert('Error', 'You must be logged in to submit a review');
            return;
        }

        const uploaded = await uploadPhoto(photoUri, 'review', user.id);

        if (!uploaded) {
            Alert.alert(
                'Upload Error',
                'Failed to upload photo. Please try again.'
            );
            return;
        }

        const review = await createReview(
            {
                dish_id: selectedDish!.id,
                venue_id: selectedVenue!.id,
                rating: rating,
                review_text: reviewText.trim() || null,
                location_latitude: location?.latitude ?? null,
                location_longitude: location?.longitude ?? null,
            },
            [uploaded.url]
        );

        if (review) {
            router.push('/(protected)/(tabs)');
        } else {
            await deletePhoto(uploaded.storagePath);
            Alert.alert(
                'Error',
                createReviewError?.includes('duplicate key value')
                    ? 'You have already submitted a review for this dish'
                    : 'Failed to submit review. Please try again.'
            );
        }
    };

    const canSubmit = rating > 0 && !isSubmitting && !isUploading;

    return (
        <ScrollView style={styles.container}>
            <ThemedView style={styles.content}>
                <ThemedText style={styles.dishName} type="title">
                    {selectedDish.name}
                </ThemedText>

                <ThemedText
                    style={styles.venueText}
                    lightColor="#666"
                    darkColor="#999"
                >
                    at {selectedVenue.name}
                </ThemedText>

                <LocationStatusBanner status={gpsStatus} />

                <ThemedView style={styles.section}>
                    <ThemedText type="defaultSemiBold" style={styles.label}>
                        Your Rating{' '}
                        <ThemedText lightColor="#ee6c2b" darkColor="#ff8c50">
                            *
                        </ThemedText>
                    </ThemedText>
                    <View style={styles.ratingContainer}>
                        <RatingInput value={rating} onChange={setRating} />
                    </View>
                </ThemedView>

                <ThemedView style={styles.section}>
                    <ThemedTextInput
                        label="Review (optional)"
                        value={reviewText}
                        onChangeText={setReviewText}
                        placeholder="Share your thoughts about this dish..."
                        multiline
                        numberOfLines={5}
                    />
                </ThemedView>

                {!photoUri && (
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
                )}

                <ThemedButton
                    onPress={handleSubmit}
                    loading={isSubmitting || isUploading}
                    disabled={!canSubmit}
                    style={styles.submitButton}
                >
                    {isUploading ? 'Uploading Photos...' : 'Submit Review'}
                </ThemedButton>

                {!gpsStatus.isVerified && gpsStatus.hasPermission && (
                    <ThemedText
                        style={styles.warningText}
                        lightColor="#666"
                        darkColor="#999"
                    >
                        Your review will be submitted without GPS verification
                        since you&apos;re not at the venue.
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
    dishName: {
        marginBottom: 4,
    },
    venueText: {
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
