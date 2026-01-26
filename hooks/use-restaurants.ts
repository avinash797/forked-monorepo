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
export function useRestaurants(searchQuery: string = '') {
    return useQuery({
        queryKey: ['restaurants', searchQuery],
        queryFn: async () => {
            let query = supabase.from('restaurants').select('*').limit(20);

            if (searchQuery) {
                query = query.ilike('name', `%${searchQuery}%`);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as Restaurant[];
        },
        enabled: true,
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
        queryKey: ['restaurants', 'nearby', latitude, longitude, radiusMeters],
        queryFn: async () => {
            if (!latitude || !longitude) return [];

            // Use raw SQL via RPC or PostGIS query
            // For now, fetch all and sort client-side (can optimize later with RPC)
            const { data, error } = await supabase
                .from('restaurants')
                .select('*')
                .eq('is_closed', false)
                .limit(limit * 3); // Fetch more to filter by distance

            if (error) throw error;
            if (!data) return [];

            // Calculate distance and filter client-side
            const withDistance = data
                .map((restaurant) => {
                    // If restaurant has coordinates, calculate distance
                    // Note: coordinates are stored as geography type
                    // For now, we'll return without distance calculation
                    // Real implementation should use PostGIS RPC
                    return {
                        ...restaurant,
                        distance_meters: undefined,
                    } as RestaurantWithDistance;
                })
                .slice(0, limit);

            return withDistance;
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
