"use strict";
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, AttachmentBuilder, } = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
const { getCharacterIcon, getItemEmoji, getRarityEmoji, getElementEmoji } = require('../../utils/images.js');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const sharp = require('sharp');
const Jimp = require('jimp');
const TEMP_DIR = path.join(__dirname, '..', '..', '.tmp');
// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}
const { ImageGenerationService } = require('../../services/ImageGenerationService');
module.exports = {
    name: 'team',
    aliases: ['kteam', 'squad'],
    description: 'Manage your beautiful battle team! (4 Slots) ✨',
    usage: 'team [add <name> | remove <slot>]',
    async execute(message, args, client) {
        let userData = await database.getUser(message.author.id, message.author.username);
        if (!userData.team)
            userData.team = [];
        const sub = args[0]?.toLowerCase();
        // Helper to find a character in inventory
        const findCharacter = async (name) => {
            const inventory = await database.getHydratedInventory(message.author.id);
            return inventory.find((c) => (c.type === 'character' || !c.type) && c.name.toLowerCase().includes(name.toLowerCase()));
        };
        // --- SUBCOMMAND: ADD ---
        if (sub === 'add') {
            const charName = args.slice(1).join(' ');
            if (!charName)
                return message.reply('❓ Who should Mommy add? Example: `kteam add Raiden` (｡♥‿♥｡)');
            if (userData.team.length >= 4)
                return message.reply('🚫 Your squad is already full! Remove someone first. (っ˘ω˘ς)');
            const found = await findCharacter(charName);
            if (!found)
                return message.reply(`❌ You don't have **${charName}** in your collection yet!`);
            if (userData.team.includes(found.name))
                return message.reply('🚫 They are already in your team! (◕‿◕✿)');
            userData.team.push(found.name);
            await database.saveUser(userData);
            return message.reply(`✅ Added **${found.name}** to your squad! (ﾉ´ヮ\`)ﾉ*:･ﾟ✧`);
        }
        // --- SUBCOMMAND: REMOVE ---
        if (sub === 'remove') {
            const slot = parseInt(args[1]);
            if (isNaN(slot) || slot < 1 || slot > 4)
                return message.reply(`❓ Which slot should Mommy clear? (1-4)`);
            if (slot > userData.team.length)
                return message.reply('🚫 That slot is already empty! (｡•́︿•̀｡)');
            const removed = userData.team.splice(slot - 1, 1);
            await database.saveUser(userData);
            return message.reply(`✅ Removed **${removed[0]}** from your team! (っ˘ω˘ς)`);
        }
        // --- DEFAULT: INTERACTIVE DISPLAY ---
        message.channel.sendTyping();
        const inventory = await database.getHydratedInventory(message.author.id);
        const characters = inventory.filter((i) => i.type === 'character' || !i.type);
        const teamCharacters = userData.team
            .map((name) => characters.find((c) => c.name === name))
            .filter(Boolean);
        const imagePath = await createTeamImage(userData, teamCharacters);
        const createEmbed = () => {
            const filledSlots = userData.team.length;
            const embed = new EmbedBuilder()
                .setColor(colors.primary)
                .setTitle(`🛡️ ${message.author.username}'s Elite Squad`)
                .setDescription(`**Team Status:** ${filledSlots}/4 Slots Deployed\n*Manage your battlefield composition below!* (｡♥‿♥｡)`)
                .setFooter({ text: 'Use buttons below to easily manage your team slots!' });
            let compText = '';
            for (let i = 0; i < 4; i++) {
                const charName = userData.team[i];
                const charData = charName ? characters.find((c) => c.name === charName) : null;
                if (charData) {
                    const charEmoji = getItemEmoji(charData, client);
                    const elementEmoji = getElementEmoji(charData, client);
                    compText += `**Slot ${i + 1}:** ${elementEmoji} ${charEmoji} **${charName}**\n`;
                }
                else {
                    compText += `**Slot ${i + 1}:** \`[ Empty Slot ]\`\n`;
                }
            }
            embed.addFields({
                name: '❖ Squad Composition',
                value: compText,
                inline: false,
            });
            if (imagePath) {
                embed.setImage('attachment://squad-banner.png');
            }
            return embed;
        };
        const createButtons = () => {
            const btns = [];
            const row = new ActionRowBuilder();
            const filledSlots = userData.team.length;
            for (let i = 0; i < 4; i++) {
                const emojiNum = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'][i];
                const isSlotFilled = i < filledSlots && !!userData.team[i];
                row.addComponents(new ButtonBuilder()
                    .setCustomId(`team_pop_${i + 1}`)
                    .setLabel(isSlotFilled ? `Clear Slot ${i + 1}` : `Slot ${i + 1} Empty`)
                    .setEmoji(emojiNum)
                    .setStyle(isSlotFilled ? ButtonStyle.Danger : ButtonStyle.Secondary)
                    .setDisabled(!isSlotFilled));
            }
            btns.push(row);
            // Add a helpful button
            const helpRow = new ActionRowBuilder().addComponents(new ButtonBuilder()
                .setCustomId('team_help_btn')
                .setLabel('How to Add Characters')
                .setEmoji('ℹ️')
                .setStyle(ButtonStyle.Primary));
            btns.push(helpRow);
            return btns;
        };
        const files = [];
        if (imagePath) {
            files.push(new AttachmentBuilder(imagePath, { name: 'squad-banner.png' }));
        }
        const msg = await message.reply({
            embeds: [createEmbed()],
            components: createButtons(),
            files: files,
        });
        if (imagePath) {
            setTimeout(() => {
                fs.unlink(imagePath, (err) => {
                    if (err)
                        console.error(`Failed to delete temp image: ${imagePath}`, err);
                });
            }, 5000); // Wait a bit before cleanup so Discord attachments send first
        }
        const collector = msg.createMessageComponentCollector({ time: 60000 });
        collector.on('collect', async (i) => {
            if (i.user.id !== message.author.id)
                return i.reply({
                    content: "This isn't your squad, darling! (っ˘ω˘ς)",
                    flags: [MessageFlags.Ephemeral],
                });
            if (i.customId === 'team_help_btn') {
                return i.reply({
                    content: "**(◕‿◕✿) Mommy's Team Guide:**\nTo add someone to an empty slot, just use the command: \`kteam add <name>\`\nExample: \`kteam add Raiden\`\n\nYou can only have 4 characters in your squad!",
                    flags: [MessageFlags.Ephemeral]
                });
            }
            if (i.customId.startsWith('team_pop_')) {
                const slot = parseInt(i.customId.replace('team_pop_', ''));
                if (slot > userData.team.length || !userData.team[slot - 1]) {
                    return i.reply({ content: "That slot is already empty!", flags: [MessageFlags.Ephemeral] });
                }
                const remName = userData.team[slot - 1];
                userData.team.splice(slot - 1, 1);
                await database.saveUser(userData);
                const newTeamChars = userData.team
                    .map((name) => characters.find((c) => c.name === name))
                    .filter(Boolean);
                const newImagePath = await createTeamImage(userData, newTeamChars);
                const newFiles = [];
                if (newImagePath) {
                    newFiles.push(new AttachmentBuilder(newImagePath, { name: 'squad-banner.png' }));
                }
                await i.update({
                    embeds: [createEmbed()],
                    components: createButtons(),
                    files: newFiles,
                });
                if (newImagePath) {
                    setTimeout(() => {
                        fs.unlink(newImagePath, (err) => {
                            if (err)
                                console.error(`Failed to delete temp image: ${newImagePath}`, err);
                        });
                    }, 5000);
                }
                // Send notification message of removal
                message.channel.send(`Removed **${remName}** from the squad!`);
            }
        });
        collector.on('end', () => {
            msg.edit({ components: [] }).catch(() => { });
        });
    },
};
