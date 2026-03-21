import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGachaHistory extends Document {
  userId: string;
  username: string;
  itemName: string;
  game: string;
  rarity: number;
  timestamp: Date;
}

const GachaHistorySchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  username: { type: String, required: true },
  itemName: { type: String, required: true },
  game: { type: String, required: true },
  rarity: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

// Set auto-delete after 7 days to keep the database clean
GachaHistorySchema.index({ timestamp: 1 }, { expireAfterSeconds: 604800 });

const GachaHistory: Model<IGachaHistory> = mongoose.model<IGachaHistory>('GachaHistory', GachaHistorySchema);
export default GachaHistory;
