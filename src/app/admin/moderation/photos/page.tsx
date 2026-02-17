import { getPhotosForReview } from "@/lib/admin/moderation-queries";
import { PhotoReviewCard } from "@/components/admin/moderation/photo-review-card";

export default async function PhotoReviewPage() {
  const photos = await getPhotosForReview(30);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#ECEDEE]">Photo Review</h1>
      <p className="text-sm text-[#9BA1A6]">
        Recent photos uploaded by users. Review for quality and appropriateness.
      </p>

      {photos.length === 0 ? (
        <div className="text-center py-12 text-[#9BA1A6]">
          <p>No photos to review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {photos.map((photo) => (
            <PhotoReviewCard key={photo.id} photo={photo} />
          ))}
        </div>
      )}
    </div>
  );
}
