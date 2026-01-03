import { useTheme } from '@/contexts/theme-provider';
import { supabase } from '@/lib/supabase';
import { Charm as CharmType } from '@/types/auth';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

interface CharmDetail {
    id: string;
    name: string;
    description: string;
    icon_url: string | null;
    icon_svg: string | null;
    rarity_tier: string;
}

interface CharmProps {
    charm: CharmType;
    showName?: boolean;
}

export function Charm({ charm, showName }: CharmProps) {
    const [data, setData] = useState<CharmDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);

    useEffect(() => {
        let mounted = true;

        async function fetchCharm() {
            try {
                const { data: charmData, error } = await supabase
                    .from('charms')
                    .select('*')
                    .eq('id', charm.id)
                    .single();

                if (error) throw error;
                if (mounted) setData(charmData);
            } catch (e) {
                console.error('Error fetching charm:', e);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        fetchCharm();

        return () => {
            mounted = false;
        };
    }, [charm.id]);

    if (loading) {
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
                    <SvgXml xml={data.icon_svg} width={32} height={32} />
                ) : (
                    <Ionicons
                        name="trophy-outline"
                        size={24}
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
            shadowColor: '#000',
            shadowOffset: { width: 0, height: theme.shadow.md.y },
            shadowOpacity: theme.shadow.md.opacity,
            shadowRadius: theme.shadow.md.radius,
            elevation: 2,
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.sm,
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
