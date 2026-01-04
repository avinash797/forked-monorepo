import { ThemedButton } from '@/components/themed-button';
import { ThemedTextInput } from '@/components/themed-text-input';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AUTH_KEYS } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-provider';
import { useAuth } from '@/hooks/use-auth';
import { usePhotoUpload } from '@/hooks/use-photo-upload';
import { supabase } from '@/lib/supabase';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

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
    location: z.string().optional(),
    bio: z.string().max(160, 'Bio must be less than 160 characters').optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function EditProfileScreen() {
    const { user, profile } = useAuth();
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);
    const router = useRouter();
    const {
        pickImage,
        takePhoto,
        uploadPhoto,
        isLoading: isUploading,
    } = usePhotoUpload();

    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url);

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            display_name: profile?.display_name || '',
            username: profile?.username || '',
            location: profile?.location || '',
            bio: profile?.bio || '',
        },
    });

    const handleAvatarPress = () => {
        Alert.alert('Change Avatar', 'Choose an option', [
            {
                text: 'Cancel',
                style: 'cancel',
            },
            {
                text: 'Take Photo',
                onPress: async () => {
                    const uri = await takePhoto();
                    if (uri && user) {
                        const result = await uploadPhoto(
                            uri,
                            'avatar',
                            user.id,
                            'user-avatars'
                        );
                        if (result) {
                            setAvatarUrl(result.url);
                        }
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
                            'user-avatars'
                        );
                        if (result) {
                            setAvatarUrl(result.url);
                        }
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
                    .from('users')
                    .update(updates)
                    .eq('id', userId);
                if (error) throw error;
            },
            onSuccess: async (data, variables) => {
                queryClient.invalidateQueries({
                    queryKey: AUTH_KEYS.profile(variables.userId),
                });
                router.back();
            },
            onError: (error: any) => {
                Alert.alert('Error', error.message);
            },
        });

    const onSubmit = async (data: ProfileFormValues) => {
        if (!user) return;

        const updates = {
            display_name: data.display_name,
            username: data.username,
            location: data.location,
            bio: data.bio,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
        };

        updateProfile({ updates, userId: user.id });
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.avatarContainer}>
                    <TouchableOpacity onPress={handleAvatarPress}>
                        {avatarUrl ? (
                            <Image
                                source={{ uri: avatarUrl }}
                                style={styles.avatar}
                            />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <IconSymbol
                                    name="photo-camera"
                                    size={40}
                                    color={theme.color.textSecondary}
                                />
                            </View>
                        )}
                        <View style={styles.editIconContainer}>
                            <IconSymbol name="edit" size={16} color="white" />
                        </View>
                    </TouchableOpacity>
                </View>

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

                    <Controller
                        control={control}
                        name="location"
                        render={({ field: { onChange, value } }) => (
                            <ThemedTextInput
                                label="Location"
                                value={value}
                                onChangeText={onChange}
                                placeholder="City, Country"
                                error={errors.location?.message}
                            />
                        )}
                    />

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
        </KeyboardAvoidingView>
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
            borderWidth: 2,
            borderColor: theme.color.bg,
        },
        form: {
            gap: 16,
            marginBottom: 32,
        },
        bioInput: {
            height: 100,
            textAlignVertical: 'top',
        },
        buttonContainer: {
            marginBottom: 32,
        },
    });
