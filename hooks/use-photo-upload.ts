import { supabase } from '@/lib/supabase';
import { useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

export interface UploadedPhoto {
    uri: string;
    storagePath: string;
    url: string;
}

export function usePhotoUpload() {
    const [pickError, setPickError] = useState<string | null>(null);

    const {
        mutateAsync: uploadMutation,
        isPending: isUploading,
        error: uploadError,
    } = useMutation({
        mutationFn: async ({
            uri,
            entityType,
            userId,
            bucket = 'review-photos',
        }: {
            uri: string;
            entityType: 'review' | 'dish' | 'venue' | 'avatar';
            userId: string;
            bucket?: string;
        }): Promise<UploadedPhoto> => {
            const response = await fetch(uri);
            const arrayBuffer = await response.arrayBuffer();

            const fileExt = uri.split('.').pop() || 'jpg';
            const fileName = `${entityType}/${userId}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(fileName, arrayBuffer, {
                    contentType: `image/${fileExt}`,
                    cacheControl: '3600',
                });

            if (uploadError) throw uploadError;

            const {
                data: { publicUrl },
            } = supabase.storage.from(bucket).getPublicUrl(fileName);

            return {
                uri,
                storagePath: fileName,
                url: publicUrl,
            };
        },
    });

    const {
        mutateAsync: deleteMutation,
        isPending: isDeleting,
        error: deleteError,
    } = useMutation({
        mutationFn: async ({
            storagePath,
            bucket = 'review-photos',
        }: {
            storagePath: string;
            bucket?: string;
        }): Promise<boolean> => {
            const { error: deleteError } = await supabase.storage
                .from(bucket)
                .remove([storagePath]);

            if (deleteError) throw deleteError;
            return true;
        },
    });

    const pickImage = async (): Promise<string | null> => {
        setPickError(null);
        try {
            const { status } =
                await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                setPickError('Camera roll permission required');
                return null;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (result.canceled) return null;
            return result.assets[0].uri;
        } catch (err: any) {
            setPickError(err.message);
            return null;
        }
    };

    const takePhoto = async (): Promise<string | null> => {
        setPickError(null);
        try {
            const { status } =
                await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                setPickError('Camera permission required');
                return null;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (result.canceled) return null;
            return result.assets[0].uri;
        } catch (err: any) {
            setPickError(err.message);
            return null;
        }
    };

    const uploadPhoto = async (
        uri: string,
        entityType: 'review' | 'dish' | 'venue' | 'avatar',
        userId: string,
        bucket: string = 'review-photos'
    ): Promise<UploadedPhoto | null> => {
        try {
            return await uploadMutation({ uri, entityType, userId, bucket });
        } catch {
            return null;
        }
    };

    const deletePhoto = async (
        storagePath: string,
        bucket: string = 'review-photos'
    ): Promise<boolean> => {
        try {
            return await deleteMutation({ storagePath, bucket });
        } catch {
            return false;
        }
    };

    return {
        pickImage,
        takePhoto,
        uploadPhoto,
        deletePhoto,
        isLoading: isUploading || isDeleting,
        error:
            (uploadError as Error)?.message ||
            (deleteError as Error)?.message ||
            pickError,
    };
}
