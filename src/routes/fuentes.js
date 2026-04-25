const express = require('express');
const Fuente = require('../models/Fuente');
const Noticia = require('../models/Noticia');

const router = express.Router();

// GET /api/fuentes  →  listar todas las fuentes activas
router.get('/', async (req, res) => {
  try {
    const fuentes = await Fuente.find({ activo: true }).sort({ confiabilidad: -1 });
    res.json(fuentes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/fuentes/all  →  listar todas incluyendo inactivas
router.get('/all', async (req, res) => {
  try {
    const fuentes = await Fuente.find().sort({ nombre: 1 });
    res.json(fuentes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/fuentes/:id  →  detalle de una fuente
router.get('/:id', async (req, res) => {
  try {
    const fuente = await Fuente.findById(req.params.id);
    if (!fuente) return res.status(404).json({ error: 'Fuente no encontrada' });
    res.json(fuente);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/fuentes/:id/noticias  →  noticias publicadas por esta fuente
router.get('/:id/noticias', async (req, res) => {
  try {
    const noticias = await Noticia
      .find({ fuente_id: req.params.id })
      .sort({ fechaPublicacion: -1 })
      .limit(50);
    res.json(noticias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/fuentes  →  registrar nueva fuente
router.post('/', async (req, res) => {
  try {
    const fuente = new Fuente(req.body);
    await fuente.save();
    res.status(201).json(fuente);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/fuentes/:id  →  actualizar fuente
router.put('/:id', async (req, res) => {
  try {
    const fuente = await Fuente.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!fuente) return res.status(404).json({ error: 'Fuente no encontrada' });
    res.json(fuente);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/fuentes/:id  →  desactivar fuente (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const fuente = await Fuente.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    );
    if (!fuente) return res.status(404).json({ error: 'Fuente no encontrada' });
    res.json({ message: 'Fuente desactivada', fuente });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
