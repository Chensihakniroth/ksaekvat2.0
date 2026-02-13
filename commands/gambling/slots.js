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
        if (args.length < 1) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ khos luy ai ah pov',
                    description: 'hg dak luy oy trov mer! \n**Usage:** `Kslots <amount>`\n**Example:** `Ks 1000`'
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
                        title: '💸 ort luy heh',
                        description: `hg ot luy jak lbeng ${config.economy.currency}!`,
                    }]
                });
            }
        } else {
            betAmount = parseInt(args[0]);
            if (isNaN(betAmount) || betAmount <= 0) {
                return message.reply({
                    embeds: [{
                        color: colors.error,
                        title: '❌ khos luy ai ah pov',
                        description: 'hg dak luy oy trov mer! dak luy chea lek mk ah pov.'
                    }]
                });
            }
        }

        if (betAmount < minBet) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '💸 ort luy heh',
                    description: `Minimum bet hg dak ban tae **${minBet.toLocaleString()}** ${config.economy.currency} teh ah chlery.`
                }]
            });
        }

        if (!database.hasBalance(message.author.id, betAmount)) {
            const userData = database.getUser(message.author.id);
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '💸 kmean luy ma cent jong jak l\'beng',
                    description: `luy hg ort krub jak lbeng teh ah pov! ${config.economy.currency}!\n**Luy hg:** ${userData.balance.toLocaleString()}\n**Trov ka:** ${betAmount.toLocaleString()}`
                }]
            });
        }

        database.removeBalance(message.author.id, betAmount);
        database.updateStats(message.author.id, 'gambled', betAmount);

        // Adjusted weights: x10 (2%) and x5 (5%) appear less. Coin, Draw, Lose are about equal (~31%).
        const outcomes = [
            { type: 'diamond', weight: 2, emoji: '🔷', multiplier: 10, name: 'DIAMOND JACKPOT!' },
            { type: 'rocket', weight: 5, emoji: '🚀', multiplier: 5, name: 'ROCKET BONUS!' },
            { type: 'coin', weight: 31, emoji: '🪙', multiplier: 2, name: 'COIN WIN!' },
            { type: 'draw', weight: 31, emoji: '🤝', multiplier: 1, name: 'DRAW!' },
            { type: 'lose', weight: 31, emoji: '💀', multiplier: 0, name: 'LOSS' }
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
            .setTitle('🎰 Slot Machine (Bek Edition)')
            .setDescription(`**hg jak :** ${betAmount.toLocaleString()} ${config.economy.currency}\n\n🎰 ┃ 🎯 ┃ 🎲 ┃\n**Spinning...**`)
            

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
                statusText = '**Spinning...**';
            } else if (stage < 6) {
                const randomEmojis = outcomes.map(o => o.emoji);
                animationSymbols.middle = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                animationSymbols.last = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                statusText = '**Slowing down...**';
            } else if (stage < 7) {
                const randomEmojis = outcomes.map(o => o.emoji);
                animationSymbols.middle = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                statusText = '**Final spin...**';
            } else {
                statusText = '**Result!**';
            }

            slotEmbed.setDescription(
                `**hg jak :** ${betAmount.toLocaleString()} ${config.economy.currency}\n\n` +
                `🎰 ┃ ${animationSymbols.first} ┃ ${animationSymbols.middle} ┃ ${animationSymbols.last} ┃\n` +
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
                .setColor(colors.success || 0x43B581)
                .setTitle(`🎉 jm loy bos ke!`)
                .setDescription(
                    `**${selectedOutcome.name}**\n\n` +
                    `🎰 ┃ ${displaySymbols.first} ┃ ${displaySymbols.middle} ┃ ${displaySymbols.last} ┃\n\n` +
                    `**Luy knong khao:** +${winAmount.toLocaleString()} ${config.economy.currency}\n` +
                    `**Balance Thmei:** ${newBalance.toLocaleString()} ${config.economy.currency}\n` +
                    `**Multiplier bek:** x${selectedOutcome.multiplier}`
                );

            if (expGain && expGain.leveledUp) {
                slotEmbed.addFields({
                    name: '🎉 Lerng Sak!',
                    value: `kop sari ! hg lerng sak hz tov Level **${expGain.newLevel}**!`,
                    inline: false
                });
            }
        } else if (selectedOutcome.type === 'draw') {
            const newBalance = database.addBalance(message.author.id, betAmount);

            slotEmbed
                .setColor(colors.secondary || 0x99AAB5)
                .setTitle('🤝 Smer knea teh!')
                .setDescription(
                    `🎰 ┃ ${displaySymbols.first} ┃ ${displaySymbols.middle} ┃ ${displaySymbols.last} ┃\n\n` +
                    `**Dak luy mk vinh hz!**\n\n` +
                    `**Luy mk vinh:** ${betAmount.toLocaleString()} ${config.economy.currency}\n` +
                    `**Balance Thmei:** ${newBalance.toLocaleString()} ${config.economy.currency}`
                );
        } else {
            const userData = database.getUser(message.author.id);
            database.updateStats(message.author.id, 'lost', betAmount);

            slotEmbed
                .setColor(colors.error || 0xF04747)
                .setTitle('💀 Os luy hz ah pov!')
                .setDescription(
                    `🎰 ┃ ${displaySymbols.first} ┃ ${displaySymbols.middle} ┃ ${displaySymbols.last} ┃\n\n` +
                    `**Bat luy:** ${betAmount.toLocaleString()} ${config.economy.currency}\n` +
                    `**Luy nov sol:** ${userData.balance.toLocaleString()} ${config.economy.currency}`
                );
        }

        await sentMessage.edit({ embeds: [slotEmbed] });
    }
};
