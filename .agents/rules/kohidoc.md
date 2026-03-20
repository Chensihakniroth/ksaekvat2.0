---
trigger: always_on
---

# 📘 KOHI Bot Revamp 2.0 — Project Documentation

> **Bot Name:** KOHI Bot | **Version:** 2.0 (Revamp Edition) | **Author:** @_callme_.mo  
> **Stack:** TypeScript + Node.js + Discord.js v14 + MongoDB (Mongoose)

---
## 🗂️ Project Structure Overview

```
kohi_revamp/
├── src/
│   ├── core/           → Entry point & bot bootstrap
│   ├── config/         → Bot settings and constants
│   ├── handlers/       → Command & event loaders
│   ├── events/         → Discord event listeners
│   ├── commands/       → All prefix + slash commands (by category)
│   ├── services/       → Business logic layer (TypeScript classes)
│   ├── models/         → Mongoose schema definitions
│   ├── repositories/   → Data access layer abstractions
│   ├── utils/          → Shared utility functions
│   └── scripts/        → One-off database/migration scripts
├── assets/             → Static image assets
├── .tmp/               → Temp files (image generation output)
├── logs/               → Daily rotating log files (Winston)
├── tests/              → Jest test suite
├── Dockerfile          → Production Docker container definition
├── tsconfig.json       → TypeScript compiler config
└── package.json        → Project dependencies & npm scripts
```

---

## ⚡ Entry Point — [src/core/index.ts](file:///c:/laragon/www/ksaekvat_revamp/src/core/index.ts)

The main application bootstrap file. It initializes the Discord client, connects the database, registers handlers, starts an HTTP server, and logs in.

### Exported Interface
```ts
interface ExtendedClient extends Client {
  commands: Collection<string, any>;       // Prefix commands
  slashCommands: Collection<string, any>;  // Slash commands
}
```

### Boot Functions

| Function | Description |
|---|---|
| [deployCommands()](file:///c:/laragon/www/ksaekvat_revamp/src/core/index.ts#53-95) | Reads all files in `commands/slash/`, builds JSON payloads, and pushes them to Discord's REST API via `Routes.applicationCommands`. Logs success/failure per file. |
| [connectDB()](file:///c:/laragon/www/ksaekvat_revamp/src/core/index.ts#96-115) | Connects to MongoDB using Mongoose with the URI resolved by [getMongoURI()](file:///c:/laragon/www/ksaekvat_revamp/src/utils/env.ts#51-63). On success, immediately calls `registry.initializeRegistry()` to warm up the gacha item cache. Exits process on failure. |
| [bootstrap()](file:///c:/laragon/www/ksaekvat_revamp/src/core/index.ts#116-148) | Orchestrates the full startup sequence: DB → Handlers → Slash Deploy → HTTP Health Check → Discord Login. |

### Other Notable Behaviors
- **HTTP Health Check**: A minimal Express server listens on `PORT` (default `8080`) and responds `OK` to `GET /`. Required by Railway for uptime detection.
- **Global Error Handling**: `process.on('unhandledRejection')` and `process.on('uncaughtException')` both route through `logger.error`.
- **Daily Cron Job**: Runs at midnight (`0 0 * * *`) via `node-cron`. Iterates all users from MongoDB and resets `dailyClaimed = false`.

---

## ⚙️ Configuration — [src/config/config.js](file:///c:/laragon/www/ksaekvat_revamp/src/config/config.js)

Central configuration object exported via `module.exports`. All values pull from environment variables with sensible fallbacks.

| Key | Description |
|---|---|
| `token` | Discord Bot Token |
| `prefix` | Main bot prefixes: `['k', 'K']` |
| `clientId` / `guildId` | Discord Application & Guild IDs |
| `shortPrefixes` | Map of shorthand aliases (e.g., `cf` → `coinflip`, `s` → `slots`) |
| `adminIds` | Array of admin Discord user IDs (from env + hardcoded) |
| `giphyApiKey`, `googleApiKey`, `seaLionApiKey`, `tenorApiKey` | External API keys |
| `aiConfig` | SEA-LION AI chatbot: `baseUrl`, `model`, and `systemPrompt` (waifu personality) |
| `economy` | Currency emoji, min/max bet, daily/weekly/work reward ranges |
| `gambling` | Per-game min/max bets and slots symbol config (diamond✦, rocket, coin, skull) |
| `hunting` | Cooldown, distraction chance (30%), and rarity table (common → priceless) with weights and values |
| `colors` | Discord-themed embed color palette |
| `botInfo` | Bot name, version, description, author |

---

## 🔒 Environment Validation — [src/utils/env.ts](file:///c:/laragon/www/ksaekvat_revamp/src/utils/env.ts)

Uses **Zod** to strictly validate the [.env](file:///c:/laragon/www/ksaekvat_revamp/.env) file on startup. If any required variable is missing or malformed, the process exits with a clear error message before anything else runs.

### Validated Variables

| Variable | Required | Default |
|---|---|---|
| `DISCORD_TOKEN` | ✅ Yes | — |
| `CLIENT_ID` | No | `1399459454889754805` |
| `GUILD_ID` | No | `1240627007340150785` |
| `MONGODB_URI` / `MONGODB_URL` / `MONGO_URI` / `MONGO_URL` | At least one | `mongodb://127.0.0.1:27017/kohi_bot` |
| `PORT` | No | `8080` |
| `NODE_ENV` | No | `development` |

### Exports

| Export | Description |
|---|---|
| [env](file:///c:/laragon/www/ksaekvat_revamp/.env) | Validated, type-safe environment object |
| [getMongoURI()](file:///c:/laragon/www/ksaekvat_revamp/src/utils/env.ts#51-63) | Returns the first available MongoDB URI from the four possible variable names |

---

## 🔌 Handlers — `src/handlers/`

### `commandHandler.js`
Recursively walks the `commands/` directory (skipping the `slash/` subfolder), loads every `.js` file, and registers it in `client.commands`. 

**Structure requirements for a command file:**
- `name` — string (required)
- `execute` — function (required)
- `aliases` — string[] (optional, all registered too)
- `category` — string (auto-set to folder name if missing)

### `eventHandler.js`
Reads all `.js` files from `events/`. For each event:
- If `event.once === true` → registers with `client.once()`
- Otherwise → registers with `client.on()`
- Passes `client` as the last argument to every `execute()` call

---

## 📡 Events — `src/events/`

| File | Description |
|---|---|
| `ready.js` | Fires once when the bot logs in. Typically logs the bot's tag and sets activity status. |
| `messageCreate.js` | The main message router. Parses prefix (including user custom prefixes and short aliases), checks cooldowns, resolves the command from `client.commands`, and executes it. |

---

## 🛠️ Services Layer — `src/services/`

All services are TypeScript classes exported as singletons (`module.exports = new XService()`).

---

### `DatabaseService.ts`
The **primary data access layer** wrapping all Mongoose model operations. Connects to MongoDB models: `User`, `Listener`, `TalkTarget`, `CharacterCard`, `AnimalRegistry`, `Character`.

| Method | Description |
|---|---|
| `getUser(userId, username?)` | Finds or creates a user document. Auto-updates username if changed. |
| `saveUser(user)` | Calls `user.save()` with error logging. |
| `getAllUsers()` | Returns all user documents. |
| `addExperience(userId, amount)` | Adds XP and handles multi-level-up with exponential scaling formula. Returns `{leveledUp, newLevel, currentExp, nextExp}`. |
| `addBalance(userId, amount)` | Atomic `$inc` update on balance. |
| `removeBalance(userId, amount)` | Atomic `$inc` with negative value on balance. |
| `hasBalance(userId, amount)` | Returns `true` if user balance ≥ amount. |
| `updateStats(userId, type, amount?)` | Increments `stats.totalWon`, `stats.totalLost`, `stats.commandsUsed`, or any custom stat field. |
| `addGachaItem(userId, itemName)` | Adds character or weapon to `gacha_inventory`. Increments `count` if already owned. Returns merged item data. |
| `getHydratedInventory(userId)` | Returns inventory items merged with static registry data. |
| `loadAnimals()` | Fetches all `AnimalRegistry` documents and returns a rarity-grouped map. |
| `addAnimal(userId, animalKey, rarity)` | Increments a nested `Map<rarity, Map<animalKey, count>>` in the user document. |
| `getUserAnimals(userId)` | Returns user's animals map. |
| `addBooster(userId, type, multiplier, duration)` | Sets a booster with expiry timestamp in user's `boosters` Map. |
| `getActiveBooster(userId, type)` | Returns booster if it hasn't expired, otherwise `null`. |
| `getListeners()` | Returns `{ adminId: targetUserId }` map from `Listener` collection. |
| `saveListener(adminId, targetUserId)` | Upserts or deletes a listener record. |
| `getTalkTargets()` | Returns `{ adminId: { channelId, serverId, setAt } }` from `TalkTarget` collection. |
| `saveTalkTarget(adminId, channelId, serverId?)` | Upserts or deletes a talk target record. |
| `getCharacterCard()` | Returns the singleton `CharacterCard` document with id `'default'`. |
| `updateCharacterCard(data)` | Upserts the default `CharacterCard`. |
| `getGachaPool()` | Builds a `{ game: { 3: [], 4: [], 5: [] } }` pool from the registry. Injects 3-star generic weapons (Sword, Claymore, Bow, Catalyst, Polearm) for genshin/hsr/wuwa. |

---

### `CombatService.ts`
All RPG battle math is centralized here. Uses TypeScript interfaces for type safety.

**Interfaces:** `CombatStats`, `PlayerStats`, `Enemy`, `BattleRewards`

| Method | Description |
|---|---|
| `calculateCharStats(char, userData, bonuses?)` | Computes character HP/ATK/DEF based on rarity, ascension, and user level. |
| `calculatePlayerStats(userData, bonuses?)` | Builds `baseStats` (ATK, DEF, HP, Luck) and `totalStats` (+ Speed, CritRate, Evasion from bonuses). |
| `generateEnemy(userLevel, worldLevel)` | Creates a randomized enemy. 10% chance to be a BOSS. Classes: TANK, STRIKER, SUPPORT, BOSS — each with HP/ATK/DEF multipliers. |
| `getEnemyAction(enemy, team)` | 30% chance for a class-specific skill (TANK shields, SUPPORT heals, STRIKER crits, BOSS AOE), otherwise a normal attack. Returns `{ type, damage, log, metadata? }`. |
| `calculateAttackDamage(attackerAtk, targetDef)` | Computes damage with 90–110% variance and a minimum floor of 30. |
| `calculateComboDamage(team)` | Sums ATK of all alive party members × 2.5. |
| `calculateRewards(enemy, betAmount, won)` | Returns `{ money, exp }`. Multiplied by boss/rarity bonuses (up to 6×). Returns `{ 0, 10 }` on loss. |

---

### `GachaService.ts`
Manages all gacha pull logic — rates, pity, and pool selection.

**Constants:** Base 5★ rate: `0.6%`, Soft pity start: pull `75`, Hard pity 5★: `90`, Hard pity 4★: `10`

| Method | Description |
|---|---|
| `rollRarity(currentPity5, currentPity4)` | Determines rarity of a single pull. Applies soft pity (rate increases per pull after 75). Returns `{ rarity, pity5, pity4 }`. |
| `performMultiPull(userData, pool)` | Performs 10 consecutive rolls using `rollRarity`. Picks a random item from the matching rarity pool each time. Returns full results with updated pity counters. |

---

### `EconomyService.ts`
Handles bet parsing and economy math. Reads limits from `config.js`.

| Method | Description |
|---|---|
| `parseBet(input, userBalance, minLimit?, maxLimit?)` | Accepts `'all'`, `'min'`, `'max'`, or a number string. Clamps to maxBet. Returns `0` on invalid input. |
| `calculateWorkReward(min?, max?, multiplier?)` | Random value in `[min, max]` range, scaled by multiplier. |
| `format(amount)` | Returns `amount.toLocaleString()` for display. |

---

### `AnimalService.ts`
Handles the hunting/zoo system and Pokémon image fetching using `pokedex-promise-v2` (auto-caching library).

| Method | Description |
|---|---|
| `calculateZooStats(userAnimals, animalsData)` | Aggregates total animal count, total value, and per-rarity breakdown. Returns `ZooStats`. |
| `calculateBadges(totalAnimalsFound, totalValue, userAnimals)` | Awards emoji badges: 🦁 Hunter (100+), 👑 Master (500+), 💰 Tycoon (1M+ value), 🌟 Legend (has priceless), 🌈 Collector (10+ unique rarities). |
| `getPokemonImage(key)` | Fetches official artwork URL from PokéAPI via `pokedex-promise-v2`. Handles shiny Charizard override. Caches results in-memory. |
| `getPokemonSprite(key)` | Fetches small pixel sprite (prefers Gen8 icons). Also cached. |
| `getKantoPokedexEntries()` | Fetches all Pokémon names from the Kanto Pokédex. Returns string array. |
