import User from '../models/User.ts';
import type { IUser } from '../models/User.ts';

/**
 * USER REPOSITORY (Professional Librarian)
 */
class UserRepository {
  public async findById(id: string, username: string = 'Unknown Traveler'): Promise<IUser> {
    let user = await User.findOne({ id });
    if (!user) user = await User.create({ id, username });
    return user;
  }

  public async save(user: IUser): Promise<IUser> {
    return await user.save();
  }

  public async updateStats(id: string, statsUpdate: any): Promise<IUser | null> {
    return await User.findOneAndUpdate({ id }, { $inc: statsUpdate }, { new: true });
  }

  public async getAll(): Promise<IUser[]> {
    return await User.find({});
  }

  public async getTopBalances(limit: number = 10): Promise<IUser[]> {
    return await User.find({}).sort({ balance: -1 }).limit(limit);
  }
}

const instance = new UserRepository();
export default instance;
