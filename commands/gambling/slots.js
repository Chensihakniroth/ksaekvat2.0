const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
    name: 'slots',
    aliases: ['s', 'slot', 'slotmachine'],
    description: 'លេងម៉ាស៊ីនស្លុតផ្សងសំណាងជាមួយបង',
    usage: 'slots <ចំនួន>',
    cooldown: 5000,
    async execute(message, args, client) {
        if (args.length < 1) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ ដាក់លុយខុសហើយអូនសម្លាញ់',
                    description: 'ដាក់លុយឱ្យត្រូវមើលម្ចាស់ថ្លៃ! \n**របៀបប្រើ:** `Kslots <ចំនួន>`\n**ឧទាហរណ៍:** `Ks 1000`'
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
                        title: '💸 អត់មានលុយទេអូន',
                        description: `អូនអត់មានលុយក្នុងខ្លួនផង ចង់លេងស្លុតមិចកើត!`,
                    }]
                });
            }
        } else {
            betAmount = parseInt(args[0]);
            if (isNaN(betAmount) || betAmount <= 0) {
                return message.reply({
                    embeds: [{
                        color: colors.error,
                        title: '❌ ដាក់លុយឱ្យត្រូវមើលមាសស្ងួន',
                        description: 'ដាក់ជាលេខមកម្ចាស់ថ្លៃ កុំឱ្យបងពិបាកចិត្តអី។'
                    }]
                });
            }
        }

        if (betAmount < minBet) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '💸 លុយតិចពេកហើយអូន',
                    description: `យ៉ាងហោចណាស់ក៏ត្រូវមាន **${minBet.toLocaleString()}** ${config.economy.currency} ដែរណាម្ចាស់ស្នេហ៍បង។`
                }]
            });
        }

        if (!database.hasBalance(message.author.id, betAmount)) {
            const userData = database.getUser(message.author.id);
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '💸 អត់លុយគ្រប់ទេអូនសម្លាញ់',
                    description: `លុយអូនអត់គ្រប់ចាក់ទេណាម្ចាស់ថ្លៃ! \n**លុយអូនមាន:** ${userData.balance.toLocaleString()}\n**ត្រូវការ:** ${betAmount.toLocaleString()}`
                }]
            });
        }

        database.removeBalance(message.author.id, betAmount);
        database.updateStats(message.author.id, 'gambled', betAmount);

        const outcomes = [
            { type: 'diamond', weight: 2, emoji: '💎', multiplier: 10, name: 'ឈ្នះដុំពេជ្រធំហើយអូន!' },
            { type: 'rocket', weight: 5, emoji: '🚀', multiplier: 5, name: 'ហោះឡើងឋានសួគ៌ហើយ!' },
            { type: 'coin', weight: 31, emoji: '🪙', multiplier: 2, name: 'ឈ្នះលុយហើយអូនសម្លាញ់!' },
            { type: 'draw', weight: 31, emoji: '🤝', multiplier: 1, name: 'ស្មើគ្នាទេម្ចាស់ថ្លៃ' },
            { type: 'lose', weight: 31, emoji: '💀', multiplier: 0, name: 'ចាញ់បាត់ហើយអូន' }
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
            .setDescription(`**អូនចាក់ :** ${betAmount.toLocaleString()} ${config.economy.currency}\n\n🎰 ┃ 🎯 ┃ 🎲 ┃\n**កំពុងវិលឱ្យអូនហើយ...**`)
            

        const sentMessage = await message.reply({ embeds: [slotEmbed] });

        async function updateSlotDisplay(stage) {
            let animationSymbols = { ...displaySymbols };
            let statusText = '';

            if (stage < 2) {
                const randomEmojis = outcomes.map(o => o.emoji);
                animationSymbols.first = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                animationSymbols.middle = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                animationSymbols.last = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                statusText = '**វិលលឿនៗ...**';
            } else if (stage < 4) {
                const randomEmojis = outcomes.map(o => o.emoji);
                animationSymbols.first = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                animationSymbols.middle = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                animationSymbols.last = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                statusText = '**កំពុងវិល...**';
            } else if (stage < 6) {
                const randomEmojis = outcomes.map(o => o.emoji);
                animationSymbols.middle = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                animationSymbols.last = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                statusText = '**ជិតឈប់ហើយ...**';
            } else if (stage < 7) {
                const randomEmojis = outcomes.map(o => o.emoji);
                animationSymbols.middle = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                statusText = '**វិលចុងក្រោយ...**';
            } else {
                statusText = '**លទ្ធផលបានហើយ!**';
            }

            slotEmbed.setDescription(
                `**អូនចាក់ :** ${betAmount.toLocaleString()} ${config.economy.currency}\n\n` +
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
                .setTitle(`🎉 ហេងណាស់ម្ចាស់ស្នេហ៍បង!`)
                .setDescription(
                    `**${selectedOutcome.name}**\n\n` +
                    `🎰 ┃ ${displaySymbols.first} ┃ ${displaySymbols.middle} ┃ ${displaySymbols.last} ┃\n\n` +
                    `**លុយចូលហោប៉ៅ:** +${winAmount.toLocaleString()} ${config.economy.currency}\n` +
                    `**សរុបថ្មី:** ${newBalance.toLocaleString()} ${config.economy.currency}\n` +
                    `**មេគុណសំណាង:** x${selectedOutcome.multiplier}`
                );

            if (expGain && expGain.leveledUp) {
                slotEmbed.addFields({
                    name: '🎉 ឡើងស័កហើយ!',
                    value: `កប់ស៊េរី! អូនឡើងដល់កម្រិតទី **${expGain.newLevel}** ហើយណាម្ចាស់ថ្លៃ!`,
                    inline: false
                });
            }
        } else if (selectedOutcome.type === 'draw') {
            const newBalance = database.addBalance(message.author.id, betAmount);

            slotEmbed
                .setColor(colors.secondary)
                .setTitle('🤝 ស្មើគ្នាទេណាម្ចាស់ថ្លៃ!')
                .setDescription(
                    `🎰 ┃ ${displaySymbols.first} ┃ ${displaySymbols.middle} ┃ ${displaySymbols.last} ┃\n\n` +
                    `**បងជូនលុយអូនវិញហើយ!**\n\n` +
                    `**លុយបានវិញ:** ${betAmount.toLocaleString()} ${config.economy.currency}\n` +
                    `**សរុបថ្មី:** ${newBalance.toLocaleString()} ${config.economy.currency}`
                );
        } else {
            const userData = database.getUser(message.author.id);
            database.updateStats(message.author.id, 'lost', betAmount);

            slotEmbed
                .setColor(colors.error)
                .setTitle('💀 អស់លុយបាត់ហើយម្ចាស់ស្នេហ៍!')
                .setDescription(
                    `🎰 ┃ ${displaySymbols.first} ┃ ${displaySymbols.middle} ┃ ${displaySymbols.last} ┃\n\n` +
                    `**បាត់បង់លុយ:** ${betAmount.toLocaleString()} ${config.economy.currency}\n` +
                    `**លុយនៅសល់:** ${userData.balance.toLocaleString()} ${config.economy.currency}`
                );
        }

        await sentMessage.edit({ embeds: [slotEmbed] });
    }
};