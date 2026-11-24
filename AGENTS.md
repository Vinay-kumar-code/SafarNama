# Website and Android

Build interface and product changes in `src/`. The website uses that React source directly, and Android's `bundleWebForAndroid` task packages it into the APK. Keep Android-specific work for device integration and test interface changes in a narrow browser viewport and an Android build.

Run `npm run build` from the repository root. From `android/`, run `gradlew.bat :app:assembleDebug :app:testDebugUnitTest` on Windows or use `./gradlew` on Unix. Run `:app:connectedDebugAndroidTest` with an Android device or emulator connected.
