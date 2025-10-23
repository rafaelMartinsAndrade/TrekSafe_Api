const mongoose = require('mongoose');

const FavoriteTrekSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  trek: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trek',
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { collection: 'TrilhasFavoritas' });

FavoriteTrekSchema.index({ user: 1, trek: 1 }, { unique: true });

module.exports = mongoose.model('FavoriteTrek', FavoriteTrekSchema);
