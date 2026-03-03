const { EmbedBuilder } = require("discord.js");
const database = require("../../utils/database.js");
const colors = require("../../utils/colors.js");

/**
 * Helper to get the best possible image URL for a character.
 * (Copied from char.js for consistency)
 */
function getCharacterImage(char) {
    let name = char.name.replace(/\s+/g, '_');
    const game = char.game?.toLowerCase();
    
    const hsrMapping = { "Dan_Heng_•_IL": "Dan_Heng_•_Imbibitor_Lunae", "March_7th": "March_7th", "Dr._Ratio": "Dr._Ratio", "Topaz": "Topaz_&_Numby" };
    const genshinMapping = { "Raiden_Shogun": "Raiden_Shogun", "Kuki_Shinobu": "Kuki_Shinobu" };
    const wuwaMapping = { "Rover": "Rover_(Spectro)", "Shorekeeper": "The_Shorekeeper" };

    if (game === 'hsr' && hsrMapping[name]) name = hsrMapping[name];
    if (game === 'genshin' && genshinMapping[name]) name = genshinMapping[name];
    if (game === 'wuwa' && wuwaMapping[name]) name = wuwaMapping[name];

    const width = "?width=1000";
    if (game === 'genshin') return `https://genshin-impact.fandom.com/wiki/Special:FilePath/Character_${name}_Splash_Art.png${width}`;
    else if (game === 'hsr') return `https://honkai-star-rail.fandom.com/wiki/Special:FilePath/${name}_Splash_Art.png${width}`;
    else if (game === 'wuwa') return `https://wutheringwaves.fandom.com/wiki/Special:FilePath/${name}_Splash_Art.png${width}`;
    else if (game === 'zzz') return `https://zenless-zone-zero.fandom.com/wiki/Special:FilePath/Agent_${name}_Portrait.png${width}`;
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`;
}

module.exports = {
    name: "team",
    aliases: ["kteam", "squad", "setteam"],
    description: "Manage your battle team! Add or remove characters.",
    usage: "team [add/remove/list]",
    async execute(message, args, client) {
        const userData = await database.getUser(message.author.id);
        if (!userData.team) userData.team = [];

        const hydratedInventory = await database.getHydratedInventory(message.author.id);
        const hydratedTeam = userData.team.map(name => hydratedInventory.find(i => i.name === name)).filter(Boolean);

        const sub = args[0]?.toLowerCase();

        if (!sub || sub === 'list') {
            const embed = new EmbedBuilder()
                .setColor(colors.primary)
                .setTitle(`🛡️ ${message.author.username}'s Battle Team`)
                .setDescription("hg ach dak character hz hz luy hz luy ban hz! (4 slots max)");

            if (hydratedTeam.length === 0) {
                embed.addFields({ name: "Team Status", value: "hg ot torm team heh! Use `kteam add <name>` to add characters." });
            }

            hydratedTeam.forEach((char, index) => {
                const starIcon = char.rarity === 5 ? '🔶' : (char.rarity === 4 ? '🔷' : '⚪');
                const ascension = char.ascension || 0;
                embed.addFields({
                    name: `Slot ${index + 1}: ${char.emoji} ${char.name}`,
                    value: `${starIcon} Rarity: ${char.rarity}★ | Asc: ${ascension} | Game: ${char.game}`,
                    inline: true
                });
            });

            if (hydratedTeam.length > 0) {
                embed.setImage(getCharacterImage(hydratedTeam[0]));
            }

            return message.reply({ embeds: [embed] });
        }

        if (sub === 'add') {
            const charName = args.slice(1).join(' ').toLowerCase();
            if (!charName) return message.reply("❓ hg jong add nak na? Example: `kteam add Raiden Shogun` (ﾉ´ヮ`)ﾉ*:･ﾟ✧");
            if (userData.team.length >= 4) return message.reply("🚫 Team hg korn hz! (Max 4 slots)");

            const found = hydratedInventory.find(c => c.type === 'character' && c.name.toLowerCase().includes(charName));
            if (!found) return message.reply(`❌ hg ot mean character **${charName}** knong inventory heh!`);
            if (userData.team.includes(found.name)) return message.reply("🚫 character ng mean hz knong team!");

            userData.team.push(found.name);
            database.saveUser(userData);
            return message.reply(`✅ Added **${found.name}** to your team! (◕‿◕✿)`);
        }

        if (sub === 'remove') {
            const slot = parseInt(args[1]);
            if (isNaN(slot) || slot < 1 || slot > userData.team.length) {
                return message.reply(`❓ hg jong remove slot na? (1-${userData.team.length})`);
            }
            const removedName = userData.team.splice(slot - 1, 1);
            database.saveUser(userData);
            return message.reply(`✅ Removed **${removedName[0]}** from your team! (◕‿◕✿)`);
        }
    }
};