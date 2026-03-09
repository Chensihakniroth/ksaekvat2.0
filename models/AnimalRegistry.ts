import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * ANIMAL REGISTRY INTERFACE (Professional Blueprint)
 * This interface defines exactly what an animal's data looks like. (｡♥‿♥｡)
 */
export interface IAnimalRegistry extends Document {
  rarity: string;
  key: string;
  name: string;
  emoji: string;
  value: number;
}

/**
 * ANIMAL REGISTRY SCHEMA (Gold Standard)
 * Defines the structure of our animal registry in MongoDB with full type-safety! (｡♥‿♥｡)
 */
const AnimalRegistrySchema: Schema = new Schema({
  rarity: { type: String, required: true },
  key: { type: String, required: true },
  name: { type: String, required: true },
  emoji: { type: String, default: '🐾' },
  value: { type: Number, default: 0 },
});

// Compound index for rarity and key
AnimalRegistrySchema.index({ rarity: 1, key: 1 }, { unique: true });

const AnimalRegistry: Model<IAnimalRegistry> = mongoose.model<IAnimalRegistry>(
  'AnimalRegistry',
  AnimalRegistrySchema
);
export default AnimalRegistry;
