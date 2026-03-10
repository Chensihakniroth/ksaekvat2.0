import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * CHARACTER CARD INTERFACE (Professional Blueprint)
 * This interface defines exactly what a character card's data looks like. (｡♥‿♥｡)
 */
export interface ICharacterCard extends Document {
  id: string;
  name: string;
  style: string;
  personality: string;
  rules: string;
  updatedAt: Date;
}

/**
 * CHARACTER CARD SCHEMA (Gold Standard)
 * Defines the structure of our character cards in MongoDB with full type-safety! (｡♥‿♥｡)
 */
const CharacterCardSchema: Schema = new Schema({
  id: { type: String, default: 'default', unique: true },
  name: { type: String, required: true },
  style: { type: String, default: 'Modern Anime' },
  personality: { type: String, default: 'Mommy' },
  rules: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now },
});

const CharacterCard: Model<ICharacterCard> = mongoose.model<ICharacterCard>(
  'CharacterCard',
  CharacterCardSchema
);
export default CharacterCard;
