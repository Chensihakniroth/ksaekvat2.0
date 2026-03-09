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
    const rarity = char.rarity || 3;
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
   * Generate a random enemy scaled to the user's world level.
   */
  public generateEnemy(userLevel: number, worldLevel: number): Enemy {
    const enemyLevel = Math.floor(Math.random() * (worldLevel * 10 - userLevel + 1)) + userLevel;
    const enemies = [
      { name: 'Hillichurl Warrior', emoji: '👹' },
      { name: 'Ruin Guard', emoji: '🤖' },
      { name: 'Voidranger', emoji: '👾' },
      { name: 'Crownless', emoji: '👑' },
    ];

    const base = enemies[Math.floor(Math.random() * enemies.length)];
    const hp = enemyLevel * 100 + 200;

    return {
      name: base.name,
      emoji: base.emoji,
      level: enemyLevel,
      maxHp: hp,
      hp: hp,
      atk: enemyLevel * 15 + 40,
      def: enemyLevel * 10 + 30,
    };
  }

  /**
   * Calculate damage for a standard attack.
   */
  public calculateAttackDamage(attackerAtk: number, targetDef: number): number {
    const variance = 0.8 + Math.random() * 0.4; // 80% to 120%
    return Math.max(20, Math.floor(attackerAtk * variance - targetDef * 0.5));
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
  public calculateRewards(enemyLevel: number, betAmount: number, won: boolean): BattleRewards {
    if (!won) return { money: 0, exp: 10 };

    return {
      money: Math.floor(enemyLevel * 100 + 200 + betAmount * 2),
      exp: Math.floor(enemyLevel * 15 + 30),
    };
  }
}

const instance = new CombatService();
export default instance;
