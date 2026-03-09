import AnimalRegistry from '../models/AnimalRegistry.ts';
import type { IAnimalRegistry } from '../models/AnimalRegistry.ts';

/**
 * ANIMAL REPOSITORY (Professional Librarian)
 */
class AnimalRepository {
  public async getAll(): Promise<IAnimalRegistry[]> {
    return await AnimalRegistry.find({});
  }

  public async findByRarityAndKey(rarity: string, key: string): Promise<IAnimalRegistry | null> {
    return await AnimalRegistry.findOne({ rarity, key });
  }

  public async findByRarity(rarity: string): Promise<IAnimalRegistry[]> {
    return await AnimalRegistry.find({ rarity });
  }

  public async getRandomByRarity(rarity: string): Promise<IAnimalRegistry | null> {
    const animals = await this.findByRarity(rarity);
    if (animals.length === 0) return null;
    return animals[Math.floor(Math.random() * animals.length)];
  }
}

const instance = new AnimalRepository();
export default instance;
