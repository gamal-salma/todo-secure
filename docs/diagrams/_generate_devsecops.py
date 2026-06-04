#!/usr/bin/env python3
"""Genera el diagrama del ciclo S-SDLC + DevSecOps (.drawio editable -> PNG nitido).
Reutiliza el motor (Graph/estilos/render) de _generate.py."""
import importlib.util
import os

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("gen", os.path.join(HERE, "_generate.py"))
gen = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gen)


def diagram_devsecops():
    g = gen.Graph()
    g.box("Ciclo DevSecOps aplicado al To-Do Seguro", 420, 20, 900, 36, gen.S_TITLE)
    g.box("Seguridad automatizada (shift-left) integrada con el S-SDLC", 420, 56, 900, 24, gen.S_SUB)

    stages = [
        ("Plan", "STRIDE<br/>ASVS / requisitos"),
        ("Code", "pre-commit<br/>gitleaks · ESLint"),
        ("Build", "npm ci<br/>SBOM (CycloneDX)"),
        ("Test", "node:test<br/>Semgrep (SAST)"),
        ("Release", "npm audit<br/>CodeQL"),
        ("Deploy", "Contenedor no-root<br/>Trivy (img/IaC)"),
        ("Operate", "Healthcheck<br/>logs pino"),
        ("Monitor", "OWASP ZAP<br/>Dependabot"),
    ]
    ids = []
    x0, y0, w, h, gap = 50, 140, 200, 120, 28
    for i, (name, ctrl) in enumerate(stages):
        x = x0 + i * (w + gap)
        cid = g.box(f"<b>{name}</b><br/><br/>{ctrl}", x, y0, w, h, gen.S_PHASE)
        ids.append((cid, x))
    for i in range(len(ids) - 1):
        g.edge(ids[i][0], ids[i + 1][0], "", gen.S_ARROW)

    # Flecha de retroalimentacion Monitor -> Plan (mejora continua).
    last_x = ids[-1][1]
    first_x = ids[0][1]
    yb = y0 + h + 70
    g.edge(ids[-1][0], ids[0][0], "Mejora continua / retroalimentacion (NIST SSDF RV)",
           gen.S_FEEDBACK, points=[(last_x + w / 2, yb), (first_x + w / 2, yb)])
    return g


if __name__ == "__main__":
    gen.ensure_viewer()
    gen.render("devsecops-pipeline", diagram_devsecops())
    print("Diagrama DevSecOps generado.")
