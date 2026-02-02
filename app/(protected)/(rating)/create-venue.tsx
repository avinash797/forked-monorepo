import { AddressAutocomplete } from '@/components/address-autocomplete';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/lib/supabase';
import { useRatingStore } from '@/stores';
import { Database } from '@/types/database.types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { z } from 'zod';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];

const venueFormSchema = z.object({
    name: z.string().min(1, 'Restaurant name is required'),
    address: z
        .string()
        .min(1, 'Address is required - please select from suggestions'),
    address_street: z.string(),
    address_city: z.string(),
    address_state: z.string(),
    address_zip: z.string(),
    address_country: z.string(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
});

type VenueFormData = z.infer<typeof venueFormSchema>;

export default function CreateVenueScreen() {
    const router = useRouter();
    const { setSelectedRestaurant } = useRatingStore();
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        control,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<VenueFormData>({
        resolver: zodResolver(venueFormSchema),
        defaultValues: {
            name: '',
            address: '',
            address_street: '',
            address_city: '',
            address_state: '',
            address_zip: '',
            address_country: 'USA',
            latitude: null,
            longitude: null,
        },
    });

    const onSubmit = async (data: VenueFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const { data: result, error: rpcError } = await supabase.rpc(
                'upsert_restaurant_from_google',
                {
                    p_google_place_id: null as unknown as string,
                    p_name: data.name.trim(),
                    p_address: data.address,
                    p_city_name: data.address_city.trim(),
                    p_state: data.address_state.trim(),
                    p_country: data.address_country.trim(),
                    p_lat: data.latitude ?? undefined,
                    p_lng: data.longitude ?? undefined,
                }
            );

            if (rpcError) {
                throw new Error(rpcError.message);
            }

            if (!result || !result[0]) {
                throw new Error('Failed to create restaurant');
            }

            const restaurant = result[0] as Restaurant;
            setSelectedRestaurant(restaurant);
            queryClient.invalidateQueries({ queryKey: ['restaurants'] });

            Alert.alert('Success', 'Restaurant created successfully!', [
                {
                    text: 'OK',
                    onPress: () => router.back(),
                },
            ]);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to create restaurant'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <ThemedView style={styles.content}>
                <ThemedText style={styles.sectionTitle}>
                    Restaurant Information
                </ThemedText>

                <Controller
                    control={control}
                    name="name"
                    render={({ field: { onChange, value } }) => (
                        <ThemedTextInput
                            label="Restaurant Name"
                            value={value}
                            onChangeText={onChange}
                            placeholder="e.g., Joe's Diner"
                            error={errors.name?.message}
                        />
                    )}
                />

                <ThemedView style={styles.fieldContainer}>
                    <ThemedText style={styles.fieldLabel}>
                        Restaurant Address
                    </ThemedText>
                    <Controller
                        control={control}
                        name="address"
                        render={({ field: { onChange } }) => (
                            <AddressAutocomplete
                                onSelect={(addressData) => {
                                    setValue(
                                        'address_street',
                                        addressData.street
                                    );
                                    setValue('address_city', addressData.city);
                                    setValue(
                                        'address_state',
                                        addressData.state
                                    );
                                    setValue('address_zip', addressData.zip);
                                    setValue(
                                        'address_country',
                                        addressData.country
                                    );
                                    setValue('latitude', addressData.latitude);
                                    setValue(
                                        'longitude',
                                        addressData.longitude
                                    );
                                    onChange(addressData.full_address);
                                }}
                                placeholder="Search for restaurant address..."
                                error={errors.address?.message}
                            />
                        )}
                    />
                </ThemedView>

                {error && (
                    <ThemedText
                        style={styles.errorText}
                        lightColor="#f44336"
                        darkColor="#ff6b6b"
                    >
                        {error}
                    </ThemedText>
                )}

                <ThemedButton
                    onPress={handleSubmit(onSubmit)}
                    loading={isLoading}
                    style={styles.submitButton}
                >
                    Create Restaurant
                </ThemedButton>
            </ThemedView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 12,
    },
    fieldContainer: {
        marginBottom: 16,
    },
    fieldLabel: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
    },
    errorText: {
        fontSize: 14,
        marginTop: 12,
        textAlign: 'center',
    },
    submitButton: {
        marginTop: 24,
        marginBottom: 32,
    },
});
