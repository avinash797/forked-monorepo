import { useTheme } from '@/contexts/theme-provider';
import { BottomTabBarButtonProps } from 'expo-router/js-tabs';
import { PlatformPressable } from 'expo-router/react-navigation';
import * as Haptics from 'expo-haptics';
import { StyleSheet, View } from 'react-native';
import { ForkLogo } from './fork-logo';

export function CenterTabButton(props: BottomTabBarButtonProps) {
    const { theme } = useTheme();

    return (
        <View style={styles.container}>
            <PlatformPressable
                {...props}
                style={[
                    styles.button,
                    {
                        backgroundColor: theme.color.accent,
                        borderColor: theme.color.surface,
                    },
                ]}
                onPressIn={(ev) => {
                    if (process.env.EXPO_OS === 'ios') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }
                    props.onPressIn?.(ev);
                }}
            >
                <View
                    style={[
                        styles.innerButton,
                        { backgroundColor: theme.color.accent },
                    ]}
                >
                    <ForkLogo size={32} color={theme.color.accentOn} />
                </View>
            </PlatformPressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    button: {
        position: 'absolute',
        top: -10,
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
        borderWidth: 4,
    },
    innerButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
