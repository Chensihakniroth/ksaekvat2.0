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
                    description: 'hg dak luy oy trov mer! \n**Usage:** `Kblackjack <amount/all>`',
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
        if (betAmount < minBet || (maxBet && betAmount > maxBet)) {
            return message.reply(`Bet must be between ${minBet.toLocaleString()} and ${(maxBet || 'unlimited').toLocaleString()} ${config.economy.currency}.`);
        }

        if (!database.hasBalance(message.author.id, betAmount)) {
            return message.reply('luy ort krub jak lbeng teh!');
        }

        // Remove bet
        database.removeBalance(message.author.id, betAmount);
        database.updateStats(message.author.id, 'gambled', betAmount);

        // Deck Setup
        const suits = ['♠️', '♥️', '♦️', '♣️'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        let deck = [];
        for (const suit of suits) {
            for (const value of values) {
                deck.push({ display: `${value}${suit}`, value });
            }
        }
        // Shuffle
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        function drawCard() {
            return deck.pop();
        }

        function calculateScore(hand) {
            let score = 0;
            let aces = 0;
            for (const card of hand) {
                if (card.value === 'A') {
                    aces++;
                    score += 11;
                } else if (['J', 'Q', 'K'].includes(card.value)) {
                    score += 10;
                } else {
                    score += parseInt(card.value);
                }
            }
            while (score > 21 && aces > 0) {
                score -= 10;
                aces--;
            }
            return score;
        }

        // Bias Logic: To achieve 50% win rate naturally, we sometimes give the player a high-value start
        const shouldBias = Math.random() < 0.5;
        let playerHand = [drawCard(), drawCard()];
        let dealerHand = [drawCard(), drawCard()];

        if (shouldBias) {
            // If we want to nudge a win, ensure player starts with a strong hand (15-20)
            // This prevents "card pulling fatigue"
            let attempts = 0;
            while (calculateScore(playerHand) < 15 && attempts < 10) {
                // Return cards to deck and reshuffle would be complex, so we just redraw 
                // from the already shuffled deck for the start
                playerHand = [drawCard(), drawCard()];
                attempts++;
            }
        }

        const getEmbed = (isFinal = false) => {
            const playerScore = calculateScore(playerHand);
            const dealerScore = isFinal ? calculateScore(dealerHand) : '??';
            const dealerDisplay = isFinal ? dealerHand.map(c => c.display).join('\n') : `${dealerHand[0].display}\n🎴`;

            const embed = new EmbedBuilder()
                .setTitle('🃏 Blackjack')
                .addFields(
                    { name: `Dealer: ${dealerScore}`, value: dealerDisplay, inline: true },
                    { name: `You: ${playerScore}`, value: playerHand.map(c => c.display).join('\n'), inline: true }
                )
                .setFooter({ text: `Bet: ${betAmount.toLocaleString()} riel`, iconURL: message.author.displayAvatarURL() });

            if (isFinal) {
                const dealerFinal = calculateScore(dealerHand);
                if (playerScore > 21) {
                    embed.setColor(colors.error).setDescription('**Bust! Dealer Wins.**\nOs luy hz ah pov.');
                } else if (dealerFinal > 21) {
                    embed.setColor(colors.success).setDescription('**Dealer Busts! You Win.**\nTos pherk!');
                } else if (playerScore > dealerFinal) {
                    embed.setColor(colors.success).setDescription('**You Win!**\nTos pherk!');
                } else if (playerScore < dealerFinal) {
                    embed.setColor(colors.error).setDescription('**Dealer Wins.**\nOs luy hz ah pov.');
                } else {
                    embed.setColor(colors.warning).setDescription('**Push!**\nLuy nov darl heh.');
                }
            } else {
                embed.setColor(colors.primary);
            }

            return embed;
        };

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('hit').setLabel('Hit').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('stand').setLabel('Stand').setStyle(ButtonStyle.Secondary),
            );

        const gameMessage = await message.reply({ embeds: [getEmbed()], components: [row] });

        const collector = gameMessage.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 60000,
            componentType: ComponentType.Button
        });

        collector.on('collect', async i => {
            if (i.customId === 'hit') {
                playerHand.push(drawCard());
                if (calculateScore(playerHand) > 21) {
                    collector.stop('bust');
                } else {
                    await i.update({ embeds: [getEmbed()] });
                }
            } else if (i.customId === 'stand') {
                collector.stop('stand');
            }
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'stand') {
                // Dealer hits until 17 (Natural Casino Rule)
                while (calculateScore(dealerHand) < 17) {
                    dealerHand.push(drawCard());
                }
            }

            const playerScore = calculateScore(playerHand);
            const dealerScore = calculateScore(dealerHand);
            
            let winMultiplier = 0;
            if (playerScore <= 21) {
                if (dealerScore > 21 || playerScore > dealerScore) {
                    winMultiplier = 2;
                } else if (playerScore === dealerScore) {
                    winMultiplier = 1;
                }
            }

            if (winMultiplier > 0) {
                const winAmount = Math.floor(betAmount * winMultiplier);
                database.addBalance(message.author.id, winAmount);
                if (winMultiplier > 1) {
                    database.updateStats(message.author.id, 'won', betAmount);
                    database.updateStats(message.author.id, 'blackjack_win', 1);
                }
            } else {
                database.updateStats(message.author.id, 'lost', betAmount);
            }

            try {
                await gameMessage.edit({ embeds: [getEmbed(true)], components: [] });
            } catch (err) {
                console.error('Failed to edit final BJ embed:', err);
            }
        });
    }
};