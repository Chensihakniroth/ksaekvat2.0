import AnimalRegistry from '../models/AnimalRegistry';
import type { IAnimalRegistry } from '../models/AnimalRegistry';

/**
 * ANIMAL REPOSITORY (Professional Librarian)
 * This class handles all the complex database queries for your animal world!
 * (｡♥‿♥｡) Industry Standard: Decoupling your database from your RPG logic.
 */
class AnimalRepository {
  /**
   * Get all animals from the registry.
   */
  public async getAll(): Promise<IAnimalRegistry[]> {
    return await AnimalRegistry.find({});
  }

  /**
   * Find a specific animal by its rarity and unique key.
   */
  public async findByRarityAndKey(rarity: string, key: string): Promise<IAnimalRegistry | null> {
    return await AnimalRegistry.findOne({ rarity, key });
  }

  /**
   * Get all animals of a certain rarity.
   */
  public async findByRarity(rarity: string): Promise<IAnimalRegistry[]> {
    return await AnimalRegistry.find({ rarity });
  }

  /**
   * Get a random animal from a specific rarity pool.
   */
  public async getRandomByRarity(rarity: string): Promise<IAnimalRegistry | null> {
    const animals = await this.findByRarity(rarity);
    if (animals.length === 0) return null;
    return animals[Math.floor(Math.random() * animals.length)];
  }
}

const instance = new AnimalRepository();
export default instance;
