import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type RestaurantInsert = Database['public']['Tables']['restaurants']['Insert'];

export interface RestaurantWithDistance extends Restaurant {
    distance_meters?: number;
}

/**
 * Search restaurants by name
 */
export function useSearchRestaurants(searchQuery: string = '') {
    return useQuery({
        queryKey: ['restaurants', searchQuery],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('restaurants')
                .select('*')
                .ilike('name', `%${searchQuery}%`)
                .limit(20);

            if (error) throw error;
            return data as Restaurant[];
        },
        enabled: !!searchQuery,
    });
}

/**
 * Get restaurants near a location
 * Uses PostGIS to calculate distance and sort by proximity
 */
export function useNearbyRestaurants(
    latitude: number | null,
    longitude: number | null,
    radiusMeters: number = 5000,
    limit: number = 20
) {
    return useQuery({
        queryKey: ['restaurants', 'nearby', latitude, longitude, radiusMeters, limit],
        queryFn: async () => {
            if (!latitude || !longitude) return [];

            const { data, error } = await supabase.rpc('find_nearby_restaurants', {
                p_lat: latitude,
                p_long: longitude,
                p_radius_meters: radiusMeters,
                p_limit: limit,
            });

            if (error) throw error;
            return (data ?? []) as RestaurantWithDistance[];
        },
        enabled: !!latitude && !!longitude,
    });
}

/**
 * Get a single restaurant by ID
 */
export function useRestaurant(restaurantId: string | null) {
    return useQuery({
        queryKey: ['restaurant', restaurantId],
        queryFn: async () => {
            if (!restaurantId) return null;

            const { data, error } = await supabase
                .from('restaurants')
                .select(
                    `
                    *,
                    city:cities(id, name, state),
                    neighborhood:neighborhoods(id, name)
                `
                )
                .eq('id', restaurantId)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!restaurantId,
    });
}

export interface CreateRestaurantInput {
    name: string;
    address?: string;
    city_id?: string;
    neighborhood_id?: string;
    latitude?: number;
    longitude?: number;
    google_place_id?: string;
    phone?: string;
    website?: string;
}

/**
 * Create a new restaurant
 */
export function useCreateRestaurant() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateRestaurantInput) => {
            const insertData: RestaurantInsert = {
                name: input.name,
                address: input.address,
                city_id: input.city_id,
                neighborhood_id: input.neighborhood_id,
                google_place_id: input.google_place_id,
                phone: input.phone,
                website: input.website,
            };

            // If coordinates provided, we'd need to convert to PostGIS format
            // For now, this requires a backend RPC or trigger

            const { data, error } = await supabase
                .from('restaurants')
                .insert(insertData)
                .select()
                .single();

            if (error) throw error;
            return data as Restaurant;
        },
        onSuccess: () => {
            // Invalidate restaurants queries to refresh lists
            queryClient.invalidateQueries({ queryKey: ['restaurants'] });
        },
    });
}
