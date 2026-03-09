import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * CHARACTER INTERFACE (Professional Blueprint)
 * This interface defines exactly what a character's data looks like. (｡♥‿♥｡)
 */
export interface ICharacter extends Document {
  name: string;
  game: string;
  rarity: '3' | '4' | '5';
  emoji: string;
  type: 'character' | 'weapon';
  image_url: string;
  updatedAt: Date;
}

/**
 * CHARACTER SCHEMA (Gold Standard - Collection: characters)
 * This model handles all items in the Gacha Pool (Characters & Weapons).
 */
const CharacterSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    game: { type: String, required: true },
    rarity: { type: String, enum: ['3', '4', '5'], required: true },
    emoji: { type: String, default: '✨' },
    type: { type: String, enum: ['character', 'weapon'], required: true },
    image_url: { type: String, default: '' }, // Unified image storage
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: 'characters' }
); // Force use of existing 'characters' collection

// Compound unique index for name and game
CharacterSchema.index({ name: 1, game: 1 }, { unique: true });

const Character: Model<ICharacter> = mongoose.model<ICharacter>('Character', CharacterSchema);
export default Character;
