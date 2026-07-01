import type { AddressData } from '@/hooks/use-address-search';
import type { Database } from '@forked/supabase';

type UpsertRestaurantArgs =
    Database['public']['Functions']['upsert_restaurant_from_google']['Args'];

export function buildUpsertRestaurantParams(
    addressData: AddressData
): UpsertRestaurantArgs {
    return {
        p_google_place_id: addressData.google_place_id,
        p_name: addressData.name,
        p_address: addressData.full_address,
        p_city_name: addressData.city,
        p_state: addressData.state,
        p_country: addressData.country,
        p_neighborhood_name: addressData.neighborhood || undefined,
        p_lat: addressData.latitude,
        p_lng: addressData.longitude,
        p_phone: addressData.phone || undefined,
        p_website: addressData.website || undefined,
        p_types: addressData.types,
        p_location_properties: {
            name: addressData.name,
            full_address: addressData.full_address,
            street: addressData.street,
            city: addressData.city,
            state: addressData.state,
            zip: addressData.zip,
            country: addressData.country,
            neighborhood: addressData.neighborhood,
            lat: addressData.latitude,
            lng: addressData.longitude,
            phone: addressData.phone,
            website: addressData.website,
            types: addressData.types,
        },
    };
}
