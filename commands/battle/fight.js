const { EmbedBuilder } = require("discord.js");
const database = require("../../utils/database.js");
const colors = require("../../utils/colors.js");
const config = require("../../config/config.js");
const itemUtils = require("./item.js");

module.exports = {
    name: "fight",
    aliases: ["battle", "combat"],
    description: "Auto-battle. Upgrade World (WL) at specific Level (AR) milestones.",
    usage: "fight [bet/upgrade]",
    cooldown: 5,
    async execute(message, args, client) {
        const userData = database.getUser(message.author.id);
        if (!userData.worldLevel) userData.worldLevel = 1;

        // --- SUBCOMMAND: UPGRADE (WL Ascension Quest) ---
        if (args[0]?.toLowerCase() === 'upgrade') {
            const nextWorld = userData.worldLevel + 1;
            const requiredLevel = userData.worldLevel * 10;
            const stats = userData.stats || {};

            // Define Quest Requirements for each World
            const quests = {
                2: { 
                    desc: "World Level 2 Ascension Quest",
                    reqs: [
                        { name: "Reach Adventure Rank 10", current: userData.level, target: 10 },
                        { name: "Win 5 Coinflips", current: stats.coinflip_win || 0, target: 5 },
                        { name: "Successfully Hunt 10 animals", current: stats.hunt_success || 0, target: 10 }
                    ]
                },
                3: {
                    desc: "World Level 3 Ascension Quest",
                    reqs: [
                        { name: "Reach Adventure Rank 20", current: userData.level, target: 20 },
                        { name: "Win 10 Blackjack games", current: stats.blackjack_win || 0, target: 10 },
                        { name: "Accumulate 50,000 riel", current: userData.balance, target: 50000 }
                    ]
                }
                // More worlds can be added here
            };

            const quest = quests[nextWorld] || {
                desc: `World Level ${nextWorld} Ascension`,
                reqs: [{ name: `Reach Adventure Rank ${requiredLevel}`, current: userData.level, target: requiredLevel }]
            };

            const allPassed = quest.reqs.every(r => r.current >= r.target);

            if (!allPassed) {
                const questList = quest.reqs.map(r => {
                    const status = r.current >= r.target ? '✅' : '❌';
                    return `${status} ${r.name} (${r.current}/${r.target})`;
                }).join('\n');

                const questEmbed = new EmbedBuilder()
                    .setColor(colors.warning)
                    .setTitle(`🚩 ${quest.desc}`)
                    .setDescription(`hg trov ka bang herp quest khang krom der thup ach upgrade ban:\n\n${questList}`)
                    .setFooter({ text: "Use other bot features to complete these tasks!" });

                return message.reply({ embeds: [questEmbed] });
            }

            if (userData.worldLevel >= 10) return message.reply("🌟 **Max World Level reached!**");

            userData.worldLevel++;
            database.saveUser(userData);
            
            const successEmbed = new EmbedBuilder()
                .setColor(colors.success)
                .setTitle("✨ WORLD LEVEL ASCENDED!")
                .setDescription(`hg lerng tov **World Level ${userData.worldLevel}** hz! Enemies are now tougher and loot is better.`)
                .setThumbnail('https://cdn-icons-png.flaticon.com/512/616/616490.png');

            return message.reply({ embeds: [successEmbed] });
        }

        // --- BATTLE LOGIC ---
        let betAmount = 0;
        if (args.length > 0) {
            betAmount = args[0].toLowerCase() === 'all' ? userData.balance : parseInt(args[0]);
            if (isNaN(betAmount) || betAmount < 0) betAmount = 0;
        }

        if (betAmount > 0) {
            if (!database.hasBalance(message.author.id, betAmount)) {
                return message.reply("💸 hg ot luy krub heh!");
            }
            database.removeBalance(message.author.id, betAmount);
        }

        const minLvl = userData.level;
        const maxLvl = userData.worldLevel * 10;
        const enemyLevel = Math.floor(Math.random() * (maxLvl - minLvl + 1)) + minLvl;

        const enemies = [
            // Genshin
            { name: "Hillichurl Warrior", emoji: "👹" }, { name: "Ruin Guard", emoji: "🤖" },
            // Honkai: Star Rail
            { name: "Antibaryon", emoji: "👾" }, { name: "Voidranger: Trampler", emoji: "🏇" },
            { name: "Silvermane Lieutenant", emoji: "🛡️" }, { name: "Automaton Direwolf", emoji: "🐺" },
            // Wuthering Waves (Wuwa)
            { name: "Crownless", emoji: "👑" }, { name: "Rocksteady Guardian", emoji: "🗿" },
            { name: "Thundering Mephis", emoji: "⚡" }, { name: "Spearback Bear", emoji: "🐻" }
        ];
        const enemyBase = enemies[Math.floor(Math.random() * enemies.length)];
        const bonuses = itemUtils.calculateEquippedBonuses(message.author.id);

        const playerState = {
            maxHp: Math.floor(userData.level * 30 + 150) + (bonuses.hp || 0),
            hp: 0,
            atk: Math.floor(userData.level * 10 + 20) + (bonuses.attack || 0),
            def: Math.floor(userData.level * 7 + 10) + (bonuses.defense || 0),
        };
        playerState.hp = playerState.maxHp;

        const enemyState = {
            maxHp: Math.floor(enemyLevel * 25 + 100),
            hp: 0,
            atk: Math.floor(enemyLevel * 12),
            def: Math.floor(enemyLevel * 6)
        };
        enemyState.hp = enemyState.maxHp;

        const createBar = (current, max, color = '■') => {
            const fill = Math.round((current / max) * 10);
            return `\`[${color.repeat(Math.max(0, fill))}${"-".repeat(Math.max(0, 10 - fill))}]\``;
        };

        const getBattleEmbed = (log = "Combat starting...") => {
            return new EmbedBuilder()
                .setColor(colors.primary)
                .setTitle(`⚔️ Adventure Rank ${userData.level} | WL ${userData.worldLevel}`)
                .setDescription(`**${message.author.username}** vs **${enemyBase.name}** (Lv.${enemyLevel})`)
                .addFields(
                    { name: `👤 Player`, value: `${createBar(playerState.hp, playerState.maxHp)} ${Math.floor((playerState.hp/playerState.maxHp)*100)}%`, inline: true },
                    { name: `${enemyBase.emoji} Enemy`, value: `${createBar(enemyState.hp, enemyState.maxHp)} ${Math.floor((enemyState.hp/enemyState.maxHp)*100)}%`, inline: true },
                    { name: '💬 Log', value: `\`\`\`md\n# ${log}\n\`\`\`` }
                );
        };

        const battleMsg = await message.reply({ embeds: [getBattleEmbed()] });
        
        // Auto Battle Loop
        let round = 1;
        while (playerState.hp > 0 && enemyState.hp > 0 && round <= 15) {
            await new Promise(r => setTimeout(r, 1200));
            let log = "";
            
            // 1/10 chance for One-Shot Critical
            const isInstaCrit = Math.random() < 0.1;
            
            if (isInstaCrit) {
                const dmg = enemyState.hp;
                enemyState.hp = 0;
                log = `✨ **EXTREME CRITICAL!** One-shot hit for ${dmg}!`;
            } else {
                const pDmg = Math.max(10, Math.floor(playerState.atk * (0.9 + Math.random() * 0.3) - enemyState.def * 0.4));
                enemyState.hp -= pDmg;
                log = `Player hits for ${pDmg}!`;
            }

            if (enemyState.hp > 0) {
                const eDmg = Math.max(8, Math.floor(enemyState.atk * (0.8 + Math.random() * 0.4) - playerState.def * 0.5));
                playerState.hp -= eDmg;
                log += `\n${enemyBase.name} counters for ${eDmg}!`;
            }

            await battleMsg.edit({ embeds: [getBattleEmbed(log)] });
            round++;
        }

        const won = enemyState.hp <= 0;
        const reward = Math.floor(enemyLevel * 60 + 100);
        const expAmt = Math.floor(enemyLevel * 8 + 20);
        const totalReward = won ? (reward + (betAmount * 2)) : 0;

        if (won) {
            database.addBalance(message.author.id, totalReward);
            database.updateStats(message.author.id, "won", betAmount);
        } else if (betAmount > 0) {
            database.updateStats(message.author.id, "lost", betAmount);
        }

        const expRes = database.addExperience(message.author.id, won ? expAmt : 5);
        const drop = (won && Math.random() <= 0.3) ? generateItem(enemyLevel) : null;

        const final = new EmbedBuilder()
            .setColor(won ? colors.success : colors.error)
            .setTitle(won ? '🏆 Combat Victory' : '💀 Defeated')
            .addFields(
                { name: '💰 Loot', value: `+${totalReward.toLocaleString()} riel`, inline: true },
                { name: '⭐ Rank Exp', value: `+${won ? expAmt : 5} XP`, inline: true },
                { name: '📈 Rank Progress', value: `${createBar(expRes.currentExp, expRes.nextExp, '▰')} ${Math.floor((expRes.currentExp/expRes.nextExp)*100)}%`, inline: false }
            );

        if (drop) {
            const id = itemUtils.addItemToInventory(message.author.id, drop);
            final.addFields({ name: `🎁 Item Drop`, value: `**${drop.name}** \`[${id}]\` (${drop.rarity})` });
        }

        if (expRes.leveledUp) final.setDescription(`🎉 **RANK INCREASED!** You are now **Adventure Rank ${expRes.newLevel}**!`);

        await battleMsg.edit({ embeds: [final] });
        database.updateStats(message.author.id, "command");
    }
};

function generateItem(lvl) {
    const rarities = [
        { name: 'C', fullName: 'Common', weight: 60, mult: 1 },
        { name: 'R', fullName: 'Rare', weight: 25, mult: 1.5 },
        { name: 'E', fullName: 'Epic', weight: 10, mult: 2.2 },
        { name: 'L', fullName: 'Legendary', weight: 4, mult: 3.5 },
        { name: 'G', fullName: 'GODLY', weight: 1, mult: 6 }
    ];
    let rand = Math.random() * 100;
    let rarity = rarities[0];
    let cum = 0;
    for (const r of rarities) {
        cum += r.weight;
        if (rand <= cum) { rarity = r; break; }
    }

    const types = [
        { type: "Wpn", fullName: "Weapon", perks: ["Crit DMG", "ATK%", "Vampirism"] },
        { type: "Arm", fullName: "Armor", perks: ["DEF%", "HP%", "Thorns"] },
        { type: "Shoe", fullName: "Shoe", perks: ["Speed", "Stamina Recovery", "Evasion"] }
    ];
    const t = types[Math.floor(Math.random() * types.length)];
    const perk = t.perks[Math.floor(Math.random() * t.perks.length)];
    const mult = Math.max(1, Math.floor(lvl / 5)) * rarity.mult;

    return {
        name: `${rarity.name}-${t.type}`,
        type: t.fullName,
        rarity: rarity.fullName,
        perk: `✨ ${perk}`,
        bonus: {
            attack: t.fullName === "Weapon" ? Math.floor(10 * mult) : 0,
            defense: t.fullName === "Armor" ? Math.floor(8 * mult) : 0,
            hp: t.fullName === "Armor" ? Math.floor(50 * mult) : 0,
            speed: t.fullName === "Shoe" ? Math.floor(5 * mult) : 0
        }
    };
}