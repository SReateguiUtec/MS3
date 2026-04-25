const mongoose = require('mongoose');

/**
 * Colección: fuentes
 * Catálogo de fuentes de noticias financieras.
 * Las noticias (colección `noticias`) referencian documentos de esta colección.
 */
const fuenteSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  tipo: {
    type: String,
    enum: ['agencia', 'blog', 'diario', 'red_social', 'otro'],
    default: 'otro'
  },
  confiabilidad: {
    type: Number,
    min: 0,
    max: 100,
    default: 50   // score 0-100
  },
  pais: {
    type: String,
    trim: true
  },
  activo: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

fuenteSchema.index({ nombre: 1 }, { unique: true });
fuenteSchema.index({ tipo: 1 });

module.exports = mongoose.model('Fuente', fuenteSchema);
