import { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Values that must be present when EAS builds a store-bound binary.
 * Without these the build still succeeds but ships broken Google Sign-In,
 * a dead Maps key, or a pointer at the wrong Supabase project.
 */
const REQUIRED_STORE_BUILD_ENV = [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    'EXPO_PUBLIC_GOOGLE_MAPS_API_KEY',
    'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
    'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID',
    'EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME',
] as const;

if (
    process.env.EAS_BUILD === 'true' &&
    process.env.EAS_BUILD_PROFILE === 'production'
) {
    const missing = REQUIRED_STORE_BUILD_ENV.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(
            `Missing required env for a production EAS build: ${missing.join(', ')}. ` +
                `Set them with \`eas env:create --environment production\` before building.`
        );
    }
}

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: 'Forked',
    slug: 'forked',
    version: '1.0.0',
    orientation: 'portrait',
    scheme: 'forked',
    userInterfaceStyle: 'automatic',
    icon: './assets/adaptive-icon.png',
    ios: {
        bundleIdentifier: 'com.forked.prod',
        appStoreUrl: 'https://apps.apple.com/app/id6761374977',
        supportsTablet: true,
        config: {
            googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
        },
        icon: {
            dark: './assets/ios-dark.png',
            light: './assets/ios-light.png',
            tinted: './assets/ios-tinted.png',
        },
        infoPlist: {
            ITSAppUsesNonExemptEncryption: false,
            NSLocationWhenInUseUsageDescription:
                'Allow Forked permission to use your location to show nearby food.',
        },
        usesAppleSignIn: true,
    },
    android: {
        playStoreUrl:
            'https://play.google.com/store/apps/details?id=com.forked.prod',
        adaptiveIcon: {
            backgroundColor: '#ffffff',
            foregroundImage: './assets/adaptive-icon.png',
            monochromeImage: './assets/adaptive-icon.png',
        },
        config: {
            googleMaps: {
                apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
            },
        },
        predictiveBackGestureEnabled: false,
        softwareKeyboardLayoutMode: 'pan',
        package: 'com.forked.prod',
    },
    web: {
        output: 'static',
        favicon: './assets/images/favicon.png',
    },
    plugins: [
        'expo-router',
        'expo-status-bar',
        [
            'expo-splash-screen',
            {
                image: './assets/splash-icon-dark.png',
                imageWidth: 200,
                resizeMode: 'contain',
                backgroundColor: '#ffffff',
                dark: {
                    image: './assets/splash-icon-light.png',
                    backgroundColor: '#000000',
                },
            },
        ],
        [
            'expo-location',
            {
                locationWhenInUsePermission:
                    'Allow Forked permission to use your location to show nearby food.',
            },
        ],
        [
            'expo-camera',
            {
                cameraPermission:
                    'Allow Forked to access your camera to take photos of dishes.',
                microphonePermission: false,
                recordAudioAndroid: false,
            },
        ],
        [
            'expo-image-picker',
            {
                photosPermission:
                    'Allow Forked to access your photos to upload dish images.',
                cameraPermission:
                    'Allow Forked to access your camera to take photos of dishes.',
            },
        ],
        [
            'expo-dev-client',
            {
                launchMode: 'most-recent',
            },
        ],
        'expo-font',
        'expo-web-browser',
        'expo-apple-authentication',
        'expo-image',
        'expo-sharing',
        [
            '@react-native-google-signin/google-signin',
            {
                iosUrlScheme:
                    process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME ??
                    'com.googleusercontent.apps.REPLACE_WITH_REVERSED_IOS_CLIENT_ID',
            },
        ],
    ],
    experiments: {
        typedRoutes: true,
        reactCompiler: true,
    },
    extra: {
        router: {},
        eas: {
            projectId: '49ad787b-e696-44f7-8f59-476e0297aefa',
        },
    },
    owner: 'avinashj1',
});
