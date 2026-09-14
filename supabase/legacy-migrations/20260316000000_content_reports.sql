-- Content reporting system for App Store compliance (UGC guideline 1.2)

-- Report reason enum
CREATE TYPE public.report_reason AS ENUM (
    'inappropriate_photo',
    'offensive',
    'spam',
    'other'
);

-- Report status enum
CREATE TYPE public.report_status AS ENUM (
    'pending',
    'reviewed',
    'dismissed',
    'actioned'
);

-- Content reports table
CREATE TABLE public.content_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reported_rating_id UUID NOT NULL REFERENCES public.personal_ratings(id) ON DELETE CASCADE,
    reason public.report_reason NOT NULL,
    description TEXT,
    status public.report_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_content_reports_status ON public.content_reports(status);
CREATE INDEX idx_content_reports_rating ON public.content_reports(reported_rating_id);
CREATE INDEX idx_content_reports_reporter ON public.content_reports(reporter_id);

-- Prevent duplicate reports from same user on same rating
CREATE UNIQUE INDEX idx_content_reports_unique_report
    ON public.content_reports(reporter_id, reported_rating_id);

-- RLS
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

-- Users can insert their own reports
CREATE POLICY "Users can create reports"
    ON public.content_reports
    FOR INSERT
    TO authenticated
    WITH CHECK (reporter_id = auth.uid());

-- Users can read their own reports (to check if they already reported)
CREATE POLICY "Users can read own reports"
    ON public.content_reports
    FOR SELECT
    TO authenticated
    USING (reporter_id = auth.uid());

-- RPC for submitting a report
CREATE OR REPLACE FUNCTION public.report_content(
    p_reported_rating_id UUID,
    p_reason TEXT,
    p_description TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_reporter_id UUID := auth.uid();
    v_report_id UUID;
    v_existing UUID;
BEGIN
    -- Check auth
    IF v_reporter_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Check the rating exists
    IF NOT EXISTS (SELECT 1 FROM personal_ratings WHERE id = p_reported_rating_id) THEN
        RAISE EXCEPTION 'Rating not found';
    END IF;

    -- Prevent self-reporting
    IF EXISTS (
        SELECT 1 FROM personal_ratings
        WHERE id = p_reported_rating_id AND user_id = v_reporter_id
    ) THEN
        RAISE EXCEPTION 'Cannot report your own content';
    END IF;

    -- Check for duplicate
    SELECT id INTO v_existing
    FROM content_reports
    WHERE reporter_id = v_reporter_id
      AND reported_rating_id = p_reported_rating_id;

    IF v_existing IS NOT NULL THEN
        RETURN json_build_object('success', true, 'already_reported', true);
    END IF;

    -- Insert report
    INSERT INTO content_reports (reporter_id, reported_rating_id, reason, description)
    VALUES (v_reporter_id, p_reported_rating_id, p_reason::report_reason, p_description)
    RETURNING id INTO v_report_id;

    RETURN json_build_object('success', true, 'report_id', v_report_id);
END;
$$;
