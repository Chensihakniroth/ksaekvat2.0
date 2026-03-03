const { EmbedBuilder } = require("discord.js");
const database = require("../../utils/database.js");
const colors = require("../../utils/colors.js");

module.exports = {
    name: "team",
    aliases: ["kteam", "squad"],
    description: "Manage your battle team! (4 Slots)",
    usage: "team [add <name>/remove <slot>]",
    async execute(message, args, client) {
        const userData = await database.getUser(message.author.id, message.author.username);
        if (!userData.team) userData.team = [];

        const sub = args[0]?.toLowerCase();

        // --- SUBCOMMAND: ADD ---
        if (sub === 'add') {
            const charName = args.slice(1).join(' ').toLowerCase();
            if (!charName) return message.reply("❓ hg jong add nak na? Example: `kteam add Raiden Shogun` (ﾉ´ヮ`)ﾉ*:･ﾟ✧");
            
            if (userData.team.length >= 4) {
                return message.reply("🚫 Team hg korn hz! (Max 4 slots). Remove someone first! (｡•́︿•̀｡)");
            }

            const hydratedInventory = await database.getHydratedInventory(message.author.id);
            const found = hydratedInventory.find(c => (c.type === 'character' || !c.type) && c.name.toLowerCase().includes(charName));
            
            if (!found) return message.reply(`❌ hg ot mean character **${charName}** knong inventory heh!`);
            if (userData.team.includes(found.name)) return message.reply("🚫 character ng mean hz knong team!");

            userData.team.push(found.name);
            await database.saveUser(userData);
            return message.reply(`✅ Added **${found.name}** to your team! (◕‿◕✿)`);
        }

        // --- SUBCOMMAND: REMOVE ---
        if (sub === 'remove') {
            const slot = parseInt(args[1]);
            if (isNaN(slot) || slot < 1 || slot > 4) {
                return message.reply(`❓ hg jong remove slot na? (1-4)`);
            }
            
            if (slot > userData.team.length) {
                return message.reply("🚫 Slot ng ot mean character heh!");
            }

            const removedName = userData.team.splice(slot - 1, 1);
            await database.saveUser(userData);
            return message.reply(`✅ Removed **${removedName[0]}** from your team! (◕‿◕✿)`);
        }

        // --- DEFAULT: SHOW TEAM ---
        const embed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle(`🛡️ ${message.author.username}'s Battle Team`)
            .setDescription("Your current squad composition:");

        // Display exactly 4 slots
        for (let i = 0; i < 4; i++) {
            const charName = userData.team[i];
            embed.addFields({
                name: `Slot ${i + 1}`,
                value: charName ? `**${charName}**` : "*Empty*",
                inline: true
            });
        }

        embed.setFooter({ text: "Use 'kteam add <name>' to fill your slots! (っ˘ω˘ς)" });

        await message.reply({ embeds: [embed] });
    }
};
