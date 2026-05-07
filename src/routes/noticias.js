const express = require('express');
const Noticia = require('../models/Noticia');

const router = express.Router();

/**
 * @swagger
 * /api/noticias/latest:
 *   get:
 *     summary: Últimas noticias
 *     tags: [Noticias]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de noticias recientes
 */
// Últimas noticias de todos los símbolos (sin filtro)
router.get('/latest', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const noticias = await Noticia.find().sort({ fechaPublicacion: -1 }).limit(limit);
    res.json(noticias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/noticias/{simbolo}:
 *   get:
 *     summary: Noticias por símbolo
 *     tags: [Noticias]
 *     parameters:
 *       - in: path
 *         name: simbolo
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de noticias del símbolo
 */
// Noticias por símbolo
router.get('/:simbolo', async (req, res) => {
  try {
    const { simbolo } = req.params;
    const noticias = await Noticia.find({ simbolo }).sort({ fechaPublicacion: -1 }).limit(50);
    res.json(noticias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Última noticia de un símbolo
router.get('/:simbolo/latest', async (req, res) => {
  try {
    const { simbolo } = req.params;
    const noticia = await Noticia.findOne({ simbolo }).sort({ fechaPublicacion: -1 });
    if (!noticia) {
      return res.status(404).json({ error: 'No hay noticias para este símbolo' });
    }
    res.json(noticia);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/noticias/{simbolo}/sentimiento:
 *   get:
 *     summary: Sentimiento agregado de un símbolo
 *     tags: [Noticias]
 *     parameters:
 *       - in: path
 *         name: simbolo
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sentimiento predominante
 */
// Sentimiento agregado de un símbolo
router.get('/:simbolo/sentimiento', async (req, res) => {
  try {
    const { simbolo } = req.params;
    const noticias = await Noticia.find({ simbolo }).sort({ fechaPublicacion: -1 }).limit(10);

    const sentimientoCount = noticias.reduce((acc, n) => {
      acc[n.sentimiento] = (acc[n.sentimiento] || 0) + 1;
      return acc;
    }, {});

    const sentimientoPredominante = Object.entries(sentimientoCount)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Neutral';

    res.json({
      simbolo,
      sentimiento: sentimientoPredominante,
      conteo: sentimientoCount,
      total: noticias.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear noticia
router.post('/', async (req, res) => {
  try {
    const noticia = new Noticia(req.body);
    await noticia.save();
    res.status(201).json(noticia);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Eliminar noticia
router.delete('/:id', async (req, res) => {
  try {
    const noticia = await Noticia.findByIdAndDelete(req.params.id);
    if (!noticia) {
      return res.status(404).json({ error: 'Noticia no encontrada' });
    }
    res.json({ message: 'Noticia eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;