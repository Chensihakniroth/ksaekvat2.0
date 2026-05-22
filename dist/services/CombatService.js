"use strict";
/**
 * 🎮 COMBAT SERVICE: Hikari's Tactical Engine (Autonomous Edition)
 * Optimized for fully automatic simulations with high variability.
 */
Object.defineProperty(exports, "__esModule", { value: true });
class CombatService {
    /**
     * Calculate combat stats for a character based on user data and equipment.
     */
    calculateCharStats(char, userData, bonuses = {}) {
        const asc = char.ascension || 0;
        const rarity = parseInt(char.rarity) || 3;
        const userLevel = userData.level || 1;
        const hp = Math.floor(rarity * 40 + asc * 80 + userLevel * 8 + 150);
        return {
            ...char,
            maxHp: hp,
            hp: hp,
            atk: Math.floor(rarity * 20 + asc * 40 + userLevel * 6 + 40) + (bonuses.attack || 0),
            def: Math.floor(rarity * 12 + asc * 25 + userLevel * 5 + 25) + (bonuses.defense || 0),
            critRate: 0.05 + (bonuses.critRate || 0),
            critDmg: 0.5 + (bonuses.critDmg || 0),
        };
    }
    /**
     * Generate a sophisticated enemy with an expanded pool.
     */
    generateEnemy(userLevel, worldLevel) {
        const enemyLevel = Math.floor(Math.random() * (worldLevel * 10)) + worldLevel * 5;
        const isBoss = Math.random() < 0.1 || (worldLevel > 1 && enemyLevel % 10 === 0);
        const classes = isBoss
            ? ['BOSS']
            : ['TANK', 'STRIKER', 'SUPPORT'];
        const enemyClass = classes[Math.floor(Math.random() * classes.length)];
        const enemies = {
            TANK: [
                { name: 'Gilded Guardian', emoji: '🛡️' },
                { name: 'Stone Shell Tortoise', emoji: '🐢' },
                { name: 'Ruin Guard', emoji: '🤖' },
                { name: 'Zonai Soldier Construct', emoji: '🧱' },
                { name: 'Obsidian Golem', emoji: '🌑' },
                { name: 'Steel-Clad Rhino', emoji: '🦏' },
            ],
            STRIKER: [
                { name: 'Shadow Stalker', emoji: '👤' },
                { name: 'Crimson Wyvern', emoji: '🐲' },
                { name: 'Voidranger: Eliminator', emoji: '👾' },
                { name: 'Neon Blade Assassin', emoji: '🗡️' },
                { name: 'Thunder-Tail Raptor', emoji: '🦖' },
                { name: 'Plasma Ghost', emoji: '👻' },
            ],
            SUPPORT: [
                { name: 'Life-Bloom Fairy', emoji: '🧚' },
                { name: 'Whirlpool Wisp', emoji: '🌀' },
                { name: 'Mechanical Healer', emoji: '🩺' },
                { name: 'Mana-Siphon Drone', emoji: '📡' },
                { name: 'Solar Sprite', emoji: '☀️' },
                { name: 'Chrono-Butterfly', emoji: '🦋' },
            ],
            BOSS: [
                { name: 'Calamity Dragon', emoji: '🐉' },
                { name: 'Crownless King', emoji: '👑' },
                { name: 'Interstellar Colossus', emoji: '🪐' },
                { name: 'Void Herald', emoji: '🌌' },
                { name: 'Ancient Automaton Lord', emoji: '🕍' },
                { name: 'Primal Behemoth', emoji: '🐘' },
            ],
        };
        const baseList = enemies[enemyClass];
        const base = baseList[Math.floor(Math.random() * baseList.length)];
        let hpMod = 1.0, atkMod = 1.0, defMod = 1.0, eva = 0.05;
        switch (enemyClass) {
            case 'TANK':
                hpMod = 1.6;
                defMod = 1.5;
                atkMod = 0.8;
                eva = 0.02;
                break;
            case 'STRIKER':
                hpMod = 0.8;
                defMod = 0.6;
                atkMod = 1.8;
                eva = 0.15;
                break;
            case 'SUPPORT':
                hpMod = 1.1;
                defMod = 0.9;
                atkMod = 1.0;
                eva = 0.08;
                break;
            case 'BOSS':
                hpMod = 3.2;
                defMod = 1.3;
                atkMod = 1.6;
                eva = 0.1;
                break;
        }
        const hp = Math.floor((enemyLevel * 100 + 300) * hpMod);
        return {
            name: base.name,
            emoji: base.emoji,
            level: enemyLevel,
            maxHp: hp,
            hp: hp,
            atk: Math.floor((enemyLevel * 20 + 65) * atkMod),
            def: Math.floor((enemyLevel * 10 + 40) * defMod),
            class: enemyClass,
            shield: 0,
            rarity: isBoss ? 'LEGENDARY' : enemyLevel > 50 ? 'EPIC' : 'RARE',
            evasion: eva,
        };
    }
    /**
     * Determine Enemy Action with Rage Logic.
     */
    getEnemyAction(enemy, team) {
        const chance = Math.random();
        const aliveMembers = team.filter((c) => c.hp > 0);
        // Check for Enrage (< 30% HP)
        let damageMultiplier = 1.0;
        if (enemy.hp / enemy.maxHp < 0.3 && !enemy.isEnraged) {
            enemy.isEnraged = true;
            return {
                type: 'SKILL',
                damage: 0,
                log: `! RAGE: ${enemy.name} has entered a Berserk state!`,
                metadata: { effect: 'RAGE' },
            };
        }
        if (enemy.isEnraged)
            damageMultiplier = 1.3;
        let target = aliveMembers[Math.floor(Math.random() * aliveMembers.length)];
        if (Math.random() < 0.6) {
            // Smarter targeting
            target = aliveMembers.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        }
        if (chance < 0.35) {
            if (enemy.class === 'TANK') {
                const shieldVal = Math.floor(enemy.maxHp * 0.2);
                enemy.shield += shieldVal;
                return {
                    type: 'SKILL',
                    damage: 0,
                    log: `Stone Skin: +${shieldVal} shield!`,
                    metadata: { effect: 'SHIELD' },
                };
            }
            if (enemy.class === 'SUPPORT') {
                const healVal = Math.floor(enemy.maxHp * 0.15);
                enemy.hp = Math.min(enemy.maxHp, enemy.hp + healVal);
                return {
                    type: 'SKILL',
                    damage: 0,
                    log: `Rejuvenation: +${healVal} HP!`,
                    metadata: { effect: 'HEAL' },
                };
            }
            if (enemy.class === 'STRIKER') {
                const dmg = this.calculateAttackDamage(enemy.atk * 1.8 * damageMultiplier, target.def);
                return {
                    type: 'SKILL',
                    damage: dmg,
                    log: `Precision Strike on ${target.name}!`,
                    metadata: { critical: true, target: target.name },
                };
            }
            if (enemy.class === 'BOSS') {
                const dmg = this.calculateAttackDamage(enemy.atk * 1.0 * damageMultiplier, target.def);
                return {
                    type: 'SKILL',
                    damage: dmg,
                    log: `Calamity Nova unleashed!`,
                    metadata: { aoe: true },
                };
            }
        }
        const dmg = this.calculateAttackDamage(enemy.atk * damageMultiplier, target.def);
        return {
            type: 'ATTACK',
            damage: dmg,
            log: `${enemy.name} hit ${target.name}!`,
            metadata: { target: target.name },
        };
    }
    /**
     * Calculate damage with Evasion check.
     */
    calculateAttackDamage(attackerAtk, targetDef, critRate = 0.05, critDmg = 0.5, targetEvasion = 0) {
        // Evasion check
        if (Math.random() < targetEvasion)
            return 0; // Miss!
        const variance = 0.85 + Math.random() * 0.3;
        let damage = Math.max(50, Math.floor(attackerAtk * variance - targetDef * 0.35));
        if (Math.random() < critRate) {
            damage = Math.floor(damage * (1 + critDmg));
        }
        return damage;
    }
    /**
     * Assist Attack Logic.
     */
    calculateFollowUp(attacker, team) {
        if (Math.random() > 0.35)
            return null;
        const others = team.filter((c) => c.hp > 0 && c.name !== attacker.name);
        if (others.length === 0)
            return null;
        const assist = others[Math.floor(Math.random() * others.length)];
        const dmg = Math.floor(assist.atk * 0.55);
        return { name: assist.name, damage: dmg };
    }
    /**
     * Team combo attack.
     */
    calculateComboDamage(team) {
        const totalAtk = team.reduce((sum, char) => sum + (char.hp > 0 ? char.atk : 0), 0);
        return Math.floor(totalAtk * 4.2);
    }
    calculateRewards(enemy, betAmount, won) {
        if (!won)
            return { money: 0, exp: 25 };
        let multiplier = 1.0;
        if (enemy.class === 'BOSS')
            multiplier *= 4.0;
        if (enemy.rarity === 'LEGENDARY')
            multiplier *= 3.0;
        return {
            money: Math.floor((enemy.level * 250 + 600 + betAmount * 3) * multiplier),
            exp: Math.floor((enemy.level * 40 + 150) * multiplier),
        };
    }
}
const instance = new CombatService();
exports.default = instance;
