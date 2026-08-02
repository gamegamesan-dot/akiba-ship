# -*- coding: utf-8 -*-
"""A6両面チラシ（105x148mm）— 白地・2色（藍＋朱）で印刷コストを抑える
   表: サービスが一目で分かる図解
   裏: 手順・料金・QR
"""
from reportlab.lib.pagesizes import A6
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor, Color

F = "/usr/share/fonts/truetype/dejavu/"
pdfmetrics.registerFont(TTFont("D",  F+"DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DB", F+"DejaVuSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("DC", F+"DejaVuSansCondensed-Bold.ttf"))

# ---- 2色 + 無彩色。白地なのでインク消費が少ない ----
NAVY  = HexColor("#1B3A5C")   # 主色：信頼感
RED   = HexColor("#C8102E")   # 差し色：日本らしさ・視認性
INK   = HexColor("#1C1C1C")
GREY  = HexColor("#6E6E6E")
LINE  = HexColor("#C9C9C9")
PALE  = HexColor("#EEF2F6")   # 薄い藍。ベタ塗り面積を最小限に

W, H = A6

# ================= 共通パーツ =================
def rule(c, y, x0=None, x1=None, col=LINE, wpt=0.7):
    x0 = x0 if x0 is not None else W*0.10
    x1 = x1 if x1 is not None else W*0.90
    c.setStrokeColor(col); c.setLineWidth(wpt); c.line(x0, y, x1, y)

def suitcase(c, cx, cy, s, fill_lines=3, col=NAVY):
    """スーツケースのアイコン"""
    w, h = s*1.15, s
    c.setStrokeColor(col); c.setLineWidth(1.4); c.setFillColor(col)
    # 取っ手
    c.setLineWidth(1.3)
    c.line(cx-w*0.16, cy+h*0.50, cx-w*0.16, cy+h*0.62)
    c.line(cx+w*0.16, cy+h*0.50, cx+w*0.16, cy+h*0.62)
    c.line(cx-w*0.16, cy+h*0.62, cx+w*0.16, cy+h*0.62)
    # 本体
    c.setFillColor(Color(1,1,1))
    c.roundRect(cx-w/2, cy-h/2, w, h, s*0.10, fill=1, stroke=1)
    # 中の荷物（線）
    c.setLineWidth(1.0)
    for i in range(fill_lines):
        yy = cy - h*0.28 + i*(h*0.62/max(fill_lines,1))
        c.line(cx-w*0.30, yy, cx+w*0.30, yy)

def box_icon(c, cx, cy, s, col=NAVY, label=None):
    """段ボール箱のアイコン"""
    w = s
    c.setStrokeColor(col); c.setLineWidth(1.4); c.setFillColor(Color(1,1,1))
    c.rect(cx-w/2, cy-w*0.40, w, w*0.80, fill=1, stroke=1)
    c.setLineWidth(1.0)
    c.line(cx, cy-w*0.40, cx, cy+w*0.40)          # 中央のテープ
    c.line(cx-w/2, cy+w*0.16, cx+w/2, cy+w*0.16)  # フタの線
    if label:
        c.setFillColor(col); c.setFont("DB", s*0.22)
        c.drawCentredString(cx, cy-w*0.62, label)

def plane(c, cx, cy, s, col=RED):
    """紙飛行機（発送）"""
    c.setFillColor(col); c.setStrokeColor(col); c.setLineWidth(0.8)
    p = c.beginPath()
    p.moveTo(cx-s*0.55, cy)
    p.lineTo(cx+s*0.55, cy+s*0.30)
    p.lineTo(cx+s*0.10, cy)
    p.lineTo(cx+s*0.55, cy-s*0.30)
    p.close()
    c.drawPath(p, fill=1, stroke=0)

def home_icon(c, cx, cy, s, col=NAVY):
    """家（自宅へ到着）"""
    c.setStrokeColor(col); c.setLineWidth(1.4); c.setFillColor(Color(1,1,1))
    c.rect(cx-s*0.38, cy-s*0.42, s*0.76, s*0.62, fill=1, stroke=1)
    p = c.beginPath()
    p.moveTo(cx-s*0.50, cy+s*0.20); p.lineTo(cx, cy+s*0.55); p.lineTo(cx+s*0.50, cy+s*0.20)
    c.setFillColor(col); c.drawPath(p, fill=1, stroke=0)
    c.setFillColor(Color(1,1,1)); c.setStrokeColor(col)
    c.rect(cx-s*0.11, cy-s*0.42, s*0.22, s*0.34, fill=1, stroke=1)

def arrow(c, x0, x1, y, col=GREY):
    c.setStrokeColor(col); c.setLineWidth(1.0)
    c.line(x0, y, x1-3.5, y)
    c.setFillColor(col)
    p = c.beginPath(); p.moveTo(x1, y); p.lineTo(x1-4.5, y+2.6); p.lineTo(x1-4.5, y-2.6); p.close()
    c.drawPath(p, fill=1, stroke=0)

# ================= 表面 =================
def front(c):
    # 上部の細い帯（ベタ面積を抑える）
    c.setFillColor(NAVY); c.rect(0, H-16, W, 16, fill=1, stroke=0)
    c.setFillColor(HexColor("#FFFFFF")); c.setFont("DB", 7)
    c.drawCentredString(W/2, H-11, "A K I H A B A R A   ·   T O K Y O")

    # サービス名
    c.setFillColor(NAVY); c.setFont("DC", 19)
    c.drawCentredString(W/2, H-38, "OMAKASE SHIP")
    c.setFillColor(GREY); c.setFont("D", 7)
    c.drawCentredString(W/2, H-49, "by Play Japan")

    # 見出し
    c.setFillColor(INK); c.setFont("DC", 24)
    c.drawCentredString(W/2, H-76, "SUITCASE FULL?")
    c.setFillColor(RED); c.setFont("DB", 12)
    c.drawCentredString(W/2, H-94, "We ship it home for you.")

    rule(c, H-104, W*0.16, W*0.84, RED, 1.2)

    # ---- 図解 ----
    yline = H-146
    xs = [W*0.20, W*0.50, W*0.80]

    suitcase(c, xs[0], yline, 30, 4)
    arrow(c, xs[0]+24, xs[1]-24, yline)
    box_icon(c, xs[1], yline, 34)
    arrow(c, xs[1]+24, xs[2]-24, yline)
    home_icon(c, xs[2], yline, 34)
    plane(c, xs[2], yline+30, 16)

    labels = ["Too much to carry", "We pack & declare", "Delivered home"]
    c.setFillColor(INK); c.setFont("DB", 7.2)
    for x, t in zip(xs, labels):
        words = t.split()
        c.drawCentredString(x, yline-30, " ".join(words[:2]))
        if len(words) > 2:
            c.drawCentredString(x, yline-39, " ".join(words[2:]))

    rule(c, yline-54)

    # ---- 3つの価値 ----
    vy = yline-74
    items = [
        ("Customs paperwork", "Japan Post no longer takes"),
        ("done in your name",  "handwritten labels."),
    ]
    c.setFillColor(NAVY); c.setFont("DB", 9.5)
    c.drawCentredString(W/2, vy,    "We handle the customs form.")
    c.setFillColor(GREY); c.setFont("D", 7)
    c.drawCentredString(W/2, vy-11, "Handwritten labels are no longer accepted,")
    c.drawCentredString(W/2, vy-20, "and the online system is Japanese only.")

    c.setFillColor(NAVY); c.setFont("DB", 9.5)
    c.drawCentredString(W/2, vy-38, "Leave your bags with us.")
    c.setFillColor(GREY); c.setFont("D", 7)
    c.drawCentredString(W/2, vy-49, "Keep shopping. Tell us when to send.")

    # ---- 価格 ----
    py = vy-76
    c.setStrokeColor(NAVY); c.setLineWidth(1.0)
    c.roundRect(W*0.14, py-16, W*0.72, 30, 4, fill=0, stroke=1)
    c.setFillColor(GREY); c.setFont("D", 6.4)
    c.drawCentredString(W/2, py+4, "1 kg to the USA, everything included")
    c.setFillColor(RED); c.setFont("DB", 15)
    c.drawCentredString(W/2, py-11, "from \u00a5 4,890")

    # フッター
    c.setFillColor(GREY); c.setFont("D", 6)
    c.drawCentredString(W/2, 20, "Turn over for how it works  \u2192")
    c.setFillColor(INK); c.setFont("DB", 6.2)
    c.drawCentredString(W/2, 10, "Ocean Trading Co., Ltd.  \u00b7  Licensed dealer, Tokyo")
    c.showPage()

# ================= 裏面 =================
def back(c, qr="qr_print.png", url="gamegamesan-dot.github.io/akiba-ship"):
    c.setFillColor(NAVY); c.rect(0, H-14, W, 14, fill=1, stroke=0)
    c.setFillColor(HexColor("#FFFFFF")); c.setFont("DB", 6.6)
    c.drawCentredString(W/2, H-9.5, "OMAKASE SHIP  ·  HOW IT WORKS")

    # ---- 4ステップ（縦並び） ----
    sy = H-38
    steps = [
        ("1", "Scan the code",      "Choose your country, get a price."),
        ("2", "Hand over your bags","Meet us in Akihabara or send from your hotel."),
        ("3", "We do the paperwork","Customs form filled in correctly, in your name."),
        ("4", "Choose your ship date","We post it and send you the tracking number."),
    ]
    for n, t, d in steps:
        c.setFillColor(NAVY); c.circle(W*0.13, sy, 7.2, fill=1, stroke=0)
        c.setFillColor(HexColor("#FFFFFF")); c.setFont("DB", 8)
        c.drawCentredString(W*0.13, sy-2.8, n)
        c.setFillColor(INK); c.setFont("DB", 8.6)
        c.drawString(W*0.22, sy-1.5, t)
        c.setFillColor(GREY); c.setFont("D", 6.4)
        c.drawString(W*0.22, sy-11, d)
        sy -= 32

    rule(c, sy+9)

    # ---- 料金表 ----
    ty = sy - 6
    c.setFillColor(NAVY); c.setFont("DB", 7)
    c.drawString(W*0.10, ty, "POSTAGE AT COST  \u00b7  no mark-up")
    ty -= 12
    c.setFillColor(PALE); c.rect(W*0.10, ty-1.5, W*0.80, 11, fill=1, stroke=0)
    c.setFillColor(INK); c.setFont("DB", 6.4)
    for x, t in zip([W*0.12, W*0.50, W*0.66, W*0.80], ["DESTINATION","0.5kg","1kg","2kg"]):
        c.drawString(x, ty+2, t)
    rows = [("USA","2,040","3,090","5,190"),
            ("Europe / Canada / AU","1,600","2,500","4,300"),
            ("Asia","1,230","1,830","3,030"),
            ("TW / KR / CN","1,120","1,620","2,620")]
    ty -= 11
    for r in rows:
        c.setFillColor(INK); c.setFont("D", 6.4)
        c.drawString(W*0.12, ty+1, r[0])
        for x, v in zip([W*0.50, W*0.66, W*0.80], r[1:]):
            c.drawString(x, ty+1, "\u00a5"+v)
        rule(c, ty-2, W*0.10, W*0.90, HexColor("#E4E4E4"), 0.4)
        ty -= 10
    c.setFillColor(GREY); c.setFont("D", 5.6)
    c.drawString(W*0.10, ty-1, "+ handling \u00a51,800 per parcel  (2nd parcel \u00a5900)")

    # ---- 免税の注意 ----
    ny = ty - 16
    c.setStrokeColor(RED); c.setLineWidth(1.6)
    c.line(W*0.10, ny+7, W*0.10, ny-11)
    c.setFillColor(RED); c.setFont("DB", 6.6)
    c.drawString(W*0.13, ny+2, "Note on tax-free shopping")
    c.setFillColor(GREY); c.setFont("D", 5.8)
    c.drawString(W*0.13, ny-6, "Items you post home are not with you at the airport,")
    c.drawString(W*0.13, ny-13, "so they cannot be refunded. Ask us what to carry.")

    # ---- QR ----
    qy = 46
    box = 62
    c.drawImage(qr, W*0.13, qy, box, box, preserveAspectRatio=True, anchor='sw', mask='auto')
    c.setStrokeColor(LINE); c.setLineWidth(0.6)
    c.rect(W*0.13-3, qy-3, box+6, box+6, fill=0, stroke=1)

    tx = W*0.13 + box + 12
    c.setFillColor(NAVY); c.setFont("DB", 8.4)
    c.drawString(tx, qy+box-12, "SCAN FOR")
    c.drawString(tx, qy+box-23, "A PRICE")
    c.setFillColor(INK); c.setFont("D", 6.4)
    c.drawString(tx, qy+box-38, "English \u00b7 \u4e2d\u6587 \u00b7 \ud55c\uad6d\uc5b4")
    c.setFillColor(GREY); c.setFont("D", 5.2)
    c.drawString(tx, qy+box-49, url)

    c.setFillColor(GREY); c.setFont("D", 5.4)
    c.drawCentredString(W/2, 14, "Sent in your name as the sender  \u00b7  We are not a customs broker")
    c.showPage()

def build(path):
    c = canvas.Canvas(path, pagesize=A6)
    front(c); back(c); c.save()

build("flyer_a6_2side.pdf")
print("ok")
