import { createNativeClient } from '@forked/supabase/native';

export const supabase = createNativeClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);
