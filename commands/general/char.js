const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');

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
    name: 'char',
    aliases: ['character', 'viewchar', 'detail'],
    description: 'View details and manually ascend your characters!',
    usage: 'char [name]',
    async execute(message, args, client) {
        const userData = database.getUser(message.author.id);
        const inventory = userData.gacha_inventory || [];
        const characters = inventory.filter(i => i.type === 'character' || !i.type);

        if (characters.length === 0) {
            return message.reply("💸 hg ot mean character teat! Use `Kgacha` pull mork. (｡•́︿•̀｡)");
        }

        // Search for a character if name provided
        const searchName = args.join(' ').toLowerCase();
        let selectedChar = null;
        if (searchName) {
            selectedChar = characters.find(c => c.name.toLowerCase().includes(searchName));
        }

        const renderCharacter = (char) => {
            const star = char.rarity === 5 ? '🔶' : (char.rarity === 4 ? '🔷' : '⚪');
            const game = char.game?.toUpperCase() || "UNKNOWN";
            
            // Stats based on rarity and ascension
            const ascension = char.ascension || 0;
            const hp = (char.rarity * 50) + (ascension * 100) + 200;
            const atk = (char.rarity * 15) + (ascension * 30) + 50;
            const def = (char.rarity * 10) + (ascension * 20) + 30;

            const duplicateCount = characters.filter(c => c.name === char.name).length - 1;

            const embed = new EmbedBuilder()
                .setColor(char.rarity === 5 ? '#FFB13F' : '#A256FF')
                .setTitle(`${star} ${char.name} (Ascension ${ascension})`)
                .setDescription(`\`[${game}]\` - Character Details`)
                .addFields(
                    { name: '❤️ HP', value: `\`${hp}\``, inline: true },
                    { name: '⚔️ ATK', value: `\`${atk}\``, inline: true },
                    { name: '🛡️ DEF', value: `\`${def}\``, inline: true },
                    { name: '✨ Duplicates Available', value: `\`${duplicateCount}\``, inline: false }
                )
                .setImage(getSplashArt(char))
                .setFooter({ text: `Use the button below to ascend if you have duplicates!` });

            return { embed, duplicateCount };
        };

        if (selectedChar) {
            const { embed, duplicateCount } = renderCharacter(selectedChar);
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`ascend_${selectedChar.name}`)
                    .setLabel('Manual Ascension')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(duplicateCount === 0 || selectedChar.ascension >= 6)
            );

            const msg = await message.reply({ embeds: [embed], components: [row] });
            const collector = msg.createMessageComponentCollector({ time: 60000 });

            collector.on('collect', async i => {
                if (i.user.id !== message.author.id) return i.reply({ content: "hg ot torm krorng heh!", ephemeral: true });

                if (i.customId.startsWith('ascend_')) {
                    // Manual Ascension Logic
                    const inventory = userData.gacha_inventory;
                    // Find index of the duplicate to remove
                    const duplicateIndex = inventory.findIndex(c => c.name === selectedChar.name && c !== selectedChar);
                    
                    if (duplicateIndex !== -1) {
                        inventory.splice(duplicateIndex, 1);
                        selectedChar.ascension = (selectedChar.ascension || 0) + 1;
                        database.saveUser(userData);
                        
                        const { embed: newEmbed, duplicateCount: newCount } = renderCharacter(selectedChar);
                        const newRow = new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId(`ascend_${selectedChar.name}`)
                                .setLabel('Ascension Success!')
                                .setStyle(ButtonStyle.Success)
                                .setDisabled(newCount === 0 || selectedChar.ascension >= 6)
                        );
                        
                        await i.update({ embeds: [newEmbed], components: [newRow] });
                        message.channel.send(`✨ **${selectedChar.name}** ascended to level **${selectedChar.ascension}**! (ﾉ´ヮ\`)ﾉ*:･ﾟ✧`);
                    }
                }
            });

            return;
        }

        // If no character selected, show a menu of unique characters
        const uniqueChars = [];
        const seen = new Set();
        for (const c of characters) {
            if (!seen.has(c.name)) {
                uniqueChars.push(c);
                seen.add(c.name);
            }
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_char')
            .setPlaceholder('Choose a character to view...')
            .addOptions(uniqueChars.slice(0, 25).map(c => ({
                label: c.name,
                description: `${c.rarity}★ - ${c.game.toUpperCase()}`,
                value: c.name,
                emoji: c.emoji
            })));

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const listEmbed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle("👤 Character Manifest")
            .setDescription("hg jong look character na? Use menu khang krom der! (◕‿◕✿)");

        const msg = await message.reply({ embeds: [listEmbed], components: [row] });

        const collector = msg.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async i => {
            if (i.user.id !== message.author.id) return i.reply({ content: "hg ot torm krorng heh!", ephemeral: true });

            if (i.customId === 'select_char') {
                const charName = i.values[0];
                const char = characters.find(c => c.name === charName);
                const { embed, duplicateCount } = renderCharacter(char);
                
                const actionRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`ascend_${char.name}`)
                        .setLabel('Manual Ascension')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(duplicateCount === 0 || char.ascension >= 6)
                );

                await i.update({ embeds: [embed], components: [actionRow] });
            }

            if (i.customId.startsWith('ascend_')) {
                const charName = i.customId.split('_')[1];
                const inventory = userData.gacha_inventory;
                const char = inventory.find(c => c.name === charName && (c.type === 'character' || !c.type));
                const duplicateIndex = inventory.findIndex(c => c.name === charName && c !== char);
                
                if (duplicateIndex !== -1) {
                    inventory.splice(duplicateIndex, 1);
                    char.ascension = (char.ascension || 0) + 1;
                    database.saveUser(userData);
                    
                    const { embed: newEmbed, duplicateCount: newCount } = renderCharacter(char);
                    const newRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`ascend_${char.name}`)
                            .setLabel('Ascension Success!')
                            .setStyle(ButtonStyle.Success)
                            .setDisabled(newCount === 0 || char.ascension >= 6)
                    );
                    
                    await i.update({ embeds: [newEmbed], components: [newRow] });
                    message.channel.send(`✨ **${char.name}** ascended to level **${char.ascension}**! (ﾉ´ヮ\`)ﾉ*:･ﾟ✧`);
                }
            }
        });
    }
};