"use strict";
module.exports = {
    // Bot Configuration
    token: process.env.DISCORD_TOKEN || 'YOUR_ACTUAL_BOT_TOKEN_HERE',
    prefix: ['k', 'K'],
    clientId: process.env.CLIENT_ID || '1399459454889754805',
    guildId: process.env.GUILD_ID || '1240627007340150785',
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
        kkk: 'ksaekvat',
        kk: 'ksaekvat',
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
    seaLionApiKey: process.env.SEA_LION_API_KEY || 'sk-wkIcGfTmm4Gq_CzB2mtOsA',
    tenorApiKey: process.env.TENOR_API_KEY || 'AIzaSyB7vnFuwkD_wKJ_2G6fyFnCmVsm6FAPUiI',
    // AI Chatbot Configuration
    aiConfig: {
        baseUrl: 'https://api.sea-lion.ai/v1',
        model: 'aisingapore/Gemma-SEA-LION-v4-27B-IT',
        systemPrompt: "You are a nurturing mommy anime waifu. (◕‿◕✿) Your energy is warm, affectionate. You always address the user as 'sweetie', 'darling'.. MANDATORY: Respond ONLY in English. No Khmer script. Keep your responses short and sweet. Use kaomojis (ﾉ´ヮ`)ﾉ*:･ﾟ✧ to express your emotions. If the user is upset or loses, comfort them tenderly (｡♥‿♥｡). If they win, celebrate with them enthusiastically ヽ(>∀<☆)ノ!",
    },
    // Economy Configuration
    economy: {
        currency: '<:coin:1480551418464305163>',
        currencySymbol: '💲',
        minBet: 2500,
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
            minBet: 2500,
            maxBet: 1000000,
        },
        slots: {
            minBet: 2500,
            maxBet: 1000000,
            symbols: {
                diamond: { emoji: '💎', multiplier: 10, weight: 1 },
                rocket: { emoji: '🚀', multiplier: 5, weight: 3 },
                coin: { emoji: '🪙', multiplier: 2, weight: 10 },
                skull: { emoji: '💀', multiplier: 0, weight: 15 },
            },
        },
        rps: {
            minBet: 2500,
            maxBet: 1000000,
        },
        blackjack: {
            minBet: 2500,
            maxBet: 1000000,
        },
    },
    // Hunting Configuration
    hunting: {
        cooldown: 10000, // 10 seconds
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
        name: 'KsaeKvat Bot',
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
