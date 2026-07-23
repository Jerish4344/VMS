export default {
  expo: {
    name: "VMS Mobile",
    slug: "vms-mobile",
    version: "1.1.3",
    newArchEnabled: true,
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#1a73e8",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.jeyarama.vms",
      infoPlist: {
        UIBackgroundModes: ["location"],
        NSLocationWhenInUseUsageDescription:
          "This app needs access to location to track vehicle trips.",
        NSLocationAlwaysUsageDescription:
          "This app needs access to location to track vehicle trips in the background.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "This app needs access to location to track vehicle trips and calculate distance traveled.",
        NSCameraUsageDescription:
          "This app needs access to camera to capture receipts and documents.",
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: false,
          NSAllowsLocalNetworking: true,
          NSExceptionDomains: {
            localhost: {
              NSExceptionAllowsInsecureHTTPLoads: true,
              NSIncludesSubdomains: true,
            },
          },
        },
      },
    },
    android: {
      package: "com.jeyarama.vms",
      versionCode: 18,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#1a73e8",
      },
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY || "",
        },
      },
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_LOCATION",
        "CAMERA",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_BACKGROUND_LOCATION",
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.FOREGROUND_SERVICE_LOCATION",
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
      ],
    },
    plugins: [
      "expo-secure-store",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Allow VMS Mobile to use your location for trip tracking.",
          isAndroidBackgroundLocationEnabled: true,
          isAndroidForegroundServiceEnabled: true,
        },
      ],
      [
        "expo-camera",
        {
          cameraPermission: "Allow VMS Mobile to access your camera.",
        },
      ],
      "expo-font",
    ],
    updates: {
      enabled: true,
      checkAutomatically: "ON_LOAD",
      fallbackToCacheTimeout: 5000,
      url: "https://u.expo.dev/008789ba-8b66-472e-a8e4-6c324214409a",
    },
    runtimeVersion: "1.1.2",
    extra: {
      eas: {
        projectId: "008789ba-8b66-472e-a8e4-6c324214409a",
      },
    },
  },
};
