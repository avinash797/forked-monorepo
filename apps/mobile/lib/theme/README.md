# Theme System Usage Guide

Design tokens (color palettes + scales) live in the shared **`@forked/theme`**
package (`packages/theme`). This folder assembles them into the app theme:

- `index.ts` — `getTheme(name, mode)` builds the active theme object from
  `mobilePalette` + `scales`.
- `makeStyles.ts` — `createStyles` / `makeShadow` helpers and the `ActiveTheme` type.
- `componentStyles.ts` — pre-built styles (`card`, `h1`, `buttonPrimary`, ...).

To change a color or scale value, edit `packages/theme/src/palettes.ts`
(mobile palette) or `scales.ts` — never hard-code values in components.
The web app consumes the same package, so scales stay in sync automatically.

There is currently one theme variant (`default`) with light + dark modes.

## Basic Usage

### In Components

```tsx
import { useTheme } from '@/contexts/theme-provider';

function MyComponent() {
    const { theme, isDark } = useTheme();

    return (
        <View
            style={{ backgroundColor: theme.color.bg, padding: theme.space.md }}
        >
            <Text
                style={{
                    color: theme.color.textPrimary,
                    fontSize: theme.font.size.lg,
                }}
            >
                Hello World
            </Text>
        </View>
    );
}
```

## Design Tokens Reference

### Colors

```tsx
theme.color.accent; // Primary brand color
theme.color.accentOn; // Text on accent background
theme.color.accentSoft; // Subtle accent background

theme.color.bg; // Main background
theme.color.surface; // Card/surface background
theme.color.surface2; // Elevated surface

theme.color.textPrimary; // Main text
theme.color.textSecondary; // Secondary text
theme.color.textTertiary; // Tertiary/muted text

theme.color.border; // Border color
theme.color.divider; // Divider line color

theme.color.inputBg; // Input background
theme.color.inputBorder; // Input border
theme.color.placeholder; // Placeholder text

theme.color.success; // Success state
theme.color.warning; // Warning state
theme.color.danger; // Error/danger state
theme.color.info; // Info state
```

### Typography

```tsx
// Font sizes
theme.font.size.xs; // 12px
theme.font.size.sm; // 14px
theme.font.size.md; // 16px (default)
theme.font.size.lg; // 18px
theme.font.size.xl; // 22px
theme.font.size.xxl; // 28px

// Line heights (matched to font sizes)
theme.font.line.xs; // 16px
theme.font.line.md; // 22px
theme.font.line.xxl; // 34px

// Font weights
theme.font.weight.regular; // "400"
theme.font.weight.medium; // "500"
theme.font.weight.semibold; // "600"
theme.font.weight.bold; // "700"
```

### Spacing

```tsx
theme.space.xxs; // 4px
theme.space.xs; // 8px
theme.space.sm; // 12px
theme.space.md; // 16px (default)
theme.space.lg; // 20px
theme.space.xl; // 24px
theme.space.xxl; // 32px
```

### Border Radius

```tsx
theme.radius.xs; // 6px
theme.radius.sm; // 10px
theme.radius.md; // 14px (default)
theme.radius.lg; // 18px
theme.radius.xl; // 24px
theme.radius.pill; // 999px (fully rounded)
```

### Borders

```tsx
theme.border.hairline; // 1px
theme.border.thin; // 1.5px
theme.border.thick; // 2px
```

### Shadows

```tsx
import { makeShadow } from '@/lib/theme/makeStyles';

const cardStyle = {
    ...makeShadow(theme, 'sm'), // Small shadow
    ...makeShadow(theme, 'md'), // Medium shadow
    ...makeShadow(theme, 'lg'), // Large shadow
};
```

### Opacity

```tsx
theme.opacity.disabled; // 0.45
theme.opacity.pressed; // 0.82
theme.opacity.subtle; // 0.10
```

## Utility Functions

### createStyles

Type-safe StyleSheet creation with theme:

```tsx
import { createStyles } from '@/lib/theme/makeStyles';
import { useTheme } from '@/contexts/theme-provider';

function MyComponent() {
    const { theme } = useTheme();
    const styles = createStyles(
        (t) => ({
            container: {
                backgroundColor: t.color.bg,
                padding: t.space.md,
            },
        }),
        theme
    );

    return <View style={styles.container}>...</View>;
}
```

### Pre-built Component Styles

```tsx
import { buildComponentStyles } from '@/lib/theme/componentStyles';
import { useTheme } from '@/contexts/theme-provider';

function MyComponent() {
    const { theme } = useTheme();
    const styles = buildComponentStyles(theme);

    return (
        <View style={styles.card}>
            <Text style={styles.h1}>Heading</Text>
            <Text style={styles.body}>Body text</Text>
            <View style={styles.divider} />
        </View>
    );
}
```

Available pre-built styles:

- `screen` - Full screen container
- `card` - Card component
- `h1`, `h2`, `body`, `caption` - Typography variants
- `input` - Text input
- `buttonPrimary`, `buttonSecondary` - Button variants
- `badge` - Badge component
- `divider` - Horizontal divider

## Theme Persistence

User's selected color-scheme preference is automatically saved to
AsyncStorage and restored on app launch (see `contexts/theme-provider.tsx`).
