# 🇮🇳 SafarNama (सफ़रनामा) — Map-First Social Travel Ecosystem

[![Android APK Build](https://github.com/Vinay-kumar-code/SafarNama/actions/workflows/build-android.yml/badge.svg)](https://github.com/Vinay-kumar-code/SafarNama/actions/workflows/build-android.yml)
[![React 19](https://img.shields.io/badge/React-19.3-61dafb.svg?style=flat-square&logo=react)](https://react.dev/)
[![Kotlin](https://img.shields.io/badge/Kotlin-2.1-7F52FF.svg?style=flat-square&logo=kotlin)](https://kotlinlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646cff.svg?style=flat-square&logo=vite)](https://vite.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/TailwindCSS-v4.0-38bdf8.svg?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase PostGIS](https://img.shields.io/badge/Supabase-PostGIS-3ecf8e.svg?style=flat-square&logo=supabase)](https://supabase.com/)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare-R2_Storage-F38020.svg?style=flat-square&logo=cloudflare)](https://cloudflare.com/)

> **Vision**: An Instagram-clean, map-first social travel ecosystem celebrating authentic India through the eyes of locals and travelers. Combines visual micro-blogging, travel tweets & threads, full-screen vertical reels, 1-on-1 direct messaging, and interactive Google Maps discovery.

---

## 📖 Complete Documentation
For an exhaustive, in-depth architectural specification covering all system components, data models, workflows, and CI/CD pipelines, please read **[PROJECT_DESCRIPTION.md](./PROJECT_DESCRIPTION.md)**.

---

## 🧭 Core Highlights & Architectural Features

### 1. Unified Social Feed (Photo Posts & Travel Tweets)
- **Photo Posts**: High-resolution image carousels with slide counters, double-tap heart animations, daily budget in INR (`₹`), seasonality recommendations, and mobile network signal availability.
- **Travel Tweets & Threads**: Micro-travel thoughts, road status updates, high-altitude pass advisories, and live weather alerts with threaded discussion capabilities.
- **Destination Tagging**: Posts and tweets attach destination hubs mapped directly into Maps and Search.
- **Group Travel Mentions**: Tag companions who journeyed together (`👥 With: @tenzin_spitilocal, @karan_banaras`).

### 2. Discussion & Comment System
- **Threaded Discussions for Tweets**: Specialized thread modal showing the parent tweet, connecting conversation line, and nested replies.
- **Universal Comments for Posts & Reels**: Fast, responsive bottom sheet for viewing and posting comments across all visual content.

### 3. Full-Screen Vertical Reels Engine
- Built with AndroidX Media3 / ExoPlayer for smooth vertical video scrolling.
- Direct Cloudflare R2 video streaming resolution with fallbacks.
- Interactive controls: Double-tap like, save, share, and a dedicated **Comment** button opening the comments sheet over the active reel.

### 4. Creator Studio (`+` Button)
- Prominent `+` button in the Home header allowing travelers to create:
  - **Travel Tweets / Threads**
  - **Photo Posts**
  - **Reel Videos**
- Includes destination selector spinner and comma-separated travel companion mentions.

### 5. 1-on-1 Direct Messaging (DM)
- Accessible from the Home top bar or any user's profile:
  - **Conversations List**: Displays active travel chats and partners.
  - **1-on-1 Chat Screen**: Instant two-way messaging with sent and received speech bubbles and real-time state updates.

### 6. Journey Follow & Notification Preferences
- Follow travelers and verified local guides to stay updated on their journeys.
- **Settings & Following Page**: Lists followed accounts with individual **Notification Alerts toggles** (*Alerts On* vs *Muted*) to customize notifications when they post new tweets, posts, or reels.

### 7. Clean Profile & Group Mentions Hub
- Modern Instagram-clean layout with no vanity follower counts, karma, or stamp clutter.
- Action buttons: Follow/Following toggle, Direct Message, and Persona Switcher (Traveler Aarav Sharma vs Verified Local Guide Tenzin Norbu).
- 3 Segmented Tabs:
  - **Posts & Tweets**: Content created by the user.
  - **👥 Mentions**: Dedicated section showing trips and stories where this user was tagged by others in group journeys.
  - **🔖 Saved**: Bookmarked bucket-list destinations and reels.

### 8. Admin Destination Management & Search Mapping
- Web Admin Portal (Passkey: `admin2026`) and Android Destination Creator modal.
- Admins can add destinations with names, states, taglines, cover images, descriptions, budgets, and GPS coordinates.
- Tapping any destination in Search displays all attached tweets and stories.

---

## 🚀 Quick Start

### Web Application (React 19 + TypeScript + Vite)
```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Build for production
npm run build
```

### Native Android Application (Kotlin + Gradle)
```bash
# Navigate to the android project directory
cd android

# Build debug APK
./gradlew assembleDebug

# Output APK path:
# android/app/build/outputs/apk/debug/app-debug.apk
```

---

## ⚙️ Environment Configuration

Set these variables in your root `.env`, `android/local.properties`, Vercel Deployment settings, or GitHub Secrets:

```ini
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_MAPS_API_KEY=AIzaSyPlaceholderSafarnamaMapsKey
VITE_CLOUDFLARE_R2_PUBLIC_URL=https://media.safarnama.travel
```

---

## 📄 License
Open-source under the MIT License.
