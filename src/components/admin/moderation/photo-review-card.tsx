import type { PhotoForReview } from "@/lib/admin/moderation-queries";

type PhotoReviewCardProps = {
  photo: PhotoForReview;
};

export function PhotoReviewCard({ photo }: PhotoReviewCardProps) {
  return (
    <div className="bg-surface border border-border rounded-sm overflow-hidden">
      <div className="aspect-square relative">
        <img
          src={photo.photo_url}
          alt={`${photo.dish_type_name} at ${photo.restaurant_name}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <p className="text-sm text-white font-medium truncate">
            {photo.restaurant_name}
          </p>
          <p className="text-xs text-white/70">{photo.dish_type_name}</p>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">{photo.user_display_name}</span>
          <span
            className={`font-semibold ${
              photo.raw_score >= 7
                ? "text-success"
                : photo.raw_score >= 4
                  ? "text-warning"
                  : "text-danger"
            }`}
          >
            {photo.raw_score}/10
          </span>
        </div>
        {photo.created_at && (
          <p className="text-xs text-text-secondary mt-1">
            {new Date(photo.created_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
