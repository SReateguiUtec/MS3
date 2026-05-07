const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Feed-Noticias API (MS3)',
      version: '1.0.0',
      description: 'API de Noticias y Sentimiento Financiero',
    },
    servers: [
      {
        url: 'http://localhost:5003',
        description: 'Servidor Local',
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Archivos que contienen anotaciones
};

const specs = swaggerJsdoc(options);

module.exports = specs;
