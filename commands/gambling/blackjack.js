const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
    name: 'blackjack',
    aliases: ['bj', '21'],
    description: 'Play a game of Blackjack with Mommy! (◕‿◕✿)',
    usage: 'blackjack <amount/all>',
    cooldown: 5000,
    async execute(message, args, client) {
        if (args.length < 1) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ Wrong amount, sweetie!',
                    description: 'Please specify a valid amount to bet. (｡♥‿♥｡) \n**Usage:** `Kblackjack <amount/all>`',
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
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ Invalid amount',
                    description: 'Please use a proper number, sweetie. (｡•́︿•̀｡)',
                }]
            });
        }

        const { minBet, maxBet } = config.gambling.blackjack;
        if (betAmount < minBet || (maxBet && betAmount > maxBet)) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '💸 Bet out of range',
                    description: `Your bet must be between **${minBet.toLocaleString()}** and **${(maxBet || 'unlimited').toLocaleString()}** ${config.economy.currency}. (｡♥‿♥｡)`,
                }]
            });
        }

        if (!database.hasBalance(message.author.id, betAmount)) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '💸 Insufficient funds',
                    description: `You don't have enough to play Blackjack right now, darling. (｡•́︿•̀｡)`,
                }]
            });
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
            let attempts = 0;
            while (calculateScore(playerHand) < 15 && attempts < 10) {
                playerHand = [drawCard(), drawCard()];
                attempts++;
            }
        }

        const getEmbed = (isFinal = false) => {
            const playerScore = calculateScore(playerHand);
            const dealerScore = isFinal ? calculateScore(dealerHand) : '??';
            const dealerDisplay = isFinal ? dealerHand.map(c => c.display).join('\n') : `${dealerHand[0].display}\n🎴`;

            const embed = new EmbedBuilder()
                .setTitle('🃏 Blackjack with Mommy')
                .addFields(
                    { name: `Mommy: ${dealerScore}`, value: dealerDisplay, inline: true },
                    { name: `You: ${playerScore}`, value: playerHand.map(c => c.display).join('\n'), inline: true }
                )
                .setFooter({ text: `Bet: ${betAmount.toLocaleString()} riel`, iconURL: message.author.displayAvatarURL() });

            if (isFinal) {
                const dealerFinal = calculateScore(dealerHand);
                if (playerScore > 21) {
                    embed.setColor(colors.error).setDescription('**Bust! Mommy wins.**\nDon\'t be sad, darling! You can try again later (っ˘ω˘ς)');
                } else if (dealerFinal > 21) {
                    embed.setColor(colors.success).setDescription('**Dealer Busts! You Win.**\nCongratulations, sweetie! ヽ(>∀<☆)ノ');
                } else if (playerScore > dealerFinal) {
                    embed.setColor(colors.success).setDescription('**You Win!**\nMommy is so proud of you! (｡♥‿♥｡)');
                } else if (playerScore < dealerFinal) {
                    embed.setColor(colors.error).setDescription('**Mommy Wins.**\nBetter luck next time, sweetie. (｡•́︿•̀｡)');
                } else {
                    embed.setColor(colors.warning).setDescription('**Push!**\nIt\'s a draw, little one. Mommy will give your money back. (◕‿◕✿)');
                }
            } else {
                embed.setColor(colors.primary).setDescription('What will you do, darling? (｡♥‿♥｡)');
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