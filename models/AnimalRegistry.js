const mongoose = require('mongoose');

const AnimalRegistrySchema = new mongoose.Schema({
  rarity: { type: String, required: true },
  key: { type: String, required: true },
  name: { type: String, required: true },
  emoji: { type: String, default: '🐾' },
  value: { type: Number, default: 0 },
});

// Compound index for rarity and key
AnimalRegistrySchema.index({ rarity: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('AnimalRegistry', AnimalRegistrySchema);
