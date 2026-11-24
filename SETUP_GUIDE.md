# SafarNama setup

The website and Android app use the same React interface in `src/`. Vite produces the website build. Gradle builds and packages that interface into the APK. Android's Kotlin host in `android/app/src/main` handles the system media picker, sharing, itinerary export, sign-in links, and Back navigation.

## Website

To deploy the website, API, and server-local storage together, follow the [Coolify deployment guide](./COOLIFY.md).

Use Node.js 24, as in the repository's GitHub Actions workflow.

```sh
npm ci
npm run dev
npm run build
```

Open the URL printed by Vite for development. The production website is in `dist/`.

## Android

With JDK 21 and Android SDK 36 installed, run the following from `android/` after `npm ci` in the repository root.

```sh
./gradlew :app:assembleDebug :app:testDebugUnitTest
./gradlew :app:assemblePreview
```

On Windows, use `gradlew.bat` in place of `./gradlew`.

| Build | Output |
| --- | --- |
| Debug | `android/app/build/outputs/apk/debug/app-debug.apk` |
| Preview, with a separate app ID for side-by-side testing | `android/app/build/outputs/apk/preview/app-preview.apk` |

Both APKs package the same screens and bundled media. Android loads them at `https://appassets.androidplatform.net/` and can open them offline. To run the navigation smoke test with an Android device or emulator connected, use `:app:connectedDebugAndroidTest`.

GitHub Actions builds the debug APK and publishes it as the `SafarNama-Android-Debug-APK` artifact.

## Optional services

Use the root `.env` or your build's environment variables. Keep server credentials out of `VITE_` variables because the values are included in client builds.

- **Maps** — Set `VITE_GOOGLE_MAPS_API_KEY` for the website and `VITE_ANDROID_GOOGLE_MAPS_API_KEY` for Android. Enable Maps JavaScript API for live maps and Geocoding API for address searches. Allow the website's origins on the web key and `https://appassets.androidplatform.net/*` on the Android key. The built-in map supports listed destinations, a set of Indian cities, and coordinate searches when online lookup is unavailable.
- **Sign-in** — Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Allow the website callback URL and add `safarnama://auth-callback` and `safarnama-preview://auth-callback` to the Supabase redirect allowlist for the Android builds. Review `supabase/schema.sql` for the database schema.
- **Media storage** — The Coolify application stores uploaded files in its persistent `/app/data` volume. Use `VITE_API_URL` in the APK to connect it to a deployed instance. The local preview uses device storage when the API is disabled. Bundled destination photographs are in `public/media/`.

## Account roles

Sign-up offers Traveler, Local guide, Business, and Destination manager. Guides can create tour packages. Businesses can list hotels and stays, travel agencies, food and drink, and local services. Users who add a destination can manage their page and post updates. To assign an editor for a bundled guide, add its destination ID to that account’s server-managed `app_metadata.managed_destination_ids` in Supabase Auth. Values such as `dest-hampi` come from `src/data/destinations.ts`. Destination updates and listings are discoverable on the place page and in Explore. Following the manager adds their updates to the Following feed.

## Changing a screen

Update the React component and shared styles in `src/`. Check the screen at phone width and desktop width, build the website, and build a new APK to pick up the changes. The preview stores stories and interactions on the device or browser where they were created.
