const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
    name: 'rps',
    aliases: ['rockpaperscissors'],
    description: 'Play Rock Paper Scissors and gamble your coins',
    usage: 'rps <amount/all>',
    cooldown: 5000,
    async execute(message, args, client) {
        if (args.length < 1) {
            return message.reply("hg dak luy oy trov mer! 
**Usage:** `Krps <amount/all>`");
        }

        let betAmount;
        const userData = database.getUser(message.author.id);
        if (args[0].toLowerCase() === 'all') {
            betAmount = Math.min(userData.balance, config.gambling.rps.maxBet);
        } else {
            betAmount = parseInt(args[0]);
        }

        if (isNaN(betAmount) || betAmount <= 0) return message.reply("hg dak luy oy trov mer!");
        if (!database.hasBalance(message.author.id, betAmount)) return message.reply("💸 hg ot luy krub heh!");

        database.removeBalance(message.author.id, betAmount);
        database.updateStats(message.author.id, "gambled", betAmount);

        const choices = [
            { name: 'Rock', emoji: '🪨', beats: 'Scissors' },
            { name: 'Paper', emoji: '📜', beats: 'Rock' },
            { name: 'Scissors', emoji: '✂️', beats: 'Paper' }
        ];

        const embed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle('✊ Rock Paper Scissors')
            .setDescription(`**Bet:** ${betAmount.toLocaleString()} riel

Choose your weapon below!`)
            .setFooter({ text: 'You have 30 seconds to choose.' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('Rock').setLabel('Rock').setEmoji('🪨').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('Paper').setLabel('Paper').setEmoji('📜').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('Scissors').setLabel('Scissors').setEmoji('✂️').setStyle(ButtonStyle.Primary)
        );

        const gameMsg = await message.reply({ embeds: [embed], components: [row] });

        const collector = gameMsg.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 30000,
            max: 1
        });

        collector.on('collect', async i => {
            const userChoice = choices.find(c => c.name === i.customId);
            
            // Win Rate Logic: 1 out of 4 (25%)
            const forcedWin = Math.random() < 0.25;
            let botChoice;

            if (forcedWin) {
                // Bot must lose
                botChoice = choices.find(c => c.name === userChoice.beats);
            } else {
                // Bot will likely win or draw
                if (Math.random() < 0.5) {
                    // Bot wins
                    botChoice = choices.find(c => c.beats === userChoice.name);
                } else {
                    // Draw or Random (still low win rate for player)
                    botChoice = choices[Math.floor(Math.random() * choices.length)];
                }
            }

            let result;
            let winMultiplier = 0;

            if (userChoice.name === botChoice.name) {
                result = "It's a Draw! 🤝";
                winMultiplier = 1;
            } else if (userChoice.beats === botChoice.name) {
                result = "You Won! 🎉";
                winMultiplier = 2;
            } else {
                result = "You Lost! 💀";
                winMultiplier = 0;
            }

            if (winMultiplier > 0) {
                database.addBalance(message.author.id, Math.floor(betAmount * winMultiplier));
                if (winMultiplier > 1) {
                    database.updateStats(message.author.id, 'won', betAmount);
                    database.updateStats(message.author.id, 'rps_win', 1);
                }
            } else {
                database.updateStats(message.author.id, 'lost', betAmount);
            }

            const finalEmbed = new EmbedBuilder()
                .setColor(winMultiplier > 1 ? colors.success : (winMultiplier === 1 ? colors.warning : colors.error))
                .setTitle('✊ RPS Result')
                .setDescription(`**${result}**

**You:** ${userChoice.emoji} ${userChoice.name}
**Bot:** ${botChoice.emoji} ${botChoice.name}`)
                .addFields({ name: 'Loot', value: winMultiplier > 1 ? `+${betAmount.toLocaleString()} riel` : (winMultiplier === 1 ? '0 riel (Refunded)' : `-${betAmount.toLocaleString()} riel`) });

            await i.update({ embeds: [finalEmbed], components: [] });
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                await gameMsg.edit({ content: '⌛ Time expired! Bet lost.', embeds: [], components: [] });
            }
        });
    }
};