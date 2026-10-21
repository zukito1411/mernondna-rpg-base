# Android APK downloads

Download the newest installable, non-debuggable release-variant APK from this repository:

[Download Tales of Leighneron APK](https://github.com/zukito1411/mernondna-rpg-base/releases/latest/download/Tales-of-Leighneron.apk)

[All Android releases](https://github.com/zukito1411/mernondna-rpg-base/releases)

The APK currently exceeds GitHub's 100 MiB Git-file limit. Releases host the
complete APK directly, so no split files or manual reassembly are necessary.
Source code and build configuration remain on `main`.

The Android workflow builds a new APK for every push to `main`, including
documentation-only changes, and can also be run manually from GitHub Actions.
Local commits trigger a build once they are pushed to GitHub. If you push
several commits together, the build uses the newest commit in that push.
It runs the existing fast sprite-fitting and save-recovery regressions, builds
the production web assets (including application TypeScript compilation), syncs
Capacitor, builds `:app:assembleRelease`, verifies its package ID,
non-debuggable status and signing certificate, and publishes the signed release
APK and SHA-256 checksum tied to the exact source commit.

Android 6.0 or newer is required. Download the APK and open it on your device;
Android may prompt you to allow installs from the browser or file manager.
There is no requirement to keep a desktop development server running.

These GitHub APKs are **release build variants**, signed with the same
permanent legacy debug certificate as all earlier public downloads. CI restores
this signing keystore from its repository secret and checks the certificate
fingerprint before building and after signing. The package ID remains
`com.mernondna.rpg`, and the CI versionCode increases with each workflow run.
This is designed to preserve in-place updates and locally stored saves for
people who already installed a CI debug build.

**Google Play signing is a separate task:** these APKs are not signed with a
dedicated production release/upload key. A future Play Store distribution needs
a properly protected production signing identity and a migration/distribution
plan; do not replace the signing key for this existing package without
considering installed users. Android rejects package updates with incompatible
signatures, and uninstalling an existing app can erase its local saves. No
keystore files or key material are committed to this public repository.

For local builds, use Node 24, JDK 21 and Android SDK 35. The local
development build remains available without the CI signing secret:

```powershell
npm ci
npm run cap:android:refresh
./android/gradlew.bat -p android :app:assembleDebug
```

Its output is `android/app/build/outputs/apk/debug/app-debug.apk`. For an
**installable release build**, use the GitHub Actions pipeline, which securely
restores the required matching signing key and runs `:app:assembleRelease`.
The CI-built release output is `android/app/build/outputs/apk/release/app-release.apk`;
the downloadable asset remains `Tales-of-Leighneron.apk`.
