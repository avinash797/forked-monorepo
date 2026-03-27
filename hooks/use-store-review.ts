import { usePreferencesStore } from '@/stores';
import * as StoreReview from 'expo-store-review';
import { useCallback } from 'react';

const RATINGS_BEFORE_PROMPT = 5;
const MIN_DAYS_BETWEEN_PROMPTS = 30;

export function useStoreReview() {
    const {
        ratingsCompletedSinceReview,
        lastReviewPromptDate,
        incrementRatingsCompleted,
        setLastReviewPromptDate,
    } = usePreferencesStore();

    const maybeRequestReview = useCallback(async () => {
        // Check if we've hit the threshold
        const newCount = ratingsCompletedSinceReview + 1;
        incrementRatingsCompleted();

        if (newCount < RATINGS_BEFORE_PROMPT) return;

        // Check cooldown
        if (lastReviewPromptDate) {
            const daysSince =
                (Date.now() - lastReviewPromptDate) / (1000 * 60 * 60 * 24);
            if (daysSince < MIN_DAYS_BETWEEN_PROMPTS) return;
        }

        // Check if review is available
        const isAvailable = await StoreReview.isAvailableAsync();
        if (!isAvailable) return;

        await StoreReview.requestReview();
        setLastReviewPromptDate(Date.now());
    }, [
        ratingsCompletedSinceReview,
        lastReviewPromptDate,
        incrementRatingsCompleted,
        setLastReviewPromptDate,
    ]);

    return { maybeRequestReview };
}
