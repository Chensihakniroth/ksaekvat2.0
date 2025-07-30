const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
    name: 'duel',
    aliases: ['challenge', 'pvp'],
    description: 'Challenge another user to a duel',
    usage: 'duel <@user> [bet_amount]',
    cooldown: 30000, // 30 seconds
    execute(message, args, client) {
        // Check if user provided a target
        if (args.length < 1) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ Invalid Usage',
                    description: 'Please mention a user to duel!\n**Usage:** `Kduel @user [bet_amount]`\n**Example:** `Kduel @friend 1000`',
                    timestamp: new Date()
                }]
            });
        }

        // Get target user
        let target = null;
        if (message.mentions.users.size > 0) {
            target = message.mentions.users.first();
        } else {
            const userId = args[0];
            target = client.users.cache.get(userId);
        }

        if (!target) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ User Not Found',
                    description: 'Please mention a valid user to duel.',
                    timestamp: new Date()
                }]
            });
        }

        // Can't duel yourself
        if (target.id === message.author.id) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '🤺 Self Duel',
                    description: 'You cannot duel yourself! Find someone else to challenge.',
                    timestamp: new Date()
                }]
            });
        }

        // Can't duel bots
        if (target.bot) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '🤖 Bot Duel',
                    description: 'You cannot duel bots! Challenge a real person instead.',
                    timestamp: new Date()
                }]
            });
        }

        // Parse bet amount (optional)
        let betAmount = 0;
        if (args.length > 1) {
            betAmount = parseInt(args[1]);
            if (isNaN(betAmount) || betAmount < 0) {
                betAmount = 0;
            }
        }

        // Check if both users have enough balance for bet
        const challengerData = database.getUser(message.author.id);
        const targetData = database.getUser(target.id);

        if (betAmount > 0) {
            if (!database.hasBalance(message.author.id, betAmount)) {
                return message.reply({
                    embeds: [{
                        color: colors.error,
                        title: '💸 Insufficient Funds',
                        description: `You don't have enough ${config.economy.currency} to bet!\n**Your Balance:** ${challengerData.balance.toLocaleString()} ${config.economy.currency}\n**Required:** ${betAmount.toLocaleString()} ${config.economy.currency}`,
                        timestamp: new Date()
                    }]
                });
            }

            if (!database.hasBalance(target.id, betAmount)) {
                return message.reply({
                    embeds: [{
                        color: colors.warning,
                        title: '💸 Target Insufficient Funds',
                        description: `${target.username} doesn't have enough ${config.economy.currency} to accept this bet!\n**Their Balance:** ${targetData.balance.toLocaleString()} ${config.economy.currency}\n**Required:** ${betAmount.toLocaleString()} ${config.economy.currency}`,
                        timestamp: new Date()
                    }]
                });
            }
        }

        // Calculate combat stats based on level and experience
        const challengerStats = {
            attack: Math.floor(challengerData.level * 10 + challengerData.experience / 100),
            defense: Math.floor(challengerData.level * 8 + challengerData.experience / 150),
            health: Math.floor(challengerData.level * 15 + 100),
            luck: Math.floor(challengerData.level * 2)
        };

        const targetStats = {
            attack: Math.floor(targetData.level * 10 + targetData.experience / 100),
            defense: Math.floor(targetData.level * 8 + targetData.experience / 150),
            health: Math.floor(targetData.level * 15 + 100),
            luck: Math.floor(targetData.level * 2)
        };

        // Create duel invitation embed
        const inviteEmbed = new EmbedBuilder()
            .setColor(colors.warning)
            .setTitle('⚔️ Duel Challenge!')
            .setDescription(`${message.author} has challenged ${target} to a duel!`)
            .addFields(
                {
                    name: '🥊 Challenger Stats',
                    value: [
                        `**Level:** ${challengerData.level}`,
                        `**Attack:** ${challengerStats.attack}`,
                        `**Defense:** ${challengerStats.defense}`,
                        `**Health:** ${challengerStats.health}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🛡️ Defender Stats',
                    value: [
                        `**Level:** ${targetData.level}`,
                        `**Attack:** ${targetStats.attack}`,
                        `**Defense:** ${targetStats.defense}`,
                        `**Health:** ${targetStats.health}`
                    ].join('\n'),
                    inline: true
                }
            );

        if (betAmount > 0) {
            inviteEmbed.addFields({
                name: '💰 Duel Stakes',
                value: `**Bet Amount:** ${betAmount.toLocaleString()} ${config.economy.currency}\n**Winner Takes:** ${(betAmount * 2).toLocaleString()} ${config.economy.currency}`,
                inline: false
            });
        }

        inviteEmbed.addFields({
            name: '📋 How to Respond',
            value: `${target}, react with ⚔️ to accept or ❌ to decline\n**Time Limit:** 60 seconds`,
            inline: false
        });

        inviteEmbed.setFooter({ 
            text: `Duel invitation expires in 60 seconds`,
            iconURL: message.author.displayAvatarURL()
        }).setTimestamp();

        message.reply({ embeds: [inviteEmbed] }).then(async (sentMessage) => {
            // Add reaction options
            await sentMessage.react('⚔️');
            await sentMessage.react('❌');

            // Create reaction collector
            const filter = (reaction, user) => {
                return ['⚔️', '❌'].includes(reaction.emoji.name) && user.id === target.id;
            };

            const collector = sentMessage.createReactionCollector({ filter, time: 60000, max: 1 });

            collector.on('collect', async (reaction, user) => {
                if (reaction.emoji.name === '⚔️') {
                    // Duel accepted - start combat
                    await startDuel(sentMessage, message.author, target, challengerStats, targetStats, betAmount);
                } else {
                    // Duel declined
                    const declineEmbed = new EmbedBuilder()
                        .setColor(colors.error)
                        .setTitle('❌ Duel Declined')
                        .setDescription(`${target} declined the duel challenge.`)
                        .setFooter({ text: 'Maybe next time!' })
                        .setTimestamp();

                    await sentMessage.edit({ embeds: [declineEmbed] });
                    await sentMessage.reactions.removeAll();
                }
            });

            collector.on('end', async (collected) => {
                if (collected.size === 0) {
                    // Timeout
                    const timeoutEmbed = new EmbedBuilder()
                        .setColor(colors.warning)
                        .setTitle('⏰ Duel Timeout')
                        .setDescription(`${target} didn't respond to the duel challenge in time.`)
                        .setFooter({ text: 'Duel invitation expired' })
                        .setTimestamp();

                    await sentMessage.edit({ embeds: [timeoutEmbed] });
                    await sentMessage.reactions.removeAll();
                }
            });
        });

        // Update command usage statistics
        database.updateStats(message.author.id, 'command');
    }
};

async function startDuel(message, challenger, defender, challengerStats, defenderStats, betAmount) {
    let challengerHP = challengerStats.health;
    let defenderHP = defenderStats.health;
    let round = 1;
    let battleLog = [];

    // Process bet if applicable
    if (betAmount > 0) {
        database.removeBalance(challenger.id, betAmount);
        database.removeBalance(defender.id, betAmount);
        database.updateStats(challenger.id, 'gambled', betAmount);
        database.updateStats(defender.id, 'gambled', betAmount);
    }

    const battleEmbed = new EmbedBuilder()
        .setColor(colors.primary)
        .setTitle('⚔️ Duel in Progress!')
        .setDescription(`**${challenger.username}** vs **${defender.username}**\n\nLet the battle begin!`)
        .addFields(
            {
                name: `🥊 ${challenger.username}`,
                value: `❤️ **HP:** ${challengerHP}/${challengerStats.health}`,
                inline: true
            },
            {
                name: `🛡️ ${defender.username}`,
                value: `❤️ **HP:** ${defenderHP}/${defenderStats.health}`,
                inline: true
            }
        )
        .setFooter({ text: 'Round 1 starting...' })
        .setTimestamp();

    await message.edit({ embeds: [battleEmbed] });
    await message.reactions.removeAll();

    // Battle loop
    while (challengerHP > 0 && defenderHP > 0 && round <= 10) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between rounds

        // Determine turn order (based on luck + random)
        const challengerInitiative = challengerStats.luck + Math.random() * 20;
        const defenderInitiative = defenderStats.luck + Math.random() * 20;

        let attacker, defender_in_round, attackerHP, defenderHP_in_round, attackerStats, defenderStats_in_round;

        if (challengerInitiative >= defenderInitiative) {
            attacker = challenger;
            defender_in_round = defender;
            attackerHP = challengerHP;
            defenderHP_in_round = defenderHP;
            attackerStats = challengerStats;
            defenderStats_in_round = defenderStats;
        } else {
            attacker = defender;
            defender_in_round = challenger;
            attackerHP = defenderHP;
            defenderHP_in_round = challengerHP;
            attackerStats = defenderStats;
            defenderStats_in_round = challengerStats;
        }

        // Calculate damage
        const baseDamage = attackerStats.attack + Math.random() * 20;
        const defense = defenderStats_in_round.defense + Math.random() * 10;
        const damage = Math.max(1, Math.floor(baseDamage - defense));

        // Apply damage
        if (attacker.id === challenger.id) {
            defenderHP -= damage;
            battleLog.push(`⚔️ ${attacker.username} attacks for **${damage}** damage!`);
        } else {
            challengerHP -= damage;
            battleLog.push(`🛡️ ${attacker.username} attacks for **${damage}** damage!`);
        }

        // Update battle display
        const roundEmbed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle(`⚔️ Duel - Round ${round}`)
            .setDescription(`**${challenger.username}** vs **${defender.username}**`)
            .addFields(
                {
                    name: `🥊 ${challenger.username}`,
                    value: `❤️ **HP:** ${Math.max(0, challengerHP)}/${challengerStats.health}`,
                    inline: true
                },
                {
                    name: `🛡️ ${defender.username}`,
                    value: `❤️ **HP:** ${Math.max(0, defenderHP)}/${defenderStats.health}`,
                    inline: true
                },
                {
                    name: '📜 Battle Log',
                    value: battleLog.slice(-3).join('\n') || 'Battle begins...',
                    inline: false
                }
            )
            .setFooter({ text: `Round ${round}` })
            .setTimestamp();

        await message.edit({ embeds: [roundEmbed] });

        round++;
    }

    // Determine winner
    let winner, loser;
    if (challengerHP <= 0) {
        winner = defender;
        loser = challenger;
    } else if (defenderHP <= 0) {
        winner = challenger;
        loser = defender;
    } else {
        // Timeout - higher HP wins
        if (challengerHP > defenderHP) {
            winner = challenger;
            loser = defender;
        } else {
            winner = defender;
            loser = challenger;
        }
    }

    // Process rewards
    let rewardText = '';
    if (betAmount > 0) {
        const winAmount = betAmount * 2;
        database.addBalance(winner.id, winAmount);
        database.updateStats(winner.id, 'won', betAmount);
        database.updateStats(loser.id, 'lost', betAmount);
        rewardText = `\n\n💰 **${winner.username}** wins **${winAmount.toLocaleString()}** ${config.economy.currency}!`;
    }

    // Add experience to both players
    const winnerExpGain = database.addExperience(winner.id, 50);
    const loserExpGain = database.addExperience(loser.id, 25);

    const resultEmbed = new EmbedBuilder()
        .setColor(colors.success)
        .setTitle('🏆 Duel Complete!')
        .setDescription(`**${winner.username}** defeats **${loser.username}**!${rewardText}`)
        .addFields(
            {
                name: '🥇 Winner',
                value: `${winner.username}\n+50 XP${winnerExpGain.leveledUp ? `\n🎉 Level Up! (${winnerExpGain.newLevel})` : ''}`,
                inline: true
            },
            {
                name: '🥈 Defeated',
                value: `${loser.username}\n+25 XP${loserExpGain.leveledUp ? `\n🎉 Level Up! (${loserExpGain.newLevel})` : ''}`,
                inline: true
            },
            {
                name: '📊 Final Stats',
                value: `**Rounds:** ${round - 1}\n**Duration:** ${(round - 1) * 2} seconds`,
                inline: false
            }
        )
        .setThumbnail(winner.displayAvatarURL())
        .setFooter({ text: 'Good fight! Both players gained experience.' })
        .setTimestamp();

    await message.edit({ embeds: [resultEmbed] });
}
