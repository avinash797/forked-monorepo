import Ionicons from '@expo/vector-icons/Ionicons';
import { SymbolView, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type ViewStyle } from 'react-native';

export type IconSymbolName = ComponentProps<typeof Ionicons>['name'];

/**
 * Mapping from Ionicons names to SF Symbols names.
 * Only icons actually used in the app are mapped here.
 */
const SF_SYMBOLS_MAP: Partial<Record<string, SymbolViewProps['name']>> = {
    'compass': 'safari.fill',
    'compass-outline': 'safari',
    'podium': 'trophy.fill',
    'podium-outline': 'trophy',
    'list': 'list.bullet',
    'list-outline': 'list.bullet',
    'person': 'person.fill',
    'person-outline': 'person',
    'search': 'magnifyingglass',
    'camera': 'camera.fill',
    'camera-outline': 'camera',
    'arrow-back': 'chevron.left',
    'close': 'xmark',
    'close-circle': 'xmark.circle.fill',
    'checkmark': 'checkmark',
    'checkmark-circle': 'checkmark.circle.fill',
    'location-outline': 'location',
    'location': 'location.fill',
    'location-sharp': 'location.fill',
    'settings-outline': 'gearshape',
    'sparkles-outline': 'sparkles',
    'restaurant-outline': 'fork.knife',
    'chevron-forward': 'chevron.right',
    'share-outline': 'square.and.arrow.up',
    'pencil': 'pencil',
    'alert-circle-outline': 'exclamationmark.circle',
    'warning-outline': 'exclamationmark.triangle',
    'image-outline': 'photo',
    'globe-outline': 'globe',
    'call-outline': 'phone',
    'navigate': 'arrow.triangle.turn.up.right.diamond.fill',
    'heart': 'heart.fill',
    'heart-outline': 'heart',
    'thumbs-up': 'hand.thumbsup.fill',
    'thumbs-up-outline': 'hand.thumbsup',
    'thumbs-down': 'hand.thumbsdown.fill',
    'thumbs-down-outline': 'hand.thumbsdown',
};

/**
 * iOS-specific icon component that uses SF Symbols via expo-symbols.
 * Falls back to Ionicons for unmapped icon names.
 *
 * Note: SymbolView renders as a View, not Text.
 */
export function IconSymbol({
    name,
    size = 20,
    color,
    style,
    animatedProps,
}: {
    name: IconSymbolName;
    size?: number;
    color: string | OpaqueColorValue;
    style?: StyleProp<ViewStyle>;
    animatedProps?: any;
}) {
    const sfName = SF_SYMBOLS_MAP[name as string];

    if (sfName) {
        return (
            <SymbolView
                name={sfName}
                size={size}
                tintColor={color as string}
                style={style}
                resizeMode="scaleAspectFit"
            />
        );
    }

    // Fallback to Ionicons for unmapped icons
    const Ionicons = require('@expo/vector-icons/Ionicons').default;
    return <Ionicons color={color} size={size} name={name} style={style} />;
}
