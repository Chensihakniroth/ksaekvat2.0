const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const TALK_TARGETS_FILE = path.join(__dirname, '../../data/talktargets.json');

// Ensure data directory exists
const dataDir = path.dirname(TALK_TARGETS_FILE);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize file if it doesn't exist
if (!fs.existsSync(TALK_TARGETS_FILE)) {
    fs.writeFileSync(TALK_TARGETS_FILE, JSON.stringify({}), 'utf8');
}

function loadTalkTargets() {
    try {
        return JSON.parse(fs.readFileSync(TALK_TARGETS_FILE, 'utf8'));
    } catch (error) {
        return {};
    }
}

function saveTalkTargets(data) {
    fs.writeFileSync(TALK_TARGETS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('talk')
        .setDescription('Set target server and channel for DM forwarding')
        .addStringOption(option =>
            option.setName('server_id')
                .setDescription('The server ID')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('channel_id')
                .setDescription('The channel ID')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const adminIDs = [
    process.env.ADMIN_ID_1,
    process.env.ADMIN_ID_2
].filter(id => id); // This removes any undefined values
        
        if (!adminIDs.includes(interaction.user.id)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const serverId = interaction.options.getString('server_id');
        const channelId = interaction.options.getString('channel_id');
        
        try {
            // Validate server exists
            const guild = await interaction.client.guilds.fetch(serverId);
            
            // Validate channel exists and is text-based
            const channel = await guild.channels.fetch(channelId);
            
            if (!channel.isTextBased()) {
                return interaction.reply({
                    content: '❌ The specified channel is not a text channel.',
                    ephemeral: true
                });
            }
            
            // Load current talk targets
            const talkTargets = loadTalkTargets();
            
            // Set this admin's talk target
            talkTargets[interaction.user.id] = {
                serverId: serverId,
                channelId: channelId
            };
            
            // Save updated talk targets
            saveTalkTargets(talkTargets);
            
            await interaction.reply({
                content: `✅ DM forwarding set to **${guild.name}** → **#${channel.name}**. Send me DMs and I'll forward them to that channel.`,
                ephemeral: true
            });
            
        } catch (error) {
            await interaction.reply({
                content: `❌ Could not find server (${serverId}) or channel (${channelId}). Make sure the bot is in the server and has access to the channel.`,
                ephemeral: true
            });
        }
    }
};