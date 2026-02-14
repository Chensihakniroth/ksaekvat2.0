const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
    name: 'blackjack',
    aliases: ['bj', '21'],
    description: 'Play a game of Blackjack and gamble your coins',
    usage: 'blackjack <amount/all>',
    cooldown: 5000,
    async execute(message, args, client) {
        if (args.length < 1) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ khos luy ai ah pov',
                    description: 'hg dak luy oy trov mer! 
**Usage:** `Kblackjack <amount/all>`',
                }]
            });
        }

        let betAmount;
        const userData = database.getUser(message.author.id);

        if (args[0].toLowerCase() === 'all') {
            const { maxBet } = config.gambling.blackjack;
            betAmount = Math.min(userData.balance, maxBet);
        } else {
            betAmount = parseInt(args[0]);
        }

        if (isNaN(betAmount) || betAmount <= 0) {
            return message.reply('hg dak luy oy trov mer!');
        }

        const { minBet, maxBet } = config.gambling.blackjack;
        if (betAmount < minBet || betAmount > maxBet) {
            return message.reply(`Bet must be between ${minBet} and ${maxBet} ${config.economy.currency}.`);
        }

        if (!database.hasBalance(message.author.id, betAmount)) {
            return message.reply('luy ort krub jak lbeng teh!');
        }

        // Remove bet
        database.removeBalance(message.author.id, betAmount);
        database.updateStats(message.author.id, 'gambled', betAmount);

        // Pre-determine outcome (50% win rate)
        const forcedWin = Math.random() < 0.5;

        const suits = ['♠️', '♥️', '♦️', '♣️'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

        function createCard() {
            const suit = suits[Math.floor(Math.random() * suits.length)];
            const value = values[Math.floor(Math.random() * values.length)];
            let score = parseInt(value);
            if (['J', 'Q', 'K'].includes(value)) score = 10;
            if (value === 'A') score = 11;
            return { display: `${value}${suit}`, score };
        }

        function calculateScore(hand) {
            let score = hand.reduce((sum, card) => sum + card.score, 0);
            let aces = hand.filter(card => card.display.startsWith('A')).length;
            while (score > 21 && aces > 0) {
                score -= 10;
                aces--;
            }
            return score;
        }

        let playerHand = [createCard(), createCard()];
        let dealerHand = [createCard(), createCard()];

        // Ensure no immediate blackjack for simplicity in forced outcome
        if (calculateScore(playerHand) === 21) playerHand[1] = createCard();
        if (calculateScore(dealerHand) === 21) dealerHand[1] = createCard();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('hit').setLabel('Hit').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('stand').setLabel('Stand').setStyle(ButtonStyle.Secondary),
            );

        const getEmbed = (isFinal = false) => {
            const playerScore = calculateScore(playerHand);
            const dealerScore = isFinal ? calculateScore(dealerHand) : '??';
            const dealerDisplay = isFinal ? dealerHand.map(c => c.display).join(' ') : `${dealerHand[0].display} 🎴`;

            return new EmbedBuilder()
                .setColor(isFinal ? (playerScore > 21 || (dealerScore <= 21 && dealerScore > playerScore) ? colors.error : colors.success) : colors.primary)
                .setTitle('🃏 Blackjack')
                .addFields(
                    { name: `Dealer: ${dealerScore}`, value: dealerDisplay, inline: true },
                    { name: `You: ${playerScore}`, value: playerHand.map(c => c.display).join(' '), inline: true }
                )
                .setFooter({ text: `Bet: ${betAmount.toLocaleString()} riel` });
        };

        const gameMessage = await message.reply({ embeds: [getEmbed()], components: [row] });

        const collector = gameMessage.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 30000,
            componentType: ComponentType.Button
        });

        collector.on('collect', async i => {
            if (i.customId === 'hit') {
                playerHand.push(createCard());
                const score = calculateScore(playerHand);
                
                if (score > 21) {
                    collector.stop('bust');
                } else {
                    await i.update({ embeds: [getEmbed()] });
                }
            } else if (i.customId === 'stand') {
                collector.stop('stand');
            }
        });

        collector.on('end', async (collected, reason) => {
            let playerScore = calculateScore(playerHand);
            
            // Dealer logic based on forced outcome
            if (reason === 'stand') {
                if (forcedWin) {
                    // Dealer must lose: either bust or stay lower
                    while (calculateScore(dealerHand) < 17 || (calculateScore(dealerHand) <= playerScore && calculateScore(dealerHand) < 21)) {
                        dealerHand.push(createCard());
                        if (calculateScore(dealerHand) > 21) break;
                        // If dealer about to win but forced to lose, stop or try to bust
                        if (calculateScore(dealerHand) > playerScore && calculateScore(dealerHand) <= 21) {
                            // High chance to "oops" and bust or just stop if plausible
                            if (Math.random() < 0.7) {
                                dealerHand.push({ display: 'K♥️', score: 10 }); // Force bust
                                break;
                            }
                        }
                    }
                } else {
                    // Dealer must win: hit until beating player
                    while (calculateScore(dealerHand) <= playerScore && calculateScore(dealerHand) < 21) {
                        dealerHand.push(createCard());
                        if (calculateScore(dealerHand) > 21) {
                            // If dealer busts but forced to win, "rig" the last card
                            dealerHand.pop();
                            const needed = playerScore + 1 - calculateScore(dealerHand);
                            if (needed <= 11) {
                                dealerHand.push({ display: 'A♥️', score: needed }); 
                            }
                            break;
                        }
                    }
                }
            }

            const finalPlayerScore = calculateScore(playerHand);
            const finalDealerScore = calculateScore(dealerHand);
            
            let result;
            let winMultiplier = 0;

            if (finalPlayerScore > 21) {
                result = 'Bust! Os luy hz ah pov.';
            } else if (finalDealerScore > 21 || finalPlayerScore > finalDealerScore) {
                result = 'You Win! Tos pherk!';
                winMultiplier = 2;
            } else if (finalPlayerScore === finalDealerScore) {
                result = 'Push! Pherk sra tirk ey?';
                winMultiplier = 1;
            } else {
                result = 'Dealer Wins! Os luy hz.';
            }

            if (winMultiplier > 0) {
                const winTotal = Math.floor(betAmount * winMultiplier);
                database.addBalance(message.author.id, winTotal);
                if (winMultiplier > 1) database.updateStats(message.author.id, 'won', betAmount);
            } else {
                database.updateStats(message.author.id, 'lost', betAmount);
            }

            const finalEmbed = getEmbed(true);
            finalEmbed.setDescription(`**${result}**`);
            
            await gameMessage.edit({ embeds: [finalEmbed], components: [] });
        });
    }
};