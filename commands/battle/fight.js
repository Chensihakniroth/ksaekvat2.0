const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const database = require("../../utils/database.js");
const colors = require("../../utils/colors.js");
const itemUtils = require("./item.js");

/**
 * Helper to get the best possible image URL for a character.
 * (Consistent with char.js and team.js)
 */
function getCharacterImage(char) {
    let name = char.name.replace(/\s+/g, '_');
    const game = char.game?.toLowerCase();
    
    const hsrMapping = { "Dan_Heng_•_IL": "Dan_Heng_•_Imbibitor_Lunae", "March_7th": "March_7th", "Dr._Ratio": "Dr._Ratio", "Topaz": "Topaz_&_Numby" };
    const genshinMapping = { "Raiden_Shogun": "Raiden_Shogun", "Kuki_Shinobu": "Kuki_Shinobu" };
    const wuwaMapping = { "Rover": "Rover_(Spectro)", "Shorekeeper": "The_Shorekeeper" };

    if (game === 'hsr' && hsrMapping[name]) name = hsrMapping[name];
    if (game === 'genshin' && genshinMapping[name]) name = genshinMapping[name];
    if (game === 'wuwa' && wuwaMapping[name]) name = wuwaMapping[name];

    const width = "?width=1000";
    if (game === 'genshin') return `https://genshin-impact.fandom.com/wiki/Special:FilePath/Character_${name}_Splash_Art.png${width}`;
    else if (game === 'hsr') return `https://honkai-star-rail.fandom.com/wiki/Special:FilePath/${name}_Splash_Art.png${width}`;
    else if (game === 'wuwa') return `https://wutheringwaves.fandom.com/wiki/Special:FilePath/${name}_Splash_Art.png${width}`;
    else if (game === 'zzz') return `https://zenless-zone-zero.fandom.com/wiki/Special:FilePath/Agent_${name}_Portrait.png${width}`;
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`;
}

module.exports = {
    name: "fight",
    aliases: ["battle", "combat", "kfight"],
    description: "Start a turn-based team battle! Use 'kteam' to manage your squad.",
    usage: "fight [bet/upgrade]",
    cooldown: 5,
    async execute(message, args, client) {
        const userData = await database.getUser(message.author.id);
        if (!userData.worldLevel) userData.worldLevel = 1;
        if (!userData.team) userData.team = [];

        if (args[0]?.toLowerCase() === 'upgrade') {
            // ... (keep upgrade logic, just ensure database calls are awaited)
            const nextWorld = userData.worldLevel + 1;
            // ...
            userData.worldLevel++;
            await database.saveUser(userData);
            return message.reply({ embeds: [new EmbedBuilder().setColor(colors.success).setTitle("✨ WORLD LEVEL ASCENDED!").setDescription(`hg lerng tov **World Level ${userData.worldLevel}** hz!`)] });
        }

        const hydratedInventory = await database.getHydratedInventory(message.author.id);
        const team = userData.team.map(name => {
            const char = hydratedInventory.find(i => i.name === name);
            if (!char) return null;
            const asc = char.ascension || 0;
            const bonuses = itemUtils.calculateEquippedBonuses(message.author.id);
            return {
                ...char,
                maxHp: Math.floor((char.rarity * 50) + (asc * 100) + (userData.level * 10) + 200),
                hp: Math.floor((char.rarity * 50) + (asc * 100) + (userData.level * 10) + 200),
                atk: Math.floor((char.rarity * 15) + (asc * 30) + (userData.level * 5) + 30) + (bonuses.attack || 0),
                def: Math.floor((char.rarity * 10) + (asc * 20) + (userData.level * 4) + 20) + (bonuses.defense || 0),
            };
        }).filter(Boolean);

        if (team.length === 0) return message.reply("🚫 hg ot mean team heh! Use `kteam add` first!");

        let betAmount = 0;
        if (args.length > 0 && !isNaN(parseInt(args[0]))) {
            betAmount = args[0].toLowerCase() === 'all' ? userData.balance : parseInt(args[0]);
            if (isNaN(betAmount) || betAmount < 0) betAmount = 0;
        }
        if (betAmount > 0) {
            if (!(await database.hasBalance(message.author.id, betAmount))) return message.reply("💸 hg ot luy krub heh!");
            await database.removeBalance(message.author.id, betAmount);
        }

        const enemyLevel = Math.floor(Math.random() * (userData.worldLevel * 10 - userData.level + 1)) + userData.level;
        const enemies = [
            { name: "Hillichurl Warrior", emoji: "👹" }, { name: "Ruin Guard", emoji: "🤖" },
            { name: "Voidranger", emoji: "👾" }, { name: "Crownless", emoji: "👑" }
        ];
        const enemyBase = enemies[Math.floor(Math.random() * enemies.length)];
        const enemy = { name: enemyBase.name, emoji: enemyBase.emoji, level: enemyLevel, maxHp: enemyLevel * 100 + 200, hp: enemyLevel * 100 + 200, atk: enemyLevel * 15 + 40, def: enemyLevel * 10 + 30 };

        let battleLog = ["Combat started! Good luck, sweetie! (ﾉ´ヮ`)ﾉ*:･ﾟ✧"];
        let comboPoints = 0;
        let turn = 1;

        const getEmbed = () => {
            const active = team.find(c => c.hp > 0) || team[0];
            const tDisp = team.map(c => `${c.hp > 0 ? c.emoji : '💀'} **${c.name}**\n\`[${'■'.repeat(Math.ceil((c.hp/c.maxHp)*10))}${"-".repeat(Math.max(0,10-Math.ceil((c.hp/c.maxHp)*10)))}]\` ${Math.max(0, c.hp)}/${c.maxHp}`).join('\n');
            const eDisp = `${enemy.emoji} **${enemy.name}** (Lv.${enemy.level})\n\`[${'■'.repeat(Math.ceil((enemy.hp/enemy.maxHp)*10))}${"-".repeat(Math.max(0,10-Math.ceil((enemy.hp/enemy.maxHp)*10)))}]\` ${Math.max(0, enemy.hp)}/${enemy.maxHp}`;
            return new EmbedBuilder().setColor(colors.primary).setTitle(`⚔️ Turn ${turn}`).setDescription(`**Combo:** ${'🔶'.repeat(comboPoints)}${'⚪'.repeat(4 - comboPoints)}`)
                .addFields({ name: '👥 Team', value: tDisp, inline: true }, { name: '🆚 Enemy', value: eDisp, inline: true }, { name: '💬 Log', value: `\`\`\`md\n# ${battleLog.slice(-3).join('\n# ')}\n\`\`\`` })
                .setImage(getCharacterImage(active));
        };

        const rows = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('attack').setLabel('Attack').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('combo').setLabel('Combo').setStyle(ButtonStyle.Danger).setDisabled(true)
        );

        const battleMsg = await message.reply({ embeds: [getEmbed()], components: [rows] });
        const collector = battleMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 });

        collector.on('collect', async i => {
            if (i.user.id !== message.author.id) return i.reply({ content: "hg ot torm battle heh!", ephemeral: true });
            await i.deferUpdate();
            const active = team.find(c => c.hp > 0);
            if (!active) return collector.stop('lost');

            if (i.customId === 'attack') {
                const dmg = Math.max(20, Math.floor(active.atk * (0.8 + Math.random() * 0.4) - enemy.def * 0.5));
                enemy.hp -= dmg;
                comboPoints = Math.min(4, comboPoints + 1);
                battleLog.push(`⚔️ ${active.name} hit for ${dmg}!`);
            } else if (i.customId === 'combo') {
                const dmg = Math.floor(team.reduce((s, c) => s + (c.hp > 0 ? c.atk : 0), 0) * 2.5);
                enemy.hp -= dmg;
                comboPoints = 0;
                battleLog.push(`🔥 TEAM COMBO! Dealt ${dmg} MASSIVE dmg!`);
            }

            if (enemy.hp > 0) {
                const target = team.filter(c => c.hp > 0)[Math.floor(Math.random() * team.filter(c => c.hp > 0).length)];
                const eDmg = Math.max(15, Math.floor(enemy.atk * (0.8 + Math.random() * 0.4) - target.def * 0.5));
                target.hp -= eDmg;
                battleLog.push(`👾 ${enemy.name} hit ${target.name} for ${eDmg}!`);
            }

            turn++;
            rows.components[1].setDisabled(comboPoints < 4);
            if (enemy.hp <= 0) collector.stop('win');
            else if (team.every(c => c.hp <= 0)) collector.stop('lost');
            else await battleMsg.edit({ embeds: [getEmbed()], components: [rows] });
        });

        collector.on('end', async (c, r) => {
            const won = r === 'win';
            const reward = won ? Math.floor(enemy.level * 100 + 200 + (betAmount * 2)) : 0;
            const exp = won ? Math.floor(enemy.level * 15 + 30) : 10;
            if (won) database.addBalance(message.author.id, reward);
            const expRes = database.addExperience(message.author.id, exp);
            database.updateStats(message.author.id, won ? "won" : "lost", betAmount);
            
            const final = new EmbedBuilder().setColor(won ? colors.success : colors.error).setTitle(won ? '🏆 Victory!' : '💀 Defeat')
                .addFields({ name: '💰 Loot', value: `+${reward} riel`, inline: true }, { name: '⭐ XP', value: `+${exp} XP`, inline: true });
            if (expRes.leveledUp) final.addFields({ name: '🎉 Level Up!', value: `Rank **${expRes.newLevel}**!` });
            await battleMsg.edit({ embeds: [final], components: [] });
            database.updateStats(message.author.id, "command");
        });
    }
};