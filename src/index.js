require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');
const mongoose = require('mongoose');
const noticiasRoutes = require('./routes/noticias');
const fuentesRoutes = require('./routes/fuentes');

const app = express();
app.use(cors());
app.use(express.json());

// Documentación de Swagger
app.use('/swagger-ui/m3', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || '27017';
const dbName = process.env.DB_NAME || 'noticias_db';
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;

let mongoUri;
if (user && password) {
  mongoUri = `mongodb://${user}:${password}@${host}:${port}/${dbName}`;
} else {
  mongoUri = `mongodb://${host}:${port}/${dbName}`;
}

mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  heartbeatFrequencyMS: 10000,
  maxPoolSize: 5,
})
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => {
    console.error('Error de conexión:', err.message);
    process.exit(1); // Fuerza restart limpio para que Docker reintente
  });

app.use('/api/noticias', noticiasRoutes);
app.use('/api/fuentes', fuentesRoutes);


app.get('/health', (req, res) => {
  const state = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (state === 1) {
    return res.json({ status: 'ok', db: 'connected' });
  }
  const stateLabel = ['disconnected', 'connected', 'connecting', 'disconnecting'][state] || 'unknown';
  return res.status(503).json({ status: 'error', db: stateLabel });
});

const appPort = process.env.APP_PORT || 5003;
app.listen(appPort, () => {
  console.log(`MS3 Feed-Noticias ejecutándose en puerto ${appPort}`);
});