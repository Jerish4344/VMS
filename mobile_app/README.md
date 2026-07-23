# VMS Mobile App

React Native Expo mobile application for the Vehicle Management System.

## Features

- **Authentication**: Login with company credentials
- **Dashboard**: Overview of vehicles, trips, and stats
- **Vehicles**: View and manage fleet vehicles
- **Trips**: Start, track, and end trips with GPS support
- **Fuel**: Log fuel transactions with receipt capture
- **Maintenance**: Schedule and track vehicle maintenance
- **Documents**: View document expiry status

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator or Expo Go app on your phone

## Setup

1. **Install dependencies:**
   ```bash
   cd mobile_app
   npm install
   ```

2. **Configure API endpoint:**
   
    Edit `src/constants/config.js` and update `API_BASE_URL` to your Django server IP:
   ```javascript
   export const API_BASE_URL = 'http://YOUR_SERVER_IP:8000';
   ```
   
    For local development, use your computer's local IP (not localhost).
    
3. **Add assets:**
   
   Add the following images to the `assets/` folder:
   - `icon.png` (1024x1024) - App icon
   - `splash.png` (1284x2778) - Splash screen
   - `adaptive-icon.png` (1024x1024) - Android adaptive icon
   - `favicon.png` (48x48) - Web favicon

4. **Start the development server:**
   ```bash
   npm start
   # or
   expo start
   ```

5. **Run on device/emulator:**
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app on your phone

## Django Backend Setup

The Django backend needs to be configured to support the mobile API:

1. **Install required packages:**
   ```bash
   pip install django-cors-headers
   ```

2. **Run migrations for auth tokens:**
   ```bash
   python manage.py migrate
   ```

3. **Start Django server (accessible from mobile):**
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

## API Endpoints

The mobile app uses the following API endpoints:

- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `GET /api/auth/profile/` - Get user profile
- `GET /api/dashboard/` - Dashboard stats
- `GET/POST /api/vehicles/` - Vehicle list/create
- `GET/POST /api/trips/` - Trip list/create
- `POST /api/trips/start/` - Start a trip
- `POST /api/trips/<id>/end/` - End a trip
- `GET /api/trips/my-trips/` - User's trips
- `GET /api/trips/ongoing/` - Ongoing trips
- `GET/POST /api/maintenance/` - Maintenance records
- `GET/POST /api/fuel/` - Fuel transactions
- `GET /api/documents/` - Documents list
- `GET /api/documents/expiring/` - Expiring documents

## Building for Production

### Android APK:
```bash
expo build:android -t apk
```

### iOS IPA:
```bash
expo build:ios -t archive
```

### EAS Build (recommended):
```bash
npx eas build --platform android
npx eas build --platform ios
```

## Project Structure

```
mobile_app/
├── App.js                 # App entry point
├── app.json              # Expo configuration
├── package.json          # Dependencies
├── assets/               # Images and icons
└── src/
    ├── api/              # API clients
    ├── components/       # Reusable UI components
    ├── constants/        # Colors, config
    ├── context/          # React contexts (Auth)
    ├── navigation/       # Navigation setup
    ├── screens/          # Screen components
    │   ├── auth/
    │   ├── dashboard/
    │   ├── vehicles/
    │   ├── trips/
    │   ├── maintenance/
    │   ├── fuel/
    │   ├── documents/
    │   └── profile/
    └── utils/            # Utility functions
```

## Troubleshooting

### Network Request Failed
- Ensure Django server is running on `0.0.0.0:8000`
- Check that `EXPO_PUBLIC_API_BASE_URL` in `.env` uses your computer's local IP
- Verify CORS is enabled in Django settings

### Authentication Issues
- Run `python manage.py migrate` to create token table
- Check that `rest_framework.authtoken` is in INSTALLED_APPS

### Location Permission Issues
- Ensure location permissions are granted in device settings
- Check that expo-location is properly installed
