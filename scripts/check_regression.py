#!/usr/bin/env python3
from pathlib import Path
import sys

checks = [
    ("v3-preview/index.html", 'id="ramTopBtn"', "botón Memoria"),
    ("v3-preview/index.html", 'id="figureSprite"', "sprite SVG inline"),
    ("v3-preview/app-core.js", 'id="homeMemoryBtn"', "tarjeta Memoria en Inicio"),
    ("v3-preview/app-core.js", "type:'svg'", "contenido SVG"),
    ("v3-preview/working-memory.js", "function renderWmPanel", "panel Memoria"),
    ("v3-preview/ram.js", "function renderRamConfig", "RAM"),
    ("v3-preview/news.js", "function renderNews", "News"),
    ("v3-preview/pagination.js", "function createPager", "paginación"),
]
errors=[]
for filename, needle, label in checks:
    path=Path(filename)
    if not path.exists():
        errors.append(f"Falta archivo: {filename}")
        continue
    content=path.read_text(encoding="utf-8")
    if needle not in content:
        errors.append(f"Falta funcionalidad {label} en {filename}")
if errors:
    print("\n".join(errors))
    sys.exit(1)
print("Regression checks OK")

# Inicio: solo opciones de entrenamiento; estadísticas quedan en Mi progreso.
core = Path("v3-preview/app-core.js").read_text(encoding="utf-8")
home_start = core.find("function renderHome()")
home = core[home_start:]
for forbidden in ["home-dashboard","Actividad y evolución","homeResultsBtn","seeAllResultsBtn","versionPanelHTML()"]:
    if forbidden in home:
        print("Regresión en Inicio; contenido no permitido:", forbidden)
        sys.exit(1)
for required in ["RAM · Palabras","RAM · Objetos","Memoria de trabajo","data-memory-action"]:
    if required not in home:
        print("Regresión en Inicio; falta:", required)
        sys.exit(1)
