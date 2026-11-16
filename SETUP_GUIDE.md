# 🇮🇳 SafarNama (सफ़रनामा) — Complete Architecture & External Setup Guide

> **Vision**: An Instagram-simple, map-first social travel ecosystem showcasing authentic India through the eyes of locals and travelers—eliminating trip-planning friction while turning personal journeys into living, crowdsourced travel guides.

---

## 📑 Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Local Development & Running the App](#2-local-development--running-the-app)
3. [Step 1: Supabase Setup (PostgreSQL + PostGIS & Auth)](#step-1-supabase-setup-postgresql--postgis--auth)
4. [Step 2: Mapbox GL JS Setup (Vector Clustering & Custom Themes)](#step-2-mapbox-gl-js-setup)
5. [Step 3: Cloudflare Stream & R2 Pipeline (Adaptive HLS Video & Zero-Egress Images)](#step-3-cloudflare-stream--r2-pipeline)
6. [Step 4: Capacitor 6+ & Android Native App Generation](#step-4-capacitor-6--android-native-app-generation)
7. [Step 5: Capgo Over-The-Air (OTA) Live Updates Setup](#step-5-capgo-over-the-air-ota-live-updates-setup)
8. [Step 6: Typesense / Meilisearch Indexing (Indian Slang & Typo-Tolerant Search)](#step-6-typesense--meilisearch-indexing)

---

## 1. Architecture Overview

```
               ┌────────────────────────────────────────────────────────┐
               │           React 19 + TypeScript + Tailwind CSS         │
               │            (Capacitor 6 Android & Webview)             │
               └──────────────────────────┬─────────────────────────────┘
                                          │
                  ┌───────────────────────┼────────────────────────┐
                  ▼                       ▼                        ▼
       ┌──────────────────────┐ ┌───────────────────┐ ┌──────────────────────┐
       │     Supabase PostGIS │ │ Cloudflare Stream │ │    Mapbox GL JS      │
       │ (Geospatial Queries, │ │  (Adaptive HLS,   │ │ (Vector Clustering,  │
       │  RLS, Dual-Profiles) │ │  Zero-Egress R2)  │ │   Custom Dark Theme) │
       └──────────────────────┘ └───────────────────┘ └──────────────────────┘
                  │                       │                        │
                  ▼                       ▼                        ▼
       ┌──────────────────────┐ ┌───────────────────┐ ┌──────────────────────┐
       │ Capgo OTA Updater    │ │ Typesense Search  │ │ Native Capacitor     │
       │ (Instant Code Pushes │ │ (Local Indian     │ │ (GPS, Camera,        │
       │  Bypassing Review)   │ │  Slang & Typos)   │ │  Filesystem, Share)  │
       └──────────────────────┘ └───────────────────┘ └──────────────────────┘
```

---

## 2. Local Development & Running the App

The project runs immediately out of the box with built-in mock data for Spiti Valley, Varanasi, Meghalaya, Old Delhi, and Hampi!

```bash
# 1. Install dependencies (already installed)
npm install

# 2. Run the Vite development server
npm run dev

# 3. Build for production
npm run build
```

Your app will be available at `http://localhost:5173`.

---

## Step 1: Supabase Setup (PostgreSQL + PostGIS & Auth)

Supabase handles the geospatial indexing, dual-identity accounts (Traveler vs Local Guide), and community Q&A.

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create an account.
2. Click **New Project**, choose a project name (e.g., `safarnama-prod`), set a secure database password, and select the **Mumbai (ap-south-1)** region for lowest latency across India.

### 2. Run the PostGIS Database Schema
1. In the Supabase Dashboard, go to **SQL Editor** in the left sidebar.
2. Click **New Query**.
3. Open `supabase/schema.sql` from this repository, paste the entire contents into the SQL Editor, and click **Run**.
4. This will automatically:
   - Enable `postgis` and `uuid-ossp` extensions.
   - Create tables: `profiles`, `destinations`, `posts`, `qa_threads`, `qa_replies`, `trips`, `trip_stops`, `campaigns`, `sponsored_stays`.
   - Setup Row-Level Security (RLS) policies.
   - Create PostGIS RPC functions: `get_nearby_posts(lat, lng, radius_km)` and `get_sequenced_trip_route(trip_uuid)`.

### 3. Copy API Keys to Your `.env`
1. Go to **Project Settings** > **API**.
2. Copy **Project URL** and **Project API Key (anon / public)**.
3. Create `.env` in the root of the project:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

---

## Step 2: Mapbox GL JS Setup

Mapbox provides 60fps vector clustering, custom travel cartography, and high-altitude topographic hillshade rendering.

### 1. Get a Free Public Access Token
1. Go to [account.mapbox.com](https://account.mapbox.com) and sign up (free tier includes 50,000 map loads per month).
2. Go to your **Access Tokens** tab and copy your **Default Public Token** (starts with `pk.eyJ...`).
3. Add it to your `.env`:
   ```env
   VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1l...
   ```

### 2. Optional: Custom Indian Travel Cartography
- In **Mapbox Studio**, create a custom Dark/Sand style highlighting national parks, high-altitude passes, and heritage monuments.
- Pass your style URL (e.g., `mapbox://styles/yourusername/clw...`) to Mapbox GL JS.

---

## Step 3: Cloudflare Stream & R2 Pipeline

Ensures reels load instantaneously even on spotty 4G networks in remote Himalayan passes or rural North East routes.

### 1. Cloudflare Stream (Adaptive HLS Video)
1. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/) and navigate to **Stream**.
2. Upload video clips using the Direct Creator Upload API or tus-js-client.
3. Cloudflare automatically generates adaptive bitrate HLS playlists (`.m3u8`) with resolutions from 360p (for remote Indian 2G/3G networks) up to 1080p (for 5G metro networks).
4. Save the returned `playback.hls` URL in the `posts.video_url` column in Supabase.

### 2. Cloudflare R2 (Zero Egress Images)
1. In Cloudflare, navigate to **R2 Object Storage** and create a bucket named `safarnama-media`.
2. Connect a custom domain (e.g. `media.safarnama.travel`).
3. Enable Cloudflare Image Resizing to automatically serve `.webp` images at variable DPRs.

---

## Step 4: Capacitor 6+ & Android Native App Generation

Capacitor wraps your React 19 single-page app into a native Android APK / AAB package.

### 1. Initialize & Build
```bash
# Build the optimized production assets
npm run build

# Add the Android platform
npx cap add android

# Sync web assets and native plugins (@capacitor/geolocation, @capacitor/camera, etc.)
npx cap sync
```

### 2. Android Permissions (GPS & Camera)
In `android/app/src/main/AndroidManifest.xml`, the following permissions are pre-configured:
```xml
<!-- Precise GPS for Checkpoint check-ins & content geotagging -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<!-- In-app camera for reels & travel photo dumps -->
<uses-permission android:name="android.permission.CAMERA" />

<!-- Offline trip storage -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### 3. Open in Android Studio & Run
```bash
npx cap open android
```
In Android Studio:
- Select your target device or emulator.
- Click **Run** (Green play button) to launch SafarNama on Android!

---

## Step 5: Normal Bundled Over-The-Air (OTA) Updates & GitHub Actions APK

Instead of proprietary or paid cloud services, SafarNama uses **clean, self-hosted bundled OTA updates** with `@capacitor/preferences`.

### 1. How the Normal OTA Works:
1. Whenever you change code, run:
   ```bash
   npm run ota:bundle
   ```
   This automatically:
   - Compiles the React/Vite app into `dist/`.
   - Compresses the assets into `ota/bundle.zip`.
   - Bumps the version number in `ota/manifest.json`.
2. Commit and push your changes to GitHub:
   ```bash
   git add .
   git commit -m "feat: new travel updates"
   git push origin main
   ```
3. When users open the app, SafarNama checks `ota/manifest.json` on app start. If an update is detected, it shows a seamless update pill and automatically bundles & reloads the new version!

### 2. GitHub Actions Automated Android APK Build
We have pre-configured a complete CI workflow in `.github/workflows/build-android.yml`.

Whenever you push to `main` (or click **Run workflow** in the GitHub Actions tab):
1. GitHub spins up a clean Ubuntu runner.
2. It sets up Node 20, Java 17 (Zulu), and the Android SDK.
3. It compiles the web build and builds the Android APK (`./gradlew assembleDebug`).
4. It uploads `SafarNama-Android-Debug-APK` as a downloadable artifact.
5. You can download the `.apk` directly from the Actions tab and install it on any Android phone!

---

## Step 6: Typesense / Meilisearch Indexing

Provides lightning-fast search that recognizes Indian city nicknames, regional spellings, and common typos (e.g. "Banares" -> "Varanasi", "Kunzam" -> "Kunzum Pass", "Cherapunji" -> "Cherrapunji").

### Configuration Schema for Typesense
```json
{
  "name": "safarnama_search",
  "fields": [
    { "name": "spot_name", "type": "string" },
    { "name": "region", "type": "string", "facet": true },
    { "name": "state", "type": "string", "facet": true },
    { "name": "tags", "type": "string[]", "facet": true },
    { "name": "cost_inr", "type": "int32" }
  ],
  "default_sorting_field": "cost_inr"
}
```

---

## 🌟 Summary of Built Components

| Component | Path | Purpose |
|---|---|---|
| **Reels Feed** | `src/components/feed/ReelsFeed.tsx` | Full-screen vertical video feed with one-tap "Save Spot to Trip" & "View on Map" overlays |
| **Travel Notes** | `src/components/feed/TravelNoteModal.tsx` | Structured micro-blog (Best time, cost in INR, safety tips, connectivity, how to reach) |
| **Discovery Map** | `src/components/map/DiscoveryMap.tsx` | Dynamic content cluster map with custom Indian travel theme & turn-by-turn navigation link |
| **Spot Drawer** | `src/components/map/SpotDetailsDrawer.tsx` | Coordinate drawer with top reels, guide notes, and nearby Q&A |
| **Trip Builder** | `src/components/trips/TripBuilder.tsx` | Zero-headache trip builder: auto-grouped by circuit, sequenced route, native stay sponsorships |
| **Live Q&A** | `src/components/qa/QAFeed.tsx` | Location-pinned discussion threads with verified local guide badges & real-time answers |
| **Campaigns Hub** | `src/components/campaigns/CampaignHub.tsx` | Time-bound influencer campaigns (#MonsoonInMeghalaya), geofenced check-ins & leaderboards |
| **Dual Profile** | `src/components/profile/ProfileView.tsx` | Dual-identity architecture: Traveler Journey Passport vs Local Guide Profile & WhatsApp booking |
| **Contextual Gear** | `src/components/common/GearShopModal.tsx` | Native non-intrusive affiliate travel commerce |
| **Destination Hub** | `src/components/destinations/DestinationHubModal.tsx` | Official master hub for Indian states, permits, scam alerts, weather & emergency contacts |
