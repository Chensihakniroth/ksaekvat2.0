const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cleardm')
        .setDescription('Clear messages from DM with the bot')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (1-100, default: 10)')
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Check admin permissions using your exact Railway variable names
        const adminIDs = [
            process.env.ADMIN_ID_1,
            process.env.ADMIN_ID_2
        ].filter(Boolean);
        
        if (!adminIDs.includes(interaction.user.id)) {
            return interaction.reply({
                content: '⛔ You do not have permission to use this command.',
                ephemeral: true
            });
        }

        // Check if this is being used in DMs
        if (interaction.channel.type !== ChannelType.DM) {
            return interaction.reply({
                content: '❌ This command can only be used in DMs with the bot.',
                ephemeral: true
            });
        }

        const amount = interaction.options.getInteger('amount') || 10;
        
        try {
            await interaction.deferReply({ ephemeral: true });
            
            // Fetch messages from the DM channel
            const messages = await interaction.channel.messages.fetch({ 
                limit: Math.min(amount + 1, 100)
            });
            
            const deletableMessages = messages.filter(m => 
                !(m.interaction && m.interaction.id === interaction.id)
            );
            
            // Delete messages
            let deletedCount = 0;
            for (const message of deletableMessages.values()) {
                try {
                    await message.delete();
                    deletedCount++;
                    await new Promise(resolve => setTimeout(resolve, 250));
                } catch (error) {
                    console.log(`Couldn't delete message: ${error.message}`);
                }
            }
            
            // Prepare result message
            const resultMessage = deletedCount > 0
                ? `✅ Successfully cleared ${deletedCount} message(s) from this DM.`
                : '⚠️ No messages were found to delete.';
            
            const reply = await interaction.editReply({
                content: resultMessage
            });
            
            // Auto-delete the result message after 5 seconds
            setTimeout(() => {
                reply.delete().catch(console.error);
            }, 5000);
            
        } catch (error) {
            console.error('Error in cleardm command:', error);
            
            let errorMessage;
            if (error.code === 50013) {
                errorMessage = '❌ Missing permissions to delete messages.';
            } else if (error.code === 50034) {
                errorMessage = '❌ Cannot delete messages older than 14 days.';
            } else {
                errorMessage = '❌ An unexpected error occurred while clearing messages.';
            }
            
            try {
                await interaction.editReply({ content: errorMessage });
            } catch {
                await interaction.followUp({ 
                    content: errorMessage,
                    ephemeral: true 
                });
            }
        }
    }
};