/**
 * Display-score rules shared by every Forked surface.
 *
 * Scores are 1.0–10.0, derived from Elo (see the rating algorithm docs).
 * Sentiment zones pin the bands: liked >= 7.0, okay 4.0–6.9, disliked < 4.0.
 */
export const SCORE_THRESHOLDS = {
    /** Scores at or above this render as the "liked" (green) band. */
    high: 7.0,
    /** Scores at or above this (but below `high`) render as the "okay" (amber) band. */
    mid: 4.0,
} as const;

export type ScoreTier = 'high' | 'mid' | 'low';

export function getScoreTier(score: number): ScoreTier {
    if (score >= SCORE_THRESHOLDS.high) return 'high';
    if (score >= SCORE_THRESHOLDS.mid) return 'mid';
    return 'low';
}

/** Canonical one-decimal score formatting (e.g. 8.4). */
export function formatScore(score: number): string {
    return score.toFixed(1);
}

/** Community-score confidence tiers, as returned in `confidence_tier` columns/RPCs. */
export const CONFIDENCE_TIERS = ['low', 'medium', 'high', 'very_high'] as const;

export type ConfidenceTier = (typeof CONFIDENCE_TIERS)[number];

export const CONFIDENCE_TIER_LABELS: Record<ConfidenceTier, string> = {
    very_high: 'Verified',
    high: 'Established',
    medium: 'Emerging',
    low: 'New',
};
