import { PropsWithChildren, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';

export function Collapsible({
    children,
    title,
}: PropsWithChildren & { title: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const { colorScheme, theme } = useTheme();

    return (
        <ThemedView>
            <Pressable
                style={({ pressed }) => [
                    styles.heading,
                    pressed && { opacity: 0.8 },
                ]}
                onPress={() => setIsOpen((value) => !value)}
                android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
            >
                <IconSymbol
                    name="chevron-right"
                    size={18}
                    color={
                        colorScheme === 'light'
                            ? theme.color.textPrimary
                            : theme.color.textSecondary
                    }
                    style={{
                        transform: [{ rotate: isOpen ? '90deg' : '0deg' }],
                    }}
                />

                <ThemedText type="defaultSemiBold">{title}</ThemedText>
            </Pressable>
            {isOpen && (
                <ThemedView style={styles.content}>{children}</ThemedView>
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    heading: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    content: {
        marginTop: 6,
        marginLeft: 24,
    },
});
