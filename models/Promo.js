const mongoose = require('mongoose');

const PromoSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  type: { type: String, enum: ['riel', 'pulls'], required: true },
  amount: { type: Number, required: true },
  usedBy: [String], // Array of Discord IDs
  maxUses: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Promo', PromoSchema);
