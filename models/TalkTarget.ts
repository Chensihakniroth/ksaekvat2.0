import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * TALK TARGET INTERFACE (Professional Blueprint)
 * This interface defines exactly what a talk target's data looks like. (｡♥‿♥｡)
 */
export interface ITalkTarget extends Document {
  adminId: string;
  channelId: string;
  serverId: string;
  setAt: Date;
}

/**
 * TALK TARGET SCHEMA (Gold Standard)
 * Defines the structure of our talk targets in MongoDB with full type-safety! (｡♥‿♥｡)
 */
const TalkTargetSchema: Schema = new Schema({
  adminId: { type: String, required: true, unique: true },
  channelId: { type: String, required: true },
  serverId: { type: String, default: 'DM' },
  setAt: { type: Date, default: Date.now },
});

const TalkTarget: Model<ITalkTarget> = mongoose.model<ITalkTarget>('TalkTarget', TalkTargetSchema);
export default TalkTarget;
