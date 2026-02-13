const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const isAdmin = require('../../utils/adminCheck');

const LISTENERS_FILE = path.join(__dirname, '../../data/listeners.json');

// Initialize data directory and file
function initDataFiles() {
    const dataDir = path.dirname(LISTENERS_FILE);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(LISTENERS_FILE)) {
        fs.writeFileSync(LISTENERS_FILE, '{}', 'utf8');
    }
}

// Data handling functions
function loadListeners() {
    try {
        if (!fs.existsSync(LISTENERS_FILE)) return {};
        const data = fs.readFileSync(LISTENERS_FILE, 'utf8');
        return JSON.parse(data) || {};
    } catch (error) {
        console.error('Error loading listeners:', error);
        return {};
    }
}

function saveListeners(data) {
    try {
        const dataDir = path.dirname(LISTENERS_FILE);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(LISTENERS_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Error saving listeners:', error);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listen')
        .setDescription('[Admin] Start listening to messages from a specific user')
        .addStringOption(option =>
            option.setName('target_user_id')
                .setDescription('The user ID to monitor')
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

        const targetUserId = interaction.options.getString('target_user_id').trim();
        
        if (!/^\d{17,20}$/.test(targetUserId)) {
            return interaction.reply({
                content: '❌ Invalid user ID format. Please provide a valid Discord user ID.',
                flags: [4096]
            });
        }

        try {
            const targetUser = await interaction.client.users.fetch(targetUserId);
            
            const listeners = loadListeners();
            listeners[interaction.user.id] = targetUserId;
            saveListeners(listeners);

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Listening Activated')
                .setDescription(`Now monitoring messages from **${targetUser.tag}**`)
                .addFields(
                    { name: 'User ID', value: targetUserId, inline: true },
                    { name: 'Notifications', value: 'You will receive DMs when this user sends messages', inline: true }
                )
                

            await interaction.reply({ embeds: [embed], flags: [4096] });
            
        } catch (error) {
            console.error('Listen command error:', error);
            
            let errorMessage = '❌ An error occurred while setting up listener.';
            if (error.code === 10013) {
                errorMessage = `❌ User with ID ${targetUserId} not found.`;
            }

            if (!interaction.replied) {
                await interaction.reply({
                    content: errorMessage,
                    flags: [4096]
                });
            }
        }
    }
};



