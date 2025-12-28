import { supabase } from "@/lib/supabase";
import type { CreateReviewInput, Review } from "@/types/rating";
import { useState } from "react";

export function useCreateReview() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReview = async (
    input: CreateReviewInput,
    photoUrls: string[]
  ): Promise<Review | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const isGpsVerified =
        input.location_latitude !== null && input.location_longitude !== null;

      const { data, error: insertError } = await supabase
        .from("reviews")
        .insert({
          ...input,
          user_id: user.id,
          photo_urls: photoUrls,
          is_gps_verified: isGpsVerified,
          is_photo_verified: photoUrls.length > 0,
          moderation_status: "pending" as const,
        } as any)
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { createReview, isLoading, error };
}
