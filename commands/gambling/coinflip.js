const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
    name: 'coinflip',
    aliases: ['cf', 'flip'],
    description: 'Flip a coin and gamble your coins',
    usage: 'coinflip <amount> [heads/tails]',
    cooldown: 3000, // 3 seconds
    execute(message, args, client) {
        // Check arguments
        if (args.length < 1) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ Invalid Usage',
                    description: 'Please provide a bet amount!\n**Usage:** `Kcoinflip <amount> [heads/tails]`\n**Example:** `Kcf 1000 heads`',
                    timestamp: new Date()
                }]
            });
        }

        // Parse bet amount
        let betAmount = parseInt(args[0]);
        if (isNaN(betAmount) || betAmount <= 0) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ Invalid Bet Amount',
                    description: 'Please provide a valid positive number.',
                    timestamp: new Date()
                }]
            });
        }

        // Check min/max bet
        const { minBet, maxBet } = config.gambling.coinflip;
        if (betAmount < minBet || betAmount > maxBet) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '💸 Invalid Bet Range',
                    description: `Bet amount must be between **${minBet.toLocaleString()}** and **${maxBet.toLocaleString()}** ${config.economy.currency}.`,
                    timestamp: new Date()
                }]
            });
        }

        // Check if user has enough balance
        if (!database.hasBalance(message.author.id, betAmount)) {
            const userData = database.getUser(message.author.id);
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '💸 Insufficient Funds',
                    description: `You don't have enough ${config.economy.currency}!\n**Your Balance:** ${userData.balance.toLocaleString()} ${config.economy.currency}\n**Required:** ${betAmount.toLocaleString()} ${config.economy.currency}`,
                    timestamp: new Date()
                }]
            });
        }

        // Get user's choice (heads or tails)
        let userChoice = 'heads'; // default
        if (args.length > 1) {
            const choice = args[1].toLowerCase();
            if (choice === 'tails' || choice === 't') {
                userChoice = 'tails';
            } else if (choice === 'heads' || choice === 'h') {
                userChoice = 'heads';
            }
        }

        // Remove bet amount from user's balance
        database.removeBalance(message.author.id, betAmount);
        database.updateStats(message.author.id, 'gambled', betAmount);

        // Animation frames for spinning coin
        const frames = ['🪙', '⚪', '🪙', '⚪', '🪙', '⚪', '🪙'];
        let frameIndex = 0;

        const embed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle('🪙 Coinflip Game')
            .setDescription(`**Bet Amount:** ${betAmount.toLocaleString()} ${config.economy.currency}\n**Your Choice:** ${userChoice.charAt(0).toUpperCase() + userChoice.slice(1)}\n\n${frames[0]} **Flipping coin...**`)
            .setFooter({ 
                text: `${message.author.username} is gambling`,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp();

        message.reply({ embeds: [embed] }).then(async (sentMessage) => {
            // Animate the spinning coin
            for (let i = 0; i < 6; i++) {
                await new Promise(resolve => setTimeout(resolve, 150));
                frameIndex = (frameIndex + 1) % frames.length;
                
                const animationEmbed = new EmbedBuilder()
                    .setColor(colors.primary)
                    .setTitle('🪙 Coinflip Game')
                    .setDescription(`**Bet Amount:** ${betAmount.toLocaleString()} ${config.economy.currency}\n**Your Choice:** ${userChoice.charAt(0).toUpperCase() + userChoice.slice(1)}\n\n${frames[frameIndex]} **Flipping coin...**`)
                    .setFooter({ 
                        text: `${message.author.username} is gambling`,
                        iconURL: message.author.displayAvatarURL()
                    })
                    .setTimestamp();

                try {
                    await sentMessage.edit({ embeds: [animationEmbed] });
                } catch (error) {
                    // Message might be deleted, stop animation
                    return;
                }
            }

            // Determine result
            const coinResult = Math.random() < 0.5 ? 'heads' : 'tails';
            const won = coinResult === userChoice;
            const resultEmoji = coinResult === 'heads' ? '🟡' : '⚪';

            let finalEmbed;
            
            if (won) {
                // User won - double their money
                const winAmount = betAmount * 2;
                const newBalance = database.addBalance(message.author.id, winAmount);
                database.updateStats(message.author.id, 'won', betAmount);
                
                // Add experience for winning
                const expGain = database.addExperience(message.author.id, 20);

                finalEmbed = new EmbedBuilder()
                    .setColor(colors.success)
                    .setTitle('🎉 You Won!')
                    .setDescription(`${resultEmoji} The coin landed on **${coinResult}**!\nYou guessed correctly!`)
                    .addFields(
                        {
                            name: '💰 Winnings',
                            value: `+${winAmount.toLocaleString()} ${config.economy.currency}`,
                            inline: true
                        },
                        {
                            name: '💳 New Balance',
                            value: `${newBalance.toLocaleString()} ${config.economy.currency}`,
                            inline: true
                        },
                        {
                            name: '⭐ XP Gained',
                            value: '+20 XP',
                            inline: true
                        }
                    );

                if (expGain.leveledUp) {
                    finalEmbed.addFields({
                        name: '🎉 Level Up!',
                        value: `Congratulations! You reached level **${expGain.newLevel}**!`,
                        inline: false
                    });
                }
            } else {
                // User lost
                const userData = database.getUser(message.author.id);
                database.updateStats(message.author.id, 'lost', betAmount);

                finalEmbed = new EmbedBuilder()
                    .setColor(colors.error)
                    .setTitle('💸 You Lost!')
                    .setDescription(`${resultEmoji} The coin landed on **${coinResult}**.\nBetter luck next time!`)
                    .addFields(
                        {
                            name: '💸 Lost',
                            value: `-${betAmount.toLocaleString()} ${config.economy.currency}`,
                            inline: true
                        },
                        {
                            name: '💳 Remaining Balance',
                            value: `${userData.balance.toLocaleString()} ${config.economy.currency}`,
                            inline: true
                        },
                        {
                            name: '🎯 Win Rate',
                            value: '50% chance',
                            inline: true
                        }
                    );
            }

            finalEmbed.setFooter({ 
                text: `Game completed | Your choice: ${userChoice}`,
                iconURL: message.author.displayAvatarURL()
            }).setTimestamp();

            // Update command usage statistics
            database.updateStats(message.author.id, 'command');

            try {
                await sentMessage.edit({ embeds: [finalEmbed] });
            } catch (error) {
                // Message might be deleted
                message.channel.send({ embeds: [finalEmbed] });
            }
        }).catch(error => {
            console.error('Error in coinflip animation:', error);
        });
    }
};
