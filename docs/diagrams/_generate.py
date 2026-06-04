#!/usr/bin/env python3
"""Genera los diagramas .drawio (XML editable) y los renderiza a PNG nitido.

Pipeline (segun enunciado): se autoran como mxGraphModel de draw.io, se incrustan
en un visor draw.io cargado por Chrome en modo headless (--screenshot) y el PNG
resultante se recorta al contenido con Pillow.

Uso:  python _generate.py
"""
import html
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
RED = "#ff3228"
INK = "#1d1d1f"
GREY = "#6b7280"
LIGHT = "#fff5f5"

# --------------------------------------------------------------------------- #
# Helpers para construir mxGraphModel
# --------------------------------------------------------------------------- #
class Graph:
    def __init__(self):
        self.cells = []
        self._id = 1

    def nid(self):
        self._id += 1
        return f"n{self._id}"

    def box(self, value, x, y, w, h, style, cid=None):
        cid = cid or self.nid()
        self.cells.append(
            f'<mxCell id="{cid}" value="{html.escape(value)}" style="{style}" '
            f'vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="{w}" '
            f'height="{h}" as="geometry"/></mxCell>'
        )
        return cid

    def edge(self, src, tgt, value="", style="", points=None):
        cid = self.nid()
        geo = '<mxGeometry relative="1" as="geometry"/>'
        if points:
            pts = "".join(f'<mxPoint x="{px}" y="{py}"/>' for px, py in points)
            geo = (f'<mxGeometry relative="1" as="geometry">'
                   f'<Array as="points">{pts}</Array></mxGeometry>')
        self.cells.append(
            f'<mxCell id="{cid}" value="{html.escape(value)}" style="{style}" '
            f'edge="1" parent="1" source="{src}" target="{tgt}">{geo}</mxCell>'
        )
        return cid

    def model(self):
        body = "".join(self.cells)
        return (
            '<mxGraphModel dx="1200" dy="900" grid="0" gridSize="10" guides="1" '
            'tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" '
            'pageWidth="1600" pageHeight="1100" math="0" shadow="0">'
            f'<root><mxCell id="0"/><mxCell id="1" parent="0"/>{body}</root>'
            '</mxGraphModel>'
        )


def drawio_file(model_xml, name):
    return (
        f'<mxfile host="app.diagrams.net" type="device">'
        f'<diagram name="{name}" id="{name}">{model_xml}</diagram></mxfile>'
    )


# Estilos reutilizables
S_TITLE = f"text;html=1;align=center;fontSize=20;fontStyle=1;fontColor={INK};"
S_SUB = f"text;html=1;align=center;fontSize=12;fontColor={GREY};"
S_PHASE = (f"rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor={RED};"
           f"strokeWidth=2;fontSize=12;fontColor={INK};align=center;verticalAlign=middle;arcSize=8;")
S_ARROW = (f"edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor={RED};"
           f"strokeWidth=2;endArrow=block;endFill=1;fontColor={GREY};fontSize=10;")
S_FEEDBACK = (f"edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor={GREY};"
              f"strokeWidth=1.5;dashed=1;endArrow=block;endFill=1;fontColor={GREY};fontSize=11;")
S_NODE = (f"rounded=1;whiteSpace=wrap;html=1;fillColor={LIGHT};strokeColor={RED};"
          f"strokeWidth=1.5;fontSize=11;fontColor={INK};align=left;verticalAlign=top;"
          f"spacing=8;arcSize=8;")
S_ROOT = (f"rounded=1;whiteSpace=wrap;html=1;fillColor={RED};strokeColor={RED};"
          f"fontSize=14;fontStyle=1;fontColor=#ffffff;align=center;arcSize=12;")
S_TREE_EDGE = f"edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor={GREY};strokeWidth=1.5;endArrow=none;"


# --------------------------------------------------------------------------- #
# Diagrama 1: Flujo S-SDLC (ciclico)
# --------------------------------------------------------------------------- #
def diagram_sdlc():
    g = Graph()
    g.box("Flujo S-SDLC — To-Do Seguro", 400, 20, 800, 36, S_TITLE)
    g.box("Seguridad integrada en cada fase del ciclo de vida", 400, 56, 800, 24, S_SUB)
    phases = [
        ("1. Requisitos", "Requisitos de seguridad<br/>(OWASP ASVS · SSDF PO.1)"),
        ("2. Diseño", "Threat modeling STRIDE<br/>Arquitectura por capas"),
        ("3. Implementación", "Codificación segura<br/>Gestión de secretos"),
        ("4. Pruebas", "Tests unitarios + seguridad<br/>SCA (npm audit)"),
        ("5. Despliegue", "Contenedor endurecido<br/>Pipeline CI"),
        ("6. Operación", "Monitorización / logs<br/>Dependabot · parches"),
    ]
    ids = []
    x0, y0, w, h, gap = 60, 130, 220, 120, 36
    for i, (name, act) in enumerate(phases):
        x = x0 + i * (w + gap)
        cid = g.box(f"<b>{name}</b><br/><br/>{act}", x, y0, w, h, S_PHASE)
        ids.append((cid, x, y0, w, h))
    for i in range(len(ids) - 1):
        g.edge(ids[i][0], ids[i + 1][0], "", S_ARROW)
    # Flecha de retroalimentacion de Operacion -> Requisitos por debajo
    last = ids[-1]
    first = ids[0]
    yb = y0 + h + 70
    g.edge(last[0], first[0], "Mejora continua / retroalimentación", S_FEEDBACK,
           points=[(last[1] + w / 2, yb), (first[1] + w / 2, yb)])
    return g


# --------------------------------------------------------------------------- #
# Diagrama 2: DFD con STRIDE y limites de confianza
# --------------------------------------------------------------------------- #
def diagram_stride():
    g = Graph()
    g.box("Modelo de amenazas STRIDE — DFD del To-Do", 250, 20, 760, 36, S_TITLE)

    # Limites de confianza (rectangulos punteados, al fondo)
    s_boundary = ("rounded=0;html=1;dashed=1;dashPattern=8 4;fillColor=none;"
                  f"strokeColor={GREY};strokeWidth=1.5;fontColor={GREY};fontSize=11;"
                  "verticalAlign=top;align=left;spacing=6;fontStyle=2;")
    g.box("Límite de confianza: contenedor Docker", 470, 110, 620, 260, s_boundary)

    s_ext = (f"shape=process;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor={INK};"
             f"strokeWidth=2;fontSize=12;fontColor={INK};align=center;")
    s_proc = (f"ellipse;whiteSpace=wrap;html=1;fillColor={LIGHT};strokeColor={RED};"
              f"strokeWidth=2;fontSize=12;fontColor={INK};align=center;")
    s_store = (f"shape=cylinder3;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor={INK};"
               f"strokeWidth=2;fontSize=12;fontColor={INK};align=center;verticalAlign=middle;")
    s_flow = (f"edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor={INK};"
              f"strokeWidth=1.5;endArrow=block;endFill=1;fontColor={GREY};fontSize=10;")

    user = g.box("Usuario<br/>(Navegador)", 150, 200, 170, 90, s_ext)
    app = g.box("Aplicación<br/>Express (Node.js)", 600, 195, 190, 100, s_proc)
    store = g.box("SQLite<br/>todo.db", 940, 200, 130, 95, s_store)

    s_flow_bi = s_flow + "startArrow=block;startFill=1;"
    g.edge(user, app, "HTTPS: login / CRUD", s_flow)
    g.edge(app, user, "Respuesta JSON", s_flow,
           points=[(415, 320), (695, 320)])
    # Flujo bidireccional app <-> store (evita solapamiento de etiquetas).
    g.edge(app, store, "SQL parametrizado / filas", s_flow_bi)

    # Notas STRIDE
    s_note = (f"rounded=1;whiteSpace=wrap;html=1;fillColor={LIGHT};strokeColor={RED};"
              f"strokeWidth=1;fontSize=10;fontColor={INK};align=left;verticalAlign=top;spacing=6;arcSize=10;")
    g.box("<b>S</b>poofing → bcrypt, rate-limit, anti-fixation", 130, 330, 320, 40, s_note)
    g.box("<b>T</b>ampering → CSRF token, cookie firmada, prepared statements", 130, 378, 320, 56, s_note)
    g.box("<b>R</b>epudiation → logging estructurado con reqId", 470, 392, 300, 40, s_note)
    g.box("<b>I</b>nfo. disclosure → redacción de logs, errores sin detalle, anti-IDOR", 790, 330, 300, 56, s_note)
    g.box("<b>D</b>enial of Service → rate-limit + límite de body 16kB", 470, 60, 320, 40, s_note)
    g.box("<b>E</b>levation → deny-by-default, contenedor no-root, CSP", 800, 392, 290, 56, s_note)
    return g


# --------------------------------------------------------------------------- #
# Diagrama 3: Estructura del proyecto
# --------------------------------------------------------------------------- #
def diagram_structure():
    g = Graph()
    g.box("Estructura del repositorio — To-Do Seguro", 350, 20, 700, 36, S_TITLE)
    root = g.box("todo-secure/", 560, 80, 200, 44, S_ROOT)

    nodes = [
        ("src/  — aplicación",
         "config/ · db/ · lib/<br/>middleware/ (auth, csrf,<br/>validate, security, rateLimit)<br/>routes/ · services/ · public/<br/>app.js · server.js"),
        ("tests/  — pruebas",
         "auth.test.js<br/>todos.test.js<br/>security.test.js<br/>helpers.js"),
        ("docs/  — documentación",
         "threat-model.md (STRIDE)<br/>s-sdlc.md · devsecops.md<br/>architecture.md · security-requirements.md<br/>diagrams/ · evidencias/ · evidencias-devsecops/"),
        ("security/  — gobierno seg.",
         "secure-coding-guidelines.md<br/>nist-ssdf-mapping.md · owasp-asvs-mapping.md<br/>.gitleaks.toml · semgrep-todo.yml<br/>sbom.cyclonedx.json"),
        (".github/  — CI/CD DevSecOps",
         "workflows/ci.yml<br/>workflows/security.yml · codeql.yml<br/>dependabot.yml · CODEOWNERS<br/>pull_request_template.md"),
        ("raíz  — contenedor + DevSecOps",
         "Dockerfile · docker-compose.yml<br/>.pre-commit-config.yaml · eslint.config.js<br/>.env.example · package.json<br/>README · SECURITY · CONTRIBUTING · LICENSE"),
    ]
    x0, y0, w, h, gx, gy = 80, 200, 320, 150, 60, 60
    for i, (title, content) in enumerate(nodes):
        col = i % 3
        row = i // 3
        x = x0 + col * (w + gx)
        y = y0 + row * (h + gy)
        cid = g.box(f"<b>{title}</b><br/><br/>{content}", x, y, w, h, S_NODE)
        g.edge(root, cid, "", S_TREE_EDGE)
    return g


# --------------------------------------------------------------------------- #
# Render
# --------------------------------------------------------------------------- #
VIEWER_HTML = """<!DOCTYPE html><html><head><meta charset="utf-8">
<style>html,body{{margin:0;padding:16px;background:#ffffff;}}</style></head>
<body><div class="mxgraph" data-mxgraph="{cfg}"></div>
<script type="text/javascript" src="_viewer.js"></script></body></html>"""


def render(name, graph):
    model_xml = graph.model()
    # 1) Fichero .drawio editable
    with open(os.path.join(HERE, f"{name}.drawio"), "w", encoding="utf-8") as f:
        f.write(drawio_file(model_xml, name))
    # 2) HTML con el visor
    cfg = json.dumps({"highlight": "none", "nav": False, "resize": True,
                      "toolbar": None, "editable": False, "xml": model_xml})
    htmlfile = os.path.join(HERE, f"_{name}.html")
    with open(htmlfile, "w", encoding="utf-8") as f:
        f.write(VIEWER_HTML.format(cfg=html.escape(cfg, quote=True)))
    # 3) Chrome headless screenshot
    out_raw = os.path.join(HERE, f"_{name}_raw.png")
    if os.path.exists(out_raw):
        os.remove(out_raw)
    cmd = [
        CHROME, "--headless=new", "--disable-gpu", "--no-sandbox",
        "--hide-scrollbars", "--force-device-scale-factor=2",
        "--default-background-color=FFFFFFFF",
        "--window-size=1700,1200",
        "--virtual-time-budget=12000",
        f"--screenshot={out_raw}",
        "file:///" + htmlfile.replace("\\", "/"),
    ]
    subprocess.run(cmd, check=True, capture_output=True, timeout=90)
    # 4) Recorte al contenido con Pillow
    from PIL import Image, ImageChops
    img = Image.open(out_raw).convert("RGB")
    bg = Image.new("RGB", img.size, (255, 255, 255))
    diff = ImageChops.difference(img, bg)
    bbox = diff.getbbox()
    if bbox:
        pad = 24
        l, t, r, b = bbox
        l = max(0, l - pad); t = max(0, t - pad)
        r = min(img.width, r + pad); b = min(img.height, b + pad)
        img = img.crop((l, t, r, b))
    img.save(os.path.join(HERE, f"{name}.png"))
    os.remove(out_raw)
    os.remove(htmlfile)
    print(f"OK {name}.png  {img.size[0]}x{img.size[1]}")


def ensure_viewer():
    """Descarga el visor draw.io (offline) si no esta presente."""
    path = os.path.join(HERE, "_viewer.js")
    if not os.path.exists(path):
        import urllib.request
        url = "https://viewer.diagrams.net/js/viewer-static.min.js"
        print(f"Descargando visor draw.io desde {url} ...")
        urllib.request.urlretrieve(url, path)
    return path


if __name__ == "__main__":
    ensure_viewer()
    render("s-sdlc-flow", diagram_sdlc())
    render("stride-dfd", diagram_stride())
    render("project-structure", diagram_structure())
    print("Diagramas generados.")
