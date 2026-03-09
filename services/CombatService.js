/**
 * COMBAT SERVICE
 * Centralized logic for all battle math, stat scaling, and enemy generation.
 */

class CombatService {
  /**
   * Calculate combat stats for a character based on user data and equipment.
   */
  calculateCharStats(char, userData, bonuses = {}) {
    const asc = char.ascension || 0;
    const rarity = char.rarity || 3;
    const userLevel = userData.level || 1;

    return {
      ...char,
      maxHp: Math.floor(rarity * 50 + asc * 100 + userLevel * 10 + 200),
      hp: Math.floor(rarity * 50 + asc * 100 + userLevel * 10 + 200),
      atk: Math.floor(rarity * 15 + asc * 30 + userLevel * 5 + 30) + (bonuses.attack || 0),
      def: Math.floor(rarity * 10 + asc * 20 + userLevel * 4 + 20) + (bonuses.defense || 0),
    };
  }

  /**
   * Calculate comprehensive combat stats for a player.
   */
  calculatePlayerStats(userData, bonuses = {}) {
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
  generateEnemy(userLevel, worldLevel) {
    const enemyLevel = Math.floor(Math.random() * (worldLevel * 10 - userLevel + 1)) + userLevel;
    const enemies = [
      { name: 'Hillichurl Warrior', emoji: '👹' },
      { name: 'Ruin Guard', emoji: '🤖' },
      { name: 'Voidranger', emoji: '👾' },
      { name: 'Crownless', emoji: '👑' },
    ];

    const base = enemies[Math.floor(Math.random() * enemies.length)];

    return {
      name: base.name,
      emoji: base.emoji,
      level: enemyLevel,
      maxHp: enemyLevel * 100 + 200,
      hp: enemyLevel * 100 + 200,
      atk: enemyLevel * 15 + 40,
      def: enemyLevel * 10 + 30,
    };
  }

  /**
   * Calculate damage for a standard attack.
   */
  calculateAttackDamage(attackerAtk, targetDef) {
    const variance = 0.8 + Math.random() * 0.4; // 80% to 120%
    return Math.max(20, Math.floor(attackerAtk * variance - targetDef * 0.5));
  }

  /**
   * Calculate damage for a team combo attack.
   */
  calculateComboDamage(team) {
    const totalAtk = team.reduce((sum, char) => sum + (char.hp > 0 ? char.atk : 0), 0);
    return Math.floor(totalAtk * 2.5);
  }

  /**
   * Calculate battle rewards (Loot and XP).
   */
  calculateRewards(enemyLevel, betAmount, won) {
    if (!won) return { money: 0, exp: 10 };

    return {
      money: Math.floor(enemyLevel * 100 + 200 + betAmount * 2),
      exp: Math.floor(enemyLevel * 15 + 30),
    };
  }
}

module.exports = new CombatService();
