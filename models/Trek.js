const mongoose = require('mongoose');

const TrekSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Por favor, informe o título da trilha']
  },
  description: {
    type: String
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startedAt: {
    type: Date
  },
  endedAt: {
    type: Date
  },
  totalDistance: {
    type: Number,
    default: 0
  },
  durationSeconds: {
    type: Number,
    default: 0
  },
  isOnline: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  initialLat: {
    type: Number,
    required: [true, 'Por favor, informe a latitude inicial da trilha']
  },
  initialLng: {
    type: Number,
    required: [true, 'Por favor, informe a longitude inicial da trilha']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

TrekSchema.index({ initialLat: 1, initialLng: 1 });

module.exports = mongoose.model('Trek', TrekSchema);