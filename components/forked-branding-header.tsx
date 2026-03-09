import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { ForkLogo } from './fork-logo';
import { ThemedText } from './themed-text';

export default function ForkedBrandingHeader({
    style,
}: {
    style?: StyleProp<ViewStyle>;
}) {
    return (
        <View style={[styles.header, style]}>
            <View style={styles.logoContainer}>
                <ForkLogo size={50} color="#FFFFFF" />
            </View>
            <ThemedText style={styles.brandName}>Forked</ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    logoContainer: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    brandName: {
        fontSize: 28,
        lineHeight: 28,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
