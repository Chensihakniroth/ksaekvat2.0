const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const TALK_TARGETS_FILE = path.join(__dirname, '../../data/talktargets.json');

function loadTalkTargets() {
    try {
        if (!fs.existsSync(TALK_TARGETS_FILE)) {
            return {};
        }
        return JSON.parse(fs.readFileSync(TALK_TARGETS_FILE, 'utf8'));
    } catch (error) {
        return {};
    }
}

function saveTalkTargets(data) {
    const dataDir = path.dirname(TALK_TARGETS_FILE);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(TALK_TARGETS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stoptalk')
        .setDescription('Stop DM forwarding')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const adminIDs = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => id.trim()) : [];
        
        if (!adminIDs.includes(interaction.user.id)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const talkTargets = loadTalkTargets();
        
        if (talkTargets[interaction.user.id]) {
            // Remove this admin's talk target
            delete talkTargets[interaction.user.id];
            saveTalkTargets(talkTargets);
            
            await interaction.reply({
                content: '✅ Stopped DM forwarding.',
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: '❌ You do not have DM forwarding set up.',
                ephemeral: true
            });
        }
    }
};