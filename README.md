# 🇮🇳 SafarNama (सफ़रनामा) — Map-First Social Travel Ecosystem

[![React 19](https://img.shields.io/badge/React-19.3-61dafb.svg?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646cff.svg?style=flat-square&logo=vite)](https://vite.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/TailwindCSS-v4.0-38bdf8.svg?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Capacitor 6+](https://img.shields.io/badge/Capacitor-6%2B-119eff.svg?style=flat-square&logo=capacitor)](https://capacitorjs.com/)
[![Supabase PostGIS](https://img.shields.io/badge/Supabase-PostGIS-3ecf8e.svg?style=flat-square&logo=supabase)](https://supabase.com/)

> **Vision**: An Instagram-simple, map-first social travel ecosystem showcasing authentic India through the eyes of locals and travelers—eliminating trip-planning friction while turning personal journeys into living, crowdsourced travel guides for both domestic explorers and international tourists.

---

## 🧭 Core Pillars & Built Features

### 1. Dual-Identity Account Architecture
- **Traveler Profiles**: Visual timeline passport stamps, visited states of India interactive tracking, automatic trip logs.
- **Local Guide Profiles**: Certified local experts (e.g. *"Spiti Valley Local Guide"*, *"Old Delhi Food Guide"*), credibility score (upvotes & helpfulness), guided tour inquiries via direct contact.

### 2. Multi-Format Content Engine
- **Reels & Short Videos**: Full-screen vertical video feed with one-tap *"Save Spot to Trip"*, *"View on Map"*, sound toggle, and contextual gear overlays.
- **Photo Carousels & Travel Notes**: High-res photo dumps paired with structured micro-blogs containing:
  - 💰 Actual cost in INR
  - ⏰ Best time to visit
  - ⚠️ Safety advisories (AMS, river crossings, terrain caution)
  - 📶 Connectivity signal (Jio 4G / Airtel / BSNL)
  - 🧭 How to reach (shared cabs, local buses, metro)
- **Live Location Q&A Threads**: Real-time location-pinned discussions (*"Is Manali–Leh highway open today?"*, *"Best vegetarian spots near Varanasi ghats?"*) with highlighted **Verified Local Guide Replies**.

### 3. Admin-Curated Destination Hubs & Discovery Map
- **Official Destination Hubs**: Verified baseline info for Indian states and hidden gems: history, permits (ILP), emergency contacts, cultural etiquette, scam alerts, and seasonal weather.
- **Discovery Map Interface**: Dynamic content clusters with custom Indian travel theme. Tapping a pin opens the exact Reels, Travel Notes, and active Q&A for those coordinates, with a turn-by-turn fallback link to Google Maps.
- **Zero-Headache Trip Builder**: Tapping *"Save"* on any Reel, Note, or Guide recommendation automatically groups pins by circuit into sequenced, map-routed itineraries with stay estimates and total INR budget calculations.

### 4. Time-Bound Influencer Campaigns
- **Flash Destination Campaigns** (e.g., `#MonsoonInMeghalaya — 14 Days`, `#HampiHiddenGems`).
- **Interactive Geofenced Checkpoints**: GPS-powered check-ins, celebratory confetti, and limited-edition digital passport badges.
- **Live Leaderboard**: Gold, Silver, and Bronze explorer tiers based on community contributions.

### 5. Native Travel Commerce & Sponsorships
- **Contextual Gear Tags**: Clean *"Shop Gear"* pills (Wildcraft rucksacks, Rynox riding jackets, Nikon cameras, Decathlon trekking poles).
- **Native Itinerary Sponsorships**: Verified homestays (e.g. *Zostel Homes Kibber*, *Cherrapunji Holiday Resort*) directly inside the Trip Builder suggestions.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the local development server
npm run dev
```

Visit `http://localhost:5173` to explore SafarNama with pre-loaded mock data for **Spiti Valley**, **Varanasi**, **Meghalaya**, **Old Delhi**, and **Hampi**.

---

## 🛠️ Complete External Setup Guide

See **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** for detailed instructions on:
1. **Supabase PostGIS**: Running `supabase/schema.sql`, enabling spatial indices and RLS.
2. **Mapbox GL JS**: Getting your free public token and setting up custom map styles.
3. **Cloudflare Stream & R2**: Adaptive HLS video streaming and zero-egress WebP image delivery.
4. **Capacitor Android Build**: Generating the native APK/AAB in Android Studio.
5. **Capgo OTA Updates**: Pushing live updates directly to users without Play Store delays.
6. **Typesense / Meilisearch**: Instant typo-tolerant search for Indian destinations and slang.
