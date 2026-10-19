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

# Contrato gráfico SVG.
index = Path("v3-preview/index.html").read_text(encoding="utf-8")
sprite_start = index.find('id="figureSprite"')
sprite_end = index.find('</svg>', sprite_start)
sprite = index[sprite_start:sprite_end] if sprite_start >= 0 else ""
if "<text" in sprite:
    print("Regresión gráfica: el sprite contiene texto/emojis en vez de vectores")
    sys.exit(1)

main_js = Path("v3-preview/app-main.js").read_text(encoding="utf-8")
if 'value="emoji"' in main_js or "Emoji / símbolo" in main_js:
    print("Regresión gráfica: el editor permite elementos emoji")
    sys.exit(1)

wm = Path("v3-preview/working-memory.js").read_text(encoding="utf-8")
ram = Path("v3-preview/ram.js").read_text(encoding="utf-8")
if "href=\"#'+escapeHTML" not in wm:
    print("Regresión gráfica: Memoria no usa referencias SVG con #")
    sys.exit(1)
if "href=\"#'+escapeHTML" not in ram:
    print("Regresión gráfica: RAM no usa referencias SVG con #")
    sys.exit(1)

for filename in [
    "v3-preview/app-core.js",
    "v3-preview/app-main.js",
    "v3-preview/working-memory.js",
    "v3-preview/ram.js",
    "v3-preview/evidence.js",
    "v3-preview/news.js",
    "v3-preview/auth.js"
]:
    content = Path(filename).read_text(encoding="utf-8")
    for forbidden in ["🍎","🎨","🔷","🧩","📈","📚","📰","👁","⚙","↪","👤","🏠","🖼️","▦","♪","⌖","↻"]:
        if forbidden in content:
            print("Regresión gráfica: emoji/icono no SVG", forbidden, "en", filename)
            sys.exit(1)

# Cabecera y modo pantalla completa.
index = Path("v3-preview/index.html").read_text(encoding="utf-8")
styles = Path("v3-preview/styles.css").read_text(encoding="utf-8")
focus = Path("v3-preview/focus-mode.js").read_text(encoding="utf-8")
for required in ["focus-mode.js", "icon-fullscreen", "icon-exit-fullscreen"]:
    if required not in index:
        print("Regresión UI: falta", required)
        sys.exit(1)
for required in ["flex-wrap:nowrap", "training-focus", ".training-focus-btn"]:
    if required not in styles:
        print("Regresión UI: falta regla", required)
        sys.exit(1)
for required in ["requestFullscreen", "exitFullscreen", "testActive"]:
    if required not in focus:
        print("Regresión UI: falta modo pantalla completa", required)
        sys.exit(1)

# Fotos reales y cabecera compacta.
index = Path("v3-preview/index.html").read_text(encoding="utf-8")
photo = Path("v3-preview/photo-real.js").read_text(encoding="utf-8")
core = Path("v3-preview/app-core.js").read_text(encoding="utf-8")
styles = Path("v3-preview/styles.css").read_text(encoding="utf-8")
for required in ["photo-real.js","icon-photo"]:
    if required not in index:
        print("Regresión: falta Fotos reales", required)
        sys.exit(1)
for required in ["photoRealBtn","Special:FilePath","fotos-reales"]:
    if required not in photo:
        print("Regresión: falta funcionalidad Fotos reales", required)
        sys.exit(1)
if "¿Qué quieres trabajar hoy?" in core or "Entrenamiento cognitivo</span>" in index:
    print("Regresión: cabecera/Inicio no están compactos")
    sys.exit(1)
if "body.training-focus .compact-test-board>.match-card" not in styles:
    print("Regresión: falta escalado adaptativo fullscreen")
    sys.exit(1)

# Foto ↔ palabra debe estar en Inicio y no en el menú.
photo = Path("v3-preview/photo-real.js").read_text(encoding="utf-8")
core = Path("v3-preview/app-core.js").read_text(encoding="utf-8")
if "menuOnly:false" not in photo or "type:'photo'" not in photo:
    print("Regresión: Fotos reales no está configurado para Inicio/fotografía")
    sys.exit(1)
if "installPhotoRealMenu" in photo or "photoRealBtn" in photo and "remove()" not in photo:
    print("Regresión: Fotos reales vuelve a crear opción de menú")
    sys.exit(1)
if "visual.type === 'photo'" not in core:
    print("Regresión: el renderizador no admite fotografías reales")
    sys.exit(1)

# Pantalla completa: controles fuera del tablero y tamaños adaptativos.
focus = Path("v3-preview/focus-mode.js").read_text(encoding="utf-8")
main_js = Path("v3-preview/app-main.js").read_text(encoding="utf-8")
styles = Path("v3-preview/styles.css").read_text(encoding="utf-8")
for required in ["training-focus-toolbar","host.prepend(toolbar)","refit()"]:
    if required not in focus:
        print("Regresión fullscreen toolbar:", required)
        sys.exit(1)
for required in ["feedbackH","actionsH","--fit-word-size","--fit-column-gap"]:
    if required not in main_js:
        print("Regresión fullscreen sizing:", required)
        sys.exit(1)
for required in ["position:static!important","var(--fit-row-h","var(--fit-word-size"]:
    if required not in styles:
        print("Regresión fullscreen CSS:", required)
        sys.exit(1)

# fotografía siempre dentro de la celda
styles = Path("v3-preview/styles.css").read_text(encoding="utf-8")
for required in [
    ".photo-test-board>.match-card.source .real-photo-visual",
    "position:absolute!important",
    "object-fit:contain!important",
    "object-position:center center!important"
]:
    if required not in styles:
        print("Regresión ajuste de fotografías:", required)
        sys.exit(1)

# Evento de pantalla completa debe ser robusto.
focus = Path("v3-preview/focus-mode.js").read_text(encoding="utf-8")
for required in [
    "document.addEventListener('click',toggleFromUserEvent,true)",
    "requestFullscreen",
    "webkitRequestFullscreen",
    "fullscreenElement()",
    "ICTUS_FULLSCREEN"
]:
    if required not in focus:
        print("Regresión evento fullscreen:", required)
        sys.exit(1)
if "catch{}" in focus:
    print("Regresión fullscreen: no se deben silenciar errores de fullscreen")
    sys.exit(1)
