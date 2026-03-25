# 🍷 Cellar — Fine Wines & Spirits App
### React Native (Expo) — Complete Setup & Play Store Guide

---

## Project Structure

```
MyWineApp/
├── App.js                          ← Root: fonts, providers, error boundary
├── app.json                        ← Expo config (name, package id, permissions)
├── eas.json                        ← EAS Build config (APK / AAB)
├── package.json
├── babel.config.js
├── assets/
│   ├── icon.png                    ← App icon (1024×1024 PNG) ← YOU MUST ADD THIS
│   ├── splash.png                  ← Splash screen (1242×2436 PNG) ← YOU MUST ADD THIS
│   └── adaptive-icon.png           ← Android adaptive icon (1024×1024)
└── src/
    ├── api/
    │   └── index.js                ← All 13 API endpoints (Axios)
    ├── components/
    │   ├── UI.js                   ← Button, Input, Card, Badge, EmptyState, etc.
    │   ├── ErrorBoundary.js        ← Catches runtime crashes
    │   └── Toast.js                ← In-app notification system
    ├── context/
    │   ├── AuthContext.js          ← JWT token + user state (AsyncStorage)
    │   └── CartContext.js          ← Global cart item count
    ├── hooks/
    │   └── useApi.js               ← useApi() and useMutation() hooks
    ├── navigation/
    │   └── AppNavigator.js         ← Auth stack + Bottom tabs + App stack
    ├── screens/
    │   ├── LoginScreen.js
    │   ├── RegisterScreen.js
    │   ├── HomeScreen.js           ← Banner carousel, categories, deals
    │   ├── ProductsScreen.js       ← Grid + filters + search
    │   ├── ProductDetailScreen.js  ← Detail + quantity + add to cart
    │   ├── CartScreen.js           ← Items + summary + checkout CTA
    │   ├── CheckoutScreen.js       ← Address + order summary + place order
    │   ├── PaymentScreen.js        ← Razorpay IDs + screenshot upload
    │   ├── OrderSuccessScreen.js   ← Animated confirmation
    │   ├── OrdersScreen.js         ← Order history with status badges
    │   └── ProfileScreen.js        ← View/edit profile + change password
    └── theme.js                    ← Colors, typography, spacing, shadows
```

---

## PHASE 1 — First Time Setup

### 1. Install Node.js (v18+)
Download from https://nodejs.org — choose the LTS version.

Verify:
```bash
node -v   # Should show v18.x or higher
npm -v
```

### 2. Install Expo and EAS CLIs globally
```bash
npm install -g expo-cli eas-cli
```

### 3. Create an Expo account
Go to https://expo.dev → Sign Up (free)

### 4. Open the project folder in VS Code
```
File → Open Folder → select MyWineApp
```

---

## PHASE 2 — Install Dependencies

Run these commands in the VS Code terminal (Terminal → New Terminal):

### Install all packages at once:
```bash
npm install

# Then install Expo-managed native packages:
npx expo install expo-splash-screen expo-image-picker
npx expo install @expo-google-fonts/playfair-display @expo-google-fonts/dm-sans
npx expo install react-native-screens react-native-safe-area-context
npx expo install @react-native-async-storage/async-storage
```

### If you don't have a package.json yet, install manually:
```bash
npm install axios
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
```

---

## PHASE 3 — Configure Your App

### 1. Set your backend URL
Open `src/api/index.js` and update:
```js
// For testing on a physical device connected to same WiFi:
export const BASE_URL = 'http://YOUR_COMPUTER_IP:5000/api/user';
// e.g. 'http://192.168.1.10:5000/api/user'

// For Android emulator:
export const BASE_URL = 'http://10.0.2.2:5000/api/user';

// For production (Play Store):
export const BASE_URL = 'https://yourapi.yourdomain.com/api/user';
```

To find your computer's IP on Windows: open Command Prompt → type `ipconfig`
Look for "IPv4 Address" under your WiFi adapter.

### 2. Update app.json
Open `app.json` and change:
- `"name"`: Your app's display name
- `"slug"`: Unique identifier (lowercase, hyphens only)
- `"android.package"`: Unique package name like `com.yourname.appname`
  ⚠️ This CANNOT be changed after Play Store submission!
- `"ios.bundleIdentifier"`: Same format

---

## PHASE 4 — Add App Icons & Splash Screen

You MUST add these image files to the `assets/` folder:

| File | Size | Description |
|------|------|-------------|
| `assets/icon.png` | 1024×1024 px | Main app icon (no rounded corners — Android adds them) |
| `assets/adaptive-icon.png` | 1024×1024 px | Android adaptive icon foreground |
| `assets/splash.png` | 1242×2436 px | Splash screen image |

**Free tools to create icons:**
- https://www.appicon.co — generate all sizes from one image
- https://canva.com — design your icon
- Keep background color `#6B1A2A` (burgundy) to match splash

---

## PHASE 5 — Run the App for Development

### Start development server:
```bash
npx expo start
```

### Test on your phone (easiest method):
1. Install **Expo Go** app on your Android phone from Play Store
2. Scan the QR code shown in terminal
3. App loads live on your phone ✅

### Test on Android emulator (requires Android Studio — optional):
```bash
npx expo start --android
```

---

## PHASE 6 — Build for Play Store (No Android Studio needed!)

EAS Build runs on Expo's cloud servers. You just run a command and download the result.

### Step 1: Log in to EAS
```bash
eas login
# Enter your expo.dev credentials
```

### Step 2: Link your project
```bash
eas build:configure
```
This updates `app.json` with your EAS project ID automatically.

### Step 3: Build a TEST APK (install directly on phone)
```bash
npm run build:preview
# OR:
eas build -p android --profile preview
```
- Build takes ~10–15 minutes on Expo's servers
- You'll get a download link for the `.apk` file
- Download it, transfer to phone, install it (enable "Unknown sources" in settings)

### Step 4: Build PRODUCTION AAB (for Play Store)
```bash
npm run build:production
# OR:
eas build -p android --profile production
```
- Produces a `.aab` (Android App Bundle) file
- This is what you upload to Google Play Console

---

## PHASE 7 — Play Store Submission

### Step 1: Create Google Play Developer account
- Go to https://play.google.com/console
- Pay the one-time $25 registration fee
- Fill in your developer profile

### Step 2: Create a new app
1. Click "Create app"
2. Fill in: App name, default language, app type (App), free/paid
3. Accept policies

### Step 3: Fill in the Store Listing
Go to "Store presence → Main store listing":
- **App name**: Your app name
- **Short description**: Max 80 characters
- **Full description**: Max 4000 characters
- **Screenshots**: Required — at least 2 phone screenshots (use your test APK to take them)
- **Feature graphic**: 1024×500 PNG banner
- **Icon**: 512×512 PNG

### Step 4: Set up content rating
- Go to "Policy → App content"
- Complete the content rating questionnaire
- Alcohol-related apps must set appropriate age rating

### Step 5: Upload your AAB
1. Go to "Release → Production → Create new release"
2. Upload your `.aab` file
3. Write release notes
4. Click "Review release"

### Step 6: Submit for review
- Click "Start rollout to production"
- First review takes 1–7 days
- Updates are usually reviewed within hours

---

## PHASE 8 — Using Toast Notifications in Screens

The `Toast` system is already set up. Use it in any screen:

```js
import { useToast } from '../components/Toast';

export default function MyScreen() {
  const { show } = useToast();

  const handleAction = async () => {
    try {
      await someApiCall();
      show('Done! Item added successfully.', 'success');
    } catch (e) {
      show(e.message, 'error');
    }
  };
}
```

Types: `'success'` | `'error'` | `'warning'` | `'info'`

---

## PHASE 9 — Using the useApi Hook

Instead of writing `useState` + `useEffect` + try/catch in every screen, use the hook:

```js
import { useApi, useMutation } from '../hooks/useApi';
import { getProducts, addToCart } from '../api';

export default function MyScreen() {
  // Fetches on mount, gives loading/error/data/refetch
  const { data: products, loading, error, refetch } = useApi(getProducts, ['wine', 'red']);

  // For actions (POST/DELETE)
  const { mutate: doAddToCart, loading: addingToCart } = useMutation(addToCart, {
    onSuccess: () => show('Added to cart!', 'success'),
    onError: (msg) => show(msg, 'error'),
  });

  const handleAdd = () => doAddToCart(productId, 1, 1);
}
```

---

## Common Issues & Fixes

### "Network request failed" on device
- Your phone and computer must be on the **same WiFi**
- Use your computer's local IP (not localhost) in `src/api/index.js`
- Make sure your backend server is running

### Fonts not loading
```bash
npx expo install @expo-google-fonts/playfair-display @expo-google-fonts/dm-sans
```

### Build fails on EAS
- Run `eas diagnostics` to check your setup
- Make sure `app.json` has a unique `android.package`

### "Unable to resolve module" error
```bash
rm -rf node_modules
npm install
npx expo start --clear
```

### App crashes on launch
- Check that all images in `assets/` exist
- Temporarily comment out the `SplashScreen.preventAutoHideAsync()` line to debug

---

## Environment: Development vs Production

Create a simple config file at `src/config.js`:

```js
const ENV = {
  dev: {
    apiUrl: 'http://192.168.1.10:5000/api/user',
  },
  prod: {
    apiUrl: 'https://yourapi.yourdomain.com/api/user',
  },
};

const isDev = __DEV__;
export default isDev ? ENV.dev : ENV.prod;
```

Then in `src/api/index.js`:
```js
import config from '../config';
const BASE_URL = config.apiUrl;
```

---

## Checklist Before Play Store Submission

- [ ] `android.package` in app.json is unique and final
- [ ] `versionCode` is 1 (increment by 1 for each update)
- [ ] `version` string updated (e.g. "1.0.0")
- [ ] Backend URL is your production HTTPS URL (not localhost!)
- [ ] `assets/icon.png` is 1024×1024
- [ ] `assets/splash.png` exists
- [ ] App tested on a real Android device
- [ ] Screenshots taken for Play Store listing
- [ ] Content rating questionnaire completed
- [ ] Privacy policy URL provided (required by Google)

---

## Quick Reference: All Commands

| Task | Command |
|------|---------|
| Start dev server | `npx expo start` |
| Clear cache + start | `npx expo start --clear` |
| Build test APK | `eas build -p android --profile preview` |
| Build production AAB | `eas build -p android --profile production` |
| Submit to Play Store | `eas submit -p android --profile production` |
| Check EAS build status | `eas build:list` |
| Login to EAS | `eas login` |
| Reinstall packages | `rm -rf node_modules && npm install` |
