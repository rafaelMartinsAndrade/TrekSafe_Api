const mongoose = require('mongoose');

const POISchema = new mongoose.Schema({
  trek: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trek',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Informe o nome do POI']
  },
  description: {
    type: String
  },
  lat: {
    type: Number,
    required: [true, 'Informe a latitude do POI']
  },
  lng: {
    type: Number,
    required: [true, 'Informe a longitude do POI']
  },
  alt: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { collection: 'POIs' });

POISchema.index({ trek: 1 });

module.exports = mongoose.model('POI', POISchema);
