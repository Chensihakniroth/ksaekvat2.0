const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const isAdmin = require('../../utils/adminCheck');

const TALK_TARGETS_FILE = path.join(__dirname, '../../data/talktargets.json');

// Initialize data files
function initDataFiles() {
    const dataDir = path.dirname(TALK_TARGETS_FILE);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(TALK_TARGETS_FILE)) {
        fs.writeFileSync(TALK_TARGETS_FILE, '{}', 'utf8');
    }
}

// Data handling functions
function loadTalkTargets() {
    try {
        if (!fs.existsSync(TALK_TARGETS_FILE)) return {};
        const data = fs.readFileSync(TALK_TARGETS_FILE, 'utf8');
        return JSON.parse(data) || {};
    } catch (error) {
        console.error('Error loading talk targets:', error);
        return {};
    }
}

function saveTalkTargets(data) {
    try {
        const dataDir = path.dirname(TALK_TARGETS_FILE);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(TALK_TARGETS_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Error saving talk targets:', error);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('talk')
        .setDescription('[Admin] Set target channel for DM forwarding')
        .addStringOption(option =>
            option.setName('channel_id')
                .setDescription('The channel ID to forward DMs to')
                .setRequired(true))
        .setDefaultMemberPermissions('0'),

    async execute(interaction) {
        initDataFiles();

        if (typeof isAdmin !== 'function' || !isAdmin(interaction.user.id)) {
            return interaction.reply({
                content: '⛔ This command is restricted to bot administrators.',
                flags: [4096]
            });
        }

        const channelId = interaction.options.getString('channel_id').trim();
        
        if (!/^\d{17,20}$/.test(channelId)) {
            return interaction.reply({
                content: '❌ Invalid channel ID format. Please provide a valid Discord channel ID.',
                flags: [4096]
            });
        }

        try {
            const channel = await interaction.client.channels.fetch(channelId);
            
            if (!channel.isTextBased()) {
                return interaction.reply({
                    content: '❌ The specified channel is not a text channel.',
                    flags: [4096]
                });
            }
            
            const permissions = channel.permissionsFor(interaction.client.user);
            if (!permissions.has('SendMessages')) {
                return interaction.reply({
                    content: '❌ I don\'t have permission to send messages in that channel.',
                    flags: [4096]
                });
            }

            const talkTargets = loadTalkTargets();
            talkTargets[interaction.user.id] = {
                channelId: channelId,
                serverId: channel.guild?.id || 'DM',
                setAt: new Date().toISOString()
            };
            saveTalkTargets(talkTargets);

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ DM Forwarding Configured')
                .setDescription(`Your DMs will now be forwarded to:\n${channel.toString()}`)
                .addFields(
                    { name: 'Server', value: channel.guild?.name || 'Direct Messages', inline: true },
                    { name: 'Channel', value: channel.name || 'Unknown', inline: true },
                    { name: 'Channel ID', value: channelId, inline: false }
                )
                
                

            await interaction.reply({ embeds: [embed], flags: [4096] });
            
        } catch (error) {
            console.error('Talk command error:', error);
            
            let errorMessage = '❌ An error occurred while configuring forwarding.';
            if (error.code === 10003) errorMessage = '❌ Channel not found. Please check the channel ID.';
            else if (error.code === 50001) errorMessage = '❌ I don\'t have access to that channel.';
            else if (error.code === 50013) errorMessage = '❌ Missing permissions to access that channel.';
            
            if (!interaction.replied) {
                await interaction.reply({ content: errorMessage, flags: [4096] });
            }
        }
    }
};



