const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const LISTENERS_FILE = path.join(__dirname, '../../data/listeners.json');

// Ensure data directory exists
const dataDir = path.dirname(LISTENERS_FILE);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize file if it doesn't exist
if (!fs.existsSync(LISTENERS_FILE)) {
    fs.writeFileSync(LISTENERS_FILE, JSON.stringify({}), 'utf8');
}

function loadListeners() {
    try {
        return JSON.parse(fs.readFileSync(LISTENERS_FILE, 'utf8'));
    } catch (error) {
        return {};
    }
}

function saveListeners(data) {
    fs.writeFileSync(LISTENERS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listen')
        .setDescription('Start listening to all messages from a specific user')
        .addStringOption(option =>
            option.setName('target_user_id')
                .setDescription('The user ID to listen to')
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

        const targetUserId = interaction.options.getString('target_user_id');
        
        try {
            // Validate user exists
            const targetUser = await interaction.client.users.fetch(targetUserId);
            
            // Load current listeners
            const listeners = loadListeners();
            
            // Set this admin to listen to the target user
            listeners[interaction.user.id] = targetUserId;
            
            // Save updated listeners
            saveListeners(listeners);
            
            await interaction.reply({
                content: `✅ Now listening to messages from **${targetUser.username}** (${targetUserId}). You will receive DMs when they send messages in any server where the bot is present.`,
                ephemeral: true
            });
            
        } catch (error) {
            await interaction.reply({
                content: `❌ Could not find user with ID: ${targetUserId}. Please make sure the user ID is correct.`,
                ephemeral: true
            });
        }
    }
};