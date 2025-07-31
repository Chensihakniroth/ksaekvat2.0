const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
    name: 'slots',
    aliases: ['s', 'slot', 'slotmachine'],
    description: 'Play the slot machine with tiered rewards',
    usage: 'slots <amount>',
    cooldown: 5000,
    async execute(message, args, client) {
        // Check arguments
        if (args.length < 1) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ Invalid Usage',
                    description: 'Please provide a bet amount!\n**Usage:** `Kslots <amount>`\n**Example:** `Ks 1000`',
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

        // Check min bet and cap max bet
        const { minBet, maxBet } = config.gambling.slots;
        if (betAmount < minBet) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '💸 Minimum Bet Required',
                    description: `Minimum bet amount is **${minBet.toLocaleString()}** ${config.economy.currency}.`,
                    timestamp: new Date()
                }]
            });
        }

        // Cap the bet amount at maximum
        if (betAmount > maxBet) {
            betAmount = maxBet;
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

        // Remove bet amount from user's balance
        database.removeBalance(message.author.id, betAmount);
        database.updateStats(message.author.id, 'gambled', betAmount);

        // NEW: Define the outcome system with weighted probabilities
        const outcomes = [
            // Diamond (5%) - Rare Jackpot
            { type: 'diamond', weight: 5, emoji: '🔷', multiplier: 10, name: 'DIAMOND JACKPOT!' },
            // Rocket (15%) - Big Win  
            { type: 'rocket', weight: 15, emoji: '🚀', multiplier: 5, name: 'ROCKET BONUS!' },
            // Coin (25%) - Small Win
            { type: 'coin', weight: 25, emoji: '🪙', multiplier: 2, name: 'COIN WIN!' },
            // Draw (30%) - Break Even
            { type: 'draw', weight: 30, emoji: '🤝', multiplier: 1, name: 'DRAW!' },
            // Lose (25%) - No reward
            { type: 'lose', weight: 25, emoji: '💀', multiplier: 0, name: 'LOSS' }
        ];

        // Create weighted outcome pool
        let outcomePool = [];
        for (const outcome of outcomes) {
            for (let i = 0; i < outcome.weight; i++) {
                outcomePool.push(outcome);
            }
        }

        // Generate the outcome
        const selectedOutcome = outcomePool[Math.floor(Math.random() * outcomePool.length)];

        // Generate visual symbols for the slot machine
        // For wins/draws, show 3 matching symbols
        // For losses, show mixed symbols
        let displaySymbols;
        if (selectedOutcome.type === 'lose') {
            // Generate 3 different symbols for loss
            const allEmojis = outcomes.map(o => o.emoji);
            const shuffled = [...allEmojis].sort(() => Math.random() - 0.5);
            displaySymbols = {
                first: shuffled[0],
                middle: shuffled[1],
                last: shuffled[2]
            };
        } else {
            // Show 3 matching symbols for wins and draws
            displaySymbols = {
                first: selectedOutcome.emoji,
                middle: selectedOutcome.emoji,
                last: selectedOutcome.emoji
            };
        }

        // Create initial embed
        const slotEmbed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle('🎰 Slot Machine')
            .setDescription(`**Bet:** ${betAmount.toLocaleString()} ${config.economy.currency}\n\n🎰 ┃ 🎯 ┃ 🎲 ┃\n**Spinning...**`)
            .setTimestamp();

        const sentMessage = await message.reply({ embeds: [slotEmbed] });

        // Animation sequence with optimized performance
        async function updateSlotDisplay(stage) {
            let animationSymbols = { ...displaySymbols };
            let statusText = '';

            // Determine which reels should still be spinning with better visual feedback
            if (stage < 2) { // First 2 spins - all reels spinning fast
                const randomEmojis = outcomes.map(o => o.emoji);
                animationSymbols.first = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                animationSymbols.middle = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                animationSymbols.last = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                statusText = '**Spinning fast...**';
            } 
            else if (stage < 4) { // Next 2 spins - all reels spinning
                const randomEmojis = outcomes.map(o => o.emoji);
                animationSymbols.first = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                animationSymbols.middle = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                animationSymbols.last = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                statusText = '**Spinning...**';
            }
            else if (stage < 6) { // Next 2 spins - first reel locked
                const randomEmojis = outcomes.map(o => o.emoji);
                animationSymbols.middle = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                animationSymbols.last = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                statusText = '**Slowing down...**';
            } 
            else if (stage < 7) { // Next spin - first and last locked
                const randomEmojis = outcomes.map(o => o.emoji);
                animationSymbols.middle = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                statusText = '**Final spin...**';
            }
            else {
                statusText = '**Result!**';
            }

            // Update embed with smoother description
            slotEmbed.setDescription(
                `**Bet:** ${betAmount.toLocaleString()} ${config.economy.currency}\n\n` +
                `🎰 ┃ ${animationSymbols.first} ┃ ${animationSymbols.middle} ┃ ${animationSymbols.last} ┃\n` +
                statusText
            );

            try {
                await sentMessage.edit({ embeds: [slotEmbed] });
            } catch (error) {
                // Handle potential edit errors gracefully
                console.error('Failed to update slot animation:', error);
            }
        }

        // Run the animation sequence with smoother timing
        for (let stage = 0; stage <= 7; stage++) {
            await updateSlotDisplay(stage);
            await new Promise(resolve => setTimeout(resolve, 
                stage < 2 ? 200 :  // First 2 spins: 200ms (faster start)
                stage < 4 ? 250 :  // Next 2 spins: 250ms
                stage < 6 ? 300 :  // Next 2 spins: 300ms (building suspense)
                400                // Last 2 spins: 400ms (dramatic pause)
            ));
        }

        // Process the outcome and update the embed
        if (selectedOutcome.type === 'diamond' || selectedOutcome.type === 'rocket' || selectedOutcome.type === 'coin') {
            // Win outcomes
            const winAmount = betAmount * selectedOutcome.multiplier;
            const newBalance = database.addBalance(message.author.id, winAmount);
            database.updateStats(message.author.id, 'won', winAmount - betAmount);
            const expGain = database.addExperience(message.author.id, 25);

            slotEmbed
                .setColor(colors.success || 0x43B581)
                .setTitle(`🎉 ${selectedOutcome.name}`)
                .setDescription(
                    `**${selectedOutcome.name}**\n\n` +
                    `🎰 ┃ ${displaySymbols.first} ┃ ${displaySymbols.middle} ┃ ${displaySymbols.last} ┃\n\n` +
                    `**Winnings:** +${winAmount.toLocaleString()} ${config.economy.currency}\n` +
                    `**Balance:** ${newBalance.toLocaleString()} ${config.economy.currency}\n` +
                    `**Multiplier:** x${selectedOutcome.multiplier}`
                );

            if (expGain && expGain.leveledUp) {
                slotEmbed.addFields({
                    name: '🎉 Level Up!',
                    value: `Reached level **${expGain.newLevel}**!`,
                    inline: false
                });
            }
        } 
        else if (selectedOutcome.type === 'draw') {
            // Draw outcome - return bet
            const newBalance = database.addBalance(message.author.id, betAmount);

            slotEmbed
                .setColor(colors.secondary || 0x99AAB5)
                .setTitle('🤝 Draw!')
                .setDescription(
                    `🎰 ┃ ${displaySymbols.first} ┃ ${displaySymbols.middle} ┃ ${displaySymbols.last} ┃\n\n` +
                    `**Bet returned!**\n\n` +
                    `**Amount returned:** ${betAmount.toLocaleString()} ${config.economy.currency}\n` +
                    `**Balance:** ${newBalance.toLocaleString()} ${config.economy.currency}`
                );
        }
        else {
            // Loss outcome
            const userData = database.getUser(message.author.id);
            database.updateStats(message.author.id, 'lost', betAmount);

            slotEmbed
                .setColor(colors.error || 0xF04747)
                .setTitle('💀 You Lost')
                .setDescription(
                    `🎰 ┃ ${displaySymbols.first} ┃ ${displaySymbols.middle} ┃ ${displaySymbols.last} ┃\n\n` +
                    `**Amount lost:** ${betAmount.toLocaleString()} ${config.economy.currency}\n` +
                    `**Balance:** ${userData.balance.toLocaleString()} ${config.economy.currency}`
                );
        }

        await sentMessage.edit({ embeds: [slotEmbed] });
    }
};