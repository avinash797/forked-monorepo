import { supabase } from "@/lib/supabase";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";

export interface UploadedPhoto {
  uri: string;
  storagePath: string;
  url: string;
}

export function usePhotoUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async (): Promise<string | null> => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        setError("Camera roll permission required");
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) return null;
      return result.assets[0].uri;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const takePhoto = async (): Promise<string | null> => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        setError("Camera permission required");
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
      setError(err.message);
      return null;
    }
  };

  const uploadPhoto = async (
    uri: string,
    entityType: "review" | "dish" | "venue",
    userId: string
  ): Promise<UploadedPhoto | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      const fileExt = uri.split(".").pop() || "jpg";
      const fileName = `${entityType}/${userId}/${Date.now()}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from("review-photos")
        .upload(fileName, arrayBuffer, {
          contentType: `image/${fileExt}`,
          cacheControl: "3600",
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("review-photos").getPublicUrl(fileName);

      return {
        uri,
        storagePath: fileName,
        url: publicUrl,
      };
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { pickImage, takePhoto, uploadPhoto, isLoading, error };
}
