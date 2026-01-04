import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/theme-provider';
import { useUserCharms } from '@/hooks/use-charms';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '../themed-text';

interface AchievementsTabProps {
    userId?: string;
}

export function AchievementsTab({ userId }: AchievementsTabProps) {
    const { theme } = useTheme();
    const { data: charms, isLoading } = useUserCharms(userId);
    const styles = createThemedStyles(theme);

    if (isLoading) {
        return (
            <View style={styles.container}>
                <ThemedText>Loading achievements...</ThemedText>
            </View>
        );
    }

    if (!charms || charms.length === 0) {
        return (
            <View style={styles.container}>
                <ThemedText style={styles.text}>No achievements yet</ThemedText>
            </View>
        );
    }

    return (
        <View style={styles.grid}>
            {charms.map((userCharm) => {
                // Ensure the charm object matches the expected structure for Badge
                if (!userCharm.charms) return null;

                const charm = {
                    ...userCharm.charms,
                    timestamp: userCharm.unlocked_at,
                };

                return (
                    <View key={userCharm.charm_id} style={styles.badgeWrapper}>
                        <Badge charm={charm} showName />
                    </View>
                );
            })}
        </View>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        container: {
            padding: theme.space.xl,
            alignItems: 'center',
        },
        text: {
            color: theme.color.textSecondary,
        },
        grid: {
            padding: theme.space.md,
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: theme.space.md,
            justifyContent: 'center',
        },
        badgeWrapper: {
            // Optional wrapper styling
        },
    });
