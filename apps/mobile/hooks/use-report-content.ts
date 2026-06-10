import { supabase } from '@/lib/supabase';
import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';

export type ReportReason =
    | 'inappropriate_photo'
    | 'offensive'
    | 'spam'
    | 'other';

interface ReportContentInput {
    ratingId: string;
    reason: ReportReason;
    description?: string;
}

interface ReportContentResponse {
    success: boolean;
    report_id?: string;
    already_reported?: boolean;
}

export function useReportContent() {
    return useMutation({
        mutationFn: async (
            input: ReportContentInput
        ): Promise<ReportContentResponse> => {
            // Note: 'report_content' RPC is defined in migration 20260316000000.
            // After applying the migration and regenerating types, remove this cast.
            const { data, error } = await (supabase.rpc as any)(
                'report_content',
                {
                    p_reported_rating_id: input.ratingId,
                    p_reason: input.reason,
                    p_description: input.description ?? null,
                }
            );

            if (error) throw error;
            return data as unknown as ReportContentResponse;
        },
        onSuccess: (data) => {
            if (data.already_reported) {
                Alert.alert(
                    'Already Reported',
                    'You have already reported this content. Our team will review it.'
                );
            } else {
                Alert.alert(
                    'Report Submitted',
                    'Thank you for helping keep Forked safe. Our team will review this report.'
                );
            }
        },
        onError: (error: Error) => {
            if (error.message?.includes('Cannot report your own content')) {
                Alert.alert('Error', 'You cannot report your own content.');
            } else {
                Alert.alert(
                    'Error',
                    'Failed to submit report. Please try again.'
                );
            }
        },
    });
}
