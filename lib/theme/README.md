# Theme System Usage Guide

The app now uses a complete design token system with multiple theme variants. All existing components have been migrated and will automatically benefit from the new system.

## Available Themes

- **default** - Original Forked theme (warm orange accent)
- **genZ** - Punchy, bold design with red accent
- **foodies** - Premium, warm theme with brick red
- **critics** - Editorial, sophisticated theme with wine accent

Each theme supports both light and dark modes.

## Basic Usage

### In Components

```tsx
import { useTheme } from '@/contexts/theme-provider';

function MyComponent() {
  const { theme, themeName, setThemeName, isDark } = useTheme();

  return (
    <View style={{ backgroundColor: theme.color.bg, padding: theme.space.md }}>
      <Text style={{
        color: theme.color.textPrimary,
        fontSize: theme.font.size.lg,
        marginBottom: theme.space.sm
      }}>
        Hello World
      </Text>
      <TouchableOpacity
        style={{
          backgroundColor: theme.color.accent,
          borderRadius: theme.radius.md,
          padding: theme.space.md
        }}
      >
        <Text style={{ color: theme.color.accentOn }}>
          Click Me
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Switching Themes

```tsx
import { useTheme } from '@/contexts/theme-provider';

function ThemeSwitcher() {
  const { themeName, setThemeName } = useTheme();

  return (
    <View>
      <Button onPress={() => setThemeName('default')}>Default</Button>
      <Button onPress={() => setThemeName('genZ')}>Gen Z</Button>
      <Button onPress={() => setThemeName('foodies')}>Foodies</Button>
      <Button onPress={() => setThemeName('critics')}>Critics</Button>
    </View>
  );
}
```

## Design Tokens Reference

### Colors

```tsx
theme.color.accent          // Primary brand color
theme.color.accentOn        // Text on accent background
theme.color.accentSoft      // Subtle accent background

theme.color.bg              // Main background
theme.color.surface         // Card/surface background
theme.color.surface2        // Elevated surface

theme.color.textPrimary     // Main text
theme.color.textSecondary   // Secondary text
theme.color.textTertiary    // Tertiary/muted text

theme.color.border          // Border color
theme.color.divider         // Divider line color

theme.color.inputBg         // Input background
theme.color.inputBorder     // Input border
theme.color.placeholder     // Placeholder text

theme.color.success         // Success state
theme.color.warning         // Warning state
theme.color.danger          // Error/danger state
theme.color.info            // Info state
```

### Typography

```tsx
// Font sizes
theme.font.size.xs          // 12px
theme.font.size.sm          // 14px
theme.font.size.md          // 16px (default)
theme.font.size.lg          // 18px
theme.font.size.xl          // 22px
theme.font.size.xxl         // 28px

// Line heights (matched to font sizes)
theme.font.line.xs          // 16px
theme.font.line.md          // 22px
theme.font.line.xxl         // 34px

// Font weights
theme.font.weight.regular   // "400"
theme.font.weight.medium    // "500"
theme.font.weight.semibold  // "600"
theme.font.weight.bold      // "700"
```

### Spacing

```tsx
theme.space.xxs             // 4px
theme.space.xs              // 8px
theme.space.sm              // 12px
theme.space.md              // 16px (default)
theme.space.lg              // 20px
theme.space.xl              // 24px
theme.space.xxl             // 32px
```

### Border Radius

```tsx
theme.radius.xs             // 6px
theme.radius.sm             // 10px
theme.radius.md             // 14px (default)
theme.radius.lg             // 18px
theme.radius.xl             // 24px
theme.radius.pill           // 999px (fully rounded)
```

### Borders

```tsx
theme.border.hairline       // 1px
theme.border.thin           // 1.5px
theme.border.thick          // 2px
```

### Shadows

```tsx
import { makeShadow } from '@/lib/theme/makeStyles';

const cardStyle = {
  ...makeShadow(theme, 'sm'),  // Small shadow
  ...makeShadow(theme, 'md'),  // Medium shadow
  ...makeShadow(theme, 'lg'),  // Large shadow
};
```

### Opacity

```tsx
theme.opacity.disabled      // 0.45
theme.opacity.pressed       // 0.80
theme.opacity.subtle        // 0.10
```

## Utility Functions

### createStyles

Type-safe StyleSheet creation with theme:

```tsx
import { createStyles } from '@/lib/theme/makeStyles';
import { useTheme } from '@/contexts/theme-provider';

function MyComponent() {
  const { theme } = useTheme();
  const styles = createStyles((t) => ({
    container: {
      backgroundColor: t.color.bg,
      padding: t.space.md,
    },
    text: {
      color: t.color.textPrimary,
      fontSize: t.font.size.md,
    },
  }), theme);

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

## Backwards Compatibility

All existing themed components support legacy `lightColor` and `darkColor` props:

```tsx
// Still works (deprecated)
<ThemedText lightColor="#000" darkColor="#fff">Text</ThemedText>

// Recommended (uses theme tokens)
<ThemedText>Text</ThemedText>
```

## Theme Persistence

User's selected theme is automatically saved to AsyncStorage and restored on app launch.

## Testing Different Themes

To test a specific theme on app launch, pass `initialThemeName` to ThemeProvider in `app/_layout.tsx`:

```tsx
<ThemeProvider initialThemeName="genZ">
  {/* ... */}
</ThemeProvider>
```
