"""QRコード生成 — URLを変えたら python make_qr.py で作り直せます"""
import qrcode
from qrcode.constants import ERROR_CORRECT_H
from PIL import Image, ImageDraw

URL = "https://gamegamesan-dot.github.io/akiba-ship/"   # ← 公開URLに合わせて変更

def build(url, box, path, label=True):
    qr = qrcode.QRCode(version=None, error_correction=ERROR_CORRECT_H,
                       box_size=box, border=3)
    qr.add_data(url); qr.make(fit=True)
    img = qr.make_image(fill_color=(22,24,29), back_color="white").convert("RGB")
    if label:
        w, h = img.size
        pad = int(h*0.09)
        canvas = Image.new("RGB", (w, h+pad), "white")
        canvas.paste(img, (0,0))
        d = ImageDraw.Draw(canvas)
        # 下に赤いラインを入れてチラシ上で視認しやすくする
        d.rectangle([int(w*0.18), h+int(pad*0.32), int(w*0.82), h+int(pad*0.44)],
                    fill=(200,16,46))
        img = canvas
    img.save(path)
    return img.size

print("print (300dpi相当):", build(URL, 20, "qr_print.png"))
print("web / SNS        :", build(URL, 8,  "qr_web.png"))
print("URL =", URL)
