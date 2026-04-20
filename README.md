# 💎 Optima Polyplast
### Premium E-Commerce Experience for Distribution & Wholesale

[![Expo](https://img.shields.io/badge/Expo-52.0-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.76-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![Axios](https://img.shields.io/badge/Axios-1.7-5A29E4?style=for-the-badge&logo=axios&logoColor=white)](https://axios-http.com)
[![License](https://img.shields.io/badge/License-Private-critical?style=for-the-badge)](https://github.com/)

**Optima Polyplast** is a state-of-the-art mobile application designed for wholesale ordering and supply chain management. Built with a focus on premium aesthetics and high-performance engineering, it provides a seamless bridge between distributors and the central warehouse.

---

## ✨ Key Features

- 📱 **Premium UI/UX**: Deep burgundy and gold palette with Glassmorphism effects and modern typography (DM Sans).
- ⚡ **Turbo Image Loading**: Powered by `expo-image` with persistent disk caching and smooth 300ms transitions.
- 🔔 **Custom Alerts**: High-end interactive alert provider replacing native system dialogs for a cohesive branded experience.
- 🛒 **Smart Cart Logic**: Dynamic quantity management with real-time feedback and direct navigation from cart to product details.
- 🛡️ **Secure Checkout**: Comprehensive order flow supporting partial/online payments with receipt verification.
- 🚦 **Robust API Handling**: Centralized error interceptors providing user-friendly feedback instead of raw technical errors.
- 🌑 **Modern Design Tokens**: Fully custom design system with consistent spacing, radius, and shadows.

---

## 🛠️ Technical Stack

- **Core Framework**: React Native (Expo SDK 52)
- **Navigation**: React Navigation (Native Stack + Bottom Tabs)
- **Performance**: `expo-image` for hardware-accelerated rendering
- **Networking**: Axios with centralized error handling and response normalization
- **State Management**: React Context API (Auth & Cart)
- **Styling**: Vanilla JavaScript-based design tokens for maximum flexibility

---

## 📂 Project Structure

```text
src/
├── api/          # Centralized API logic & Error Interceptors
├── components/   # Custom UI Library (Alerts, UI primitives, etc.)
├── context/      # Global State (Authentication, Cart)
├── navigation/   # Typed Navigation Stacks
├── screens/      # Feature-specific views
└── theme.js      # Global Design Tokens (Colors, Typography)
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** (LTS version)
- **Expo Go** app (iOS/Android)
- **EAS CLI** (for cloud builds)

### 2. Installation
```bash
# Install dependencies
npm install

# Clear cache and start server
npx expo start --clear
```

### 3. Environment Setup
Create/Configure your `.env` or update `BASE_URL` in `src/api/index.js` to point to your development server's IP.

---

## 📦 Deployment (EAS Build)

The project is pre-configured for **Expo Application Services (EAS)**:

- **Build Preview (APK)**: `eas build -p android --profile preview`
- **Build Production (AAB)**: `eas build -p android --profile production`

---

## 🎨 Design Philosophy

Optima Polyplast follows a **"Luxury Industrial"** aesthetic:
- **Primary**: Burgundy (`#6B1A2A`) - Representing strength and heritage.
- **Accent**: Optima Blue (`#2563eb`) - Replacing previous indigo for a professional, reliable touch.
- **Neutral**: Slate Grays and High-Contrast Blacks for readability.

---

<p align="center">
  Built for Optima Polyplast Distribution
</p>
