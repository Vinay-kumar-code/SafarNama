# 🇮🇳 SafarNama — Comprehensive Project Specification & Architecture

This document records the original project specification. The current website and Android app share the React interface in `src/`. See the [setup guide](./SETUP_GUIDE.md) for the current architecture and build commands.

> **Map-First Social Travel Ecosystem for India**  
> *Connecting travelers and certified local guides across India through an Instagram-clean, multi-format social journal and geo-discovery engine.*

---

## 1. Executive Summary & Brand Philosophy

**SafarNama** (meaning *"Travelogue"* or *"Book of Journeys"*) is a modern, high-performance social travel platform engineered specifically for the Indian travel landscape. It combines the visual immediacy and clean aesthetic of modern social media with deep geo-contextual utility—enabling explorers to document trips, follow fellow travelers, interact with verified local guides, and discover offbeat destinations.

### Brand Design Principles
- **Instagram-Clean White Theme**: Pure white (`#FFFFFF`) surfaces, refined zinc typography (`#09090B`, `#71717A`), light borders (`#E4E4E7`), and vibrant saffron/coral accents (`#FF5722`, `#FFA000`).
- **Zero Clutter & Meaningful Metrics**: Removed gamified karma scores, passport stamps, and vanity follower counts. Instead, the focus is on authentic journey documentation, actionable travel data (costs, seasonality, mobile signal, connectivity), and genuine traveler connections.
- **Icon-Only Bottom Navigation**: Standard 5-tab icon-only mobile navigation bar (Home, Search, Reels, Maps, Profile) adhering to modern mobile conventions.

---

## 2. System Architecture & Tech Stack

The SafarNama ecosystem is composed of a responsive Web application, a native Android application, and cloud infrastructure:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SAFARNAMA ECOSYSTEM                             │
├───────────────────────────────────┬────────────────────────────────────┤
│           WEB APPLICATION         │      NATIVE ANDROID APPLICATION    │
│  • React 19 + TypeScript          │  • Native Kotlin (JVM 21)          │
│  • Vite 8 + Tailwind CSS v4       │  • AndroidX + Material 3           │
│  • Google Maps JavaScript API     │  • ViewBinding (Zero Synthetic)    │
│  • Responsive Desktop & Mobile UI │  • AndroidX Media3 / ExoPlayer     │
│  • Multi-Role Auth & Admin Portal │  • Google Maps Android SDK         │
│  • Lucide React Icons             │  • OkHttp3 + Coil Image Engine     │
├───────────────────────────────────┴────────────────────────────────────┤
│                     BACKEND & CLOUD SERVICES                           │
│  • Supabase (PostgreSQL with PostGIS spatial indices & REST API)       │
│  • Cloudflare R2 Object Storage (Zero-egress media & video delivery)   │
│  • Google Maps Platform (Maps, Geocoding, Places API)                  │
│  • Vercel (Automated Web Deployment & Edge Routing)                    │
│  • GitHub Actions (Automated CI/CD Building Android Debug APKs)        │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Web Application
- **Framework**: React 19.3 with TypeScript 5.x, bundled with Vite 8.
- **Styling**: Tailwind CSS v4 with custom responsive desktop layouts and clean white Instagram styling.
- **Maps**: Google Maps JavaScript API with custom map styles, coordinates, and markers for Indian destination hubs.
- **Auth & Roles**: Multi-role system supporting Travelers, Local Guides / Creators, and Admin Operations Portal (`admin2026`).

### 2.2 Native Kotlin Android Application
- **Language & Runtime**: 100% Native Kotlin targeting JDK 21 and Android SDK 35/36.
- **UI Architecture**: Single-activity architecture (`MainActivity.kt`) hosting modern fragments with `ViewBinding`.
- **Media Playback**: AndroidX Media3 (`1.5.1`) with ExoPlayer for seamless vertical Reels video playback.
- **Image Pipeline**: Coil (`2.7.0`) for memory-cached, asynchronous image rendering with circular transformations.
- **Networking & Async**: Kotlin Coroutines & `StateFlow` coupled with OkHttp3.

### 2.3 Cloud Infrastructure & Storage
- **Database**: Supabase PostgreSQL configured with PostGIS geo-spatial extensions for coordinate querying and RLS policies.
- **Object Storage**: Cloudflare R2 bucket (`media.safarnama.travel`) storing high-definition videos (`videos/`), travel photos (`images/`), and user avatars (`avatars/`) with zero-egress fee public resolution.
- **Continuous Integration**: GitHub Actions runner (`ubuntu-latest`) running Gradle 8.14.3 to assemble and publish Android debug APKs (`app-debug.apk`).

---

## 3. Core Features & Functional Modules

### 3.1 Unified Home Feed (Multi-Format Stream)
The Home screen features a unified chronological feed displaying both visual travel posts and real-time micro-blogs:
- **Travel Tweets & Threads**: Short-form travel thoughts, road status updates, high-altitude pass alerts, and live trail conditions.
  - Formatted in an elegant Twitter/Threads card style with author details, timestamp, attached destination pill, and travel companion mentions.
  - Interactive Like and Save actions.
  - Threaded replies button opening the nested discussion sheet.
- **Photo Posts & Carousels**: High-resolution photo dumps with swipeable ViewPager2 carousel sliders.
  - Slide counter indicators (e.g. `1/3`).
  - Double-tap heart burst animation.
  - Actionable Travel Chips: Daily budget in INR (`₹1,800 / day`), Best visiting season (`Jun - Oct`), and Mobile signal availability (`BSNL 4G Only`).
  - Comment button opening the universal comments bottom sheet.

### 3.2 Threaded Discussions vs. Universal Comments
To respect the different engagement styles of micro-blogs and photos:
- **Tweet Threads (`ThreadBottomSheetDialogFragment`)**:
  - Displays the original parent tweet at the top.
  - A vertical connecting thread line branches into user replies.
  - Allows travelers to join the live conversation with immediate threaded replies.
- **Post & Reel Comments (`CommentsBottomSheetDialogFragment`)**:
  - Reusable comments bottom sheet for photo posts and reels.
  - Shows chronologically ordered community comments with avatars and timestamps.
  - Sticky bottom input field for posting new comments in real-time.

### 3.3 Full-Screen Vertical Reels Engine
- Full-screen vertical swipe feed built with `ViewPager2` and native `ExoPlayer`.
- Auto-play and pause on page swipe.
- Creator handle, verified guide badge, spot name, region tag, and original audio banner.
- Double-tap to like with bursting heart animation.
- Dedicated **Comment button** opening the Comments BottomSheet directly over the active reel.
- Cloudflare R2 video streaming resolution with fallbacks.

### 3.4 Content Creation Studio (`+` Button)
Located in the Home top bar, the `+` button opens `CreateContentBottomSheetDialogFragment`:
- **Three Creation Formats**:
  1. **Tweet / Thread**: Micro-blog text (up to 500 characters) for thoughts, weather warnings, and route updates.
  2. **Photo Post**: Image URL/upload, spot name, state, daily budget, and travel tips.
  3. **Reel Video**: Video URL / Cloudflare R2 MP4, spot name, caption, and hashtags.
- **Destination Tagging**: Integrated spinner selector populated dynamically from registered destination hubs (e.g., Spiti Valley, Varanasi, Meghalaya, Hampi, etc.).
- **Group Travel Mentions**: Input field allowing users to tag travel companions who journeyed with them (e.g. `@aarav_journeys, @karan_banaras`).

### 3.5 1-on-1 Direct Messaging (DM)
- Accessible from the Home top bar message icon or directly from any traveler/guide's profile:
  - **Conversations List (`DirectMessagesDialogFragment`)**: Lists active chats, showing partner avatars, names, last message snippet, and timestamps.
  - **1-on-1 Chat Interface (`ChatDialogFragment`)**: Real-time message exchange with color-coded speech bubbles (sent in gradient coral vs. received in light zinc), timestamps, and instant send capabilities via `TravelRepository`.

### 3.6 Follow System & Per-Account Notification Controls
- **Journey Follow**: Users can follow any traveler or local guide to keep up with their latest itineraries and posts.
- **Settings & Following (`SettingsDialogFragment`)**:
  - Lists every followed account.
  - Features an individual **Alerts Toggle** (Bell icon: *Alerts On* vs *Muted*) for each followed account, controlling notifications whenever they publish a new tweet, post, or reel.
  - Instant Unfollow button with real-time UI updates.

### 3.7 Profile & Group Travel Mentions Hub
- **Redesigned Clean Profile**:
  - Removed karma, credibility scores, passport stamps, and follower/following counts.
  - Clean stat counters: **Trips Completed**, **Posts & Tweets**, and **Saved Spots**.
  - Interactive **Follow / Following** toggle button and **Message** shortcut.
  - **Persona Switcher**: Demonstrates switching between traveler mode (Aarav Sharma) and verified local guide studio mode (Tenzin Norbu).
- **Segmented Tabs**:
  1. **Posts & Tweets**: Displays all stories and micro-blogs authored by this account.
  2. **👥 Mentions**: A dedicated tab filtering all posts, tweets, and reels where this account was tagged during group travels by other explorers.
  3. **🔖 Saved Spots**: Grid of bookmarked bucket-list places and reels.

### 3.8 Search, Discovery & Destination Hubs
- **Destination Hub Cards**: Grid of top Indian destinations with cover images, regional circuits, budget estimates, and guide counts.
- **Search Filtering**: Real-time search query filtering by destination name, state, region, or terrain keywords.
- **Destination Mapping**: Tapping any destination displays the exact number of tweets, photo posts, and reels mapped to that location.
- **Admin Destination Hub Creator (`AdminDestinationDialogFragment`)**:
  - Enables administrators to create new destination hubs with name, state, region, tagline, image URL, overview, budget, and GPS coordinates.
  - Newly created destinations immediately become available in Maps, Search, and the Content Creation destination picker.

---

## 4. Data Models Architecture

```kotlin
// Content Format
enum class PostFormat {
    PHOTO_POST,
    TWEET,
    REEL,
    CAROUSEL_NOTE,
    QUICK_TIP
}

// Post Entity (Unified for Photos, Tweets, and Reels)
data class Post(
    val id: String,
    val author: Profile,
    val spotName: String,
    val state: String,
    val region: String,
    val caption: String,
    val format: PostFormat = PostFormat.PHOTO_POST,
    val videoUrl: String? = null,
    val thumbnailUrl: String? = null,
    val carouselImages: List<String> = emptyList(),
    val destinationId: String? = null,
    val destinationName: String? = null,
    val mentionedUsernames: List<String> = emptyList(),
    val costInInr: Int = 0,
    val bestTimeToVisit: String = "Year-round",
    val safetyTips: String = "",
    val howToReach: String = "",
    val connectivitySignal: String = "4G Available",
    val latitude: Double = 20.5937,
    val longitude: Double = 78.9629,
    var likesCount: Int = 0,
    var savesCount: Int = 0,
    var commentsCount: Int = 0,
    var threadRepliesCount: Int = 0,
    var isLiked: Boolean = false,
    var isSaved: Boolean = false,
    val createdAt: String = "Just now"
)

// Comment & Thread Reply Entity
data class Comment(
    val id: String,
    val postId: String,
    val author: Profile,
    val text: String,
    val createdAt: String = "Just now",
    val parentCommentId: String? = null,
    val likesCount: Int = 0
)

// 1-on-1 Direct Message Entity
data class DirectMessage(
    val id: String,
    val senderId: String,
    val receiverId: String,
    val text: String,
    val timestamp: String = "Just now",
    val isFromMe: Boolean = false
)

// Followed Account Notification Preferences
data class FollowedAccountSetting(
    val profile: Profile,
    var notificationsEnabled: Boolean = true
)

// Destination Hub Entity
data class DestinationHub(
    val id: String,
    val slug: String,
    val name: String,
    val state: String,
    val region: String,
    val tagline: String,
    val coverImage: String,
    val galleryImages: List<String> = emptyList(),
    val latitude: Double,
    val longitude: Double,
    val overview: String,
    val bestTimeToVisit: String,
    val dailyBudgetInr: Int = 2000,
    val topSpotsCount: Int = 10,
    val guideCount: Int = 5,
    val averageRating: Double = 4.8
)
```

---

## 5. Environment Variables & Configuration

The application resolves environment variables seamlessly from root `.env`, Android `local.properties`, Vercel Deployment settings, and GitHub Actions Secrets:

| Environment Variable | Description | Default Fallback |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase Project REST Endpoint | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase Public Anonymous API Key | `your-anon-key` |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps Platform API Key | `AIzaSyPlaceholderSafarnamaMapsKey` |
| `VITE_CLOUDFLARE_R2_PUBLIC_URL` | Cloudflare R2 Public CDN Endpoint | `https://media.safarnama.travel` |

---

## 6. Build & CI/CD Pipeline

### Native Android APK Build Workflow (`.github/workflows/build-android.yml`)
- **Trigger**: Every push or pull request to `main` or manual trigger via `workflow_dispatch`.
- **Environment**: Ubuntu Latest with Zulu JDK 21 and pre-installed Android command-line tools.
- **Build Steps**:
  1. Checks out repository.
  2. Sets up JDK 21 (Zulu distribution).
  3. Initializes Gradle caching (`gradle/actions/setup-gradle@v4`).
  4. Accepts Android SDK licenses and verifies SDK build-tools.
  5. Injects CI Secrets into Gradle `BuildConfig` and AndroidManifest string resources.
  6. Executes `./gradlew assembleDebug -x lint --stacktrace --no-daemon`.
  7. Publishes debug APK artifact: `SafarNama-Android-Debug-APK` (~9.69 MB).

### Web App Verification
- Execute `npm run build` to compile the React TypeScript client into production bundles under `dist/` with zero type errors.

---

## 7. Directory Structure

```
SafarNama/
├── .github/
│   └── workflows/
│       └── build-android.yml         # GitHub Actions CI for Native Android APK
├── android/
│   ├── app/
│   │   ├── build.gradle              # App-level build configuration, BuildConfig, dependencies
│   │   └── src/
│   │       ├── main/
│   │       │   ├── AndroidManifest.xml
│   │       │   ├── java/com/safarnama/travel/
│   │       │   │   ├── MainActivity.kt
│   │       │   │   ├── SafarNamaApp.kt
│   │       │   │   ├── api/
│   │       │   │   │   ├── R2MediaResolver.kt
│   │       │   │   │   └── SupabaseClient.kt
│   │       │   │   ├── data/
│   │       │   │   │   ├── Models.kt
│   │       │   │   │   ├── SeedData.kt
│   │       │   │   │   └── TravelRepository.kt
│   │       │   │   ├── ui/
│   │       │   │   │   ├── home/
│   │       │   │   │   │   ├── HomeFragment.kt
│   │       │   │   │   │   ├── FeedAdapter.kt
│   │       │   │   │   │   ├── CarouselImageAdapter.kt
│   │       │   │   │   │   ├── CommentsAdapter.kt
│   │       │   │   │   │   ├── CommentsBottomSheetDialogFragment.kt
│   │       │   │   │   │   ├── ThreadBottomSheetDialogFragment.kt
│   │       │   │   │   │   ├── CreateContentBottomSheetDialogFragment.kt
│   │       │   │   │   │   ├── DirectMessagesDialogFragment.kt
│   │       │   │   │   │   ├── ChatDialogFragment.kt
│   │       │   │   │   │   ├── ConversationsAdapter.kt
│   │       │   │   │   │   └── MessagesAdapter.kt
│   │       │   │   │   ├── maps/
│   │       │   │   │   │   └── MapsFragment.kt
│   │       │   │   │   ├── profile/
│   │       │   │   │   │   ├── ProfileFragment.kt
│   │       │   │   │   │   ├── SettingsDialogFragment.kt
│   │       │   │   │   │   ├── AdminDestinationDialogFragment.kt
│   │       │   │   │   │   ├── FollowedAccountsAdapter.kt
│   │       │   │   │   │   ├── SavedSpotsAdapter.kt
│   │       │   │   │   │   └── PassportStampsAdapter.kt
│   │       │   │   │   ├── reels/
│   │       │   │   │   │   ├── ReelsFragment.kt
│   │       │   │   │   │   └── ReelVideoAdapter.kt
│   │       │   │   │   ├── search/
│   │       │   │   │   │   ├── SearchFragment.kt
│   │       │   │   │   │   ├── DestinationGridAdapter.kt
│   │       │   │   │   │   └── GuidesAdapter.kt
│   │       │   │   │   └── util/
│   │       │   │   │       └── HeartAnimationUtil.kt
│   │       │   │   └── res/
│   │       │   │       ├── drawable/     # Vector icons and card shapes
│   │       │   │       ├── layout/       # Fragment and dialog layouts
│   │       │   │       ├── values/       # Colors, styles, strings, themes
│   │       │   │       └── menu/         # Bottom navigation menu
│   │       └── test/java/com/safarnama/travel/
│   │           └── TravelRepositoryTest.kt   # Automated unit tests
│   ├── build.gradle                  # Top-level build file
│   ├── settings.gradle
│   └── variables.gradle              # Dependency versions
├── src/                              # React 19 Web App
│   ├── components/
│   │   ├── admin/                    # Admin operations portal
│   │   ├── common/                   # Brand logo, navbars, modals
│   │   ├── home/                     # Web feed & destination hubs
│   │   ├── map/                      # Google Maps interactive view
│   │   ├── profile/                  # Multi-role profile view
│   │   └── reels/                    # Web reels feed
│   ├── App.tsx
│   └── main.tsx
├── public/                           # Static assets, favicon.svg, logo.svg
├── PROJECT_DESCRIPTION.md            # Complete project documentation
├── package.json
└── vite.config.ts
```
