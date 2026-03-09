import Character from '../models/Character.ts';
import type { ICharacter } from '../models/Character.ts';

/**
 * CHARACTER REPOSITORY (Professional Librarian)
 */
class CharacterRepository {
  public async findByName(name: string): Promise<ICharacter | null> {
    return await Character.findOne({ name });
  }

  public async getPoolByRarity(): Promise<Record<string, ICharacter[]>> {
    const allChars = await Character.find({});
    const pool: Record<string, ICharacter[]> = { '3': [], '4': [], '5': [] };
    for (const char of allChars) {
      if (pool[char.rarity]) pool[char.rarity].push(char);
    }
    return pool;
  }

  public async findByGame(game: string): Promise<ICharacter[]> {
    return await Character.find({ game });
  }

  public async getCount(): Promise<number> {
    return await Character.countDocuments();
  }
}

const instance = new CharacterRepository();
export default instance;
