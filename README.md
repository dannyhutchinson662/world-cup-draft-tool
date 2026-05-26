# World Cup Fantasy Draft Tool

A Netlify-ready React/Vite app for running a Panini Fantasy World Cup live snake draft.

## Current version

This version includes:

1. 20 manager default draft board
2. 5-round classic snake draft
3. 218-player ranked pool from the final CSV
4. 2-minute pick timer
5. Auto-pick best available player when the timer expires
6. Active manager column highlight
7. Pick announcement pop-up
8. Player cards with position colours, rating badges and flags
9. Filters for position, country and category
10. CSV export
11. Fullscreen board and player pool views
12. Viewer/admin URL structure prepared for a later Firebase live-view update

## Netlify build settings

Use these settings in Netlify:

```text
Branch to deploy: main
Base directory: leave empty
Build command: npm run build
Publish directory: dist
```

## GitHub upload

Upload the contents of this folder to the root of your GitHub repository. The repository should show these files at the top level:

```text
package.json
index.html
vite.config.js
netlify.toml
src/
public/
```

Do not upload the zip file itself.

## Local testing

```bash
npm install
npm run dev
```

## Production build test

```bash
npm run build
```

## Future Firebase live-view update

Firebase is intentionally disabled in this package. The UI already includes Room ID, viewer link and admin link controls, and viewer mode is read-only when `?view=1` is present in the URL.

When ready, the next Firebase update should:

1. Add Firebase dependencies and configuration through Netlify environment variables.
2. Save `drafted`, `players`, `managersText`, `rounds` and `pickStartedAt` to Firestore by room ID.
3. Subscribe viewer links to Firestore updates.
4. Keep viewer mode read-only.
5. Test admin laptop and phone viewer at the same time.

Suggested environment variable names:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```
