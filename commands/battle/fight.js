const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
    name: 'fight',
    aliases: ['battle', 'combat'],
    description: 'Fight against a random opponent',
    usage: 'fight [bet_amount]',
    cooldown: 20000, // 20 seconds
    execute(message, args, client) {
        // Parse bet amount (optional)
        let betAmount = 0;
        if (args.length > 0) {
            betAmount = parseInt(args[0]);
            if (isNaN(betAmount) || betAmount < 0) {
                betAmount = 0;
            }
        }

        // Check if user has enough balance for bet
        const userData = database.getUser(message.author.id);
        
        if (betAmount > 0) {
            if (!database.hasBalance(message.author.id, betAmount)) {
                return message.reply({
                    embeds: [{
                        color: colors.error,
                        title: '💸 Insufficient Funds',
                        description: `You don't have enough ${config.economy.currency} to bet!\n**Your Balance:** ${userData.balance.toLocaleString()} ${config.economy.currency}\n**Required:** ${betAmount.toLocaleString()} ${config.economy.currency}`,
                        timestamp: new Date()
                    }]
                });
            }
            
            // Remove bet amount
            database.removeBalance(message.author.id, betAmount);
            database.updateStats(message.author.id, 'gambled', betAmount);
        }

        // Generate random enemy
        const enemies = [
            { name: 'Goblin Warrior', emoji: '👹', level: Math.max(1, userData.level - 2), difficulty: 0.8 },
            { name: 'Skeleton Fighter', emoji: '💀', level: Math.max(1, userData.level - 1), difficulty: 0.9 },
            { name: 'Orc Berserker', emoji: '👺', level: userData.level, difficulty: 1.0 },
            { name: 'Dark Knight', emoji: '⚔️', level: userData.level + 1, difficulty: 1.1 },
            { name: 'Shadow Assassin', emoji: '🥷', level: userData.level + 1, difficulty: 1.2 },
            { name: 'Fire Elemental', emoji: '🔥', level: userData.level + 2, difficulty: 1.3 },
            { name: 'Ice Giant', emoji: '🧊', level: userData.level + 2, difficulty: 1.4 },
            { name: 'Dragon Wyrmling', emoji: '🐉', level: userData.level + 3, difficulty: 1.5 }
        ];

        // Select random enemy based on user level
        const enemy = enemies[Math.floor(Math.random() * enemies.length)];

        // Calculate player stats
        const playerStats = {
            attack: Math.floor(userData.level * 10 + userData.experience / 100),
            defense: Math.floor(userData.level * 8 + userData.experience / 150),
            health: Math.floor(userData.level * 15 + 100),
            luck: Math.floor(userData.level * 2)
        };

        // Calculate enemy stats
        const enemyStats = {
            attack: Math.floor(enemy.level * 10 * enemy.difficulty),
            defense: Math.floor(enemy.level * 8 * enemy.difficulty),
            health: Math.floor(enemy.level * 15 * enemy.difficulty + 80),
            luck: Math.floor(enemy.level * 2)
        };

        const battleEmbed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle('⚔️ Random Battle!')
            .setDescription(`${message.author.username} encounters a wild **${enemy.name}**!`)
            .addFields(
                {
                    name: `🥊 ${message.author.username}`,
                    value: [
                        `**Level:** ${userData.level}`,
                        `**Attack:** ${playerStats.attack}`,
                        `**Defense:** ${playerStats.defense}`,
                        `**Health:** ${playerStats.health}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: `${enemy.emoji} ${enemy.name}`,
                    value: [
                        `**Level:** ${enemy.level}`,
                        `**Attack:** ${enemyStats.attack}`,
                        `**Defense:** ${enemyStats.defense}`,
                        `**Health:** ${enemyStats.health}`
                    ].join('\n'),
                    inline: true
                }
            );

        if (betAmount > 0) {
            battleEmbed.addFields({
                name: '💰 Stakes',
                value: `**Bet:** ${betAmount.toLocaleString()} ${config.economy.currency}\n**Potential Win:** ${(betAmount * 2).toLocaleString()} ${config.economy.currency}`,
                inline: false
            });
        }

        battleEmbed.setFooter({ 
            text: 'Battle starting in 3 seconds...',
            iconURL: message.author.displayAvatarURL()
        }).setTimestamp();

        message.reply({ embeds: [battleEmbed] }).then(async (sentMessage) => {
            await new Promise(resolve => setTimeout(resolve, 3000));
            await startPvEBattle(sentMessage, message.author, enemy, playerStats, enemyStats, betAmount);
        });

        // Update command usage statistics
        database.updateStats(message.author.id, 'command');
    }
};

async function startPvEBattle(message, player, enemy, playerStats, enemyStats, betAmount) {
    let playerHP = playerStats.health;
    let enemyHP = enemyStats.health;
    let round = 1;
    let battleLog = [];

    // Battle loop
    while (playerHP > 0 && enemyHP > 0 && round <= 15) {
        await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 second delay between rounds

        // Determine turn order (based on luck + random)
        const playerInitiative = playerStats.luck + Math.random() * 20;
        const enemyInitiative = enemyStats.luck + Math.random() * 20;

        if (playerInitiative >= enemyInitiative) {
            // Player attacks first
            const baseDamage = playerStats.attack + Math.random() * 15;
            const defense = enemyStats.defense + Math.random() * 8;
            const damage = Math.max(1, Math.floor(baseDamage - defense));
            
            enemyHP -= damage;
            battleLog.push(`⚔️ You attack for **${damage}** damage!`);
            
            // Enemy counterattack if still alive
            if (enemyHP > 0) {
                const enemyBaseDamage = enemyStats.attack + Math.random() * 15;
                const playerDefense = playerStats.defense + Math.random() * 8;
                const enemyDamage = Math.max(1, Math.floor(enemyBaseDamage - playerDefense));
                
                playerHP -= enemyDamage;
                battleLog.push(`${enemy.emoji} ${enemy.name} attacks for **${enemyDamage}** damage!`);
            }
        } else {
            // Enemy attacks first
            const enemyBaseDamage = enemyStats.attack + Math.random() * 15;
            const playerDefense = playerStats.defense + Math.random() * 8;
            const enemyDamage = Math.max(1, Math.floor(enemyBaseDamage - playerDefense));
            
            playerHP -= enemyDamage;
            battleLog.push(`${enemy.emoji} ${enemy.name} attacks for **${enemyDamage}** damage!`);
            
            // Player counterattack if still alive
            if (playerHP > 0) {
                const baseDamage = playerStats.attack + Math.random() * 15;
                const defense = enemyStats.defense + Math.random() * 8;
                const damage = Math.max(1, Math.floor(baseDamage - defense));
                
                enemyHP -= damage;
                battleLog.push(`⚔️ You attack for **${damage}** damage!`);
            }
        }

        // Update battle display
        const roundEmbed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle(`⚔️ Battle - Round ${round}`)
            .setDescription(`**${player.username}** vs **${enemy.name}**`)
            .addFields(
                {
                    name: `🥊 ${player.username}`,
                    value: `❤️ **HP:** ${Math.max(0, playerHP)}/${playerStats.health}`,
                    inline: true
                },
                {
                    name: `${enemy.emoji} ${enemy.name}`,
                    value: `❤️ **HP:** ${Math.max(0, enemyHP)}/${enemyStats.health}`,
                    inline: true
                },
                {
                    name: '📜 Battle Log',
                    value: battleLog.slice(-4).join('\n') || 'Battle begins...',
                    inline: false
                }
            )
            .setFooter({ text: `Round ${round}` })
            .setTimestamp();

        await message.edit({ embeds: [roundEmbed] });

        round++;
    }

    // Determine winner
    const playerWon = enemyHP <= 0;
    
    let resultEmbed;
    
    if (playerWon) {
        // Player victory
        let rewardAmount = Math.floor(enemy.level * 50 + Math.random() * 200);
        let expReward = Math.floor(enemy.level * 20 + 30);
        
        // Apply money booster if active
        const moneyBooster = database.getActiveBooster(player.id, 'money');
        if (moneyBooster) {
            rewardAmount = Math.floor(rewardAmount * moneyBooster.multiplier);
        }
        
        // Add bet winnings if applicable
        let totalReward = rewardAmount;
        if (betAmount > 0) {
            totalReward += betAmount * 2; // Return bet + winnings
            database.updateStats(player.id, 'won', betAmount);
        }
        
        const newBalance = database.addBalance(player.id, totalReward);
        const expGain = database.addExperience(player.id, expReward);

        resultEmbed = new EmbedBuilder()
            .setColor(colors.success)
            .setTitle('🏆 Victory!')
            .setDescription(`You defeated the **${enemy.name}**!`)
            .addFields(
                {
                    name: '💰 Rewards',
                    value: [
                        `**Battle Loot:** ${rewardAmount.toLocaleString()} ${config.economy.currency}`,
                        betAmount > 0 ? `**Bet Winnings:** ${(betAmount * 2).toLocaleString()} ${config.economy.currency}` : '',
                        `**Total Earned:** ${totalReward.toLocaleString()} ${config.economy.currency}`,
                        `**New Balance:** ${newBalance.toLocaleString()} ${config.economy.currency}`
                    ].filter(Boolean).join('\n'),
                    inline: true
                },
                {
                    name: '⭐ Experience',
                    value: [
                        `**XP Gained:** +${expReward}`,
                        expGain.leveledUp ? `🎉 **Level Up!** (${expGain.newLevel})` : `**Current Level:** ${database.getUser(player.id).level}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '📊 Battle Stats',
                    value: [
                        `**Rounds:** ${round - 1}`,
                        `**Final HP:** ${Math.max(0, playerHP)}/${playerStats.health}`,
                        `**Enemy Defeated:** ${enemy.name} (Lv.${enemy.level})`
                    ].join('\n'),
                    inline: false
                }
            );
    } else {
        // Player defeat
        if (betAmount > 0) {
            database.updateStats(player.id, 'lost', betAmount);
        }

        // Small consolation experience
        const expGain = database.addExperience(player.id, 10);

        resultEmbed = new EmbedBuilder()
            .setColor(colors.error)
            .setTitle('💀 Defeat!')
            .setDescription(`You were defeated by the **${enemy.name}**...`)
            .addFields(
                {
                    name: '💸 Losses',
                    value: betAmount > 0 ? 
                        `**Lost Bet:** ${betAmount.toLocaleString()} ${config.economy.currency}` :
                        'No money was lost in this battle.',
                    inline: true
                },
                {
                    name: '⭐ Consolation XP',
                    value: [
                        `**XP Gained:** +10`,
                        expGain.leveledUp ? `🎉 **Level Up!** (${expGain.newLevel})` : `**Current Level:** ${database.getUser(player.id).level}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '📊 Battle Stats',
                    value: [
                        `**Rounds Survived:** ${round - 1}`,
                        `**Enemy HP Left:** ${Math.max(0, enemyHP)}/${enemyStats.health}`,
                        `**Enemy:** ${enemy.name} (Lv.${enemy.level})`
                    ].join('\n'),
                    inline: false
                }
            );
    }

    resultEmbed.setThumbnail(playerWon ? player.displayAvatarURL() : null)
        .setFooter({ 
            text: playerWon ? 'Great victory! Train more to fight stronger enemies.' : 'Better luck next time! Keep training to get stronger.',
            iconURL: player.displayAvatarURL()
        })
        .setTimestamp();

    await message.edit({ embeds: [resultEmbed] });
}
