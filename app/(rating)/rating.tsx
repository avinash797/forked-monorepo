import { LocationStatusBanner } from "@/components/rating/location-status-banner";
import { PhotoPicker } from "@/components/rating/photo-picker";
import { StarRating } from "@/components/rating/star-rating";
import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedTextInput } from "@/components/themed-text-input";
import { ThemedView } from "@/components/themed-view";
import { useRatingFlow } from "@/contexts/rating-flow-context";
import { useAuth } from "@/hooks/use-auth";
import { useGPSVerification, useLocation } from "@/hooks/use-location";
import { usePhotoUpload } from "@/hooks/use-photo-upload";
import { useCreateReview } from "@/hooks/use-reviews";
import { useRouter } from "expo-router";
import { Alert, ScrollView, StyleSheet } from "react-native";

export default function RatingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { state, setStarRating, setReviewText, addPhoto, removePhoto } =
    useRatingFlow();
  const { createReview, isLoading: isSubmitting } = useCreateReview();
  const {
    pickImage,
    takePhoto,
    uploadPhoto,
    isLoading: isUploading,
  } = usePhotoUpload();
  const { location } = useLocation();
  const gpsStatus = useGPSVerification(
    location,
    state.selectedVenue
      ? {
          latitude: state.selectedVenue.latitude,
          longitude: state.selectedVenue.longitude,
        }
      : null
  );

  if (!state.selectedVenue || !state.selectedDish) {
    router.back();
    return null;
  }

  const handleAddPhoto = async (source: string) => {
    let uri: string | null = null;

    if (source === "camera") {
      uri = await takePhoto();
    } else if (source === "gallery") {
      uri = await pickImage();
    }

    if (uri) {
      addPhoto(uri);
    }
  };

  const handleSubmit = async () => {
    if (state.starRating === 0) {
      Alert.alert("Rating Required", "Please select a star rating (1-5)");
      return;
    }

    if (state.photoUris.length === 0) {
      Alert.alert(
        "Photo Required",
        "At least one photo is required to submit a review"
      );
      return;
    }

    if (!user) {
      Alert.alert("Error", "You must be logged in to submit a review");
      return;
    }

    const photoUrls: string[] = [];
    for (const uri of state.photoUris) {
      const uploaded = await uploadPhoto(uri, "review", user.id);
      if (uploaded) {
        photoUrls.push(uploaded.url);
      }
    }

    if (photoUrls.length === 0) {
      Alert.alert("Upload Error", "Failed to upload photos. Please try again.");
      return;
    }

    const review = await createReview(
      {
        dish_id: state.selectedDish!.id,
        venue_id: state.selectedVenue!.id,
        star_rating: state.starRating,
        review_text: state.reviewText.trim() || null,
        location_latitude: location?.latitude ?? null,
        location_longitude: location?.longitude ?? null,
      },
      photoUrls
    );

    if (review) {
      router.push("/(rating)/success");
    } else {
      Alert.alert("Error", "Failed to submit review. Please try again.");
    }
  };

  const canSubmit =
    state.starRating > 0 &&
    state.photoUris.length > 0 &&
    !isSubmitting &&
    !isUploading;

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText style={styles.dishName} type="title">
          {state.selectedDish.name}
        </ThemedText>

        <ThemedText style={styles.venueText} lightColor="#666" darkColor="#999">
          at {state.selectedVenue.name}
        </ThemedText>

        <LocationStatusBanner status={gpsStatus} />

        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.label}>
            Your Rating{" "}
            <ThemedText lightColor="#ee6c2b" darkColor="#ff8c50">
              *
            </ThemedText>
          </ThemedText>
          <StarRating
            value={state.starRating}
            onChange={setStarRating}
            size={40}
          />
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedTextInput
            label="Review (optional)"
            value={state.reviewText}
            onChangeText={setReviewText}
            placeholder="Share your thoughts about this dish..."
            multiline
            numberOfLines={5}
          />
        </ThemedView>

        <ThemedView style={styles.section}>
          <PhotoPicker
            photos={state.photoUris}
            onAddPhoto={handleAddPhoto}
            onRemovePhoto={removePhoto}
            maxPhotos={5}
            isLoading={isUploading}
            required
          />
        </ThemedView>

        <ThemedButton
          onPress={handleSubmit}
          loading={isSubmitting || isUploading}
          disabled={!canSubmit}
          style={styles.submitButton}
        >
          {isUploading ? "Uploading Photos..." : "Submit Review"}
        </ThemedButton>

        {!gpsStatus.isVerified && gpsStatus.hasPermission && (
          <ThemedText
            style={styles.warningText}
            lightColor="#666"
            darkColor="#999"
          >
            Your review will be submitted without GPS verification since
            you&apos;re not at the venue.
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
  label: {
    marginBottom: 12,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 32,
  },
});
