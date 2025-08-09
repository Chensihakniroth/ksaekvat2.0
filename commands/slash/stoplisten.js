const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const LISTENERS_FILE = path.join(__dirname, '../../data/listeners.json');

function loadListeners() {
    try {
        if (!fs.existsSync(LISTENERS_FILE)) {
            return {};
        }
        return JSON.parse(fs.readFileSync(LISTENERS_FILE, 'utf8'));
    } catch (error) {
        return {};
    }
}

function saveListeners(data) {
    const dataDir = path.dirname(LISTENERS_FILE);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(LISTENERS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stoplis')
        .setDescription('Stop listening to messages')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const adminIDs = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => id.trim()) : [];
        
        if (!adminIDs.includes(interaction.user.id)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const listeners = loadListeners();
        
        if (listeners[interaction.user.id]) {
            // Remove this admin from listeners
            delete listeners[interaction.user.id];
            saveListeners(listeners);
            
            await interaction.reply({
                content: '✅ Stopped listening to messages.',
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: '❌ You are not currently listening to any user.',
                ephemeral: true
            });
        }
    }
};  