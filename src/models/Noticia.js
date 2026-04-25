const mongoose = require('mongoose');

const noticiaSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true
  },
  simbolo: {
    type: String,
    required: true,
    index: true
  },
  sentimiento: {
    type: String,
    enum: ['Bullish', 'Bearish', 'Neutral'],
    required: true
  },
  // Referencia a la colección `fuentes`
  fuente_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fuente',
    default: null
  },
  fuente: {
    type: String    // nombre denormalizado para queries rápidas
  },
  url: {
    type: String
  },
  fechaPublicacion: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

noticiaSchema.index({ simbolo: 1, fechaPublicacion: -1 });
noticiaSchema.index({ fuente_id: 1 });

module.exports = mongoose.model('Noticia', noticiaSchema);