# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Expo React Native application using:
- **Expo SDK 54** with React Native 0.81.5
- **React 19.1.0** (latest stable)
- **Expo Router v6** for file-based navigation
- **TypeScript** with strict mode enabled
- **React Native New Architecture** (enabled via `newArchEnabled: true`)
- **Experimental features**: Typed routes and React Compiler

## Development Commands

### Starting the Development Server
```bash
npx expo start           # Start with interactive menu
npm run android          # Start and open Android emulator
npm run ios              # Start and open iOS simulator
npm run web              # Start web version
```

### Code Quality
```bash
npm run lint             # Run ESLint using expo lint
```

### Project Management
```bash
npm run reset-project    # Move starter code to app-example/, create blank app/
```

## Architecture

### File-Based Routing (Expo Router)

The app uses Expo Router's file-based routing system located in the `app/` directory:

- **`app/_layout.tsx`**: Root layout with Stack navigation and theme provider
  - Wraps the entire app with `ThemeProvider` (React Navigation)
  - Defines `unstable_settings.anchor = '(tabs)'` for initial route
  - Includes modal screen configuration

- **`app/(tabs)/`**: Tab navigation group (folder with parentheses = route group, not URL segment)
  - `_layout.tsx`: Tab bar configuration with HapticTab and IconSymbol components
  - `index.tsx`: Home tab screen
  - `explore.tsx`: Explore tab screen

- **`app/modal.tsx`**: Modal screen presented over tabs

### Theme System

The app implements a comprehensive light/dark theme system:

- **`constants/theme.ts`**: Defines Colors and Fonts for both light and dark modes
- **`hooks/use-color-scheme.ts`**: Platform-specific color scheme detection
  - Native: Re-exports React Native's `useColorScheme`
  - Web: Custom implementation in `use-color-scheme.web.ts`
- **`hooks/use-theme-color.ts`**: Hook for consuming theme colors with prop overrides

### Themed Components

Reusable components that automatically adapt to light/dark mode:

- **`ThemedText`** (`components/themed-text.tsx`): Typed text variants (default, title, subtitle, link, defaultSemiBold)
- **`ThemedView`** (`components/themed-view.tsx`): View with automatic background color

These accept `lightColor` and `darkColor` props to override theme defaults.

### Component Organization

- **`components/`**: Shared UI components
  - `external-link.tsx`: Link component for opening URLs
  - `haptic-tab.tsx`: Tab button with haptic feedback
  - `hello-wave.tsx`: Animated wave component
  - `parallax-scroll-view.tsx`: Scrollview with parallax header
  - `ui/`: UI primitives
    - `collapsible.tsx`: Collapsible section component
    - `icon-symbol.tsx`: Expo Material icon component

- **`hooks/`**: Custom React hooks for theming and utilities

- **`constants/`**: Centralized theme configuration

- **`assets/images/`**: App icons, splash screens, and image assets

### Import Aliases

The project uses `@/*` path alias configured in `tsconfig.json`:
```typescript
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
```

Maps to the project root directory.

## Platform Support

Configured for iOS, Android, and Web:
- **iOS**: Tab support, uses SF Symbols
- **Android**: Edge-to-edge enabled, predictive back gesture disabled, adaptive icons configured
- **Web**: Static output mode, separate font fallbacks

## Key Configuration Files

- **`app.json`**: Expo configuration with EAS project ID, platform-specific settings
- **`tsconfig.json`**: Extends `expo/tsconfig.base`, strict mode enabled
- **`eslint.config.js`**: Flat ESLint config using `eslint-config-expo`
- **`.vscode/settings.json`**: Auto-fix and organize imports on save

## Development Notes

- The app has **no test setup** currently (no Jest/Vitest config in project root)
- Uses React Native Reanimated 4.1.1 for animations
- React Native Gesture Handler installed for touch interactions
- Color scheme automatically follows system preference
- VSCode is configured to auto-fix, organize imports, and sort members on save
