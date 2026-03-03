const { EmbedBuilder } = require("discord.js");
const database = require("../../utils/database.js");
const colors = require("../../utils/colors.js");

// --- UTILS: Character Image Mapping ---
function getSplashArt(char) {
    const name = char.name.replace(/\s+/g, '_');
    const game = char.game?.toLowerCase();
    
    if (game === 'genshin') {
        return `https://api.ambr.top/assets/UI/UI_Gacha_AvatarIcon_${name}.png`;
    }
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`;
}

module.exports = {
    name: "team",
    aliases: ["kteam", "squad", "setteam"],
    description: "Manage your battle team! Add or remove characters.",
    usage: "team [add/remove/list]",
    async execute(message, args, client) {
        const userData = database.getUser(message.author.id);
        if (!userData.team) userData.team = [];

        const sub = args[0]?.toLowerCase();

        // --- LIST TEAM ---
        if (!sub || sub === 'list') {
            const embed = new EmbedBuilder()
                .setColor(colors.primary)
                .setTitle(`🛡️ ${message.author.username}'s Battle Team`)
                .setDescription("hg ach dak character hz hz luy hz luy ban hz! (4 slots max)");

            if (userData.team.length === 0) {
                embed.addFields({ name: "Team Status", value: "hg ot torm team heh! Use `kteam add <name>` to add characters." });
            }

            userData.team.forEach((char, index) => {
                const starIcon = char.rarity === 5 ? '🔶' : (char.rarity === 4 ? '🔷' : '⚪');
                const ascension = char.ascension || 0;
                embed.addFields({
                    name: `Slot ${index + 1}: ${char.emoji} ${char.name}`,
                    value: `${starIcon} Rarity: ${char.rarity}★ | Asc: ${ascension} | Game: ${char.game}`,
                    inline: true
                });
            });

            if (userData.team.length > 0) {
                embed.setImage(getSplashArt(userData.team[0]));
            }

            return message.reply({ embeds: [embed] });
        }

        // --- ADD TO TEAM ---
        if (sub === 'add') {
            const charName = args.slice(1).join(' ').toLowerCase();
            if (!charName) return message.reply("❓ hg jong add nak na? Example: `kteam add Raiden Shogun` (ﾉ´ヮ`)ﾉ*:･ﾟ✧");

            if (userData.team.length >= 4) return message.reply("🚫 Team hg korn hz! (Max 4 slots)");

            const inventory = userData.gacha_inventory || [];
            // Find character in inventory (filter out weapons)
            const found = inventory.find(c => (c.type === 'character' || !c.type) && c.name.toLowerCase().includes(charName));

            if (!found) return message.reply(`❌ hg ot mean character **${charName}** knong inventory heh!`);
            
            // Check if already in team
            if (userData.team.some(c => c.name === found.name)) return message.reply("🚫 character ng mean hz knong team!");

            userData.team.push(found);
            database.saveUser(userData);

            const embed = new EmbedBuilder()
                .setColor(colors.success)
                .setTitle("✅ Character Added!")
                .setDescription(`hg add **${found.name}** tov team hz!`)
                .setThumbnail(getSplashArt(found));

            return message.reply({ embeds: [embed] });
        }

        // --- REMOVE FROM TEAM ---
        if (sub === 'remove') {
            const slot = parseInt(args[1]);
            if (isNaN(slot) || slot < 1 || slot > userData.team.length) {
                return message.reply(`❓ hg jong remove slot na? (1-${userData.team.length})`);
            }

            const removed = userData.team.splice(slot - 1, 1);
            database.saveUser(userData);

            return message.reply(`✅ Removed **${removed[0].name}** from your team! (◕‿◕✿)`);
        }
    }
};