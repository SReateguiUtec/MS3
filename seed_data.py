"""
Seed script: inserta fuentes y noticias ficticias en MongoDB (MS3).

Uso:
    pip install pymongo python-dotenv
    python seed_data.py

Variables de entorno (.env o shell):
    DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
"""

import os
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pymongo import MongoClient, ASCENDING, DESCENDING
from bson import ObjectId

load_dotenv()

DB_HOST     = os.getenv("DB_HOST", "localhost")
DB_PORT     = int(os.getenv("DB_PORT", 27017))
DB_USER     = os.getenv("DB_USER", "admin")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME     = os.getenv("DB_NAME", "noticias_db")

# ---------------------------------------------------------------------------
# Catálogo de fuentes
# ---------------------------------------------------------------------------

FUENTES_DATA = [
    {"nombre": "Reuters",        "url": "https://www.reuters.com",        "tipo": "agencia",     "confiabilidad": 95, "pais": "UK"},
    {"nombre": "Bloomberg",      "url": "https://www.bloomberg.com",      "tipo": "agencia",     "confiabilidad": 93, "pais": "USA"},
    {"nombre": "CNBC",           "url": "https://www.cnbc.com",           "tipo": "diario",      "confiabilidad": 85, "pais": "USA"},
    {"nombre": "Financial Times","url": "https://www.ft.com",             "tipo": "diario",      "confiabilidad": 92, "pais": "UK"},
    {"nombre": "MarketWatch",    "url": "https://www.marketwatch.com",    "tipo": "diario",      "confiabilidad": 80, "pais": "USA"},
    {"nombre": "Seeking Alpha",  "url": "https://seekingalpha.com",       "tipo": "blog",        "confiabilidad": 65, "pais": "USA"},
    {"nombre": "The Motley Fool","url": "https://www.fool.com",           "tipo": "blog",        "confiabilidad": 70, "pais": "USA"},
    {"nombre": "Yahoo Finance",  "url": "https://finance.yahoo.com",      "tipo": "agencia",     "confiabilidad": 78, "pais": "USA"},
    {"nombre": "StockTwits",     "url": "https://stocktwits.com",         "tipo": "red_social",  "confiabilidad": 50, "pais": "USA"},
    {"nombre": "Investing.com",  "url": "https://www.investing.com",      "tipo": "diario",      "confiabilidad": 75, "pais": "CYP"},
]

# ---------------------------------------------------------------------------
# Plantillas de titulares por símbolo y sentimiento
# ---------------------------------------------------------------------------

TITULARES = {
    "AAPL": {
        "Bullish":  [
            "Apple supera expectativas de ingresos en Q{q} con ventas récord de iPhone",
            "Apple anuncia expansión masiva de servicios en Latinoamérica",
            "Analistas elevan precio objetivo de AAPL a ${price} tras resultados",
            "Apple Vision Pro dispara las acciones al alza en sesión del Nasdaq",
            "Recompra de acciones de Apple por $90,000M impulsa precio al máximo histórico",
        ],
        "Bearish":  [
            "Caída en ventas de iPhone en China preocupa a inversores de Apple",
            "Apple enfrenta demanda antimonopolio en la UE que pesa en sus acciones",
            "Cadena de suministro de Apple afectada por tensiones geopolíticas",
            "Márgenes de Apple se contraen ante aumento de costos de producción",
        ],
        "Neutral":  [
            "Apple presenta iOS {v} con actualizaciones de privacidad",
            "Evento Apple WWDC: novedades para desarrolladores sin sorpresas en hardware",
            "Tim Cook habla sobre inteligencia artificial en conferencia de Stanford",
        ],
    },
    "NVDA": {
        "Bullish":  [
            "NVIDIA bate récords de ingresos gracias a chips H100 para IA",
            "Demanda de GPUs NVIDIA se dispara entre proveedores de nube",
            "NVIDIA anuncia arquitectura Blackwell: salto generacional en IA",
            "Acuerdo de NVIDIA con Microsoft para centros de datos impulsa acciones",
        ],
        "Bearish":  [
            "Restricciones de exportación de EEUU afectan ventas de NVIDIA a China",
            "Competencia de AMD y startups de chips presiona márgenes de NVIDIA",
            "Inventarios de chips NVIDIA en canales de distribución generan incertidumbre",
        ],
        "Neutral":  [
            "Jensen Huang presenta roadmap de chips para los próximos dos años",
            "NVIDIA GTC 2025: conferencia de desarrolladores sin grandes sorpresas",
        ],
    },
    "MSFT": {
        "Bullish":  [
            "Azure crece {pct}% interanual y supera estimaciones de Wall Street",
            "Microsoft Copilot adopción empresarial supera el millón de usuarios activos",
            "Acuerdo de Microsoft con OpenAI amplía ventaja competitiva en IA",
        ],
        "Bearish":  [
            "Reguladores de la UE investigan prácticas de bundling de Microsoft Teams",
            "Desaceleración en gasto corporativo en TI afecta a Microsoft",
        ],
        "Neutral":  [
            "Microsoft lanza Windows 12 con integración nativa de IA",
            "Satya Nadella discute estrategia de nube en Davos",
        ],
    },
    "GOOGL": {
        "Bullish":  [
            "Google Cloud registra crecimiento de {pct}% en trimestre",
            "Gemini Ultra supera benchmarks de GPT-4 en pruebas de terceros",
            "YouTube Premium alcanza 100 millones de suscriptores, record histórico",
        ],
        "Bearish":  [
            "Caso antimonopolio contra Google avanza en tribunal federal",
            "Pérdida de participación de mercado en búsquedas por IA de OpenAI",
        ],
        "Neutral":  [
            "Google presenta Gemini 2.0 en evento de desarrolladores I/O",
            "Alphabet reorganiza divisiones para enfocarse en IA y nube",
        ],
    },
    "TSLA": {
        "Bullish":  [
            "Tesla entrega {n}K vehículos en Q{q}, superando estimaciones",
            "Cybertruck agota stock en primeras semanas de lanzamiento masivo",
            "Tesla Robotaxi recibe aprobación piloto en California",
        ],
        "Bearish":  [
            "Márgenes de Tesla caen a mínimos históricos tras guerra de precios",
            "Retrasos en producción del Roadster 2 preocupan a inversores",
            "Elon Musk distrae con Twitter/X, según analistas de Wedbush",
        ],
        "Neutral":  [
            "Tesla abre Gigafactory en México con capacidad de 500K vehículos/año",
            "Elon Musk presenta avances en Full Self-Driving en Beta 12",
        ],
    },
}

SIMBOLOS = list(TITULARES.keys())
SENTIMIENTOS = ["Bullish", "Bearish", "Neutral"]
# Peso probabilístico: más bullish y neutral que bearish
PESOS = [0.40, 0.25, 0.35]

NOTICIAS_POR_SIMBOLO = 4050   # 5 símbolos × 4050 = 20,250 noticias
START_DATE = datetime(2023, 1, 1) # Un rango más amplio para 20k noticias

def pick_titulo(simbolo, sentimiento):
    plantillas = TITULARES[simbolo][sentimiento]
    t = random.choice(plantillas)
    return t.format(
        q=random.randint(1, 4),
        price=random.randint(180, 300),
        v=random.randint(17, 19),
        pct=random.randint(20, 45),
        n=random.randint(400, 550),
    )

def seed():
    uri = f"mongodb://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?authSource=admin"
    print(f"Conectando a MongoDB ({DB_HOST}:{DB_PORT})...")
    client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    db = client[DB_NAME]

    fuentes_col = db["fuentes"]
    noticias_col = db["noticias"]

    # Limpiar datos previos del seed
    fuentes_col.drop()
    noticias_col.drop()

    # Índices
    fuentes_col.create_index([("nombre", ASCENDING)], unique=True)
    noticias_col.create_index([("simbolo", ASCENDING), ("fechaPublicacion", DESCENDING)])
    noticias_col.create_index([("fuente_id", ASCENDING)])

    # --- Insertar fuentes ---
    print("Insertando fuentes...")
    now = datetime.utcnow()
    fuentes_docs = [{**f, "activo": True, "createdAt": now} for f in FUENTES_DATA]
    result = fuentes_col.insert_many(fuentes_docs)
    fuentes_ids = result.inserted_ids
    print(f"  {len(fuentes_ids)} fuentes insertadas.")

    # Mapeo nombre → ObjectId para referencia
    fuentes_map = {doc["nombre"]: oid for doc, oid in zip(fuentes_docs, fuentes_ids)}

    # --- Insertar noticias ---
    print("Insertando noticias...")
    noticias = []
    for simbolo in SIMBOLOS:
        for _ in range(NOTICIAS_POR_SIMBOLO):
            sentimiento = random.choices(SENTIMIENTOS, weights=PESOS, k=1)[0]
            fuente_nombre = random.choice(FUENTES_DATA)["nombre"]
            fuente_id = fuentes_map[fuente_nombre]
            dias_offset = random.randint(0, 300)
            horas_offset = random.randint(6, 22)
            fecha = START_DATE + timedelta(days=dias_offset, hours=horas_offset)

            noticias.append({
                "titulo":          pick_titulo(simbolo, sentimiento),
                "simbolo":         simbolo,
                "sentimiento":     sentimiento,
                "fuente_id":       fuente_id,
                "fuente":          fuente_nombre,
                "url":             f"https://example.com/noticias/{simbolo.lower()}/{dias_offset}",
                "fechaPublicacion": fecha,
                "createdAt":       now,
            })

    result = noticias_col.insert_many(noticias)
    print(f"  {len(result.inserted_ids)} noticias insertadas.")

    client.close()
    print("\nSeed MS3 completado ✓")


if __name__ == "__main__":
    seed()
