# MS3 - Feed de Noticias

Servicio de noticias financieras, fuentes y sentimiento agregado por simbolo.

![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-ODM-880000?style=for-the-badge&logo=mongoose&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)

## Responsabilidad

- Listar ultimas noticias financieras.
- Consultar noticias por simbolo.
- Calcular sentimiento predominante por simbolo.
- Administrar fuentes de noticias.
- Exponer health check con estado de MongoDB.

## Requisitos

- Node.js 20+
- npm
- MongoDB

## Instalacion

```bash
npm install
cp .env.example .env
```

Edita `.env` con los datos de conexion a MongoDB.

## Variables de entorno

```env
DB_HOST=localhost
DB_PORT=27017
DB_NAME=noticias_db
DB_USER=
DB_PASSWORD=
APP_PORT=5003
```

Si `DB_USER` y `DB_PASSWORD` estan vacios, el servicio se conecta sin autenticacion.

## Ejecutar en desarrollo

```bash
npm run dev
```

## Ejecutar en produccion local

```bash
npm start
```

El servicio queda disponible en:

```text
http://localhost:5003
```

## Endpoints principales

| Metodo | Ruta | Descripcion |
| ------ | ---- | ----------- |
| GET | `/health` | Health check y estado de MongoDB |
| GET | `/api/noticias/latest?limit=50` | Ultimas noticias |
| GET | `/api/noticias/:simbolo` | Noticias por simbolo |
| GET | `/api/noticias/:simbolo/latest` | Ultima noticia de un simbolo |
| GET | `/api/noticias/:simbolo/sentimiento` | Sentimiento agregado |
| POST | `/api/noticias` | Crea una noticia |
| DELETE | `/api/noticias/:id` | Elimina una noticia |
| GET | `/api/fuentes` | Lista fuentes activas |
| GET | `/api/fuentes/all` | Lista todas las fuentes |
| GET | `/api/fuentes/:id` | Detalle de fuente |
| GET | `/api/fuentes/:id/noticias` | Noticias por fuente |
| POST | `/api/fuentes` | Crea una fuente |
| PUT | `/api/fuentes/:id` | Actualiza una fuente |
| DELETE | `/api/fuentes/:id` | Desactiva una fuente |

## Seed de datos

```bash
python seed_data.py
```

## Docker

```bash
docker build -t fintrend-ms3-noticias .
docker run --env-file .env -p 5003:5003 fintrend-ms3-noticias
```

## Estructura

```text
.
├── src/
│   ├── index.js
│   ├── models/
│   │   ├── Fuente.js
│   │   └── Noticia.js
│   └── routes/
│       ├── fuentes.js
│       └── noticias.js
├── seed_data.py
├── package.json
├── package-lock.json
├── Dockerfile
├── .gitignore
└── .env.example
```
