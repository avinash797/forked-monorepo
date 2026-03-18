import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
        'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return jsonResponse({ error: 'Missing authorization header' }, 401);
        }

        // --- 1. Verify the caller & extract user ID ---
        // Use the service role key to verify the JWT without needing the anon key
        const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            auth: { persistSession: false },
        });

        const token = authHeader.replace('Bearer ', '');
        const {
            data: { user },
            error: userError,
        } = await adminClient.auth.getUser(token);

        if (userError || !user) {
            console.error('Auth verification failed:', userError?.message);
            return jsonResponse({ error: 'Invalid or expired session' }, 401);
        }

        const userId = user.id;

        // --- 2. Anonymize user data ---
        // Use a client authenticated as the user so that auth.uid() works
        // inside the anonymize_user_data RPC (it checks auth.uid() == p_user_id)
        const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: authHeader } },
            auth: { persistSession: false },
        });

        const { data: anonymizeResult, error: anonymizeError } =
            await userClient.rpc('anonymize_user_data', { p_user_id: userId });

        if (anonymizeError) {
            console.error('Anonymize error:', anonymizeError);
            return jsonResponse(
                { error: 'Failed to anonymize user data', details: anonymizeError.message },
                500
            );
        }

        // --- 3. Delete storage objects (best-effort, don't block on failure) ---
        const photoPaths: string[] = anonymizeResult?.photo_storage_paths ?? [];
        const avatarPath: string | null = anonymizeResult?.avatar_path ?? null;

        if (photoPaths.length > 0) {
            const { error: photoDeleteError } = await adminClient.storage
                .from('dish-photos')
                .remove(photoPaths);
            if (photoDeleteError) {
                console.error('Failed to delete dish photos:', photoDeleteError.message);
            }
        }

        if (avatarPath) {
            // avatar_url is a full URL; extract the storage path after the bucket name
            const avatarStoragePath = avatarPath.includes('/avatars/')
                ? avatarPath.split('/avatars/').pop()
                : null;
            if (avatarStoragePath) {
                const { error: avatarDeleteError } = await adminClient.storage
                    .from('avatars')
                    .remove([avatarStoragePath]);
                if (avatarDeleteError) {
                    console.error('Failed to delete avatar:', avatarDeleteError.message);
                }
            }
        }

        // --- 4. Delete the auth account (requires service role) ---
        const { error: deleteError } =
            await adminClient.auth.admin.deleteUser(userId);

        if (deleteError) {
            console.error('Delete auth user error:', deleteError);
            return jsonResponse(
                { error: 'Failed to delete auth account', details: deleteError.message },
                500
            );
        }

        return jsonResponse({
            success: true,
            message: 'Account deleted successfully',
            anonymize_result: anonymizeResult,
        });
    } catch (err) {
        console.error('Unexpected error:', err);
        return jsonResponse({ error: 'Internal server error' }, 500);
    }
});
