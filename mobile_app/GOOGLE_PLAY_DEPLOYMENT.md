# Vehicle Management System - Google Play Store Deployment Guide

This guide covers the complete process of publishing the VMS Mobile App to Google Play Store.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [App Configuration](#app-configuration)
3. [Building the APK/AAB](#building-the-apkaab)
4. [Google Play Console Setup](#google-play-console-setup)
5. [Store Listing Preparation](#store-listing-preparation)
6. [App Submission](#app-submission)
7. [Post-Launch](#post-launch)

---

## Prerequisites

### 1. Development Environment
- Node.js (v18 or higher)
- Expo CLI installed globally: `npm install -g expo-cli`
- EAS CLI installed globally: `npm install -g eas-cli`
- Expo account (create at https://expo.dev)

### 2. Google Play Requirements
- Google Play Developer Account ($25 one-time fee)
  - Register at: https://play.google.com/console/signup
- Google Cloud Project (for signing)

### 3. Backend Configuration
Your Django backend is already running at `https://jeyarama.com/vms`. Ensure:
- HTTPS is enabled (SSL certificate)
- CORS is configured to allow mobile app requests
- API endpoints are accessible

---

## App Configuration

### Step 1: Update API Base URL

Edit `mobile_app/src/constants/config.js`:

```javascript
// Production API URL
export const API_BASE_URL = 'https://jeyarama.com/vms';

```bash
EXPO_PUBLIC_API_BASE_URL=https://jeyarama.com/vms
```

### Step 2: Update app.json

Edit `mobile_app/app.json` with your production settings:

```json
{
  "expo": {
    "name": "VMS Mobile",
    "slug": "vms-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.jeyarama.vms"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.jeyarama.vms",
      "versionCode": 1,
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow VMS to use your location for trip tracking."
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": "Allow VMS to access your camera for document scanning."
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

### Step 3: Create App Icons and Splash Screen

Replace placeholder assets with proper designs:

| Asset | Size | Location |
|-------|------|----------|
| App Icon | 1024x1024 px | `assets/icon.png` |
| Adaptive Icon | 1024x1024 px | `assets/adaptive-icon.png` |
| Splash Screen | 1284x2778 px | `assets/splash.png` |
| Favicon | 48x48 px | `assets/favicon.png` |

**Design Tips:**
- Use PNG format with transparency for icons
- Keep important content in the center (safe zone) for adaptive icons
- Splash screen should have your logo centered

---

## Building the APK/AAB

### Step 1: Login to Expo

```bash
npx expo login
```

### Step 2: Configure EAS Build

Create `eas.json` in the `mobile_app` directory:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

### Step 3: Initialize EAS Project

```bash
cd mobile_app
eas build:configure
```

### Step 4: Build for Testing (APK)

```bash
# Build APK for internal testing
eas build --platform android --profile preview
```

### Step 5: Build for Production (AAB)

```bash
# Build Android App Bundle for Play Store
eas build --platform android --profile production
```

**Note:** Google Play Store requires AAB (Android App Bundle) format, not APK.

### Step 6: Download the Build

After the build completes:
1. Go to https://expo.dev
2. Navigate to your project's builds
3. Download the `.aab` file

---

## Google Play Console Setup

### Step 1: Create Developer Account

1. Go to https://play.google.com/console
2. Pay the $25 registration fee
3. Complete identity verification

### Step 2: Create New App

1. Click "Create app"
2. Fill in:
   - **App name:** VMS Mobile
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free
3. Accept declarations and create

### Step 3: Set Up App Signing

1. Go to **Release > Setup > App signing**
2. Choose "Let Google manage and protect your app signing key"
3. This is the recommended and most secure option

### Step 4: Complete App Content

Navigate to **Policy > App content** and complete:

#### Privacy Policy
Create a privacy policy page and add the URL:
- Example: `https://jeyarama.com/vms/privacy-policy`

**Privacy Policy should include:**
- What data you collect (location, camera access, user info)
- How data is used
- Data storage and security
- User rights
- Contact information

#### App Access
- Select "All or some functionality is restricted"
- Provide test credentials:
  - Username: `testuser`
  - Password: `testpassword123`
- Create this test account in your Django admin

#### Ads
- Select "No, my app does not contain ads"

#### Content Rating
- Complete the questionnaire for your app
- For a fleet management app, expect "Everyone" or "Low Maturity"

#### Target Audience
- Select "18 and over" (business app)

#### News App
- Select "No"

#### Data Safety
Complete the data safety form:

| Data Type | Collected | Shared | Purpose |
|-----------|-----------|--------|---------|
| Location | Yes | No | App functionality (trip tracking) |
| Personal info | Yes | No | Account management |
| Photos | Yes | No | Document uploads |

#### Government Apps
- Select "No" (unless applicable)

---

## Store Listing Preparation

### Step 1: Main Store Listing

Navigate to **Grow > Store presence > Main store listing**

#### App Details
- **App name:** VMS Mobile - Vehicle Management System
- **Short description (80 chars max):**
  ```
  Manage your fleet vehicles, track trips, fuel, and maintenance on the go.
  ```
- **Full description (4000 chars max):**
  ```
  VMS Mobile is the official mobile companion for the Vehicle Management System. 
  Designed for fleet managers, drivers, and staff to efficiently manage vehicles, 
  track trips, and maintain records on the go.

  KEY FEATURES:

  📊 Dashboard
  • Real-time overview of fleet status
  • Quick access to active trips and pending tasks
  • Monthly statistics and insights

  🚗 Vehicle Management
  • View all fleet vehicles
  • Check vehicle status and availability
  • Access vehicle details and documents

  🗺️ Trip Management
  • Start and end trips with GPS tracking
  • Record odometer readings
  • View trip history and details

  ⛽ Fuel Tracking
  • Log fuel transactions
  • Capture fuel receipts
  • Track fuel efficiency

  🔧 Maintenance
  • View scheduled maintenance
  • Report vehicle issues
  • Track maintenance history

  📄 Documents
  • Access vehicle documents
  • Get expiry notifications
  • Digital document storage

  ROLE-BASED ACCESS:
  • Administrators: Full system access
  • Managers: Fleet oversight and reporting
  • Drivers: Trip logging and vehicle access
  • Personal Vehicle Staff: Reimbursement tracking

  SECURITY:
  • Secure token-based authentication
  • Role-based permissions
  • Data encryption

  Connect to your organization's VMS portal for seamless fleet management.

  For support, contact: support@jeyarama.com
  ```

#### Graphics

| Asset | Requirement |
|-------|-------------|
| App icon | 512x512 px PNG |
| Feature graphic | 1024x500 px |
| Phone screenshots | Min 2, Max 8 (16:9 or 9:16) |
| 7-inch tablet screenshots | Optional |
| 10-inch tablet screenshots | Optional |

**Screenshot suggestions:**
1. Login screen
2. Dashboard with stats
3. Vehicle list
4. Start trip screen
5. Fuel tracking
6. Vehicle details

### Step 2: Store Settings

Navigate to **Grow > Store presence > Store settings**

- **App category:** Business
- **Contact email:** support@jeyarama.com
- **Contact phone:** Your business phone
- **Contact website:** https://jeyarama.com/vms

---

## App Submission

### Step 1: Create a Release

1. Go to **Release > Production**
2. Click "Create new release"

### Step 2: Upload AAB

1. Upload the `.aab` file from EAS Build
2. The file will be processed and validated

### Step 3: Release Notes

Add release notes:
```
Version 1.0.0 - Initial Release

• Dashboard with fleet overview
• Vehicle management and tracking
• Trip start/end with GPS location
• Fuel transaction logging
• Maintenance scheduling
• Document management
• Role-based access control
• Secure authentication
```

### Step 4: Review and Rollout

1. Click "Review release"
2. Fix any errors or warnings
3. Click "Start rollout to Production"

### Step 5: Submit for Review

Google will review your app, which typically takes:
- **First submission:** 1-7 days
- **Updates:** 1-3 days

---

## Post-Launch

### Monitor Performance

1. **Crashes & ANRs:** Check Android Vitals
2. **User reviews:** Respond promptly
3. **Install statistics:** Track growth

### Update Process

For future updates:

1. Update version in `app.json`:
   ```json
   {
     "version": "1.1.0",
     "android": {
       "versionCode": 2
     }
   }
   ```

2. Build new AAB:
   ```bash
   eas build --platform android --profile production
   ```

3. Upload to Play Console and create new release

### Staged Rollout

For safer updates:
1. Start with 10% rollout
2. Monitor crash reports
3. Gradually increase to 100%

---

## Backend Configuration for Production

### Django Settings (settings.py)

Ensure these settings are configured:

```python
# CORS - Allow mobile app
CORS_ALLOWED_ORIGINS = [
    "https://jeyarama.com",
]

# For mobile app using expo
CORS_ALLOW_ALL_ORIGINS = False  # Set to False in production
CORS_ALLOW_CREDENTIALS = True

# Security
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

### API URL Configuration

Ensure your Django `urls.py` includes:
```python
path('api/', include('core.api_urls')),
```

---

## Troubleshooting

### Common Issues

1. **Build fails with signing error**
   - Run `eas credentials` to manage Android keystore
   - Let EAS manage credentials automatically

2. **App rejected for policy violation**
   - Review rejection reason in Play Console
   - Common issues: missing privacy policy, unclear permissions

3. **API connection fails in production**
   - Verify HTTPS is working
   - Check CORS configuration
   - Test API endpoints manually

4. **Location not working**
   - Verify permissions in app.json
   - Check expo-location plugin configuration

### Support Resources

- Expo Documentation: https://docs.expo.dev
- EAS Build: https://docs.expo.dev/build/introduction
- Google Play Console Help: https://support.google.com/googleplay/android-developer

---

## Quick Reference Commands

```bash
# Login to Expo
npx expo login

# Configure EAS
eas build:configure

# Build preview APK (for testing)
eas build --platform android --profile preview

# Build production AAB (for Play Store)
eas build --platform android --profile production

# Submit to Play Store (automated)
eas submit --platform android

# Check build status
eas build:list

# View credentials
eas credentials
```

---

## Checklist Before Submission

- [ ] API URL updated to production (https://jeyarama.com/vms)
- [ ] App icons and splash screen created
- [ ] app.json configured with correct package name
- [ ] eas.json created with build profiles
- [ ] Privacy policy page created and URL added
- [ ] Test account created for Google review
- [ ] Screenshots captured (minimum 2)
- [ ] Feature graphic created (1024x500)
- [ ] Store description written
- [ ] Data safety form completed
- [ ] Content rating questionnaire completed
- [ ] AAB file built and uploaded
- [ ] Release notes added

---

## Contact

For technical support:
- Email: support@jeyarama.com
- Web: https://jeyarama.com/vms

Document Version: 1.0
Last Updated: January 2026
