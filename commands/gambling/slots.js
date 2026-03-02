const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
    name: 'slots',
    aliases: ['s', 'slot', 'slotmachine'],
    description: 'Play the slot machine with Mommy! (◕‿◕✿)',
    usage: 'slots <amount>',
    cooldown: 5000,
    async execute(message, args, client) {
        if (args.length < 1) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ Missing amount',
                    description: 'Please specify how much you\'d like to bet. (｡♥‿♥｡) \n**Usage:** `Kslots <amount>`',
                }]
            });
        }

        const { minBet, maxBet } = config.gambling.slots;

        let betAmount;
        if (args[0].toLowerCase() === 'all') {
            const userData = database.getUser(message.author.id);
            betAmount = Math.min(userData.balance, maxBet);
            
            if (betAmount <= 0) {
                return message.reply({
                    embeds: [{
                        color: colors.error,
                        title: '💸 No funds found!',
                        description: `You don't have any money to play right now, sweetie. (◕‿◕✿)`,
                    }]
                });
            }
        } else {
            betAmount = parseInt(args[0]);
            if (isNaN(betAmount) || betAmount <= 0) {
                return message.reply({
                    embeds: [{
                        color: colors.error,
                        title: '❌ Invalid amount',
                        description: 'Please use a proper number, sweetie. (｡•́︿•̀｡)'
                    }]
                });
            }
        }

        if (betAmount < minBet) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '💸 Bet too low',
                    description: `You need at least **${minBet.toLocaleString()}** ${config.economy.currency} to play. (｡♥‿♥｡)`
                }]
            });
        }

        if (!database.hasBalance(message.author.id, betAmount)) {
            const userData = database.getUser(message.author.id);
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '💸 Insufficient funds',
                    description: `You don't have enough to make that bet, darling! (｡•́︿•̀｡)`
                }]
            });
        }

        database.removeBalance(message.author.id, betAmount);
        database.updateStats(message.author.id, 'gambled', betAmount);

        const outcomes = [
            { type: 'diamond', weight: 2, emoji: '💎', multiplier: 10, name: 'A big diamond for a big winner! ✨' },
            { type: 'rocket', weight: 5, emoji: '🚀', multiplier: 5, name: 'To the moon, darling! 🚀' },
            { type: 'coin', weight: 31, emoji: '🪙', multiplier: 2, name: 'You won some money, sweetie! 💰' },
            { type: 'draw', weight: 31, emoji: '🤝', multiplier: 1, name: 'It\'s a draw, little one' },
            { type: 'lose', weight: 31, emoji: '💀', multiplier: 0, name: 'Oh no, you lost, darling' }
        ];

        let outcomePool = [];
        for (const outcome of outcomes) {
            for (let i = 0; i < outcome.weight; i++) {
                outcomePool.push(outcome);
            }
        }

        const selectedOutcome = outcomePool[Math.floor(Math.random() * outcomePool.length)];

        let displaySymbols;
        if (selectedOutcome.type === 'lose') {
            const allEmojis = outcomes.map(o => o.emoji);
            const shuffled = [...allEmojis].sort(() => Math.random() - 0.5);
            displaySymbols = {
                first: shuffled[0],
                middle: shuffled[1],
                last: shuffled[2]
            };
        } else {
            displaySymbols = {
                first: selectedOutcome.emoji,
                middle: selectedOutcome.emoji,
                last: selectedOutcome.emoji
            };
        }

        const slotEmbed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle('🎰 Slot Machine')
            .setDescription(`**Bet:** ${betAmount.toLocaleString()} ${config.economy.currency}\n\n🎰 ┃ 🎯 ┃ 🎲 ┃\n**Spinning... (ﾉ´ヮ)ﾉ*:･ﾟ✧**`)
            

        const sentMessage = await message.reply({ embeds: [slotEmbed] });

        async function updateSlotDisplay(stage) {
            let animationSymbols = { ...displaySymbols };
            let statusText = '';

            if (stage < 2) {
                const randomEmojis = outcomes.map(o => o.emoji);
                animationSymbols.first = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                animationSymbols.middle = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                animationSymbols.last = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                statusText = '**Spinning fast...**';
            } else if (stage < 4) {
                const randomEmojis = outcomes.map(o => o.emoji);
                animationSymbols.first = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                animationSymbols.middle = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                animationSymbols.last = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                statusText = '**Still spinning...**';
            } else if (stage < 6) {
                const randomEmojis = outcomes.map(o => o.emoji);
                animationSymbols.middle = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                animationSymbols.last = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                statusText = '**Slowing down...**';
            } else if (stage < 7) {
                const randomEmojis = outcomes.map(o => o.emoji);
                animationSymbols.middle = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                statusText = '**Almost there...**';
            } else {
                statusText = '**Here are the results!**';
            }

            slotEmbed.setDescription(
                `**Bet:** ${betAmount.toLocaleString()} ${config.economy.currency}\n\n` +
                `🎰 ┃ ${animationSymbols.first} ┃ ${animationSymbols.middle} ┃ ${animationSymbols.last} ┃\n\n` +
                statusText
            );

            try {
                await sentMessage.edit({ embeds: [slotEmbed] });
            } catch (error) {
                console.error('Failed to update slot animation:', error);
            }
        }

        for (let stage = 0; stage <= 7; stage++) {
            await updateSlotDisplay(stage);
            await new Promise(resolve => setTimeout(resolve,
                stage < 2 ? 200 :
                stage < 4 ? 250 :
                stage < 6 ? 300 :
                400
            ));
        }

        if (selectedOutcome.type === 'diamond' || selectedOutcome.type === 'rocket' || selectedOutcome.type === 'coin') {
            const winAmount = betAmount * selectedOutcome.multiplier;
            const newBalance = database.addBalance(message.author.id, winAmount);
            database.updateStats(message.author.id, 'won', winAmount - betAmount);
            const expGain = database.addExperience(message.author.id, 25);

            slotEmbed
                .setColor(colors.success)
                .setTitle(`🎉 You won, my lucky little one! ヽ(>∀<☆)ノ`)
                .setDescription(
                    `**${selectedOutcome.name}**\n\n` +
                    `🎰 ┃ ${displaySymbols.first} ┃ ${displaySymbols.middle} ┃ ${displaySymbols.last} ┃\n\n` +
                    `**Winnings:** +${winAmount.toLocaleString()} ${config.economy.currency}\n` +
                    `**New Balance:** ${newBalance.toLocaleString()} ${config.economy.currency}\n` +
                    `**Multiplier:** x${selectedOutcome.multiplier}`
                );

            if (expGain && expGain.leveledUp) {
                slotEmbed.addFields({
                    name: '🎉 Level Up!',
                    value: `Congratulations! You've reached level **${expGain.newLevel}**, sweetie! (◕‿◕✿)`,
                    inline: false
                });
            }
        } else if (selectedOutcome.type === 'draw') {
            const newBalance = database.addBalance(message.author.id, betAmount);

            slotEmbed
                .setColor(colors.secondary)
                .setTitle('🤝 It\'s a draw, little one!')
                .setDescription(
                    `🎰 ┃ ${displaySymbols.first} ┃ ${displaySymbols.middle} ┃ ${displaySymbols.last} ┃\n\n` +
                    `**Mommy is giving your money back!**\n\n` +
                    `**Returned:** ${betAmount.toLocaleString()} ${config.economy.currency}\n` +
                    `**Balance:** ${newBalance.toLocaleString()} ${config.economy.currency}`
                );
        } else {
            const userData = database.getUser(message.author.id);
            database.updateStats(message.author.id, 'lost', betAmount);

            slotEmbed
                .setColor(colors.error)
                .setTitle('💀 Oh no, you lost, darling (｡•́︿•̀｡)')
                .setDescription(
                    `🎰 ┃ ${displaySymbols.first} ┃ ${displaySymbols.middle} ┃ ${displaySymbols.last} ┃\n\n` +
                    `**Loss:** ${betAmount.toLocaleString()} ${config.economy.currency}\n` +
                    `**Balance:** ${userData.balance.toLocaleString()} ${config.economy.currency}`
                );
        }

        await sentMessage.edit({ embeds: [slotEmbed] });
    }
};