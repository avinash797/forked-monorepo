import { ThemedText } from '@/components/themed-text';
import React from 'react';
import { SvgXml } from 'react-native-svg';

interface DishTypeIconProps {
    /** SVG string from the dish_type `icon` column */
    icon?: string | null;
    /** Emoji fallback from the dish_type `emoji` column */
    emoji?: string | null;
    /** Icon / emoji display size (width & height for SVG, fontSize for emoji) */
    size?: number;
    /** Optional tint color applied to the SVG (uses `currentColor`). Has no effect on emoji. */
    color?: string;
}

/**
 * Renders a dish-type icon as an SVG when available, falling back to the
 * emoji string, and finally to a generic fork-and-knife emoji.
 *
 * Drop-in replacement for the repeated `icon ? <SvgXml .../> : <Text>{emoji}</Text>` pattern.
 *
 * @example
 * ```tsx
 * <DishTypeIcon icon={dishType.icon} emoji={dishType.emoji} size={20} color={theme.color.accent} />
 * ```
 */
export function DishTypeIcon({
    icon,
    emoji,
    size = 20,
    color,
}: DishTypeIconProps) {
    if (icon) {
        return <SvgXml xml={icon} width={size} height={size} color={color} />;
    }

    return (
        <ThemedText style={{ fontSize: size, lineHeight: size * 1.2 }}>
            {emoji || '🍽️'}
        </ThemedText>
    );
}
