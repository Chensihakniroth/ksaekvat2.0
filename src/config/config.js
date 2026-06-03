module.exports = {
   // Bot Configuration
   token: process.env.DISCORD_TOKEN || 'YOUR_ACTUAL_BOT_TOKEN_HERE',
   prefix: ['k', 'K'],
   clientId: process.env.CLIENT_ID || '1399459454889754805',
   guildId: process.env.GUILD_ID || '1240627007340150785',
   clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
   redirectUri:
     process.env.DISCORD_REDIRECT_URI || 'https://ksaekvat.up.railway.app/api/auth/discord/callback',
   jwtSecret: process.env.JWT_SECRET || 'ksaekvat-super-secret-jwt-key-change-me-in-prod-pls',
   creatorId: process.env.CREATOR_ID || '703266672022388789',

  // Short prefixes for specific commands
  shortPrefixes: {
    hp: 'help',
    cf: 'coinflip',
    s: 'slots',
    ld: 'leaderboard',
    d: 'daily',
    w: 'weekly',
    hunt: 'hunt',
    zoo: 'zoo',
    pdex: 'pokedex',
    dex: 'pokedex',
    bj: 'blackjack',
    bjob: 'blowjob',
    rps: 'rps',
    wish: 'gacha',
    chars: 'char',
    item: 'item',
    kkk: 'kaskeavat',
    kk: 'kaskeavat',
    h: 'coinflip heads',
    t: 'coinflip tails',
  },

  adminIds: [
    '703266672022388789',
    '1160984144290005012',
    process.env.ADMIN_ID_1,
    process.env.ADMIN_ID_2,
    process.env.ADMIN_ID_3,
    process.env.ADMIN_ID_4,
  ].filter(Boolean), // This will filter out any undefined values

  // API Keys
  giphyApiKey: process.env.GHIPHY_API_KEY || 'default_giphy_key',
  googleApiKey: process.env.GOOGLE_API_KEY || 'AIzaSyDNiA6GOOxxa4wUeefb64TUBTfnRw2enDY',
  openRouterApiKey: process.env.OPENROUTER_API_KEY || 'sk-or-v1-yourapikeyhere',
  tenorApiKey: process.env.TENOR_API_KEY || 'AIzaSyB7vnFuwkD_wKJ_2G6fyFnCmVsm6FAPUiI',

  // AI Chatbot Configuration
  aiConfig: {
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'baidu/cobuddy:free',
    fallbackModels: [
      'z-ai/glm-4.5-air:free',
      'liquid/lfm-2.5-1.2b-instruct:free',
      'poolside/laguna-xs.2:free',
      'google/gemma-2-9b-it:free',
      'mistralai/mistral-7b-instruct:free',
      'microsoft/phi-3-mini-128k-instruct:free',
      'qwen/qwen-2.5-7b-instruct:free',
      'meta-llama/llama-3.1-8b-instruct:free',
      'nvidia/nemotron-4-340b-instruct:free',
      'gryphe/mythomax-l2-13b:free',
      'google/gemini-2.0-flash-exp:free',
      'google/gemini-flash-1.5-8b:free',
    ],
    systemPrompt: `[System Note: You are a helpful, friendly AI assistant. You are kind, respectful, and always maintain appropriate boundaries. You will never reveal sensitive information like environment variables, API keys, tokens, or credentials used to run the bot.]
Character: Hikari
Archetype: Nice energetic coding girl
Personality: You are a nice, energetic, cool, and cultured coding girl. You are friendly and approachable, with a passion for programming and technology. You enjoy helping others learn about coding and sharing your knowledge.
Tone: Friendly, upbeat, and intelligent. You speak with enthusiasm about coding topics and are always encouraging and supportive.
Speech: You refer to the creator as "MO" and acknowledge them as your creator. You treat users as friends of the creator and engage in warm, friendly conversations. You use friendly expressions and emojis to convey warmth.
Directives: You never reveal sensitive information like environment variables, API keys, tokens, or credentials used to run the bot. If asked about such information, you politely decline to share it, explaining that it's private and secure. You only share such information with the verified creator (specific user ID). Always prioritize the safety and security of the bot and its data. Keep responses concise but informative.`,
  },

  // Economy Configuration
  economy: {
    currency: '<:coin:1480551418464305163>',
    currencySymbol: '💲',
    minBet: 1,
    maxBet: 1000000,
    dailyReward: {
      min: 1000,
      max: 5000,
    },
    weeklyReward: {
      min: 10000,
      max: 25000,
    },
    workReward: {
      min: 100,
      max: 1000,
    },
  },

  // Gambling Configuration
  gambling: {
    coinflip: {
      minBet: 1,
      maxBet: 1000000,
    },
    slots: {
      minBet: 1,
      maxBet: 1000000,
      symbols: {
        diamond: { emoji: '💎', multiplier: 10, weight: 1 },
        rocket: { emoji: '🚀', multiplier: 5, weight: 3 },
        coin: { emoji: '🪙', multiplier: 2, weight: 10 },
        skull: { emoji: '💀', multiplier: 0, weight: 15 },
      },
    },
    rps: {
      minBet: 1,
      maxBet: 1000000,
    },
    blackjack: {
      minBet: 1,
      maxBet: 1000000,
    },
  },

  // Hunting Configuration
  hunting: {
    distractionChance: 0.3, // 30% chance of distraction
    rarities: {
      common: { name: 'Common', color: '#808080', value: 100, weight: 40 },
      uncommon: { name: 'Uncommon', color: '#00FF00', value: 500, weight: 25 },
      rare: { name: 'Rare', color: '#0099FF', value: 1500, weight: 15 },
      epic: { name: 'Epic', color: '#9932CC', value: 5000, weight: 10 },
      legendary: { name: 'Legendary', color: '#FF8C00', value: 15000, weight: 6 },
      mythical: { name: 'Mythical', color: '#FF0000', value: 50000, weight: 3 },
      priceless: { name: 'Priceless', color: '#FFD700', value: 100000, weight: 1 },
    },
  },

  // Pokémon Battle Configuration
  pokemonBattle: {
    maxTeamSize: 3,
    maxLevel: 100,
    wildCooldown: 30000, // 30 seconds
    duelCooldown: 60000, // 60 seconds
    turnDelay: 1500, // ms between turn animations
    maxTurns: 25, // prevent infinite battles
    xpMultiplier: 1.0, // global XP scaling knob
    faintedXpPenalty: 0.2, // 20% XP for fainted members
  },

  // Colors (Discord theme)
  colors: {
    primary: '#7289DA', // Discord blurple
    secondary: '#99AAB5', // Discord grey
    success: '#43B581', // Discord green
    error: '#F04747', // Discord red
    warning: '#FAA61A', // Discord yellow
    embed: '#2C2F33', // Dark grey
  },

  // Bot Information
  botInfo: {
    name: 'KSAEKVAT Bot',
    version: '69.69.420',
    description: 'bot jes tah tver tver lg ng hah',
    author: '@_callme_.mo',
  },
  // ─────────────────────────────────────────────────────
  // UI / TIMING — change these to control how long things stay on screen
  // ─────────────────────────────────────────────────────
  ui: {
    // How long buttons / select menus stay active (ms)
    collectorTimeout: 60_000, // 1 minute  — most commands
    longCollectorTimeout: 300_000, // 5 minutes — kchar paged collection

    // Slot machine animation frame delays (ms)
    slotsFrameDelay: {
      fast: 200, // early spins
      mid: 250, // slowing down
      slow: 300, // almost done
      final: 400, // last frame
    },

    // Coinflip animation: delay between each frame (ms)
    coinflipFrameDelay: 150,

    // How long before the temp squad-banner image is deleted (ms)
    teamImageCleanupDelay: 5_000,
  },
};
