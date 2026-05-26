import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "NotesApp",
  slug: "notes-app",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  splash: {
    resizeMode: "contain",
    backgroundColor: "#0F0F14"
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.notesapp.app"
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#0F0F14"
    },
    package: "com.notesapp.app"
  },
  plugins: [
    "expo-router"
  ],
  scheme: "notesapp",
  experiments: {
    typedRoutes: true
  }
});