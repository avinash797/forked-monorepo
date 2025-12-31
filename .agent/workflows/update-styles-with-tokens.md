---
description: This workflow will update existing components that do not utilize style token based style system to use the token based style system.
---

## Problem
Some of the components/files in this app still uses useTheme color hook from `\hooks\use-theme-color.ts`, and also useColorScheme from `hooks\use-color-scheme.ts`. These functions have been deprecated.

## Solution
We now use the token based design system from `lib\theme\token.default.ts`. and use the theme context instead `contexts\theme-provider.tsx`

For all the components that are not yet following the new pattern, we need to do the following:

  const { theme } = useTheme();
  const builtStyles = buildComponentStyles(theme);
  const styles = createThemedStyles(theme);

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.space.xs,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.xxs,
    marginBottom: theme.space.xxs,
  },
});

And use the style within the Elements.