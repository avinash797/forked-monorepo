import { useTheme } from '@/contexts/theme-provider';
import { useCharm } from '@/hooks/use-charms';
import { Charm as CharmType } from '@/types/auth';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

interface CharmProps {
    charm: CharmType;
    showName?: boolean;
}

export function Charm({ charm, showName }: CharmProps) {
    const { data, isLoading } = useCharm(charm.id);
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);

    if (isLoading) {
        return (
            <View
                style={[
                    styles.placeholder,
                    { backgroundColor: theme.color.surface2 },
                ]}
            />
        );
    }

    if (!data) return null;

    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                {data.icon_url ? (
                    <Image
                        source={{ uri: data.icon_url }}
                        style={styles.icon}
                        contentFit="contain"
                    />
                ) : data.icon_svg ? (
                    <SvgXml xml={data.icon_svg} width={24} height={24} />
                ) : (
                    <Ionicons
                        name="trophy-outline"
                        size={18}
                        color={theme.color.accent}
                    />
                )}
            </View>

            {showName && (
                <Text style={[styles.name, { color: theme.color.textPrimary }]}>
                    {data.name}
                </Text>
            )}
        </View>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        container: {
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            flexDirection: 'row',
            boxShadow: `0px ${theme.shadow.md.y}px ${theme.shadow.md.radius}px rgba(0, 0, 0, ${theme.shadow.md.opacity})`,
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.sm,
            borderCurve: 'continuous',
            padding: theme.space.xxs,
        },
        iconContainer: {
            width: 24,
            height: 24,
            alignItems: 'center',
            justifyContent: 'center',
        },
        icon: {
            width: 24,
            height: 24,
        },
        name: {
            fontSize: 12,
            fontWeight: '600',
            textAlign: 'center',
            marginTop: 4,
        },
        placeholder: {
            width: 48,
            height: 48,
            borderRadius: 24,
        },
    });
