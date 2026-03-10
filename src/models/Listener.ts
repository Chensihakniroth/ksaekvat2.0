import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * LISTENER INTERFACE (Professional Blueprint)
 * This interface defines exactly what a listener's data looks like. (｡♥‿♥｡)
 */
export interface IListener extends Document {
  adminId: string;
  targetUserId: string;
  createdAt: Date;
}

/**
 * LISTENER SCHEMA (Gold Standard)
 * Defines the structure of our listeners in MongoDB with full type-safety! (｡♥‿♥｡)
 */
const ListenerSchema: Schema = new Schema({
  adminId: { type: String, required: true, unique: true },
  targetUserId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Listener: Model<IListener> = mongoose.model<IListener>('Listener', ListenerSchema);
export default Listener;
