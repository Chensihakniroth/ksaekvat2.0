"use strict";
const { EmbedBuilder } = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const GIPHY_API_KEY = config.giphyApiKey;
// Jail tracker: userId -> timestamp when jail expires
const jailedUsers = new Map();
// ── Curated GIF pools for guaranteed context relevance ──────────────
const GIF_POOLS = {
    rob_success: [
        'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3UybjByZGxsNXZyYmtzNGt4Z3BuMmpscThsem5yMGRiejlpY3ZoNCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/0ixAZaU8Gp8R5TdRQT/giphy.gif',
        'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3UybjByZGxsNXZyYmtzNGt4Z3BuMmpscThsem5yMGRiejlpY3ZoNCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/Rtu8Jzs4MzoC3cl8lM/giphy.gif',
        'https://media.giphy.com/media/dMsh6gRYJDymXSIatd/giphy.gif',
        'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3UybjByZGxsNXZyYmtzNGt4Z3BuMmpscThsem5yMGRiejlpY3ZoNCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/bpTL6wXRuMQpMIVduB/giphy.gif',
        'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3UybjByZGxsNXZyYmtzNGt4Z3BuMmpscThsem5yMGRiejlpY3ZoNCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/JhEHJrm4GTzw5gqj5y/giphy.gif',
        'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3UybjByZGxsNXZyYmtzNGt4Z3BuMmpscThsem5yMGRiejlpY3ZoNCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/6N09ETGHhVuOspFNJD/giphy.gif',
    ],
    rob_fail: [
        'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjdpc3hrbnVpOTJ5a2x0ZDV2cTc5dWdvaDdxMmtjNnFmaTIwZno2eCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/7oFbG03C8AvFbv4Iti/giphy.gif',
        'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjdpc3hrbnVpOTJ5a2x0ZDV2cTc5dWdvaDdxMmtjNnFmaTIwZno2eCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/SU90xAXfWonoggFIcm/giphy.gif',
        'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Y3JhamQ0endjZTBkanE4a2Z5NXFuejUyenZobXFhdDJqMGkzc3k2aCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/V6gKvIt1JozxrMQPFc/giphy.gif',
        'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3N2RzczZtbml2MmFwOGJjMXAxOW9wd2NtaHJsOHdxbXpkOGRpYTV2NCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/uN1ggGbJi8Ie3BFoXq/giphy.gif',
        'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjF4NWgydzk0Y2w2Zmd2M2doaG1zMHB6Zzh0dW11Z3c0aDFtNDY5NyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/J1YvLYmEKS8BcgM5Yy/giphy.gif',
    ],
    jail: [
        'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExbWtka21lZWZxdDhldndtaDlscmN6M2xjbmIycWJ2czk0OWE5bzg5aiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/d8XNDMiXhPMVRKpjlu/giphy.gif',
        'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHQ0eWVyZTVsNjR5a2k4bmNrendqNTA5OWVxcXdhazIwN3FxeTVldiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/soS6N6KBCB3oc/giphy.gif',
        'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Z3F1MGliaGphNnJ4eGliMHJoNDVrYm50NGdrbzhodDAwa3k3NWxoOCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ZwX6kSakHXY5KsJZP1/giphy.gif',
        'https://media.giphy.com/media/26gsobowozGM9umBi/giphy.gif',
        'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3azJ6ZnN4bXJkbHA5NWd0enAxZW5nNWs1c3p3OXQzOG16ZHV5Ymd1eSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/t6qZSIwcLk8GLCX6Vp/giphy.gif',
        'https://media.giphy.com/media/l4Ep6uxU6aedrYUik/giphy.gif',
        'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Mm90OHV0aWgzNDR0dnAyNGQxY2UxaWl5bnpoam1za2Jvb2l2dDlhMSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/r59gUvu0iTW2Q/giphy.gif',
    ],
};
/**
 * Get a contextual GIF from curated pool, with Giphy random API fallback.
 */
async function getContextGif(pool) {
    // Primary: curated pool (instant, always relevant)
    const curated = GIF_POOLS[pool];
    if (curated && curated.length > 0) {
        return curated[Math.floor(Math.random() * curated.length)];
    }
    // Fallback: Giphy random endpoint with tight tag
    try {
        const tag = pool === 'jail' ? 'jail' : pool === 'rob_success' ? 'robbery' : 'caught';
        const url = `https://api.giphy.com/v1/gifs/random?api_key=${GIPHY_API_KEY}&tag=${tag}&rating=pg-13`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.data && data.data.images) {
            return data.data.images.original.url;
        }
    }
    catch (err) {
        console.error('[ROB] Giphy fallback failed:', err.message);
    }
    return null;
}
module.exports = {
    name: 'rob',
    aliases: ['steal', 'heist', 'plon'],
    description: "Attempt to rob another user's wallet! 50/50 odds... but you might end up in jail. (¬‿¬)",
    usage: 'rob <@user>',
    category: 'economy',
    cooldown: 60000, // 1 minute (60,000 ms)
    async execute(message, args, client) {
        const robber = message.author;
        // ── Jail check ──────────────────────────────────────────────────────
        const jailExpiry = jailedUsers.get(robber.id);
        if (jailExpiry && Date.now() < jailExpiry) {
            const remaining = Math.ceil((jailExpiry - Date.now()) / 60000);
            const jailGif = await getContextGif('jail');
            const embed = new EmbedBuilder()
                .setColor(colors.error)
                .setTitle('🔒 Pg jorb kok')
                .setDescription(` Wait **${remaining} minute(s)** ban plorn ban tt. (ಥ﹏ಥ)`);
            if (jailGif)
                embed.setImage(jailGif);
            const sent = await message.reply({ embeds: [embed] });
            setTimeout(() => sent.delete().catch(() => { }), 8000);
            return 'CUSTOM_COOLDOWN'; // Signal to messageCreate that we handled it
        }
        // ── Target validation ───────────────────────────────────────────────
        const target = message.mentions.users.first();
        if (!target) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(colors.error)
                        .setTitle('⚠️ Hoch plorn pi na ke?')
                        .setDescription('oun eng plorn na ke? Mention neak ng mao! (・_・ヾ\n**Usage:** `krob @user`'),
                ],
            });
        }
        if (target.id === robber.id) {
            return message.reply("You can't rob yourself... that's just moving money between pockets. (≧◡≦)");
        }
        if (target.bot) {
            return message.reply("Bots don't carry cash. Nice try though. (¬‿¬)");
        }
        // ── Fetch both users ────────────────────────────────────────────────
        const robberData = await database.getUser(robber.id, robber.username);
        const targetData = await database.getUser(target.id, target.username);
        // Only wallet money can be stolen
        if (targetData.balance < 500) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(colors.warning)
                        .setTitle('💸 ah oun ng ot luy pg ng ')
                        .setDescription(`**${target.username}** ror luy ma riel kmean. ror neak mean luy jeang ng mao (・_・ヾ`),
                ],
            });
        }
        // ── Roll the dice ───────────────────────────────────────────────────
        const roll = Math.random();
        const jailChance = 0.15; // 15% chance of jail on failure
        const successChance = 0.5; // 50% success rate
        // Random steal amount: 1,000 - 10,000, capped at target's wallet
        const stealAmount = Math.min(Math.floor(Math.random() * 9001) + 1000, // 1000–10000
        targetData.balance);
        // ── SUCCESS ─────────────────────────────────────────────────────────
        if (roll < successChance) {
            // Transfer money
            await database.addBalance(robber.id, stealAmount);
            await database.removeBalance(target.id, stealAmount);
            const robGif = await getContextGif('rob_success');
            const embed = new EmbedBuilder()
                .setColor(0x00ff88)
                .setTitle('💰 PLON BAN SOMRACH :3')
                .setDescription(`**${robber.username}** plorn **${stealAmount.toLocaleString()}** ${config.economy.currencySymbol} from **${target.username}**'s wallet! (¬‿¬)\n\n` +
                `Their bank was untouchable... but their wallet? Wide open.`)
                .addFields({
                name: '🏃 Your Wallet',
                value: `**${(robberData.balance + stealAmount).toLocaleString()}** ${config.economy.currencySymbol}`,
                inline: true,
            }, {
                name: "😭 Victim's Wallet",
                value: `**${(targetData.balance - stealAmount).toLocaleString()}** ${config.economy.currencySymbol}`,
                inline: true,
            })
                .setTimestamp();
            if (robGif)
                embed.setImage(robGif);
            await database.updateStats(robber.id, 'command');
            return message.reply({ embeds: [embed] });
        }
        // ── JAIL CHECK on failure ───────────────────────────────────────────
        if (Math.random() < jailChance) {
            // JAILED! 20 minute lockout
            const jailDuration = 20 * 60 * 1000; // 20 minutes
            jailedUsers.set(robber.id, Date.now() + jailDuration);
            const jailGif = await getContextGif('jail');
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('🚨 JORB KOK 1 - 0 ')
                .setDescription(`**${robber.username}** ror plorn **${target.username}** Tae police jab ban! (ಥ﹏ಥ)\n\n` +
                `🔒 **Jail Time:** You can't rob for **20 minutes**!`)
                .setTimestamp();
            if (jailGif)
                embed.setImage(jailGif);
            await database.updateStats(robber.id, 'command');
            return message.reply({ embeds: [embed] });
        }
        // ── Regular failure (no jail) ───────────────────────────────────────
        const failGif = await getContextGif('rob_fail');
        const embed = new EmbedBuilder()
            .setColor(colors.error)
            .setTitle('❌ plon ke ot ban haaaa')
            .setDescription(`**${robber.username}** jong plorn **${target.username}** but ke tarm torn (・_・ヾ\n\n` +
            `Heng ai ke ot jab dak kok...`)
            .setTimestamp();
        if (failGif)
            embed.setImage(failGif);
        await database.updateStats(robber.id, 'command');
        return message.reply({ embeds: [embed] });
    },
};
