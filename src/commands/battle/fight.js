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
const { getCharacterImage } = require('../../utils/images.js');
const CombatService = require('../../services/CombatService.js').default || require('../../services/CombatService.js');
const EconomyService = require('../../services/EconomyService').default || require('../../services/EconomyService');

const activeBattles = new Set();

module.exports = {
  name: 'fight',
  aliases: ['battle', 'combat', 'kfight'],
  description: "Start a turn-based team battle! Fully automatic tactical simulation. (¬‿¬)",
  usage: 'fight [bet/upgrade]',
  cooldown: 5,
  async execute(message, args, client) {
    if (activeBattles.has(message.author.id)) {
      return message.reply("Wait! (・_・ヾ Your tactical simulation is still running. One at a time! (≧◡≦)");
    }

    const userData = await database.getUser(message.author.id, message.author.username);
    if (!userData.worldLevel) userData.worldLevel = 1;
    if (!userData.team) userData.team = [];

    // --- SUBCOMMAND: UPGRADE ---
    if (args[0]?.toLowerCase() === 'upgrade') {
      const nextWorld = userData.worldLevel + 1;
      const cost = nextWorld * 50000;
      if (!(await database.hasBalance(message.author.id, cost))) {
        return message.reply(
          `System error: Insufficient funds... (・_・ヾ To reach World Level ${nextWorld}, you need **${EconomyService.format(cost)}** <:coin:1480551418464305163>. (ಥ﹏ಥ)`
        );
      }
      await database.removeBalance(message.author.id, cost);
      userData.worldLevel++;
      await database.saveUser(userData);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.success)
            .setTitle('🚀 SYSTEM UPGRADED!')
            .setDescription(
              `Nice! You've reached **World Level ${userData.worldLevel}**! Power ceiling increased. (¬‿¬)`
            ),
        ],
      });
    }

    // --- PREPARE TEAM ---
    const hydratedInventory = await database.getHydratedInventory(message.author.id);
    const emptyBonuses = { attack: 0, defense: 0, hp: 0, speed: 0, luck: 0 };
    const team = userData.team
      .map((name) => {
        const char = hydratedInventory.find((i) => i.name === name);
        if (!char) return null;
        const stats = CombatService.calculateCharStats(char, userData, emptyBonuses);
        stats.isDefending = false; 
        return stats;
      })
      .filter(Boolean);

    if (team.length === 0)
      return message.reply(
        "Whoa, hold on! (・_・ヾ You don't have a team yet. Build your squad before heading out! (≧◡≦)"
      );

    const betAmount = EconomyService.parseBet(args[0], userData.balance);
    if (betAmount > 0) {
      if (!(await database.hasBalance(message.author.id, betAmount)))
        return message.reply("Wallet check failed! (ಥ﹏ಥ)");
      await database.removeBalance(message.author.id, betAmount);
    }

    activeBattles.add(message.author.id);

    const enemy = CombatService.generateEnemy(userData.level, userData.worldLevel);
    let battleLog = ['> Initiating tactical simulation... (✧ω✧)'];
    let comboPoints = 0;
    let turn = 1;
    let isActive = true;

    const getEmbed = () => {
      const activeChar = team.find((c) => c.hp > 0) || team[0];
      const tDisp = team
        .map(
          (c) =>
            `${c.hp > 0 ? c.emoji : '💀'} **${c.name}**${c.isDefending ? ' 🛡️' : ''}\n\`[${'■'.repeat(Math.max(0, Math.ceil((c.hp / c.maxHp) * 10)))}${'-'.repeat(Math.max(0, 10 - Math.ceil((c.hp / c.maxHp) * 10)))}]\` ${Math.max(0, c.hp)}/${c.maxHp}`
        )
        .join('\n');

      const shieldStr = enemy.shield > 0 ? ` 🛡️ (+${enemy.shield})` : '';
      const enrageStr = enemy.isEnraged ? ' 💢' : '';
      const eDisp = `${enemy.emoji} **${enemy.name}** (Lv.${enemy.level})${enrageStr}\n` +
        `**Class:** ${enemy.class} | **Rarity:** ${enemy.rarity}\n` +
        `\`[${'■'.repeat(Math.max(0, Math.ceil((enemy.hp / enemy.maxHp) * 10)))}${'-'.repeat(Math.max(0, 10 - Math.ceil((enemy.hp / enemy.maxHp) * 10)))}]\` ${Math.max(0, enemy.hp)}/${enemy.maxHp}${shieldStr}`;

      const comboBar = `**Overdrive:** ${'🔶'.repeat(Math.floor(comboPoints))}${'⚪'.repeat(Math.max(0, 4 - Math.floor(comboPoints)))}`;

      return new EmbedBuilder()
        .setColor(enemy.rarity === 'LEGENDARY' ? 0xffd700 : colors.primary)
        .setTitle(`⚔️ Tactical Simulation: Phase ${turn}`)
        .setDescription(`${comboBar}\n${isActive ? '🛰️ Processing combat data...' : '🏁 Simulation Concluded.'}`)
        .addFields(
          { name: '👥 Your Squad', value: tDisp, inline: true },
          { name: '🆚 Target', value: eDisp, inline: true },
          { name: '📟 System Log', value: `\`\`\`diff\n${battleLog.slice(-5).map(l => l.startsWith('!') ? l : `+ ${l}`).join('\n')}\n\`\`\`` }
        )
        .setImage(getCharacterImage(activeChar))
        .setFooter({ text: `World Level ${userData.worldLevel} | Hikari Tactical AI` });
    };

    const battleMsg = await message.reply({ embeds: [getEmbed()], components: [] });

    const processTurn = async () => {
      if (!isActive) return;

      const activeChar = team.find((c) => c.hp > 0);
      if (!activeChar) return finalizeBattle('lost');

      team.forEach(c => c.isDefending = false);

      // --- PLAYER AI ---
      let actionId = comboPoints >= 4 ? 'combo' : 'attack';
      // Smarter AI: Defend if low HP and combo not ready
      if (activeChar.hp / activeChar.maxHp < 0.25 && comboPoints < 4 && Math.random() < 0.4) {
        actionId = 'defend';
      }

      if (actionId === 'attack') {
        const dmg = CombatService.calculateAttackDamage(activeChar.atk, enemy.def, activeChar.critRate, activeChar.critDmg, enemy.evasion);
        if (dmg === 0) {
          battleLog.push(`! MISS: ${enemy.name} evaded ${activeChar.name}'s strike!`);
        } else {
          if (enemy.shield > 0) {
            const absorbed = Math.min(enemy.shield, dmg);
            enemy.shield -= absorbed;
            const overkill = dmg - absorbed;
            if (overkill > 0) enemy.hp -= overkill;
            battleLog.push(`${activeChar.name} hits for ${dmg} (${absorbed} shielded).`);
          } else {
            enemy.hp -= dmg;
            battleLog.push(`${activeChar.name} deals ${dmg} damage.`);
          }
        }
        const followUp = CombatService.calculateFollowUp(activeChar, team);
        if (followUp && enemy.hp > 0) {
          enemy.hp -= followUp.damage;
          battleLog.push(`! Assist: ${followUp.name} adds ${followUp.damage} dmg!`);
        }
        comboPoints = Math.min(4, comboPoints + 1);
      } else if (actionId === 'defend') {
        activeChar.isDefending = true;
        comboPoints = Math.min(4, comboPoints + 1);
        battleLog.push(`${activeChar.name} is in defensive stance.`);
      } else if (actionId === 'combo') {
        const dmg = CombatService.calculateComboDamage(team);
        enemy.hp -= dmg;
        enemy.shield = 0; 
        comboPoints = 0;
        battleLog.push(`! OVERDRIVE: ${dmg} TOTAL DMG!`);
      }

      // --- ENEMY AI ---
      if (enemy.hp > 0) {
        const action = CombatService.getEnemyAction(enemy, team);
        if (action.damage > 0) {
          if (action.metadata?.aoe) {
            team.forEach(member => {
              if (member.hp > 0) {
                let finalDmg = Math.floor(action.damage * 0.6);
                if (member.isDefending) finalDmg = Math.floor(finalDmg * 0.5);
                member.hp -= finalDmg;
              }
            });
            battleLog.push(`! AOE: The squad took heavy damage!`);
          } else {
            const target = team.find(c => c.name === action.metadata?.target);
            if (target) {
              let finalDmg = action.damage;
              if (target.isDefending) {
                finalDmg = Math.floor(finalDmg * 0.5);
                battleLog.push(`! Blocked: ${target.name} takes only ${finalDmg}.`);
              } else {
                battleLog.push(`! ${enemy.name} hit ${target.name} for ${finalDmg}!`);
              }
              target.hp -= finalDmg;
            }
          }
        } else {
          battleLog.push(action.log);
        }
      }

      turn++;
      
      if (enemy.hp <= 0) return finalizeBattle('win');
      if (team.every((c) => c.hp <= 0)) return finalizeBattle('lost');

      await battleMsg.edit({ embeds: [getEmbed()] }).catch(() => {});
      
      // Delay for next turn (fast-paced)
      setTimeout(processTurn, 1400 + Math.random() * 400);
    };

    const finalizeBattle = async (result) => {
      isActive = false;
      activeBattles.delete(message.author.id);

      const won = result === 'win';
      const rewards = CombatService.calculateRewards(enemy, betAmount, won);

      if (won) await database.addBalance(message.author.id, rewards.money);
      const expRes = await database.addExperience(message.author.id, rewards.exp);
      await database.updateStats(message.author.id, won ? 'won' : 'lost', betAmount);

      const final = new EmbedBuilder()
        .setColor(won ? colors.success : colors.error)
        .setTitle(won ? '(✧ω✧) VICTORY' : "(ಥ﹏ಥ) SYSTEM OFFLINE")
        .setDescription(won 
          ? "Target eliminated. Simulation confirms peak tactical performance. (¬‿¬)" 
          : "Simulation failed. Critical damage sustained. Need more optimization... (・_・ヾ"
        )
        .addFields(
          {
            name: '💰 Loot Found',
            value: `+${EconomyService.format(rewards.money)} <:coin:1480551418464305163>`,
            inline: true,
          },
          { name: '⭐ Data Gained', value: `+${rewards.exp} XP`, inline: true }
        );

      if (expRes.leveledUp)
        final.addFields({ name: '🎊 LEVEL UP!', value: `You've reached Rank **${expRes.newLevel}**! (≧◡≦)` });

      await battleMsg.edit({ embeds: [final] }).catch(() => {});
      await database.updateStats(message.author.id, 'command');
    };

    // Start simulation
    processTurn();
  },
};
