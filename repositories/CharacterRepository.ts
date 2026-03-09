import Character from '../models/Character';
import type { ICharacter } from '../models/Character';

/**
 * CHARACTER REPOSITORY (Professional Librarian)
 * This class handles all the complex database queries for the gacha pool!
 * (｡♥‿♥｡) Industry Standard: Decoupling your database from your gacha logic.
 */
class CharacterRepository {
  /**
   * Find a single character by its name.
   */
  public async findByName(name: string): Promise<ICharacter | null> {
    return await Character.findOne({ name });
  }

  /**
   * Get all characters in the gacha pool, organized by rarity.
   */
  public async getPoolByRarity(): Promise<Record<string, ICharacter[]>> {
    const allChars = await Character.find({});
    const pool: Record<string, ICharacter[]> = {
      '3': [],
      '4': [],
      '5': [],
    };

    for (const char of allChars) {
      if (pool[char.rarity]) {
        pool[char.rarity].push(char);
      }
    }

    return pool;
  }

  /**
   * Find all characters from a specific game (e.g., 'Genshin', 'HSR').
   */
  public async findByGame(game: string): Promise<ICharacter[]> {
    return await Character.find({ game });
  }

  /**
   * Get the total count of characters in the pool.
   */
  public async getCount(): Promise<number> {
    return await Character.countDocuments();
  }
}

const instance = new CharacterRepository();
export default instance;
