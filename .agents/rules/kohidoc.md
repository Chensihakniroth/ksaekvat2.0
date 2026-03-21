---
trigger: always_on
---

# 📘 KSAEKVAT Bot Revamp 2.0 — Project Documentation

> **Bot Name:** KSAEKVAT Bot | **Version:** 2.0 (Revamp Edition) | **Author:** @_callme_.mo  
> **Backend Stack:** TypeScript + Node.js + Discord.js v14 + MongoDB (Mongoose) + Express.js
> **Frontend Stack:** React 19 + Vite + Framer Motion + React-Lenis (Smooth Scrolling)

---
## 🗂️ Project Structure Overview

```
ksaekvat_revamp/
├── src/
│   ├── core/           → Entry point & bot bootstrap (Express startup, Cookie-parser integration)
│   ├── api/            → Express HTTP API (routes: auth.ts for Discord OAuth, profile.ts for search)
│   ├── config/         → Bot settings, constants, and OAuth/JWT credentials
│   ├── handlers/       → Command & event loaders
│   ├── events/         → Discord event listeners
│   ├── commands/       → All prefix + slash commands (by category)
│   ├── services/       → Business logic layer (TypeScript classes)
│   ├── models/         → Mongoose schema definitions
│   └── utils/          → Shared utility functions (Env validation)
├── dashboard/
│   ├── src/
│   │   ├── components/ → Modern glassmorphic UI (Navbar, Footer, GlobalTicker)
│   │   ├── context/    → Global React Context (AuthContext for user sessions)
│   │   ├── pages/      → UI Pages (Landing HomePage, Bio-Scan ZooPage, Discord LoginPage, etc.)
│   │   ├── index.css   → Massive custom design system with high-tech aesthetics
│   │   ├── App.jsx     → React Root wrapping with AuthProvider and ReactLenis
│   │   └── main.jsx    → Vite Entry Point
├── assets/             → Static image assets
├── .tmp/               → Temp files (image generation output)
├── Dockerfile          → Production Docker container (Uses --legacy-peer-deps for React 19/Lenis compatibility)
└── package.json        → Project dependencies & npm scripts
```

---

## ⚡ Entry Point — `src/core/index.ts`

The main application bootstrap file. It initializes the Discord client, connects the database, registers handlers, starts an HTTP server via Express, sets up `cookie-parser`, and logs in.

### Web API & Dashboard Initialization
- **HTTP/Express Server**: Mounts API routes at `/api/auth` (Discord login/logout callback) and `/api/profile` (Global user biometric search). Serves the Vite-compiled dashboard dashboard fallback to `index.html`.
- **Global Error Handling**: `process.on('unhandledRejection')` and `uncaughtException` route through logger.
- **Daily Cron Job**: Runs at midnight (`0 0 * * *`) via `node-cron`. Iterates all users and resets daily claims.

---

## ⚙️ Configuration — `src/config/config.js`

Central configuration object. Pulls mostly from environment variables with sensible fallbacks.

| Key | Description |
|---|---|
| `token` | Discord Bot Token |
| `discordOauth` | `clientId`, `guildId`, `clientSecret`, `redirectUri` for Web Dashboard Login |
| `jwtSecret` | Used to cryptographically sign HTTP-only authentication cookies |
| `prefix` | Main bot prefixes: `['k', 'K']` |
| `aiConfig` | SEA-LION AI chatbot: `baseUrl`, `model`, and `systemPrompt` (Hikari Pixel waifu personality) |
| `economy` | Currency emoji, min/max bet, daily/weekly/work reward ranges |
| `gambling` | Per-game min/max bets and slots symbol config |
| `hunting` | Pokémon hunting weights, cooldowns, distraction chance (30%), rarity tables |
| `botInfo` | Bot name (KSAEKVAT), version, description, author |

---

## 🔒 Environment Validation — `src/utils/env.ts`

Uses **Zod** to strictly validate the `.env` file on startup. If any required variable is missing or malformed, the process exits.

| Variable | Required | Default / Description |
|---|---|---|
| `DISCORD_TOKEN` | ✅ Yes | — |
| `CLIENT_ID` | No | `1399459454889754805` |
| `DISCORD_CLIENT_SECRET` | ✅ Yes | Required for Web Dashboard Discord Login |
| `DISCORD_REDIRECT_URI` | No | `https://ksaekvat.up.railway.app/api/auth/discord/callback` |
| `JWT_SECRET` | ✅ Yes | Required for securing Dashboard user sessions |
| `MONGODB_URI` / `MONGO_URL`| ✅ Yes | `mongodb://127.0.0.1:27017/ksaekvat_bot` |
| `PORT` | No | `8080` (Railway requires 8080) |

---

## 🛠️ Services Layer — `src/services/`

All services are TypeScript classes exported as singletons (`module.exports = new XService()`).

### `DatabaseService.ts`
The primary data access layer wrapping Mongoose model operations.

| Method | Description |
|---|---|
| `getUser(userId, username?)` | Finds or creates a user document. Auto-updates username if changed. |
| `addExperience(userId, amount)` | Adds XP, exponential level scaling. Returns `{leveledUp, newLevel, currentExp, nextExp}`. |
| `addBalance(userId, amount)` | Atomic `$inc` update on balance. |
| `hasBalance(userId, amount)` | Returns `true` if user balance ≥ amount. |
| `addGachaItem(userId, itemName)` | Adds character strictly (Generic weapons removed from ecosystem). |
| `getGachaPool()` | Builds pool for Genshin/HSR/WuWa exclusive characters. |

### `CombatService.ts`
All RPG battle math is centralized here.

| Method | Description |
|---|---|
| `calculateCharStats(...)` | Computes character HP/ATK/DEF based on rarity, ascension, and user level. |
| `generateEnemy(...)` | Creates a randomized enemy. 10% chance to be a BOSS. |
| `getEnemyAction(...)` | 30% chance for a class-specific skill, otherwise a normal attack. |
| `calculateRewards(...)` | Returns `{ money, exp }`. Multiplied by boss/rarity bonuses (up to 6×). |

### `GachaService.ts`
Manages all character gacha pull logic.

| Method | Description |
|---|---|
| `rollRarity(...)` | Determines pull rarity. Base 5★ rate: `0.6%`. Soft pity: `75`, Hard pity: `90`. |
| `performMultiPull(...)` | Performs 10 consecutive rolls updating pity counters. |

### `AnimalService.ts`
Handles the hunting/zoo system and Pokémon image fetching.

| Method | Description |
|---|---|
| `calculateZooStats(...)` | Aggregates total Pokémon count, value, and rarity breakdown. |
| `calculateBadges(...)` | Awards emoji badges for hunter milestones. |
| `getPokemonImage(key)` | Fetches official artwork URL via `pokedex-promise-v2` with in-memory caching. |

---

## 🎨 Frontend Architecture (Dashboard)

The frontend uses Vite+React. Recently overhauled for a high-end "Mission Control" and "Bio-Scan" aesthetic perfectly synchronized with the KSAEKVAT brand.

- **Routing:** `<BrowserRouter>` mapping URLs to lazy-loaded Page components.
- **State Management:** `AuthContext.jsx` holds user state, JWT presence, and `login()`/`logout()` triggers mapping directly to `/api/auth/discord`.
- **Smooth Scrolling:** Integrated with `@studio-freight/react-lenis` (`<ReactLenis root>`), bound at the `App.jsx` level. Fixed peer dependencies in production Dockerfile using `--legacy-peer-deps`.
- **Search Engine:** An integrated live biometric search within the `Navbar.jsx` hits `/api/profile/search` and drops down results smoothly using Framer Motion.
- **Styling:** Maintained primarily via `dashboard/src/index.css` leveraging granular flex/grid classes, neon glows (`.neon-border`), glassmorphism panels, and bespoke animation blocks.
