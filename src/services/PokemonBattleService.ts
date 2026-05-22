/**
 * 🎮 POKEMON BATTLE SERVICE: 3v3 Automated Melee Engine
 * Type chart, stat calculation, damage formula, and full battle simulation.
 * Designed for speed-based turn order with random targeting. (✧ω✧)
 */

import Pokedex from 'pokedex-promise-v2';

const PokedexClass = (Pokedex as any).default || Pokedex;
const P = new PokedexClass();

// ─── TYPE CHART ────────────────────────────────────────────────────────
// Full 18-type chart. Each type maps to arrays of types it's strong/weak/immune against.

const TYPE_CHART: Record<string, { strong: string[]; weak: string[]; immune: string[] }> = {
  normal: { strong: [], weak: ['rock', 'steel'], immune: ['ghost'] },
  fire: {
    strong: ['grass', 'ice', 'bug', 'steel'],
    weak: ['fire', 'water', 'rock', 'dragon'],
    immune: [],
  },
  water: { strong: ['fire', 'ground', 'rock'], weak: ['water', 'grass', 'dragon'], immune: [] },
  grass: {
    strong: ['water', 'ground', 'rock'],
    weak: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'],
    immune: [],
  },
  electric: {
    strong: ['water', 'flying'],
    weak: ['electric', 'grass', 'dragon'],
    immune: ['ground'],
  },
  ice: {
    strong: ['grass', 'ground', 'flying', 'dragon'],
    weak: ['fire', 'water', 'ice', 'steel'],
    immune: [],
  },
  fighting: {
    strong: ['normal', 'ice', 'rock', 'dark', 'steel'],
    weak: ['poison', 'flying', 'psychic', 'bug', 'fairy'],
    immune: ['ghost'],
  },
  poison: {
    strong: ['grass', 'fairy'],
    weak: ['poison', 'ground', 'rock', 'ghost'],
    immune: ['steel'],
  },
  ground: {
    strong: ['fire', 'electric', 'poison', 'rock', 'steel'],
    weak: ['grass', 'bug'],
    immune: ['flying'],
  },
  flying: { strong: ['grass', 'fighting', 'bug'], weak: ['electric', 'rock', 'steel'], immune: [] },
  psychic: { strong: ['fighting', 'poison'], weak: ['psychic', 'steel'], immune: ['dark'] },
  bug: {
    strong: ['grass', 'psychic', 'dark'],
    weak: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'],
    immune: [],
  },
  rock: {
    strong: ['fire', 'ice', 'flying', 'bug'],
    weak: ['fighting', 'ground', 'steel'],
    immune: [],
  },
  ghost: { strong: ['psychic', 'ghost'], weak: ['dark'], immune: ['normal'] },
  dragon: { strong: ['dragon'], weak: ['steel'], immune: ['fairy'] },
  dark: { strong: ['psychic', 'ghost'], weak: ['fighting', 'dark', 'fairy'], immune: [] },
  steel: {
    strong: ['ice', 'rock', 'fairy'],
    weak: ['fire', 'water', 'electric', 'steel'],
    immune: [],
  },
  fairy: { strong: ['fighting', 'dragon', 'dark'], weak: ['fire', 'poison', 'steel'], immune: [] },
};

// ─── POKEMON MOVE NAMES BY TYPE ────────────────────────────────────────
const TYPE_MOVES: Record<string, string[]> = {
  normal: ['Tackle', 'Hyper Beam', 'Body Slam'],
  fire: ['Flamethrower', 'Fire Blast', 'Ember'],
  water: ['Hydro Pump', 'Surf', 'Water Gun'],
  grass: ['Solar Beam', 'Razor Leaf', 'Vine Whip'],
  electric: ['Thunderbolt', 'Thunder', 'Thunder Shock'],
  ice: ['Ice Beam', 'Blizzard', 'Ice Punch'],
  fighting: ['Close Combat', 'Dynamic Punch', 'Karate Chop'],
  poison: ['Sludge Bomb', 'Poison Jab', 'Acid'],
  ground: ['Earthquake', 'Dig', 'Mud Shot'],
  flying: ['Hurricane', 'Air Slash', 'Gust'],
  psychic: ['Psychic', 'Psybeam', 'Confusion'],
  bug: ['Bug Buzz', 'X-Scissor', 'Pin Missile'],
  rock: ['Rock Slide', 'Stone Edge', 'Rock Throw'],
  ghost: ['Shadow Ball', 'Shadow Claw', 'Lick'],
  dragon: ['Dragon Pulse', 'Draco Meteor', 'Dragon Rage'],
  dark: ['Dark Pulse', 'Crunch', 'Bite'],
  steel: ['Iron Tail', 'Flash Cannon', 'Metal Claw'],
  fairy: ['Moonblast', 'Dazzling Gleam', 'Fairy Wind'],
};

// ─── TYPE EMOJI MAP ────────────────────────────────────────────────────
const TYPE_EMOJI: Record<string, string> = {
  normal: '⚪',
  fire: '🔥',
  water: '💧',
  grass: '🌿',
  electric: '⚡',
  ice: '❄️',
  fighting: '🥊',
  poison: '☠️',
  ground: '🏔️',
  flying: '🕊️',
  psychic: '🔮',
  bug: '🐛',
  rock: '🪨',
  ghost: '👻',
  dragon: '🐉',
  dark: '🌑',
  steel: '⚙️',
  fairy: '🧚',
};

// ─── INTERFACES ────────────────────────────────────────────────────────

export interface BattlePokemon {
  id: string; // UserPokemon _id
  speciesKey: string;
  name: string; // Display name (capitalized)
  level: number;
  types: string[]; // e.g. ['fire', 'flying']
  maxHp: number;
  hp: number;
  atk: number;
  def: number;
  spAtk: number;
  spDef: number;
  speed: number;
  moveType: string; // Primary type used for attacks
  moveName: string; // Display name of the move
  side: 'A' | 'B';
}

export interface BattleLogEntry {
  turn: number;
  text: string;
  type: 'attack' | 'crit' | 'super_effective' | 'not_effective' | 'immune' | 'faint' | 'info';
}

export interface HpSnapshot {
  turn: number;
  teamA: { id: string; hp: number; maxHp: number }[];
  teamB: { id: string; hp: number; maxHp: number }[];
}

export interface BattleResult {
  winner: 'A' | 'B';
  log: BattleLogEntry[];
  turns: number;
  teamAState: BattlePokemon[];
  teamBState: BattlePokemon[];
  snapshots: HpSnapshot[];
}

// ─── STAT CACHE ────────────────────────────────────────────────────────
const baseStatCache: Map<
  string,
  {
    hp: number;
    atk: number;
    def: number;
    spAtk: number;
    spDef: number;
    speed: number;
    types: string[];
  }
> = new Map();

class PokemonBattleService {
  // ─── FETCH BASE STATS ──────────────────────────────────────────────
  /**
   * Fetch base stats from PokeAPI with in-memory caching.
   */
  public async getBaseStats(
    speciesKey: string
  ): Promise<{
    hp: number;
    atk: number;
    def: number;
    spAtk: number;
    spDef: number;
    speed: number;
    types: string[];
  } | null> {
    if (baseStatCache.has(speciesKey)) return baseStatCache.get(speciesKey)!;

    let lookup = this.sanitizeName(speciesKey);

    // Handle special cases
    if (lookup === 'shinycharizard') lookup = 'charizard';
    if (lookup === 'missingno') {
      const fallback = {
        hp: 33,
        atk: 136,
        def: 0,
        spAtk: 6,
        spDef: 6,
        speed: 29,
        types: ['normal', 'bird'],
      };
      baseStatCache.set(speciesKey, fallback);
      return fallback;
    }

    try {
      const pokemon = await P.getPokemonByName(lookup as any);
      const stats = pokemon.stats;
      const data = {
        hp: stats.find((s: any) => s.stat.name === 'hp')?.base_stat || 50,
        atk: stats.find((s: any) => s.stat.name === 'attack')?.base_stat || 50,
        def: stats.find((s: any) => s.stat.name === 'defense')?.base_stat || 50,
        spAtk: stats.find((s: any) => s.stat.name === 'special-attack')?.base_stat || 50,
        spDef: stats.find((s: any) => s.stat.name === 'special-defense')?.base_stat || 50,
        speed: stats.find((s: any) => s.stat.name === 'speed')?.base_stat || 50,
        types: pokemon.types.map((t: any) => t.type.name),
      };
      baseStatCache.set(speciesKey, data);
      return data;
    } catch (error: any) {
      console.error(`[PokemonBattle] Failed to fetch stats for ${speciesKey}:`, error.message);
      return null;
    }
  }

  // ─── STAT CALCULATION ──────────────────────────────────────────────
  /**
   * Calculate a Pokémon's combat stat based on its base stat and level.
   * Simplified Pokémon formula.
   */
  public calculateHP(baseHP: number, level: number): number {
    return Math.floor(baseHP * (level / 50) + level + 10);
  }

  public calculateStat(baseStat: number, level: number): number {
    return Math.floor(baseStat * (level / 50) + 5);
  }

  // ─── BUILD BATTLE POKEMON ──────────────────────────────────────────
  /**
   * Transform a UserPokemon document + PokeAPI data into a combat-ready BattlePokemon.
   */
  public async buildBattlePokemon(
    userPokemon: any,
    side: 'A' | 'B'
  ): Promise<BattlePokemon | null> {
    const base = await this.getBaseStats(userPokemon.speciesKey);
    if (!base) return null;

    const level = userPokemon.level || 1;
    const primaryType = base.types[0] || 'normal';
    const moves = TYPE_MOVES[primaryType] || TYPE_MOVES.normal;

    const maxHp = this.calculateHP(base.hp, level);

    return {
      id: userPokemon._id?.toString() || userPokemon.speciesKey,
      speciesKey: userPokemon.speciesKey,
      name: userPokemon.nickname || this.capitalize(userPokemon.speciesKey),
      level,
      types: base.types,
      maxHp,
      hp: maxHp,
      atk: this.calculateStat(Math.max(base.atk, base.spAtk), level), // Use the higher offensive stat
      def: this.calculateStat(Math.floor((base.def + base.spDef) / 2), level), // Average both defenses
      spAtk: this.calculateStat(base.spAtk, level),
      spDef: this.calculateStat(base.spDef, level),
      speed: this.calculateStat(base.speed, level),
      moveType: primaryType,
      moveName: moves[Math.floor(Math.random() * moves.length)],
      side,
    };
  }

  // ─── TYPE EFFECTIVENESS ────────────────────────────────────────────
  /**
   * Calculate the type multiplier for an attack type vs defender types.
   */
  public getTypeMultiplier(attackType: string, defenderTypes: string[]): number {
    let multiplier = 1.0;
    const chart = TYPE_CHART[attackType];
    if (!chart) return 1.0;

    for (const defType of defenderTypes) {
      if (chart.immune.includes(defType)) return 0;
      if (chart.strong.includes(defType)) multiplier *= 2.0;
      if (chart.weak.includes(defType)) multiplier *= 0.5;
    }

    return multiplier;
  }

  // ─── DAMAGE CALCULATION ────────────────────────────────────────────
  /**
   * Pokémon-inspired damage formula with type effectiveness, variance, and crits.
   */
  public calculateDamage(
    attackerLevel: number,
    attackerAtk: number,
    defenderDef: number,
    typeMultiplier: number
  ): { damage: number; isCrit: boolean } {
    const base = (((2 * attackerLevel) / 5 + 2) * attackerAtk) / Math.max(1, defenderDef) / 50 + 2;
    const variance = 0.85 + Math.random() * 0.15;
    const isCrit = Math.random() < 0.0625; // 6.25% crit rate
    const critMod = isCrit ? 1.5 : 1.0;
    const damage = Math.max(1, Math.floor(base * typeMultiplier * variance * critMod));
    return { damage, isCrit };
  }

  // ─── BATTLE SIMULATION ─────────────────────────────────────────────
  /**
   * Run a full 3v3 automated battle simulation.
   * Returns the complete result with turn-by-turn log.
   */
  public simulateBattle(
    teamA: BattlePokemon[],
    teamB: BattlePokemon[],
    maxTurns: number = 25
  ): BattleResult {
    const log: BattleLogEntry[] = [];
    const snapshots: HpSnapshot[] = [];
    let turn = 0;

    // Tag sides
    teamA.forEach((p) => (p.side = 'A'));
    teamB.forEach((p) => (p.side = 'B'));

    const allPokemon = [...teamA, ...teamB];

    while (turn < maxTurns) {
      turn++;

      // Get alive Pokémon and sort by speed (descending), random tiebreaker
      const alive = allPokemon.filter((p) => p.hp > 0);
      alive.sort((a, b) => b.speed - a.speed || Math.random() - 0.5);

      for (const attacker of alive) {
        if (attacker.hp <= 0) continue;

        // Find alive enemies
        const enemies = allPokemon.filter((p) => p.hp > 0 && p.side !== attacker.side);
        if (enemies.length === 0) break;

        // Pure random targeting
        const target = enemies[Math.floor(Math.random() * enemies.length)];

        // Calculate type effectiveness
        const typeMultiplier = this.getTypeMultiplier(attacker.moveType, target.types);

        if (typeMultiplier === 0) {
          log.push({
            turn,
            text: `${attacker.name} used **${attacker.moveName}** on ${target.name}... It had no effect!`,
            type: 'immune',
          });
          continue;
        }

        // Calculate damage
        const { damage, isCrit } = this.calculateDamage(
          attacker.level,
          attacker.atk,
          target.def,
          typeMultiplier
        );

        target.hp = Math.max(0, target.hp - damage);

        // Build log entry
        let logText = `${attacker.name} used **${attacker.moveName}** on ${target.name} for **${damage}** dmg!`;
        let logType: BattleLogEntry['type'] = 'attack';

        if (isCrit) {
          logText += ' 💥 **CRITICAL HIT!**';
          logType = 'crit';
        }
        if (typeMultiplier >= 2.0) {
          logText += ' ⚡ **Super Effective!**';
          logType = 'super_effective';
        } else if (typeMultiplier <= 0.5) {
          logText += ' 🛡️ Not very effective...';
          logType = 'not_effective';
        }

        log.push({ turn, text: logText, type: logType });

        // Check for faint
        if (target.hp <= 0) {
          log.push({
            turn,
            text: `💀 **${target.name}** fainted!`,
            type: 'faint',
          });
        }

        // Check win condition after each attack
        const teamAAlive = teamA.filter((p) => p.hp > 0).length;
        const teamBAlive = teamB.filter((p) => p.hp > 0).length;

        if (teamAAlive === 0 || teamBAlive === 0) {
          snapshots.push({
            turn,
            teamA: teamA.map((p) => ({ id: p.id, hp: p.hp, maxHp: p.maxHp })),
            teamB: teamB.map((p) => ({ id: p.id, hp: p.hp, maxHp: p.maxHp })),
          });
          return {
            winner: teamAAlive > 0 ? 'A' : 'B',
            log,
            turns: turn,
            teamAState: teamA,
            teamBState: teamB,
            snapshots,
          };
        }
      }

      // Snapshot HP at end of this turn
      snapshots.push({
        turn,
        teamA: teamA.map((p) => ({ id: p.id, hp: p.hp, maxHp: p.maxHp })),
        teamB: teamB.map((p) => ({ id: p.id, hp: p.hp, maxHp: p.maxHp })),
      });
    }

    // Timeout: winner is the side with more total HP%
    const teamAHpPct = teamA.reduce((sum, p) => sum + p.hp / p.maxHp, 0);
    const teamBHpPct = teamB.reduce((sum, p) => sum + p.hp / p.maxHp, 0);

    log.push({
      turn,
      text: `⏱️ Time's up! Battle decided by remaining HP.`,
      type: 'info',
    });

    return {
      winner: teamAHpPct >= teamBHpPct ? 'A' : 'B',
      log,
      turns: turn,
      teamAState: teamA,
      teamBState: teamB,
      snapshots,
    };
  }

  // ─── WILD TEAM GENERATOR ───────────────────────────────────────────
  /**
   * Generate a random wild team of 3 Pokémon scaled to the player's avg level.
   */
  public async generateWildTeam(avgLevel: number): Promise<BattlePokemon[]> {
    // Import the valid Pokémon list from AnimalService
    const validPokemon = [
      'bulbasaur',
      'ivysaur',
      'venusaur',
      'charmander',
      'charmeleon',
      'charizard',
      'squirtle',
      'wartortle',
      'blastoise',
      'pikachu',
      'raichu',
      'jigglypuff',
      'wigglytuff',
      'zubat',
      'golbat',
      'oddish',
      'gloom',
      'vileplume',
      'psyduck',
      'golduck',
      'growlithe',
      'arcanine',
      'abra',
      'kadabra',
      'alakazam',
      'machop',
      'machoke',
      'machamp',
      'geodude',
      'graveler',
      'golem',
      'ponyta',
      'rapidash',
      'slowpoke',
      'slowbro',
      'magnemite',
      'magneton',
      'gastly',
      'haunter',
      'gengar',
      'onix',
      'cubone',
      'marowak',
      'hitmonlee',
      'hitmonchan',
      'koffing',
      'weezing',
      'rhyhorn',
      'rhydon',
      'horsea',
      'seadra',
      'staryu',
      'starmie',
      'scyther',
      'electabuzz',
      'magmar',
      'pinsir',
      'tauros',
      'magikarp',
      'gyarados',
      'lapras',
      'eevee',
      'vaporeon',
      'jolteon',
      'flareon',
      'snorlax',
      'dratini',
      'dragonair',
      'dragonite',
      'mewtwo',
      'mew',
      // Gen 2
      'chikorita',
      'cyndaquil',
      'totodile',
      'pichu',
      'togepi',
      'mareep',
      'espeon',
      'umbreon',
      'murkrow',
      'scizor',
      'heracross',
      'sneasel',
      'houndour',
      'houndoom',
      'larvitar',
      'pupitar',
      'tyranitar',
    ];

    const team: BattlePokemon[] = [];
    const used = new Set<string>();

    while (team.length < 3) {
      const species = validPokemon[Math.floor(Math.random() * validPokemon.length)];
      if (used.has(species)) continue;
      used.add(species);

      // Wild level: avgLevel - 3 to avgLevel + 5, min 1
      const wildLevel = Math.max(1, Math.min(100, avgLevel + Math.floor(Math.random() * 9) - 3));

      const wildPokemon = await this.buildBattlePokemon(
        { speciesKey: species, level: wildLevel, _id: `wild_${species}` },
        'B'
      );

      if (wildPokemon) team.push(wildPokemon);
    }

    return team;
  }

  // ─── XP & REWARD CALCULATION ───────────────────────────────────────
  /**
   * Calculate XP and money rewards after a battle.
   */
  public calculateBattleRewards(
    won: boolean,
    playerTeam: BattlePokemon[],
    enemyTeam: BattlePokemon[],
    faintedXpPenalty: number = 0.2
  ): { xpPerMember: Map<string, number>; money: number } {
    const avgEnemyLevel = enemyTeam.reduce((s, p) => s + p.level, 0) / enemyTeam.length;
    const baseXP = Math.floor(avgEnemyLevel * 20 + 50);
    const xpPerMember = new Map<string, number>();

    if (won) {
      for (const member of playerTeam) {
        const xp = member.hp > 0 ? baseXP : Math.floor(baseXP * faintedXpPenalty);
        xpPerMember.set(member.id, xp);
      }
    } else {
      // Losers still get some XP
      for (const member of playerTeam) {
        const xp = Math.floor(baseXP * 0.3);
        xpPerMember.set(member.id, xp);
      }
    }

    const money = won ? Math.floor(enemyTeam.reduce((s, p) => s + p.level, 0) * 100) : 0;

    return { xpPerMember, money };
  }

  // ─── XP REQUIREMENTS ──────────────────────────────────────────────
  /**
   * Get XP required for the next level.
   */
  public getRequiredXP(level: number): number {
    return level * 50 + level * level * 5;
  }

  // ─── HELPERS ───────────────────────────────────────────────────────

  public getTypeEmoji(type: string): string {
    return TYPE_EMOJI[type] || '❓';
  }

  public getTypeEmojis(types: string[]): string {
    return types.map((t) => TYPE_EMOJI[t] || '❓').join('');
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
  }

  private sanitizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/nidoran\s?♀/g, 'nidoran-f')
      .replace(/nidoran\s?♂/g, 'nidoran-m')
      .replace(/farfetch['']d/g, 'farfetchd')
      .replace(/mr\.\s?mime/g, 'mr-mime')
      .replace(/ho_oh/g, 'ho-oh')
      .replace(/[^a-z0-9-]/g, '');
  }
}

const instance = new PokemonBattleService();
export default instance;
