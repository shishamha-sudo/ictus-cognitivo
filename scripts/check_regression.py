#!/usr/bin/env python3
from pathlib import Path
import sys

checks = [
    ("v3-preview/index.html", 'id="figureSprite"', "sprite SVG inline"),
    ("v3-preview/app-core.js", "type:'svg'", "contenido SVG"),
    ("v3-preview/working-memory.js", "function renderWmPanel", "panel Memoria"),
    ("v3-preview/working-memory.js", "const WM_TASKS", "tareas de Memoria"),
    ("v3-preview/ram.js", "function renderRamConfig", "RAM"),
    ("v3-preview/news.js", "function renderNews", "News"),
    ("v3-preview/pagination.js", "function createPager", "paginación"),
    ("v3-preview/evidence.js", "function renderMyProgress", "Mi progreso"),
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

index=Path("v3-preview/index.html").read_text(encoding="utf-8")
if 'id="ramTopBtn"' in index:
    errors.append("Memoria no debe aparecer en la cabecera")

core=Path("v3-preview/app-core.js").read_text(encoding="utf-8")
home_start=core.find("function renderHome()")
home=core[home_start:] if home_start>=0 else ""
for forbidden in ["home-dashboard","Actividad y evolución","homeResultsBtn","seeAllResultsBtn"]:
    if forbidden in home:
        errors.append(f"Inicio contiene elemento no permitido: {forbidden}")

for required in ["RAM · Palabras","RAM · Objetos","Memoria de trabajo","data-memory-action","versionPanelHTML()"]:
    if required not in home:
        errors.append(f"Inicio no contiene elemento requerido: {required}")

if errors:
    print("\n".join(errors))
    sys.exit(1)
print("Regression checks OK")

# Acceso anonymous debe seguir disponible.
auth = Path("v3-preview/auth.js").read_text(encoding="utf-8")
for required in ["anonymousLoginBtn","signInAnonymously","displayName=isAnonymous?'anonymous'"]:
    if required not in auth:
        print("Regresión: falta acceso anonymous:", required)
        sys.exit(1)

# Anonymous debe poder funcionar sin Firestore.
auth = Path("v3-preview/auth.js").read_text(encoding="utf-8")
for required in ["loadAnonymousResults","saveAnonymousResults","u.isAnonymous","ANON_RESULTS_KEY"]:
    if required not in auth:
        print("Regresión: falta fallback local anonymous:", required)
        sys.exit(1)
