const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const isAdmin = require('../../utils/adminCheck');

const LISTENERS_FILE = path.join(__dirname, '../../data/listeners.json');

// Data handling functions
function loadListeners() {
    try {
        if (!fs.existsSync(LISTENERS_FILE)) {
            return {};
        }
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
        .setName('stoplisten')
        .setDescription('[Admin] Stop monitoring messages from previously tracked user')
        .setDefaultMemberPermissions('0'),

    async execute(interaction) {
        if (typeof isAdmin !== 'function' || !isAdmin(interaction.user.id)) {
            return interaction.reply({
                content: '⛔ This command is restricted to bot administrators.',
                flags: [4096]
            });
        }

        try {
            const listeners = loadListeners();
            
            if (listeners[interaction.user.id]) {
                const removedUserId = listeners[interaction.user.id];
                delete listeners[interaction.user.id];
                saveListeners(listeners);

                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Monitoring Stopped')
                    .setDescription('You will no longer receive notifications for this user')
                    .addFields(
                        { name: 'Stopped Tracking', value: `<@${removedUserId}>`, inline: true },
                        { name: 'User ID', value: removedUserId, inline: true }
                    )
                    

                await interaction.reply({ embeds: [embed], flags: [4096] });
            } else {
                await interaction.reply({
                    content: 'ℹ️ You were not currently monitoring any user.',
                    flags: [4096]
                });
            }
        } catch (error) {
            console.error('Stoplisten command error:', error);
            
            const errorMessage = '❌ An error occurred while stopping monitoring';

            if (!interaction.replied) {
                await interaction.reply({
                    content: errorMessage,
                    flags: [4096]
                });
            }
        }
    }
};



