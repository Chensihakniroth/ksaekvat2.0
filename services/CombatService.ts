/**
 * COMBAT SERVICE (Professional TypeScript Edition)
 * Centralized logic for all battle math, stat scaling, and enemy generation.
 * Now with type-safety to ensure every battle is balanced! (｡♥‿♥｡)
 */

interface CombatStats {
  maxHp: number;
  hp: number;
  atk: number;
  def: number;
  [key: string]: any;
}

interface PlayerStats {
  baseStats: {
    attack: number;
    defense: number;
    health: number;
    luck: number;
  };
  totalStats: {
    attack: number;
    defense: number;
    health: number;
    luck: number;
    speed: number;
    critRate: number;
    evasion: number;
  };
}

interface Enemy {
  name: string;
  emoji: string;
  level: number;
  maxHp: number;
  hp: number;
  atk: number;
  def: number;
  class: 'TANK' | 'STRIKER' | 'SUPPORT' | 'BOSS';
  shield: number;
  rarity: string;
}

interface BattleRewards {
  money: number;
  exp: number;
}

class CombatService {
  /**
   * Calculate combat stats for a character based on user data and equipment.
   */
  public calculateCharStats(char: any, userData: any, bonuses: any = {}): CombatStats {
    const asc = char.ascension || 0;
    const rarity = parseInt(char.rarity) || 3;
    const userLevel = userData.level || 1;

    const hp = Math.floor(rarity * 50 + asc * 100 + userLevel * 10 + 200);

    return {
      ...char,
      maxHp: hp,
      hp: hp,
      atk: Math.floor(rarity * 15 + asc * 30 + userLevel * 5 + 30) + (bonuses.attack || 0),
      def: Math.floor(rarity * 10 + asc * 20 + userLevel * 4 + 20) + (bonuses.defense || 0),
    };
  }

  /**
   * Calculate comprehensive combat stats for a player.
   */
  public calculatePlayerStats(userData: any, bonuses: any = {}): PlayerStats {
    const baseStats = {
      attack: Math.floor(userData.level * 10 + userData.experience / 100),
      defense: Math.floor(userData.level * 8 + userData.experience / 150),
      health: Math.floor(userData.level * 15 + 100),
      luck: Math.floor(userData.level * 2),
    };

    const totalStats = {
      attack: baseStats.attack + (bonuses.attack || 0),
      defense: baseStats.defense + (bonuses.defense || 0),
      health: baseStats.health + (bonuses.hp || 0),
      luck: baseStats.luck + (bonuses.luck || 0),
      speed: bonuses.speed || 0,
      critRate: bonuses.critRate || 0,
      evasion: bonuses.evasion || 0,
    };

    return { baseStats, totalStats };
  }

  /**
   * Generate a sophisticated enemy scaled to the user's world level.
   */
  public generateEnemy(userLevel: number, worldLevel: number): Enemy {
    const enemyLevel = Math.floor(Math.random() * (worldLevel * 10)) + worldLevel * 5;
    const isBoss = Math.random() < 0.1 || (worldLevel > 1 && enemyLevel % 10 === 0);
    
    const classes: ('TANK' | 'STRIKER' | 'SUPPORT' | 'BOSS')[] = isBoss ? ['BOSS'] : ['TANK', 'STRIKER', 'SUPPORT'];
    const enemyClass = classes[Math.floor(Math.random() * classes.length)];

    const enemies = {
      TANK: [
        { name: 'Gilded Guardian', emoji: '🛡️' },
        { name: 'Stone Shell Tortoise', emoji: '🐢' },
        { name: 'Ruin Guard', emoji: '🤖' }
      ],
      STRIKER: [
        { name: 'Shadow Stalker', emoji: '👤' },
        { name: 'Crimson Wyvern', emoji: '🐲' },
        { name: 'Voidranger: Eliminator', emoji: '👾' }
      ],
      SUPPORT: [
        { name: 'Life-Bloom Fairy', emoji: '🧚' },
        { name: 'Whirlpool Wisp', emoji: '🌀' },
        { name: 'Mechanical Healer', emoji: '🩺' }
      ],
      BOSS: [
        { name: 'Calamity Dragon', emoji: '🐉' },
        { name: 'Crownless King', emoji: '👑' },
        { name: 'Interstellar Colossus', emoji: '🪐' }
      ]
    };

    const baseList = enemies[enemyClass];
    const base = baseList[Math.floor(Math.random() * baseList.length)];
    
    let hpMod = 1.0, atkMod = 1.0, defMod = 1.0;

    switch(enemyClass) {
      case 'TANK': hpMod = 1.8; defMod = 1.5; atkMod = 0.7; break;
      case 'STRIKER': hpMod = 0.8; defMod = 0.6; atkMod = 1.6; break;
      case 'SUPPORT': hpMod = 1.2; defMod = 1.0; atkMod = 0.8; break;
      case 'BOSS': hpMod = 3.5; defMod = 1.3; atkMod = 1.4; break;
    }

    const hp = Math.floor((enemyLevel * 120 + 300) * hpMod);

    return {
      name: base.name,
      emoji: base.emoji,
      level: enemyLevel,
      maxHp: hp,
      hp: hp,
      atk: Math.floor((enemyLevel * 18 + 50) * atkMod),
      def: Math.floor((enemyLevel * 12 + 40) * defMod),
      class: enemyClass,
      shield: 0,
      rarity: isBoss ? 'LEGENDARY' : (enemyLevel > 50 ? 'EPIC' : 'RARE')
    };
  }

  /**
   * Determine Enemy Action for a turn.
   */
  public getEnemyAction(enemy: Enemy, team: any[]): { type: 'ATTACK' | 'SKILL', damage: number, log: string, metadata?: any } {
    const chance = Math.random();
    
    // 30% chance for a skill
    if (chance < 0.3) {
      if (enemy.class === 'TANK') {
        const shieldVal = Math.floor(enemy.maxHp * 0.15);
        enemy.shield += shieldVal;
        return { type: 'SKILL', damage: 0, log: `🛡️ ${enemy.name} activated Stone Skin, gaining ${shieldVal} shield!` };
      }
      if (enemy.class === 'SUPPORT') {
        const healVal = Math.floor(enemy.maxHp * 0.1);
        enemy.hp = Math.min(enemy.maxHp, enemy.hp + healVal);
        return { type: 'SKILL', damage: 0, log: `💚 ${enemy.name} used Rejuvenation, healing ${healVal} HP!` };
      }
      if (enemy.class === 'STRIKER') {
        const dmg = this.calculateAttackDamage(enemy.atk * 1.5, team[0].def); 
        return { type: 'SKILL', damage: dmg, log: `⚡ ${enemy.name} used Precision Strike! Dealt ${dmg} CRITICAL damage!`, metadata: { critical: true } };
      }
      if (enemy.class === 'BOSS') {
        const dmg = this.calculateAttackDamage(enemy.atk * 0.8, team[0].def);
        return { type: 'SKILL', damage: dmg, log: `💥 ${enemy.name} unleashed a Calamity Nova! AOE Damage dealt!`, metadata: { aoe: true } };
      }
    }

    // Normal Attack
    const aliveMembers = team.filter(c => c.hp > 0);
    const target = aliveMembers[Math.floor(Math.random() * aliveMembers.length)];
    const dmg = this.calculateAttackDamage(enemy.atk, target.def);
    return { type: 'ATTACK', damage: dmg, log: `👾 ${enemy.name} hit ${target.name} for ${dmg}!`, metadata: { target: target.name } };
  }

  /**
   * Calculate damage for a standard attack.
   */
  public calculateAttackDamage(attackerAtk: number, targetDef: number): number {
    const variance = 0.9 + Math.random() * 0.2; // 90% to 110%
    return Math.max(30, Math.floor(attackerAtk * variance - targetDef * 0.4));
  }

  /**
   * Calculate damage for a team combo attack.
   */
  public calculateComboDamage(team: any[]): number {
    const totalAtk = team.reduce((sum, char) => sum + (char.hp > 0 ? char.atk : 0), 0);
    return Math.floor(totalAtk * 2.5);
  }

  /**
   * Calculate battle rewards (Loot and XP).
   */
  public calculateRewards(enemy: Enemy, betAmount: number, won: boolean): BattleRewards {
    if (!won) return { money: 0, exp: 10 };

    let multiplier = 1.0;
    if (enemy.class === 'BOSS') multiplier *= 3.0;
    if (enemy.rarity === 'LEGENDARY') multiplier *= 2.0;
    else if (enemy.rarity === 'EPIC') multiplier *= 1.5;

    return {
      money: Math.floor((enemy.level * 150 + 300 + betAmount * 2) * multiplier),
      exp: Math.floor((enemy.level * 20 + 50) * multiplier),
    };
  }
}

const instance = new CombatService();
export default instance;
