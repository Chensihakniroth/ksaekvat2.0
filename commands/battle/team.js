const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const database = require("../../utils/database.js");
const colors = require("../../utils/colors.js");
const { getCharacterIcon } = require("../../utils/images.js");

module.exports = {
    name: "team",
    aliases: ["kteam", "squad"],
    description: "Manage your battle team! (4 Slots) ✨",
    usage: "team [add <name> | remove <slot>]",
    async execute(message, args, client) {
        let userData = await database.getUser(message.author.id, message.author.username);
        if (!userData.team) userData.team = [];

        const sub = args[0]?.toLowerCase();

        // Helper to find a character in inventory
        const findCharacter = async (name) => {
            const inventory = await database.getHydratedInventory(message.author.id);
            return inventory.find(c => (c.type === 'character' || !c.type) && c.name.toLowerCase().includes(name.toLowerCase()));
        };

        // --- SUBCOMMAND: ADD ---
        if (sub === 'add') {
            const charName = args.slice(1).join(' ');
            if (!charName) return message.reply("❓ Who should Mommy add? Example: `kteam add Raiden` (｡♥‿♥｡)");
            
            if (userData.team.length >= 4) return message.reply("🚫 Team is full! Remove someone first. (っ˘ω˘ς)");

            const found = await findCharacter(charName);
            if (!found) return message.reply(`❌ You don't have **${charName}** in your collection!`);
            if (userData.team.includes(found.name)) return message.reply("🚫 Already in team! (◕‿◕✿)");

            userData.team.push(found.name);
            await database.saveUser(userData);
            return message.reply(`✅ Added **${found.name}** to Slot ${userData.team.length}! (ﾉ´ヮ`)ﾉ*:･ﾟ✧`);
        }

        // --- SUBCOMMAND: REMOVE ---
        if (sub === 'remove') {
            const slot = parseInt(args[1]);
            if (isNaN(slot) || slot < 1 || slot > 4) return message.reply(`❓ Which slot should Mommy clear? (1-4)`);
            if (slot > userData.team.length) return message.reply("🚫 That slot is already empty! (｡•́︿•̀｡)");

            const removed = userData.team.splice(slot - 1, 1);
            await database.saveUser(userData);
            return message.reply(`✅ Removed **${removed[0]}** from your team! (っ˘ω˘ς)`);
        }

        // --- DEFAULT: INTERACTIVE DISPLAY ---
        const inventory = await database.getHydratedInventory(message.author.id);
        const characters = inventory.filter(i => i.type === 'character' || !i.type);

        const createEmbed = () => {
            const embed = new EmbedBuilder()
                .setColor(colors.primary)
                .setTitle(`🛡️ ${message.author.username}'s Battle Team`)
                .setDescription("Manage your squad composition below! (｡♥‿♥｡)");

            for (let i = 0; i < 4; i++) {
                const charName = userData.team[i];
                const charData = charName ? characters.find(c => c.name === charName) : null;
                const star = charData ? (charData.rarity === 5 ? '🟡' : '🟣') : '';
                
                embed.addFields({
                    name: `Slot ${i + 1}`,
                    value: charName ? `${star} **${charName}**` : "*Empty Slot*",
                    inline: true
                });
            }

            if (userData.team.length > 0) {
                const firstChar = characters.find(c => c.name === userData.team[0]);
                if (firstChar) embed.setThumbnail(getCharacterIcon(firstChar));
            }

            return embed;
        };

        const createButtons = () => {
            const row = new ActionRowBuilder();
            for (let i = 0; i < 4; i++) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`remove_${i + 1}`)
                        .setLabel(`Clear Slot ${i + 1}`)
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(!userData.team[i])
                );
            }
            return [row];
        };

        const msg = await message.reply({ embeds: [createEmbed()], components: userData.team.length > 0 ? createButtons() : [] });
        
        if (userData.team.length > 0) {
            const collector = msg.createMessageComponentCollector({ time: 60000 });

            collector.on('collect', async i => {
                if (i.user.id !== message.author.id) return i.reply({ content: "This isn't your squad, darling! (っ˘ω˘ς)", ephemeral: true });

                const slot = parseInt(i.customId.split('_')[1]);
                userData.team.splice(slot - 1, 1);
                await database.saveUser(userData);

                await i.update({ embeds: [createEmbed()], components: userData.team.length > 0 ? createButtons() : [] });
            });

            collector.on('end', () => {
                msg.edit({ components: [] }).catch(() => {});
            });
        }
    }
};
