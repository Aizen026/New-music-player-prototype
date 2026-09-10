# 🎵 Monochrome Audio Player

High-fidelity music streaming player powered by Monochrome.tf / Tidal sources with real-time Web Audio API frequency visualizer, track queuing, album explorer, and Android APK compilation support.

---

## 🚀 Android APK Release with GitHub Actions

This repository includes a ready-to-use GitHub Actions workflow (`.github/workflows/release.yml`) that builds an Android APK and creates a downloadable GitHub Release whenever you manually trigger it!

### How to Manually Trigger an APK Release:

1. **Push your code to a GitHub Repository** (see instructions below).
2. Go to your repository on [GitHub](https://github.com).
3. Click on the **Actions** tab at the top.
4. In the left sidebar, click **Build & Release Android APK**.
5. Click the **Run workflow** dropdown on the right:
   - **Version Name**: e.g., `1.0.0` or `1.1.0`
   - **Android Version Code**: `1` (increment with each release)
   - **Release Notes**: Describe new features or bug fixes
   - **Publish as GitHub Release**: `true`
6. Click **Run workflow**.
7. In ~2–3 minutes, the build will finish:
   - The compiled APK (`Monochrome-Audio-v1.0.0.apk`) will be available under **Releases** on GitHub.
   - It is also available as an artifact under the completed workflow run.
8. Download the APK directly to your Android device, open it, and tap **Install**!

---

## 📦 Pushing this Repository to GitHub

You can publish this project to GitHub using either method:

### Option A: Via AI Studio UI (Fastest)
1. In Google AI Studio, click the project menu in the top right corner.
2. Select **Export to GitHub** (or **Download ZIP**).
3. Select your target repository name and push.

### Option B: Via Git Command Line
```bash
# Initialize git if not already done
git init
git add .
git commit -m "feat: complete Monochrome audio player with Capacitor Android APK and release workflow"

# Connect to your GitHub repository
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPOSITORY>.git
git branch -M main
git push -u origin main
```

---

## 🛠️ Local Development & Android Studio Build

### Prerequisites
- Node.js 20+
- Android Studio / Android SDK (optional, for local Android testing)

### Commands
```bash
# 1. Install dependencies
npm install

# 2. Run local web development server
npm run dev

# 3. Build web production bundle & sync Capacitor Android project
npm run cap:build

# 4. Open in Android Studio (to run on an emulator or plugged-in phone)
npm run cap:open
```

---

## 📱 Features
- **Monochrome & Tidal Integration**: Stream 320kbps AAC and FLAC Lossless quality.
- **Background Audio Support**: Configured with Android Wake Lock and Foreground Media Playback service permissions.
- **Audio Visualizer**: Real-time FFT frequency bars, fluid waveform, and dynamic glow.
- **Queue & Playlists**: Persistent playback state and full queue management.
- **PWA & Native APK**: Installable either as an APK via GitHub Actions or as a Progressive Web App (PWA) straight from the browser.
