# Android APK downloads

Download the newest installable development APK from this repository:

[Download Tales of Leighneron APK](https://github.com/zukito1411/mernondna-rpg-base/releases/latest/download/Tales-of-Leighneron.apk)

[All Android releases](https://github.com/zukito1411/mernondna-rpg-base/releases)

The APK currently exceeds GitHub's 100 MiB Git-file limit. Releases host the
complete APK directly, so no split files or manual reassembly are necessary.
Source code and build configuration remain on `main`.

The Android workflow builds a new APK when game/build files change on `main`,
and can also be run manually from GitHub Actions. It checks application/test
types and the current targeted regression suites, builds the production web
assets, syncs Capacitor, builds and verifies a signed debug APK, then publishes
the APK and SHA-256 checksum in a release tied to that exact source commit.

Android 6.0 or newer is required. Download the APK and open it on your device;
Android may prompt you to allow installs from the browser or file manager.
There is no requirement to keep a desktop development server running.

These are development APKs. CI caches its debug keystore to retain its signing
identity across subsequent builds. Locally built APKs can use another debug
certificate, and a deleted/expired signing cache can also change the CI
certificate. Android rejects updates with incompatible signatures; uninstalling
the old copy removes that copy's local saved game. No production signing keys
are committed to this public repository.

For local builds, use Node 24, JDK 21 and Android SDK 35:

```powershell
npm ci
npm run cap:android:refresh
./android/gradlew.bat -p android :app:assembleDebug
```

The local output is `android/app/build/outputs/apk/debug/app-debug.apk`.
