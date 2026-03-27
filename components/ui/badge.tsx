import DEFAULT_ACHIEVEMENT from '@/assets/images/fork-logo/fork-gold.png';
import { useTheme } from '@/contexts/theme-provider';
import { useCharm } from '@/hooks/use-charms';
import { Charm as CharmType } from '@/types/auth';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

interface BadgeProps {
    charm: CharmType;
    showName?: boolean;
}

export function Badge({ charm, showName }: BadgeProps) {
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
                    <Image source={DEFAULT_ACHIEVEMENT} style={styles.icon} />
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
        },
        iconContainer: {
            width: 50,
            height: 50,
            alignItems: 'center',
            justifyContent: 'center',
        },
        icon: {
            width: 50,
            height: 50,
            borderRadius: 25,
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
