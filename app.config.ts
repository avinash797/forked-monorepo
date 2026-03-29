import { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Forked",
  slug: "forked",
  version: "0.1.0",
  orientation: "portrait",
  scheme: "forked",
  userInterfaceStyle: "automatic",
  icon: "./assets/adaptive-icon.png",
  ios: {
    bundleIdentifier: "com.forked.prod",
    appStoreUrl: "https://apps.apple.com/app/id6740587828",
    buildNumber: "1",
    supportsTablet: true,
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    },
    icon: {
      dark: "./assets/ios-dark.png",
      light: "./assets/ios-light.png",
      tinted: "./assets/ios-tinted.png",
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSLocationWhenInUseUsageDescription: "Allow Forked permission to use your location to show nearby food.",
      NSLocationAlwaysUsageDescription: "Allow Forked permission to use your location to show nearby food."
    },
  },
  android: {
    playStoreUrl: "https://play.google.com/store/apps/details?id=com.forked.prod",
    adaptiveIcon: {
      backgroundColor: "#ffffff",
      foregroundImage: "./assets/adaptive-icon.png",
      monochromeImage: "./assets/adaptive-icon.png",
    },
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
      },
    },
    predictiveBackGestureEnabled: false,
    softwareKeyboardLayoutMode: "pan",
    package: "com.forked.prod",
    versionCode: 1,
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/splash-icon-dark.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          image: "./assets/splash-icon-light.png",
          backgroundColor: "#000000",
        },
      },
    ],
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "Allow Forked permission to use your location to show nearby food.",
      },
    ],
    [
      "expo-camera",
      {
        cameraPermission:
          "Allow Forked to access your camera to take photos of dishes.",
        microphonePermission: false,
        recordAudioAndroid: false,
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "Allow Forked to access your photos to upload dish images.",
        cameraPermission:
          "Allow Forked to access your camera to take photos of dishes.",
      },
    ],
    [
      "expo-dev-client",
      {
        launchMode: "most-recent",
      },
    ],
    "expo-secure-store",
    "expo-font",
    "expo-web-browser",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: "49ad787b-e696-44f7-8f59-476e0297aefa",
    },
  },
  owner: "avinashj1",
});
