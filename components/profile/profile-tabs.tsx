import { useTheme } from '@/contexts/theme-provider';
import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '../themed-text';

interface ProfileTabsProps {
    tabs: string[];
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export function ProfileTabs({
    tabs,
    activeTab,
    onTabChange,
}: ProfileTabsProps) {
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);

    return (
        <View style={styles.container}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab;
                return (
                    <Pressable
                        key={tab}
                        onPress={() => onTabChange(tab)}
                        style={[styles.tab, isActive && styles.activeTab]}
                    >
                        <ThemedText
                            style={[
                                styles.tabText,
                                isActive && styles.activeTabText,
                            ]}
                        >
                            {tab}
                        </ThemedText>
                    </Pressable>
                );
            })}
        </View>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        container: {
            flexDirection: 'row',
            borderBottomWidth: 1,
            borderBottomColor: theme.color.border,
        },
        tab: {
            flex: 1,
            alignItems: 'center',
            paddingVertical: theme.space.sm,
            borderBottomWidth: 2,
            borderBottomColor: 'transparent',
        },
        activeTab: {
            borderBottomColor: theme.color.textPrimary,
        },
        tabText: {
            fontSize: theme.font.size.md,
            color: theme.color.textSecondary,
            fontWeight: '600',
        },
        activeTabText: {
            color: theme.color.textPrimary,
        },
    });
