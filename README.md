# 🇮🇳 SafarNama — Map-First Social Travel Ecosystem

[![Android APK Build](https://github.com/Vinay-kumar-code/SafarNama/actions/workflows/build-android.yml/badge.svg)](https://github.com/Vinay-kumar-code/SafarNama/actions/workflows/build-android.yml)
[![React 19](https://img.shields.io/badge/React-19.3-61dafb.svg?style=flat-square&logo=react)](https://react.dev/)
[![Kotlin](https://img.shields.io/badge/Kotlin-2.1-7F52FF.svg?style=flat-square&logo=kotlin)](https://kotlinlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646cff.svg?style=flat-square&logo=vite)](https://vite.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/TailwindCSS-v4.0-38bdf8.svg?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase PostGIS](https://img.shields.io/badge/Supabase-PostGIS-3ecf8e.svg?style=flat-square&logo=supabase)](https://supabase.com/)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare-R2_Storage-F38020.svg?style=flat-square&logo=cloudflare)](https://cloudflare.com/)

> A travel journal for discovering India through the stories, tips, and routes of the people who travel here.

## Try the community preview

Start the web app with `npm run dev` and open the local URL printed by Vite. Create a photo story, travel note, or reel from Home. Explore India links destination guides to traveler stories, and My journal collects your stories and bookmarks.

The website and Android app use the same React screens in `src/`. Gradle bundles those screens into each APK. Android provides the media picker, share sheet, and itinerary export. Make interface changes in the shared code, then build and test both targets. The retired Android screens and their entry point have been removed.

In **Map**, switch between places and travel stories, search by name or state, and open directions or a destination guide. The bundled map keeps pins and guides available when live tiles are unavailable. From **My journal**, open **My journeys**, **Conversations**, or **Celebrate India**.

Accounts use Supabase Auth. The [Coolify deployment](./COOLIFY.md) stores published content, uploaded media, and signed-in account activity on the Ubuntu server. Development previews can still run with device-local storage. [Destination photo credits](./public/media/credits.html).

Live maps in the Android app use `VITE_ANDROID_GOOGLE_MAPS_API_KEY` for the Maps JavaScript API, with `https://appassets.androidplatform.net/*` allowed as a referrer. Add `safarnama://auth-callback` and `safarnama-preview://auth-callback` to the Supabase redirect URL allowlist for Google sign-in and email confirmation. Google sign-in opens the device browser and returns to SafarNama.

---

## What you can do

- Publish a photo story, a short travel note, or a reel. Follow travelers, join conversations, and save stories to your journal.
- Discover places on the map or in Explore. Open destination guides for photos, budgets, best times to visit, reviews, and travel stories.
- Add stops to your journey, organize them by day, edit notes, share your itinerary, or export it.
- Ask travel questions and read replies from travelers and verified guides.
- Explore India's travel challenges and preview checkpoints, badges, and leaderboards.
- Use the full-screen map to search a city, destination, or coordinates and find listed places nearby. Sign in to add a destination, drop its pin, or edit a place you manage.
- Open Publishing studio from My journal to manage destination pages and post local updates. Guides can publish tours and businesses can list stays, agencies, and services. Visitors can discover them in Explore or on each destination page, and follow the manager for updates in Home.
- Traveler accounts can choose **Mark visited** on a destination page, then open **My journal → Passport** to see stamps, visit totals, and badges. **My journal → Settings** opens the profile editor.

See the [setup guide](./SETUP_GUIDE.md) for the current architecture. The [original project specification](./PROJECT_DESCRIPTION.md) documents the broader product vision.


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

### Android Application (Kotlin + Gradle)
```bash
# Install dependencies for the bundled interface in the repository root
npm ci

# Navigate to the android project directory (JDK 21 and Android SDK 36 required)
cd android

# Build the debug APK and run unit tests
./gradlew :app:assembleDebug :app:testDebugUnitTest
# On Windows: gradlew.bat :app:assembleDebug :app:testDebugUnitTest

# Installable alongside a previous debug APK, with separate app data
./gradlew :app:assemblePreview

# Run the bundled interface smoke test with an Android device or emulator connected
./gradlew :app:connectedDebugAndroidTest

# Output APK path:
# android/app/build/outputs/apk/debug/app-debug.apk
```

---

## ⚙️ Environment Configuration

Set public Vite variables in the root `.env`, your website build environment, or GitHub Actions. See the [setup guide](./SETUP_GUIDE.md) for platform-specific configuration.

```ini
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_MAPS_API_KEY=AIzaSyPlaceholderSafarnamaMapsKey
VITE_ANDROID_GOOGLE_MAPS_API_KEY=
VITE_CLOUDFLARE_R2_PUBLIC_URL=https://media.safarnama.travel
```

---

## 📄 License
Open-source under the MIT License.
