import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { UserBadgeWithDefinition } from '@/types/badge.types';
import { Image } from 'expo-image';
import { Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { BadgeStyles } from './badge-styles';

interface BadgeItemProps {
    item: UserBadgeWithDefinition;
    index: number;
    onPress: (badge: UserBadgeWithDefinition) => void;
    styles: BadgeStyles;
}

export function BadgeItem({ item, index, onPress, styles }: BadgeItemProps) {
    const isEarned = item.earned_at !== null;
    return (
        <Animated.View key={item.id} entering={FadeInDown.delay(index * 50).duration(300)} style={styles.badgeWrapper}>
            <Pressable
                style={({ pressed }) => [
                    styles.badgeItem,
                    pressed && styles.badgeItemPressed,
                ]}
                onPress={() => onPress(item)}
            >
                <ThemedView
                    style={[
                        styles.badgeImageContainer,
                        item.is_featured && isEarned && styles.badgeImageFeatured,
                        !isEarned && styles.badgeImageUnearned,
                    ]}
                >
                    {item.image_url ? (
                        <Image
                            source={{ uri: item.image_url }}
                            style={[
                                styles.badgeImage,
                                !isEarned && styles.unearnedImage,
                            ]}
                            contentFit="contain"
                        />
                    ) : (
                        <ThemedText style={[styles.placeholderEmoji, !isEarned && styles.unearnedImage]}>
                            🏅
                        </ThemedText>
                    )}
                </ThemedView>
                <ThemedText style={[styles.badgeName, !isEarned && styles.unearnedText]} numberOfLines={1}>
                    {item.name}
                </ThemedText>
            </Pressable>
        </Animated.View>
    );
}
