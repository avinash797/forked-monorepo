import { useQuery } from '@tanstack/react-query';

interface CharmData {
    id: string;
    name: string;
    icon_url?: string | null;
    icon_svg?: string | null;
}

export function useCharm(id: string) {
    return useQuery<CharmData | null>({
        queryKey: ['charm', id],
        queryFn: async () => {
            // Charms table not yet implemented — return null gracefully
            return null;
        },
        enabled: !!id,
        staleTime: Infinity,
    });
}
