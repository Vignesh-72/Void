<div align="center">
<img width="514" height="306" alt="voidgit" src="https://github.com/user-attachments/assets/c0b45393-21ad-4c34-9689-5f24d69d2dd8" />
</div>

<div align="center">

# Project VOID
**High-Fidelity Space Exploration Dashboard**

<a href="https://sourceforge.net/projects/void-app/"><img src="https://img.shields.io/badge/SourceForge-Download-EE6600?style=for-the-badge&logo=sourceforge&logoColor=white" alt="Download Project VOID on SourceForge" /></a>
<img src="https://img.shields.io/badge/React-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" alt="React" />
<img src="https://img.shields.io/badge/Tailwind_CSS-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
<img src="https://img.shields.io/badge/Leaflet-%23199900.svg?style=for-the-badge&logo=Leaflet&logoColor=white" alt="Leaflet" />
<img src="https://img.shields.io/badge/PWA_Ready-%235A0FC8.svg?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA" />

<br />

Project VOID is a cinematic mission control center built with React and Tailwind CSS. It aggregates real-time telemetry, orbital tracking, and global space news into a single, immersive "Sci-Fi HUD" interface, fully equipped with offline service worker support.

</div>

---

## 📥 Downloads & Releases

Packaged builds and offline release archives are available on SourceForge:

👉 **[Download Project VOID on SourceForge](https://sourceforge.net/projects/void-app/)**

---

## 🚀 Key Features

* **Live Mission Control:** Real-time countdowns for upcoming rocket launches globally via the TheSpaceDevs API.
* **Orbit Tracker:** Live ISS telemetry (Altitude/Velocity) and overflight predictions powered by WhereTheISS.at and Leaflet GL.
* **Spaceflight News:** A curated global intel feed aggregated from top space subreddits using the Reddit JSON API.
* **Asset Database:** A deep technical wiki for the SpaceX fleet, including boosters, dragons, and naval recovery ships.
* **PWA Ready:** Fully installable on mobile and desktop with robust offline support capabilities.
* **Cinematic Intro:** Procedural "Big Bang" initialization sequence featuring real-time Web Audio API sound synthesis.

---

## 🛠️ Technical Stack

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19 | Strict Mode enabled for robust UI rendering. |
| **Styling** | Tailwind CSS v4 | Alpha/Beta with custom glassmorphism & motion effects. |
| **Mapping** | Leaflet & React-Leaflet | High-performance orbital path rendering. |
| **Networking** | Axios + Custom Cache | TTL-based Cache Manager to minimize API rate-limiting. |
| **Icons** | Lucide-React | Consistent, clean HUD iconography. |

---

## 📂 Architecture & Data Flow

The application utilizes a **State-Based Routing** architecture to maintain a seamless, native-app feel without page reloads.

1. **Boot Sequence:** `App.jsx` triggers the IntroAnimation, initializing audio oscillators for immersive sound effects before mounting the main dashboard.
2. **Caching Layer:** The `cacheManager.js` intercepts all API calls, storing JSON payloads in `localStorage` with specific expiration timers (e.g., 5 seconds for ISS data, 15 minutes for launches) to prevent rate limits.
3. **Responsive Layout:** The UI adapts dynamically—shifting the navigation bar from a bottom thumb-bar on mobile to a vertical sidebar on desktop environments.

---

## ⚙️ Installation & Setup

To run Project VOID locally on your machine:

**1. Clone the Repository:**
```bash
git clone [https://github.com/Vignesh-72/Void.git](https://github.com/Vignesh-72/Void.git)
cd Void
```
**2. Install Dependencies:**
```bash
npm instal
```
3. Run the Development Server:
```bash
npm run dev
```
4. Build for Production:
```bash
npm run build
```
## 📡 APIs Integrated

| Data Point | Provider | Purpose |
| :--- | :--- | :--- |
| **Launches** | TheSpaceDevs (LL2) | Upcoming mission telemetry |
| **Orbital Path** | WhereTheISS.at | Real-time ISS coordinates |
| **Assets** | SpaceX API v4 | Fleet and booster history |
| **Intel Feed** | Reddit JSON | Community-curated news |
| **Geocoding** | Nominatim (OSM) | Locating user cities for flyovers |

---

## 📜 License

This project is developed for educational purposes. All data is sourced from public, third-party APIs. 

<br>

<div align="center">
  Developed by <b>Vignesh S.</b>
</div>
