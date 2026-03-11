import { CitySearchSheet } from '@/components/profile/city-search-sheet';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { AUTH_KEYS, useAuth } from '@/hooks/use-auth';
import { usePhotoUpload } from '@/hooks/use-photo-upload';
import { supabase } from '@/lib/supabase';

import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const profileSchema = z.object({
    display_name: z
        .string()
        .min(2, 'Display name must be at least 2 characters'),
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .optional()
        .or(z.literal('')),
    bio: z.string().max(160, 'Bio must be less than 160 characters').optional(),
    avatar_url: z.string().nullable().optional(),
    home_city_id: z.string().nullable().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function EditProfileScreen() {
    const { user, profile } = useAuth();
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);
    const router = useRouter();
    const citySheetRef = useRef<BottomSheetModal>(null);
    const insets = useSafeAreaInsets();
    const {
        pickImage,
        takePhoto,
        uploadPhoto,
        isLoading: isUploading,
    } = usePhotoUpload();

    const [selectedCityDisplay, setSelectedCityDisplay] = useState<
        string | null
    >(null);

    const defaultCityDisplay = useMemo(
        () =>
            profile?.home_city
                ? `${profile.home_city.name}${profile.home_city.state ? `, ${profile.home_city.state}` : ''}`
                : null,
        [profile?.home_city]
    );

    const {
        control,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isDirty },
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            display_name: profile?.display_name || '',
            username: profile?.username || '',
            bio: profile?.bio || '',
            avatar_url: profile?.avatar_url || null,
            home_city_id: profile?.home_city_id || null,
        },
    });

    const avatarUrl = watch('avatar_url');
    const selectedCityId = watch('home_city_id');
    const cityDisplayText = selectedCityDisplay || defaultCityDisplay;

    const handleCitySelect = useCallback(
        (result: { cityId: string; displayName: string }) => {
            setValue('home_city_id', result.cityId, { shouldDirty: true });
            setSelectedCityDisplay(result.displayName);
        },
        [setValue]
    );

    const handleClearCity = useCallback(() => {
        setValue('home_city_id', null, { shouldDirty: true });
        setSelectedCityDisplay(null);
    }, [setValue]);

    // Warn user when navigating away with unsaved changes
    const navigation = useNavigation();
    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            if (!isDirty) return;

            // Prevent default back behavior
            e.preventDefault();

            Alert.alert(
                'Discard changes?',
                'You have unsaved changes. Are you sure you want to leave without saving?',
                [
                    {
                        text: "Don't leave",
                        style: 'cancel',
                    },
                    {
                        text: 'Discard',
                        style: 'destructive',
                        onPress: () => navigation.dispatch(e.data.action),
                    },
                ]
            );
        });

        return unsubscribe;
    }, [navigation, isDirty]);

    const handleAvatarPress = () => {
        Alert.alert('Change Avatar', 'Choose an option', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Take Photo',
                onPress: async () => {
                    const uri = await takePhoto();
                    if (uri && user) {
                        const result = await uploadPhoto(
                            uri,
                            'avatar',
                            user.id,
                            'avatars'
                        );
                        if (result) setValue('avatar_url', result.url, { shouldDirty: true });
                    }
                },
            },
            {
                text: 'Choose from Library',
                onPress: async () => {
                    const uri = await pickImage();
                    if (uri && user) {
                        const result = await uploadPhoto(
                            uri,
                            'avatar',
                            user.id,
                            'avatars'
                        );
                        if (result) setValue('avatar_url', result.url, { shouldDirty: true });
                    }
                },
            },
        ]);
    };

    const queryClient = useQueryClient();
    const { mutateAsync: updateProfile, isPending: isUpdatingProfile } =
        useMutation({
            mutationFn: async ({
                updates,
                userId,
            }: {
                updates: any;
                userId: string;
            }) => {
                const { error } = await supabase
                    .from('profiles')
                    .update(updates)
                    .eq('id', userId);
                if (error) throw error;
            },
            onSuccess: async (_data, variables) => {
                queryClient.invalidateQueries({
                    queryKey: AUTH_KEYS.profile(variables.userId),
                });
                reset(undefined, { keepValues: true });
                router.back();
            },
            onError: (error: any) => {
                Alert.alert('Error', error.message);
            },
        });

    const onSubmit = async (data: ProfileFormValues) => {
        if (!user) return;

        const updates: Record<string, any> = {
            display_name: data.display_name,
            username: data.username,
            bio: data.bio,
            avatar_url: data.avatar_url,
            home_city_id: data.home_city_id,
            updated_at: new Date().toISOString(),
        };

        updateProfile({ updates, userId: user.id });
    };

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: insets.bottom > 0 ? insets.bottom + 24 : 48 },
                ]}
                keyboardShouldPersistTaps="handled"
            >
                {/* Avatar */}
                <View style={styles.avatarContainer}>
                    <Pressable onPress={handleAvatarPress}>
                        {avatarUrl ? (
                            <Image
                                source={{ uri: avatarUrl }}
                                style={styles.avatar}
                            />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <IconSymbol
                                    name="camera"
                                    size={40}
                                    color={theme.color.textSecondary}
                                />
                            </View>
                        )}
                        <View style={styles.editIconContainer}>
                            <IconSymbol
                                name="camera-outline"
                                size={16}
                                color="white"
                            />
                        </View>
                    </Pressable>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <Controller
                        control={control}
                        name="display_name"
                        render={({ field: { onChange, value } }) => (
                            <ThemedTextInput
                                label="Display Name"
                                value={value}
                                onChangeText={onChange}
                                placeholder="Your Name"
                                error={errors.display_name?.message}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="username"
                        render={({ field: { onChange, value } }) => (
                            <ThemedTextInput
                                label="Username"
                                value={value}
                                onChangeText={onChange}
                                placeholder="username"
                                autoCapitalize="none"
                                error={errors.username?.message}
                            />
                        )}
                    />

                    {/* City picker field */}
                    <View style={styles.fieldGroup}>
                        <ThemedText style={styles.fieldLabel}>
                            Location
                        </ThemedText>
                        <Pressable
                            style={({ pressed }) => [
                                styles.cityField,
                                pressed && styles.cityFieldPressed,
                            ]}
                            onPress={() => citySheetRef.current?.present()}
                        >
                            <View style={styles.cityFieldIcon}>
                                <IconSymbol
                                    name="location-outline"
                                    size={18}
                                    color={
                                        cityDisplayText
                                            ? theme.color.accent
                                            : theme.color.textTertiary
                                    }
                                />
                            </View>
                            <ThemedText
                                style={[
                                    styles.cityFieldText,
                                    !cityDisplayText &&
                                    styles.cityFieldPlaceholder,
                                ]}
                                numberOfLines={1}
                            >
                                {cityDisplayText || 'Select your city'}
                            </ThemedText>
                            {!selectedCityId && (
                                <IconSymbol
                                    name="chevron-forward"
                                    size={16}
                                    color={theme.color.textTertiary}
                                />
                            )}
                        </Pressable>
                    </View>

                    <Controller
                        control={control}
                        name="bio"
                        render={({ field: { onChange, value } }) => (
                            <ThemedTextInput
                                label="Bio"
                                value={value}
                                onChangeText={onChange}
                                placeholder="Tell us about yourself"
                                multiline
                                numberOfLines={4}
                                style={styles.bioInput}
                                error={errors.bio?.message}
                            />
                        )}
                    />
                </View>

                <View style={styles.buttonContainer}>
                    <ThemedButton
                        onPress={handleSubmit(onSubmit)}
                        loading={isUpdatingProfile || isUploading}
                        disabled={isUpdatingProfile || isUploading}
                    >
                        Save Changes
                    </ThemedButton>
                </View>
            </ScrollView>

            {/* City search bottom sheet */}
            <CitySearchSheet
                ref={citySheetRef}
                onSelect={handleCitySelect}
                onClose={() => { }}
            />
        </View>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.color.bg,
        },
        scrollContent: {
            padding: 24,
        },
        avatarContainer: {
            alignItems: 'center',
            marginBottom: 32,
        },
        avatar: {
            width: 120,
            height: 120,
            borderRadius: 60,
        },
        avatarPlaceholder: {
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: theme.color.surface,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.color.border,
        },
        editIconContainer: {
            position: 'absolute',
            bottom: 0,
            right: 0,
            backgroundColor: theme.color.accent,
            padding: 8,
            borderRadius: 20,
            borderCurve: 'continuous',
            borderWidth: 2,
            borderColor: theme.color.bg,
        },
        form: {
            gap: 16,
            marginBottom: 32,
        },
        fieldGroup: {
            marginBottom: theme.space.md,
        },
        fieldLabel: {
            fontSize: theme.font.size.sm,
            fontWeight: theme.font.weight.semibold as any,
            marginBottom: theme.space.xs,
        },
        cityField: {
            flexDirection: 'row',
            alignItems: 'center',
            height: 50,
            borderRadius: theme.radius.md,
            borderCurve: 'continuous',
            paddingHorizontal: theme.space.md,
            borderWidth: theme.border.hairline,
            backgroundColor: theme.color.inputBg,
            borderColor: theme.color.inputBorder,
            gap: theme.space.sm,
        },
        cityFieldPressed: {
            backgroundColor: theme.color.surface2,
        },
        cityFieldIcon: {
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: theme.color.accentSoft,
            justifyContent: 'center',
            alignItems: 'center',
        },
        cityFieldText: {
            flex: 1,
            fontSize: theme.font.size.md,
            color: theme.color.textPrimary,
        },
        cityFieldPlaceholder: {
            color: theme.color.placeholder,
        },
        cityClearButton: {
            padding: 4,
        },
        bioInput: {
            height: 100,
            textAlignVertical: 'top',
        },
        buttonContainer: {
            marginBottom: 32,
        },
    });
