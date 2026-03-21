# 🌌 KSAEKVAT REVAMP 2.0

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/tech-TypeScript%20%7C%20Node.js%20%7C%20React%20%7C%20MongoDB-cyan?style=for-the-badge)
![Status](https://img.shields.io/badge/status-active-green?style=for-the-badge)

A high-end Discord Bot and Web Dashboard ecosystem featuring a robust RPG Gacha system, Economy, and the all-new **Zen Mode Portfolio**.

---

## ✨ Key Features

### 🤖 Discord Bot
*   **Deep RPG Gacha System**: Collect characters from Genshin Impact, Honkai: Star Rail, Wuthering Waves, and ZZZ.
*   **Dynamic Combat Engine**: Strategic RPG battles with class-specific skills (Tank, Striker, Support, Boss).
*   **Integrated Economy**: Gambling games (Blackjack, Slots, Coinflip), daily rewards, and work systems.
*   **Hunting & Zoo**: Collect rare specimens and manage your digital menagerie.
*   **AI Chatbot**: Context-aware AI interactions with a unique personality.

### 🖼️ Zen Portfolio (New!)
*   **Ultra-Minimalist Interface**: A high-end, transparent profile page inspired by modern digital bio sites (gun.lol).
*   **2-Column Pro Layout**: Facebook-style header with a fixed identity sidebar and scrollable content area.
*   **Spotify Integration**: Embed your favorite tracks directly into your profile with a sleek mini-player.
*   **Showcase Your Work**: Link GitHub repositories and upload artwork/galleries.
*   **Gaming Arsenal**: Opt-in to show your RPG stats and collected character roster.
*   **Atmospheric Audio**: Support for auto-playing background music with ambient low-volume settings.

---

## 🛠️ Tech Stack

### Backend
*   **Runtime**: Node.js (TypeScript)
*   **Framework**: Discord.js v14
*   **API**: Express.js
*   **Database**: MongoDB (Mongoose)
*   **Validation**: Zod (Runtime environment safety)
*   **Image Processing**: Sharp (High-performance pixel manipulation)

### Frontend (Dashboard)
*   **Framework**: React 19 + Vite
*   **Styling**: Vanilla CSS (Zen Minimalism)
*   **Animations**: Framer Motion
*   **Icons**: Lucide React
*   **Charts**: Recharts

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   MongoDB Instance
*   Discord Bot Token

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-repo/ksaekvat-revamp.git
    cd ksaekvat-revamp
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    cd dashboard && npm install
    cd ..
    ```

3.  **Environment Setup**:
    Create a `.env` file in the root directory:
    ```env
    DISCORD_TOKEN=your_token
    CLIENT_ID=your_client_id
    GUILD_ID=your_guild_id
    MONGODB_URI=your_mongo_uri
    JWT_SECRET=your_jwt_secret
    PORT=8080
    ```

4.  **Build & Run**:
    ```bash
    # Development (Bot + Dashboard)
    npm run dev:all

    # Production Build
    npm run build
    npm start
    ```

---

## 📂 Project Structure

```
ksaekvat_revamp/
├── src/
│   ├── api/            # Express API routes
│   ├── commands/       # Discord bot commands
│   ├── core/           # Entry point & bootstrap
│   ├── models/         # Mongoose schemas
│   ├── services/       # Core business logic
│   └── utils/          # Shared utilities
├── dashboard/
│   ├── src/
│   │   ├── pages/      # Profile, Dashboard, Zoo, etc.
│   │   ├── components/ # Reusable UI atoms
│   │   └── index.css   # Zen Mode design system
└── assets/             # Static character & game assets
```

---

## 📜 License
Internal Project. All rights reserved.

---

*Made with 💖 by @_callme_.mo and Hikari Pixel (AI).*
