#!/usr/bin/env python3
"""Recorta las capturas de la app al contenido y renderiza las salidas de
terminal (tests, cabeceras) como imagenes estilo consola."""
import os
from PIL import Image, ImageChops, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))


def autocrop_ui(name):
    """Recorta el area vacia inferior de una captura de la app."""
    path = os.path.join(HERE, name)
    img = Image.open(path).convert("RGB")
    bg = Image.new("RGB", img.size, img.getpixel((5, img.height - 5)))  # color del fondo gris
    diff = ImageChops.difference(img, bg).convert("L")
    bbox = diff.point(lambda p: 255 if p > 14 else 0).getbbox()
    if bbox:
        pad = 16
        l, t, r, b = bbox
        l = max(0, l - pad); t = max(0, t - pad)
        r = min(img.width, r + pad); b = min(img.height, b + pad)
        img = img.crop((l, t, r, b))
    img.save(path)
    print(f"recortada {name} -> {img.size[0]}x{img.size[1]}")


def render_terminal(txt_name, png_name, title):
    with open(os.path.join(HERE, txt_name), encoding="utf-8") as f:
        raw = f.read().splitlines()
    # Transliterar simbolos unicode para evitar glifos ausentes en la fuente.
    subs = {"✔": "[OK]", "✓": "[OK]", "✖": "[X]",
            "▶": ">", "ℹ": "i", "·": "-"}
    wrapped = []
    for ln in raw:
        for k, v in subs.items():
            ln = ln.replace(k, v)
        # Ajuste de lineas muy largas (p. ej. la CSP) con sangria de continuacion.
        maxc = 96
        if len(ln) > maxc:
            indent = "    "
            while len(ln) > maxc:
                cut = ln.rfind(";", 0, maxc)
                if cut < 40:
                    cut = ln.rfind(" ", 0, maxc)
                if cut < 40:
                    cut = maxc
                wrapped.append(ln[: cut + 1])
                ln = indent + ln[cut + 1:].lstrip()
        wrapped.append(ln)
    lines = wrapped

    scale = 2
    fs = 15 * scale
    pad = 18 * scale
    bar = 30 * scale
    try:
        font = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", fs)
        fontb = ImageFont.truetype("C:/Windows/Fonts/consolab.ttf", fs)
    except OSError:
        font = fontb = ImageFont.load_default()
    lh = int(fs * 1.45)

    tmp = Image.new("RGB", (10, 10)); d = ImageDraw.Draw(tmp)
    width = max(int(d.textlength(ln, font=font)) for ln in lines) + pad * 2
    width = max(width, 560 * scale)
    height = bar + pad + lh * len(lines) + pad

    img = Image.new("RGB", (width, height), "#0d1117")
    d = ImageDraw.Draw(img)
    # Barra de titulo estilo terminal
    d.rectangle([0, 0, width, bar], fill="#21262d")
    for i, c in enumerate(["#ff5f56", "#ffbd2e", "#27c93f"]):
        cx = pad + i * (14 * scale)
        r = 5 * scale
        d.ellipse([cx, bar // 2 - r, cx + 2 * r, bar // 2 + r], fill=c)
    d.text((width // 2, bar // 2), title, font=fontb, fill="#8b949e", anchor="mm")

    y = bar + pad
    for ln in lines:
        color = "#c9d1d9"
        f = font
        if ln.startswith("$"):
            color = "#58a6ff"; f = fontb
        elif "[OK]" in ln:
            color = "#3fb950"
        elif "pass" in ln or "fail 0" in ln:
            color = "#3fb950"; f = fontb
        elif ln.startswith(("Content-Security", "X-", "Strict", "Set-Cookie",
                            "Referrer", "Cross-Origin", "HTTP/")):
            color = "#79c0ff"
        d.text((pad, y), ln, font=f, fill=color)
        y += lh
    img.save(os.path.join(HERE, png_name))
    print(f"render {png_name} -> {img.size[0]}x{img.size[1]}")


if __name__ == "__main__":
    for n in ("01-login.png", "02-registro.png", "03-tareas.png"):
        autocrop_ui(n)
    render_terminal("tests.txt", "04-tests.png", "npm test  -  15/15 OK")
    render_terminal("headers.txt", "05-cabeceras.png", "curl -I  -  cabeceras de seguridad")
    print("Evidencias renderizadas.")
