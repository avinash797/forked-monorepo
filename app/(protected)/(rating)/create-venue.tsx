import { AddressAutocomplete } from '@/components/address-autocomplete';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { useRatingFlow } from '@/contexts/rating-flow-context';
import { useCreateVenue } from '@/hooks/use-venues';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { z } from 'zod';

const venueFormSchema = z.object({
    name: z.string().min(1, 'Venue name is required'),
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
    cuisine_types: z.string(),
    price_range: z.string().refine(
        (val) => {
            if (!val || val === '') return true;
            const num = parseInt(val, 10);
            return !isNaN(num) && num >= 1 && num <= 4;
        },
        { message: 'Price range must be between 1 and 4' }
    ),
});

type VenueFormData = z.infer<typeof venueFormSchema>;

export default function CreateVenueScreen() {
    const router = useRouter();
    const { setVenue } = useRatingFlow();
    const {
        mutateAsync: createVenue,
        isPending: isLoading,
        error: createError,
    } = useCreateVenue();
    const error = createError ? (createError as Error).message : null;

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
            cuisine_types: '',
            price_range: '',
        },
    });

    const onSubmit = async (data: VenueFormData) => {
        const cuisineTypes = data.cuisine_types
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);

        const priceRange =
            data.price_range && data.price_range !== ''
                ? parseInt(data.price_range, 10)
                : null;

        const venue = await createVenue({
            name: data.name.trim(),
            address_street: data.address_street.trim(),
            address_city: data.address_city.trim(),
            address_state: data.address_state.trim(),
            address_zip: data.address_zip.trim(),
            address_country: data.address_country.trim(),
            latitude: data.latitude,
            longitude: data.longitude,
            cuisine_types: cuisineTypes,
            price_range: priceRange,
        });

        if (venue) {
            setVenue(venue);
            Alert.alert('Success', 'Venue created successfully!', [
                {
                    text: 'OK',
                    onPress: () => router.back(),
                },
            ]);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <ThemedView style={styles.content}>
                <ThemedText style={styles.sectionTitle}>
                    Venue Information
                </ThemedText>

                <Controller
                    control={control}
                    name="name"
                    render={({ field: { onChange, value } }) => (
                        <ThemedTextInput
                            label="Venue Name"
                            value={value}
                            onChangeText={onChange}
                            placeholder="e.g., Joe's Diner"
                            error={errors.name?.message}
                        />
                    )}
                />

                <ThemedView style={styles.fieldContainer}>
                    <ThemedText style={styles.fieldLabel}>
                        Venue Address
                    </ThemedText>
                    <Controller
                        control={control}
                        name="address"
                        render={({ field: { onChange } }) => (
                            <AddressAutocomplete
                                onSelect={(addressData) => {
                                    // Populate all address fields at once
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
                                placeholder="Search for venue address..."
                                error={errors.address?.message}
                            />
                        )}
                    />
                </ThemedView>

                <ThemedText style={styles.sectionTitle}>
                    Additional Details
                </ThemedText>

                <Controller
                    control={control}
                    name="cuisine_types"
                    render={({ field: { onChange, value } }) => (
                        <ThemedTextInput
                            label="Cuisine Types (comma-separated)"
                            value={value}
                            onChangeText={onChange}
                            placeholder="American, Italian"
                        />
                    )}
                />

                <Controller
                    control={control}
                    name="price_range"
                    render={({ field: { onChange, value } }) => (
                        <ThemedTextInput
                            label="Price Range (1-4)"
                            value={value}
                            onChangeText={onChange}
                            placeholder="2"
                            keyboardType="numeric"
                            error={errors.price_range?.message}
                        />
                    )}
                />

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
                    Create Venue
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
