import { ThemedText } from '@/components/themed-text';
import type { UserBadgeWithDefinition } from '@/types/badge.types';
import { Image } from 'expo-image';
import { Modal, Pressable, View } from 'react-native';
import Animated, { BounceIn } from 'react-native-reanimated';
import type { BadgeStyles } from './badge-styles';

interface BadgeDetailModalProps {
    badge: UserBadgeWithDefinition | null;
    onClose: () => void;
    styles: BadgeStyles;
}

export function BadgeDetailModal({ badge, onClose, styles }: BadgeDetailModalProps) {
    return (
        <Modal
            visible={badge !== null}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <Pressable
                    style={styles.modalCard}
                    onPress={(e) => e.stopPropagation()}
                >
                    <Animated.View
                        entering={BounceIn.springify().damping(14)}
                        style={styles.modalContent}
                    >
                        <View style={styles.modalImageContainer}>
                            {badge?.image_url ? (
                                <Image
                                    source={{ uri: badge.image_url }}
                                    style={styles.modalBadgeImage}
                                    contentFit="contain"
                                />
                            ) : (
                                <View style={styles.modalBadgePlaceholder}>
                                    <ThemedText style={styles.modalPlaceholderEmoji}>
                                        🏅
                                    </ThemedText>
                                </View>
                            )}
                        </View>
                        <ThemedText style={styles.modalBadgeName}>
                            {badge?.name}
                        </ThemedText>
                        {badge?.is_featured && (
                            <View style={styles.featuredTag}>
                                <ThemedText style={styles.featuredTagText}>
                                    Featured
                                </ThemedText>
                            </View>
                        )}
                        <ThemedText style={styles.modalBadgeDescription}>
                            {badge?.description}
                        </ThemedText>
                        {badge?.earned_at ? (
                            <ThemedText style={styles.modalEarnedDate}>
                                Earned{' '}
                                {new Date(badge.earned_at).toLocaleDateString(
                                    undefined,
                                    { month: 'long', day: 'numeric', year: 'numeric' }
                                )}
                            </ThemedText>
                        ) : (
                            <ThemedText style={styles.modalUnearnedText}>
                                Not yet earned
                            </ThemedText>
                        )}
                        <Pressable
                            style={({ pressed }) => [
                                styles.modalButton,
                                pressed && styles.modalButtonPressed,
                            ]}
                            onPress={onClose}
                        >
                            <ThemedText style={styles.modalButtonText}>
                                Close
                            </ThemedText>
                        </Pressable>
                    </Animated.View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}
