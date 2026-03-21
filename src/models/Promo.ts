import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * PROMO INTERFACE (Professional Blueprint)
 * This interface defines exactly what a promo's data looks like. (｡♥‿♥｡)
 */
export interface IPromo extends Document {
  code: string;
  type: 'riel' | 'pulls';
  amount: number;
  usedBy: string[];
  maxUses: number;
  createdAt: Date;
}

/**
 * PROMO SCHEMA (Gold Standard)
 * Defines the structure of our promos in MongoDB with full type-safety! (｡♥‿♥｡)
 */
const PromoSchema: Schema = new Schema({
  code: { type: String, required: true, unique: true },
  type: { type: String, enum: ['riel', 'pulls'], required: true },
  amount: { type: Number, required: true },
  usedBy: [String], // Array of Discord IDs
  maxUses: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
});

const Promo: Model<IPromo> = mongoose.model<IPromo>('Promo', PromoSchema);
export default Promo;
