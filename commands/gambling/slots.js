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

        // Check if user has enough balance (FIXED THIS LINE)
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

        // Get symbols from config
        const symbols = config.gambling.slots.symbols;
        const symbolKeys = Object.keys(symbols);

        // Create weighted symbol pool
        let symbolPool = [];
        for (const [key, data] of Object.entries(symbols)) {
            for (let i = 0; i < data.weight; i++) {
                symbolPool.push(key);
            }
        }

        // Generate final results first
        const result1 = symbolPool[Math.floor(Math.random() * symbolPool.length)];
        const result2 = symbolPool[Math.floor(Math.random() * symbolPool.length)];
        const result3 = symbolPool[Math.floor(Math.random() * symbolPool.length)];

        const finalSymbols = {
            first: symbols[result1].emoji,
            middle: symbols[result2].emoji,
            last: symbols[result3].emoji
        };

        // Create initial embed
        const slotEmbed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle('🎰 Slot Machine')
            .setDescription(`**Bet:** ${betAmount.toLocaleString()} ${config.economy.currency}\n\n🎰 ┃ 🎯 ┃ 🎲 ┃\n**Spinning...**`)
            .setTimestamp();

        const sentMessage = await message.reply({ embeds: [slotEmbed] });

        // Animation sequence with optimized performance
        async function updateSlotDisplay(stage) {
            let displaySymbols = { ...finalSymbols };
            let statusText = '';

            // Determine which reels should still be spinning with better visual feedback
            if (stage < 2) { // First 2 spins - all reels spinning fast
                displaySymbols.first = symbols[symbolKeys[Math.floor(Math.random() * symbolKeys.length)]].emoji;
                displaySymbols.middle = symbols[symbolKeys[Math.floor(Math.random() * symbolKeys.length)]].emoji;
                displaySymbols.last = symbols[symbolKeys[Math.floor(Math.random() * symbolKeys.length)]].emoji;
                statusText = '**Spinning fast...**';
            } 
            else if (stage < 4) { // Next 2 spins - all reels spinning
                displaySymbols.first = symbols[symbolKeys[Math.floor(Math.random() * symbolKeys.length)]].emoji;
                displaySymbols.middle = symbols[symbolKeys[Math.floor(Math.random() * symbolKeys.length)]].emoji;
                displaySymbols.last = symbols[symbolKeys[Math.floor(Math.random() * symbolKeys.length)]].emoji;
                statusText = '**Spinning...**';
            }
            else if (stage < 6) { // Next 2 spins - first reel locked
                displaySymbols.middle = symbols[symbolKeys[Math.floor(Math.random() * symbolKeys.length)]].emoji;
                displaySymbols.last = symbols[symbolKeys[Math.floor(Math.random() * symbolKeys.length)]].emoji;
                statusText = '**Slowing down...**';
            } 
            else if (stage < 7) { // Next spin - first and last locked
                displaySymbols.middle = symbols[symbolKeys[Math.floor(Math.random() * symbolKeys.length)]].emoji;
                statusText = '**Final spin...**';
            }
            else {
                statusText = '**Result!**';
            }

            // Update embed with smoother description
            slotEmbed.setDescription(
                `**Bet:** ${betAmount.toLocaleString()} ${config.economy.currency}\n\n` +
                `🎰 ┃ ${displaySymbols.first} ┃ ${displaySymbols.middle} ┃ ${displaySymbols.last} ┃\n` +
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

        // Check win conditions
        let multiplier = 0;
        let winType = '';
        let resultStatus = '';

        if (result1 === 'diamond' && result2 === 'diamond' && result3 === 'diamond') {
            multiplier = 15;
            winType = 'DIAMOND JACKPOT!';
            resultStatus = 'win';
        } 
        else if (result1 === 'rocket' && result2 === 'rocket' && result3 === 'rocket') {
            multiplier = 10;
            winType = 'ROCKET BONUS!';
            resultStatus = 'win';
        }
        else if (result1 === 'coin' && result2 === 'coin' && result3 === 'coin') {
            multiplier = 2;
            winType = 'COIN WIN!';
            resultStatus = 'win';
        }
        else if (result1 === 'skull' && result2 === 'skull' && result3 === 'skull') {
            resultStatus = 'draw';
        }
        else if (result1 !== result2 && result1 !== result3 && result2 !== result3) {
            resultStatus = 'lose';
        }
        else {
            resultStatus = 'lose';
        }

        // Update the same embed with results
        if (resultStatus === 'win') {
            const winAmount = betAmount * multiplier;
            const newBalance = database.addBalance(message.author.id, winAmount);
            database.updateStats(message.author.id, 'won', winAmount - betAmount);
            const expGain = database.addExperience(message.author.id, 25);

            slotEmbed
                .setColor(colors.success || 0x43B581)
                .setTitle(`🎉 ${winType}`)
                .setDescription(
                    `**${winType}**\n\n` +
                    `🎰 ┃ ${finalSymbols.first} ┃ ${finalSymbols.middle} ┃ ${finalSymbols.last} ┃\n\n` +
                    `**Winnings:** +${winAmount.toLocaleString()} ${config.economy.currency}\n` +
                    `**Balance:** ${newBalance.toLocaleString()} ${config.economy.currency}\n` +
                    `**Multiplier:** x${multiplier}`
                );

            if (expGain && expGain.leveledUp) {
                slotEmbed.addFields({
                    name: '🎉 Level Up!',
                    value: `Reached level **${expGain.newLevel}**!`,
                    inline: false
                });
            }
        } 
        else if (resultStatus === 'draw') {
            const newBalance = database.addBalance(message.author.id, betAmount);

            slotEmbed
                .setColor(colors.secondary || 0x99AAB5)
                .setTitle('💀 Draw!')
                .setDescription(
                    `🎰 ┃ ${finalSymbols.first} ┃ ${finalSymbols.middle} ┃ ${finalSymbols.last} ┃\n\n` +
                    `**Bet returned!**\n\n` +
                    `**Amount returned:** ${betAmount.toLocaleString()} ${config.economy.currency}\n` +
                    `**Balance:** ${newBalance.toLocaleString()} ${config.economy.currency}`
                );
        }
        else {
            const userData = database.getUser(message.author.id);
            database.updateStats(message.author.id, 'lost', betAmount);

            slotEmbed
                .setColor(colors.error || 0xF04747)
                .setTitle('💸 You Lost')
                .setDescription(
                    `🎰 ┃ ${finalSymbols.first} ┃ ${finalSymbols.middle} ┃ ${finalSymbols.last} ┃\n\n` +
                    `**Amount lost:** ${betAmount.toLocaleString()} ${config.economy.currency}\n` +
                    `**Balance:** ${userData.balance.toLocaleString()} ${config.economy.currency}`
                );
        }

        await sentMessage.edit({ embeds: [slotEmbed] });
    }
};