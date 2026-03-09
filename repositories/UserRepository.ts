import User, { IUser } from '../models/User';

/**
 * USER REPOSITORY (Professional Librarian)
 * This class handles all the complex database queries and caching for user data!
 * (｡♥‿♥｡) Industry Standard: Decoupling your database from your business logic.
 */
class UserRepository {
  /**
   * Find a user by their Discord ID, or create one if they don't exist.
   */
  public async findById(id: string, username: string = 'Unknown Traveler'): Promise<IUser> {
    let user = await User.findOne({ id });

    if (!user) {
      user = await User.create({ id, username });
    }

    return user;
  }

  /**
   * Save a user's data back to the database.
   */
  public async save(user: IUser): Promise<IUser> {
    return await user.save();
  }

  /**
   * Update a user's statistics in a single database operation.
   */
  public async updateStats(id: string, statsUpdate: any): Promise<IUser | null> {
    return await User.findOneAndUpdate({ id }, { $inc: statsUpdate }, { new: true });
  }

  /**
   * Get all users in the database (useful for cron jobs).
   */
  public async getAll(): Promise<IUser[]> {
    return await User.find({});
  }

  /**
   * Get the top users by balance (for leaderboards).
   */
  public async getTopBalances(limit: number = 10): Promise<IUser[]> {
    return await User.find({}).sort({ balance: -1 }).limit(limit);
  }
}

const instance = new UserRepository();
export default instance;
