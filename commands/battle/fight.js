const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const database = require("../../utils/database.js");
const colors = require("../../utils/colors.js");
const itemUtils = require("./item.js");

// --- UTILS: Character Image Mapping ---
function getSplashArt(char) {
    const name = char.name.replace(/\s+/g, '_');
    const game = char.game.toLowerCase();
    
    if (game === 'genshin') {
        // Common pattern for Genshin Splash Art (Official Wiki/Fan sites)
        return `https://api.ambr.top/assets/UI/UI_Gacha_AvatarIcon_${name}.png`;
    } else if (game === 'hsr') {
        return `https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/icon/character/1001.png`; // Fallback to March 7th for now
    } else if (game === 'wuwa') {
        return `https://api.dicebear.com/7.x/identicon/svg?seed=${name}`; // Fallback for WuWa
    }
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`;
}

module.exports = {
    name: "fight",
    aliases: ["battle", "combat", "kfight"],
    description: "Turn-based combat with your team! Use 'kfight team' to manage your squad.",
    usage: "fight [bet/upgrade/team/add/remove]",
    cooldown: 5,
    async execute(message, args, client) {
        const userData = database.getUser(message.author.id);
        if (!userData.worldLevel) userData.worldLevel = 1;
        if (!userData.team) userData.team = [];

        const sub = args[0]?.toLowerCase();

        // --- SUBCOMMAND: TEAM MANAGEMENT ---
        if (sub === 'team') {
            const embed = new EmbedBuilder()
                .setColor(colors.primary)
                .setTitle(`🛡️ ${message.author.username}'s Battle Team`)
                .setDescription("hg ach dak character hz hz luy hz luy ban hz! (4 slots max)");

            if (userData.team.length === 0) {
                embed.addFields({ name: "Team Status", value: "hg ot torm team heh! Use `kfight add <name>` to add characters." });
            }

            userData.team.forEach((char, index) => {
                const starIcon = char.rarity === 5 ? '🔶' : (char.rarity === 4 ? '🔷' : '⚪');
                embed.addFields({
                    name: `Slot ${index + 1}: ${char.emoji} ${char.name}`,
                    value: `${starIcon} Rarity: ${char.rarity}★ | Game: ${char.game}`,
                    inline: true
                });
            });

            // If there's at least one char, show the splash art of the leader (first slot)
            if (userData.team.length > 0) {
                embed.setImage(getSplashArt(userData.team[0]));
            }

            return message.reply({ embeds: [embed] });
        }

        // --- SUBCOMMAND: ADD TO TEAM ---
        if (sub === 'add') {
            const charName = args.slice(1).join(' ').toLowerCase();
            if (!charName) return message.reply("❓ hg jong add nak na? Example: `kfight add Raiden Shogun` (ﾉ´ヮ`)ﾉ*:･ﾟ✧");

            if (userData.team.length >= 4) return message.reply("🚫 Team hg korn hz! (Max 4 slots)");

            const inventory = userData.gacha_inventory || [];
            const found = inventory.find(c => c.name.toLowerCase().includes(charName));

            if (!found) return message.reply(`❌ hg ot mean character **${charName}** knong inventory heh!`);
            
            // Check if already in team
            if (userData.team.some(c => c.name === found.name)) return message.reply("🚫 character ng mean hz knong team!");

            userData.team.push(found);
            database.saveUser(userData);

            const embed = new EmbedBuilder()
                .setColor(colors.success)
                .setTitle("✅ Character Added!")
                .setDescription(`hg add **${found.name}** tov team hz!`)
                .setThumbnail(getSplashArt(found));

            return message.reply({ embeds: [embed] });
        }

        // --- SUBCOMMAND: REMOVE FROM TEAM ---
        if (sub === 'remove') {
            const slot = parseInt(args[1]);
            if (isNaN(slot) || slot < 1 || slot > userData.team.length) {
                return message.reply(`❓ hg jong remove slot na? (1-${userData.team.length})`);
            }

            const removed = userData.team.splice(slot - 1, 1);
            database.saveUser(userData);

            return message.reply(`✅ Removed **${removed[0].name}** from your team! (◕‿◕✿)`);
        }

        // --- SUBCOMMAND: UPGRADE (WL Ascension Quest) ---
        if (sub === 'upgrade') {
            // Keep existing upgrade logic...
            const nextWorld = userData.worldLevel + 1;
            const requiredLevel = userData.worldLevel * 10;
            const stats = userData.stats || {};

            const quests = {
                2: { desc: "World Level 2 Ascension Quest", reqs: [{ name: "Reach Adventure Rank 10", current: userData.level, target: 10 }, { name: "Win 5 Coinflips", current: stats.coinflip_win || 0, target: 5 }, { name: "Successfully Hunt 10 animals", current: stats.hunt_success || 0, target: 10 }] },
                3: { desc: "World Level 3 Ascension Quest", reqs: [{ name: "Reach Adventure Rank 20", current: userData.level, target: 20 }, { name: "Win 10 Blackjack games", current: stats.blackjack_win || 0, target: 10 }, { name: "Accumulate 50,000 riel", current: userData.balance, target: 50000 }] }
            };

            const quest = quests[nextWorld] || { desc: `World Level ${nextWorld} Ascension`, reqs: [{ name: `Reach Adventure Rank ${requiredLevel}`, current: userData.level, target: requiredLevel }] };
            const allPassed = quest.reqs.every(r => r.current >= r.target);

            if (!allPassed) {
                const questList = quest.reqs.map(r => `${r.current >= r.target ? '✅' : '❌'} ${r.name} (${r.current}/${r.target})`).join('\n');
                return message.reply({ embeds: [new EmbedBuilder().setColor(colors.warning).setTitle(`🚩 ${quest.desc}`).setDescription(`hg trov ka bang herp quest khang krom der thup ach upgrade ban:\n\n${questList}`).setFooter({ text: "Use other bot features to complete these tasks!" })] });
            }

            if (userData.worldLevel >= 10) return message.reply("🌟 **Max World Level reached!**");
            userData.worldLevel++;
            database.saveUser(userData);
            return message.reply({ embeds: [new EmbedBuilder().setColor(colors.success).setTitle("✨ WORLD LEVEL ASCENDED!").setDescription(`hg lerng tov **World Level ${userData.worldLevel}** hz! Enemies are now tougher and loot is better.`)] });
        }

        // --- BATTLE LOGIC ---
        if (userData.team.length === 0) {
            return message.reply("🚫 hg ot mean team krub fighting heh! Use `kfight add` first! (｡•́︿•̀｡)");
        }

        let betAmount = 0;
        if (args.length > 0 && !isNaN(parseInt(args[0]))) {
            betAmount = args[0].toLowerCase() === 'all' ? userData.balance : parseInt(args[0]);
            if (isNaN(betAmount) || betAmount < 0) betAmount = 0;
        }

        if (betAmount > 0) {
            if (!database.hasBalance(message.author.id, betAmount)) return message.reply("💸 hg ot luy krub heh!");
            database.removeBalance(message.author.id, betAmount);
        }

        // Initialize Team Stats
        const bonuses = itemUtils.calculateEquippedBonuses(message.author.id);
        const team = userData.team.map(char => ({
            ...char,
            maxHp: Math.floor((char.rarity * 50) + (userData.level * 10) + 200),
            hp: Math.floor((char.rarity * 50) + (userData.level * 10) + 200),
            atk: Math.floor((char.rarity * 15) + (userData.level * 5) + 30) + (bonuses.attack || 0),
            def: Math.floor((char.rarity * 10) + (userData.level * 4) + 20) + (bonuses.defense || 0),
        }));

        // Enemy Setup
        const enemyLevel = Math.floor(Math.random() * (userData.worldLevel * 10 - userData.level + 1)) + userData.level;
        const enemies = [
            { name: "Hillichurl Warrior", emoji: "👹" }, { name: "Ruin Guard", emoji: "🤖" },
            { name: "Antibaryon", emoji: "👾" }, { name: "Voidranger: Trampler", emoji: "🏇" },
            { name: "Silvermane Lieutenant", emoji: "🛡️" }, { name: "Automaton Direwolf", emoji: "🐺" },
            { name: "Crownless", emoji: "👑" }, { name: "Rocksteady Guardian", emoji: "🗿" }
        ];
        const enemyBase = enemies[Math.floor(Math.random() * enemies.length)];
        const enemy = {
            name: enemyBase.name,
            emoji: enemyBase.emoji,
            level: enemyLevel,
            maxHp: Math.floor(enemyLevel * 100 + 200),
            hp: Math.floor(enemyLevel * 100 + 200),
            atk: Math.floor(enemyLevel * 15 + 40),
            def: Math.floor(enemyLevel * 10 + 30)
        };

        let battleLog = ["Combat started! Good luck, sweetie! (ﾉ´ヮ`)ﾉ*:･ﾟ✧"];
        let comboPoints = 0;
        let turn = 1;

        const getBattleEmbed = () => {
            const activeMember = team.find(c => c.hp > 0) || team[0];
            const teamDisplay = team.map(c => 
                `${c.hp > 0 ? c.emoji : '💀'} **${c.name}**\n\`[${'■'.repeat(Math.ceil((c.hp/c.maxHp)*10))}${"-".repeat(10-Math.ceil((c.hp/c.maxHp)*10))}]\` ${Math.max(0, c.hp)}/${c.maxHp}`
            ).join('\n');

            const enemyDisplay = `${enemy.emoji} **${enemy.name}** (Lv.${enemy.level})\n\`[${'■'.repeat(Math.ceil((enemy.hp/enemy.maxHp)*10))}${"-".repeat(10-Math.ceil((enemy.hp/enemy.maxHp)*10))}]\` ${Math.max(0, enemy.hp)}/${enemy.maxHp}`;

            return new EmbedBuilder()
                .setColor(colors.primary)
                .setTitle(`⚔️ Turn ${turn} | Team Battle`)
                .setDescription(`**Combo Points:** ${'🔶'.repeat(comboPoints)}${'⚪'.repeat(4 - comboPoints)}`)
                .addFields(
                    { name: '👥 Your Team', value: teamDisplay, inline: true },
                    { name: '🆚 Enemy', value: enemyDisplay, inline: true },
                    { name: '💬 Log', value: `\`\`\`md\n# ${battleLog.slice(-3).join('\n# ')}\n\`\`\`` }
                )
                .setImage(getSplashArt(activeMember));
        };

        const rows = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('attack').setLabel('Attack').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('combo').setLabel('Combo Attack').setStyle(ButtonStyle.Danger).setDisabled(true)
        );

        const battleMsg = await message.reply({ embeds: [getBattleEmbed()], components: [rows] });

        const collector = battleMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

        collector.on('collect', async i => {
            if (i.user.id !== message.author.id) return i.reply({ content: "hg ot torm krorng battle ng heh!", ephemeral: true });

            await i.deferUpdate();

            let logEntry = "";
            const activeMember = team.find(c => c.hp > 0);
            if (!activeMember) return collector.stop('lost');

            if (i.customId === 'attack') {
                const dmg = Math.max(20, Math.floor(activeMember.atk * (0.8 + Math.random() * 0.4) - enemy.def * 0.5));
                enemy.hp -= dmg;
                comboPoints = Math.min(4, comboPoints + 1);
                logEntry = `⚔️ ${activeMember.name} dealt ${dmg} dmg!`;
            } else if (i.customId === 'combo') {
                const totalAtk = team.reduce((sum, c) => sum + (c.hp > 0 ? c.atk : 0), 0);
                const dmg = Math.floor(totalAtk * 2.5);
                enemy.hp -= dmg;
                comboPoints = 0;
                logEntry = `🔥 TEAM COMBO! Dealt ${dmg} MASSIVE dmg!`;
            }

            // Enemy Turn
            if (enemy.hp > 0) {
                const target = team.filter(c => c.hp > 0)[Math.floor(Math.random() * team.filter(c => c.hp > 0).length)];
                const eDmg = Math.max(15, Math.floor(enemy.atk * (0.8 + Math.random() * 0.4) - target.def * 0.5));
                target.hp -= eDmg;
                logEntry += `\n👾 ${enemy.name} hit ${target.name} for ${eDmg}!`;
            }

            battleLog.push(logEntry);
            turn++;

            // Update buttons
            rows.components[1].setDisabled(comboPoints < 4);

            if (enemy.hp <= 0) {
                collector.stop('win');
            } else if (team.every(c => c.hp <= 0)) {
                collector.stop('lost');
            } else {
                await battleMsg.edit({ embeds: [getBattleEmbed()], components: [rows] });
            }
        });

        collector.on('end', async (collected, reason) => {
            const won = reason === 'win';
            const reward = Math.floor(enemy.level * 100 + 200);
            const expAmt = Math.floor(enemy.level * 15 + 30);
            const totalReward = won ? (reward + (betAmount * 2)) : 0;

            if (won) {
                database.addBalance(message.author.id, totalReward);
                database.updateStats(message.author.id, "won", betAmount);
            } else if (betAmount > 0) {
                database.updateStats(message.author.id, "lost", betAmount);
            }

            const expRes = database.addExperience(message.author.id, won ? expAmt : 10);
            
            const finalEmbed = new EmbedBuilder()
                .setColor(won ? colors.success : colors.error)
                .setTitle(won ? '🏆 Combat Victory!' : '💀 Team Wiped Out')
                .setDescription(won ? `hg hov hz! Team hg pkae krob hz.` : `hg sov klang der pnh hz... (｡•́︿•̀｡)`)
                .addFields(
                    { name: '💰 Loot', value: `+${totalReward.toLocaleString()} riel`, inline: true },
                    { name: '⭐ Rank Exp', value: `+${won ? expAmt : 10} XP`, inline: true }
                );

            if (expRes.leveledUp) finalEmbed.addFields({ name: '🎉 Level Up!', value: `You are now Adventure Rank **${expRes.newLevel}**!` });

            await battleMsg.edit({ embeds: [finalEmbed], components: [] });
            database.updateStats(message.author.id, "command");
        });
    }
};

function generateItem(lvl) {
    // Keep item generation the same or move to a separate utility if needed
    // ...
}