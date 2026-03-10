const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
} = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
const itemUtils = require('./item.js');
const { getCharacterImage } = require('../../utils/images.js');
const CombatService = require('../../services/CombatService.js');
const EconomyService = require('../../services/EconomyService').default || require('../../services/EconomyService');

module.exports = {
  name: 'fight',
  aliases: ['battle', 'combat', 'kfight'],
  description: "Start a turn-based team battle! Use 'kteam' to manage your squad.",
  usage: 'fight [bet/upgrade]',
  cooldown: 5,
  async execute(message, args, client) {
    const userData = await database.getUser(message.author.id, message.author.username);
    if (!userData.worldLevel) userData.worldLevel = 1;
    if (!userData.team) userData.team = [];

    // --- SUBCOMMAND: UPGRADE ---
    if (args[0]?.toLowerCase() === 'upgrade') {
      const nextWorld = userData.worldLevel + 1;
      const cost = nextWorld * 50000;
      if (!(await database.hasBalance(message.author.id, cost))) {
        return message.reply(
          `Oh darling, you don't have enough coins... (｡•́︿•̀｡) To reach World Level ${nextWorld}, you need **${EconomyService.format(cost)}** <:coin:1480551418464305163>. (っ˘ω˘ς)`
        );
      }
      await database.removeBalance(message.author.id, cost);
      userData.worldLevel++;
      await database.saveUser(userData);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.success)
            .setTitle('✨ PROUD OF YOU!')
            .setDescription(
              `Sweetie, you've reached **World Level ${userData.worldLevel}**! You're growing so fast!`
            ),
        ],
      });
    }

    // --- PREPARE TEAM ---
    const hydratedInventory = await database.getHydratedInventory(message.author.id);
    const team = userData.team
      .map((name) => {
        const char = hydratedInventory.find((i) => i.name === name);
        if (!char) return null;
        const bonuses = itemUtils.calculateEquippedBonuses(message.author.id);
        return CombatService.calculateCharStats(char, userData, bonuses);
      })
      .filter(Boolean);

    if (team.length === 0)
      return message.reply(
        "Sweetie, you don't have a team yet! (｡•́︿•̀｡) Use `kteam add` to find some friends to help you! (◕‿◕✿)"
      );

    // --- HANDLE BET ---
    const betAmount = EconomyService.parseBet(args[0], userData.balance);
    if (betAmount > 0) {
      if (!(await database.hasBalance(message.author.id, betAmount)))
        return message.reply("Darling, you don't have enough coins for that... (っ˘ω˘ς)");
      await database.removeBalance(message.author.id, betAmount);
    }

    // --- GENERATE ENEMY ---
    const enemy = CombatService.generateEnemy(userData.level, userData.worldLevel);

    let battleLog = ['Combat started! Good luck, sweetie! (ﾉ´ヮ`)ﾉ*:･ﾟ✧'];
    let comboPoints = 0;
    let turn = 1;

    const getEmbed = () => {
      const active = team.find((c) => c.hp > 0) || team[0];
      const tDisp = team
        .map(
          (c) =>
            `${c.hp > 0 ? c.emoji : '💀'} **${c.name}**\n\`[${'■'.repeat(Math.max(0, Math.ceil((c.hp / c.maxHp) * 10)))}${'-'.repeat(Math.max(0, 10 - Math.ceil((c.hp / c.maxHp) * 10)))}]\` ${Math.max(0, c.hp)}/${c.maxHp}`
        )
        .join('\n');

      const shieldStr = enemy.shield > 0 ? ` 🛡️ (+${enemy.shield})` : '';
      const eDisp = `${enemy.emoji} **${enemy.name}** (Lv.${enemy.level})\n` +
        `**Class:** ${enemy.class} | **Rarity:** ${enemy.rarity}\n` +
        `\`[${'■'.repeat(Math.max(0, Math.ceil((enemy.hp / enemy.maxHp) * 10)))}${'-'.repeat(Math.max(0, 10 - Math.ceil((enemy.hp / enemy.maxHp) * 10)))}]\` ${Math.max(0, enemy.hp)}/${enemy.maxHp}${shieldStr}`;

      return new EmbedBuilder()
        .setColor(enemy.rarity === 'LEGENDARY' ? 0xffd700 : colors.primary)
        .setTitle(`⚔️ Turn ${turn}`)
        .setDescription(`**Combo:** ${'🔶'.repeat(comboPoints)}${'⚪'.repeat(4 - comboPoints)}`)
        .addFields(
          { name: '👥 Team', value: tDisp, inline: true },
          { name: '🆚 Enemy', value: eDisp, inline: true },
          { name: '💬 Log', value: `\`\`\`md\n# ${battleLog.slice(-3).join('\n# ')}\n\`\`\`` }
        )
        .setImage(getCharacterImage(active));
    };

    const rows = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('attack').setLabel('Attack').setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('combo')
        .setLabel('Combo')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true)
    );

    const battleMsg = await message.reply({ embeds: [getEmbed()], components: [rows] });
    const collector = battleMsg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300000,
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== message.author.id)
        return i.reply({
          content: 'Wait your turn, little one! (◕‿◕✿)',
          flags: [MessageFlags.Ephemeral],
        });
      await i.deferUpdate();
      const active = team.find((c) => c.hp > 0);
      if (!active) return collector.stop('lost');

      // Player Turn
      if (i.customId === 'attack') {
        const dmg = CombatService.calculateAttackDamage(active.atk, enemy.def);

        // Handle Shield
        if (enemy.shield > 0) {
          const absorbed = Math.min(enemy.shield, dmg);
          enemy.shield -= absorbed;
          const overkill = dmg - absorbed;
          if (overkill > 0) enemy.hp -= overkill;
          battleLog.push(`⚔️ ${active.name} hit for ${dmg} (${absorbed} absorbed by shield)!`);
        } else {
          enemy.hp -= dmg;
          battleLog.push(`⚔️ ${active.name} hit for ${dmg}!`);
        }

        comboPoints = Math.min(4, comboPoints + 1);
      } else if (i.customId === 'combo') {
        const dmg = CombatService.calculateComboDamage(team);
        enemy.hp -= dmg;
        enemy.shield = 0; // Combo breaks shield!
        comboPoints = 0;
        battleLog.push(`🔥 TEAM COMBO! Dealt ${dmg} MASSIVE dmg!`);
      }

      // Enemy Turn
      if (enemy.hp > 0) {
        const action = CombatService.getEnemyAction(enemy, team);
        battleLog.push(action.log);

        if (action.damage > 0) {
          if (action.metadata?.aoe) {
            team.forEach(member => {
              if (member.hp > 0) member.hp -= Math.floor(action.damage * 0.6); // Reduced AOE damage
            });
          } else {
            // Find target member
            const target = team.find(c => c.name === action.metadata?.target);
            if (target) target.hp -= action.damage;
          }
        }
      }

      turn++;
      rows.components[1].setDisabled(comboPoints < 4);
      if (enemy.hp <= 0) collector.stop('win');
      else if (team.every((c) => c.hp <= 0)) collector.stop('lost');
      else await battleMsg.edit({ embeds: [getEmbed()], components: [rows] });
    });

    collector.on('end', async (c, r) => {
      const won = r === 'win';
      const rewards = CombatService.calculateRewards(enemy, betAmount, won);

      if (won) await database.addBalance(message.author.id, rewards.money);
      const expRes = await database.addExperience(message.author.id, rewards.exp);
      await database.updateStats(message.author.id, won ? 'won' : 'lost', betAmount);

      const final = new EmbedBuilder()
        .setColor(won ? colors.success : colors.error)
        .setTitle(won ? '(｡♥‿♥｡) You did it!' : "(｡•́︿•̀｡) It's okay...")
        .addFields(
          {
            name: '💰 Treasures Found',
            value: `+${EconomyService.format(rewards.money)} <:coin:1480551418464305163>`,
            inline: true,
          },
          { name: '⭐ Lessons Learned', value: `+${rewards.exp} XP`, inline: true }
        );

      if (expRes.leveledUp)
        final.addFields({ name: '🎉 Level Up!', value: `Rank **${expRes.newLevel}**!` });

      await battleMsg.edit({ embeds: [final], components: [] });
      await database.updateStats(message.author.id, 'command');
    });
  },
};
