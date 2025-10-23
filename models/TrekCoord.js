const mongoose = require('mongoose');

const TrekCoordSchema = new mongoose.Schema({
  trek: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trek',
    required: true,
    index: true
  },
  orderIndex: {
    type: Number,
    required: true,
    index: true
  },
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  },
  alt: {
    type: Number
  },
  accuracy: {
    type: Number
  },
  speed: {
    type: Number
  },
  heading: {
    type: Number
  },
  timestamp: {
    type: Date,
    required: true
  }
}, { collection: 'PontosTrilha' });

TrekCoordSchema.index({ trek: 1, orderIndex: 1 }, { unique: true });
TrekCoordSchema.index({ lat: 1, lng: 1 });

module.exports = mongoose.model('TrekCoord', TrekCoordSchema);