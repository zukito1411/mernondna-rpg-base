# Publishing Tales of Leighneron to itch.io

Game page: https://zukiaoki.itch.io/tales-of-leighneron
Channel: `android` (single APK, not a zipped folder).

## First-time authorization (one-time)

1. In itch.io while signed in as the account authorized to edit that page, create an API key at https://itch.io/user/settings/api-keys.
2. In GitHub, open `zukito1411/mernondna-rpg-base` > Settings > Secrets and variables > Actions > New repository secret.
3. Name the secret **`BUTLER_API_KEY`** and paste the itch.io key there. Never commit or paste it in chat.
4. Open Actions > **Publish Android APK to itch.io** > Run workflow, leaving `release_tag` blank to upload the latest GitHub Android release.

## Subsequent releases

After the secret exists, this separate workflow also runs automatically when
**Build and publish Android APK** completes successfully on `main`. It downloads
the release corresponding to that exact workflow run, verifies the included
SHA-256 file and uploads the same APK to itch.io using the official butler tool.
One channel is updated each time; the existing GitHub APK publication remains
independent and unchanged.

If the secret is missing, the workflow logs an explicit notice and skips the
upload without touching itch.io. A manual re-run after adding the key is needed
for the latest already published APK; secrets are not retroactive triggers.

An empty manual `release_tag` uses the latest published GitHub Android release.
For a previous release, enter a tag like `android-39535384942-1`.

## Safety and distribution notes

- The APK retains `com.mernondna.rpg` and the old GitHub signing certificate so it can update existing installs. This is not Google Play production signing.
- itch.io account authorization is independent of GitHub authentication.
- The workflow uploads a **single `.apk` file** with butler, so website downloaders receive an APK rather than a ZIP wrapper (see https://itch.io/docs/butler/single-files.html).
- Changing the itch.io game page's visibility, price or download enablement still requires checking the itch.io editor. An upload does not automatically make a draft game public.
- Before upload, GitHub's SHA-256 checksum is verified. Neither repository nor workflow contains the itch.io API key.
- If another upload already exists on itch.io, check the page for duplicate Android downloads and remove only the obsolete upload manually.

Official references: https://itch.io/docs/butler/pushing.html, https://itch.io/docs/butler/login.html, https://itch.io/docs/butler/installing.html.
