# -*- coding: utf-8 -*-
import os, subprocess, argparse, re
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
import qrcode

# ---------------------------------------------------------------- args
ap = argparse.ArgumentParser(description='Generate the Omakase Ship A6 flyer.')
ap.add_argument('--code', default='',
                help='Partner store code, e.g. CF01. Blank = generic flyer.')
ap.add_argument('--store', default='', help='Store name (for the filename only).')
ap.add_argument('--base', default='https://gamegamesan-dot.github.io/akiba-ship/')
A = ap.parse_args()

CODE = A.code.strip().upper()
if CODE and not re.fullmatch(r'[A-Z]{2}\d{2,3}', CODE):
    raise SystemExit('code must look like CF01 / FG02 / HT101')
PRETTY = CODE[:2] + '-' + CODE[2:] if CODE else ''
Q = ('?s=' + CODE) if CODE else ''
URL_LP   = A.base + Q
URL_COST = A.base + 'cost/' + Q

# ---------------------------------------------------------------- strings
S = {
    'hook':      'HANDS FULL?',
    'hook2':     'We ship it home.',
    'zh':        '行李太多？我們幫您寄回家。',
    'ko':        '짐이 너무 많으세요? 집까지 보내드립니다.',
    'ja':        '荷物が多すぎませんか。ご自宅までお送りします。',
    'from':      'From ¥4,410',
    'fromSub':   '500 g to the USA  ·  about $28',
    'scan':      'Scan for exact rates',
    'brand':     'Omakase Ship',
    'brandSub':  'by Play Japan  ·  Akihabara, Tokyo',
    'how':       'HOW IT WORKS',
    's1t':       'Drop it off',
    's1b':       'Bring your shopping to our counter in Akihabara.',
    's2t':       'We pack it',
    's2b':       'We pack the box and fill in the customs form for you.',
    's3t':       'It arrives home',
    's3b':       'Sent by Japan Post with tracking. 6-13 days to the USA.',
    'cost':      'WHAT IT COSTS',
    'colD':      'Destination', 'c1': '500 g', 'c2': '1 kg', 'c3': '2 kg',
    'r1':        'United States',
    'r2':        'Europe / Canada / Australia',
    'r3':        'Singapore / SE Asia',
    'r4':        'Korea / Taiwan / China',
    'note':      'Japanese yen. Packing, customs paperwork and postage included.',
    'no':        'We cannot ship loose batteries, aerosols or flammables. Devices with a sealed-in battery are fine.',
    'langs':     'English  ·  中文  ·  한국어  ·  日本語',
    'legal':     'Ocean Trading Co., Ltd.  ·  Licensed second-hand dealer, Tokyo',
    'calc':      'Full price calculator',
}
ROWS = [
    ('r1', '4,410', '5,460', '11,050'),
    ('r2', '3,910', '4,810', '9,700'),
    ('r3', '3,420', '4,020', '7,100'),
    ('r4', '3,270', '3,770', '5,850'),
]
EXTRA = ''.join(v for _, a, b, cc in ROWS for v in (a, b, cc))

# ---------------------------------------------------------------- fonts
CHARS = ''.join(S.values()) + EXTRA + PRETTY + '0123456789 .,·¥$%/-()'
open('/home/claude/flyer_chars.txt', 'w', encoding='utf-8').write(CHARS)
subprocess.run(['python3', '/home/claude/mkfont.py'], check=True)

pdfmetrics.registerFont(TTFont('N',  '/home/claude/fonts/NotoCJK-reg.ttf'))
pdfmetrics.registerFont(TTFont('NB', '/home/claude/fonts/NotoCJK-bold.ttf'))

INK, GRAY, RULE = HexColor('#0E1626'), HexColor('#5A6779'), HexColor('#C4CEDE')
RED, BLUE, PANEL = HexColor('#C8352C'), HexColor('#1D4E9C'), HexColor('#EDF1F8')
WHITE = HexColor('#FFFFFF')

A6 = (105*mm, 148*mm)
W, H = A6
M = 9*mm                      # inner margin
SB = 4.2*mm                   # stripe border width

OUT = '/home/claude/flyer_a6%s.pdf' % (('_' + CODE) if CODE else '')
c = canvas.Canvas(OUT, pagesize=A6)
c.setTitle('Omakase Ship — Akihabara shipping flyer')


def qr_img(url):
    q = qrcode.QRCode(border=0, box_size=10,
                      error_correction=qrcode.constants.ERROR_CORRECT_M)
    q.add_data(url); q.make(fit=True)
    im = q.make_image(fill_color='#0E1626', back_color='white').convert('RGB')
    p = '/home/claude/qr_%d.png' % abs(hash(url))
    im.save(p)
    return p


def border():
    """Airmail stripe frame around the whole card."""
    seg = 4.6*mm
    def run(x, y, dx, dy, n):
        for i in range(n):
            c.setFillColor(RED if i % 2 == 0 else BLUE)
            c.rect(x + dx*i, y + dy*i,
                   seg if dx else SB, SB if dx else seg, stroke=0, fill=1)
    run(0, H - SB, seg, 0, int(W/seg) + 1)
    run(0, 0, seg, 0, int(W/seg) + 1)
    run(0, 0, 0, seg, int(H/seg) + 1)
    run(W - SB, 0, 0, seg, int(H/seg) + 1)
    c.setFillColor(WHITE)
    c.rect(SB, SB, W - 2*SB, H - 2*SB, stroke=0, fill=1)


def wrap(t, f, s, mw):
    """Word-aware for Latin, char-wise for CJK."""
    if ' ' in t and max(ord(ch) for ch in t) < 0x2E80:
        out, cur = [], ''
        for w in t.split(' '):
            trial = (cur + ' ' + w).strip()
            if cur and pdfmetrics.stringWidth(trial, f, s) > mw:
                out.append(cur); cur = w
            else:
                cur = trial
        if cur: out.append(cur)
        return out
    out, cur = [], ''
    for ch in t:
        if pdfmetrics.stringWidth(cur + ch, f, s) > mw:
            out.append(cur); cur = ch
        else:
            cur += ch
    if cur: out.append(cur)
    return out


def para(x, y, t, s=6.6, lead=9, col=GRAY, mw=None, f='N'):
    mw = mw or (W - 2*M)
    c.setFont(f, s); c.setFillColor(col)
    for ln in wrap(t, f, s, mw):
        c.drawString(x, y, ln); y -= lead
    return y


# ================================================== SIDE 1
border()
y = H - SB - 13*mm

c.setFont('NB', 26); c.setFillColor(INK)
c.drawString(M, y, S['hook'])
y -= 10.5*mm
c.setFont('NB', 15.5); c.setFillColor(RED)
c.drawString(M, y, S['hook2'])

y -= 9*mm
c.setStrokeColor(RULE); c.setLineWidth(0.6)
c.line(M, y, W - M, y)

y -= 6.5*mm
for k in ('zh', 'ko', 'ja'):
    c.setFont('N', 8.4); c.setFillColor(GRAY)
    c.drawString(M, y, S[k]); y -= 7.4*mm

# price + QR block
y -= 3*mm
bh = 32*mm
c.setFillColor(PANEL); c.rect(M, y - bh, W - 2*M, bh, stroke=0, fill=1)

qp = qr_img(URL_LP)
qs = 24*mm
c.drawImage(ImageReader(qp), W - M - qs - 4*mm, y - bh + (bh - qs)/2,
            qs, qs, mask=None)

c.setFont('NB', 19); c.setFillColor(INK)
c.drawString(M + 5*mm, y - 14*mm, S['from'])
c.setFont('N', 6.8); c.setFillColor(GRAY)
c.drawString(M + 5*mm, y - 19.5*mm, S['fromSub'])
c.setFont('N', 6.4); c.setFillColor(BLUE)
c.drawString(M + 5*mm, y - 25*mm, S['scan'])
y -= bh

# footer
y = SB + 13*mm
c.setFont('NB', 11.5); c.setFillColor(INK)
c.drawString(M, y, S['brand'])
y -= 5*mm
c.setFont('N', 6.6); c.setFillColor(GRAY)
c.drawString(M, y, S['brandSub'])
y -= 5*mm
c.setFont('N', 6.6); c.setFillColor(BLUE)
c.drawString(M, y, S['langs'])
if PRETTY:
    c.setFont('N', 6); c.setFillColor(HexColor('#9AA7BA'))
    c.drawRightString(W - M, y, PRETTY)

c.showPage()

# ================================================== SIDE 2
border()
y = H - SB - 11*mm

c.setFont('NB', 7.6); c.setFillColor(BLUE)
c.drawString(M, y, S['how'])
y -= 6.5*mm

for i, (t, b) in enumerate([('s1t', 's1b'), ('s2t', 's2b'), ('s3t', 's3b')]):
    c.setFont('NB', 8.6); c.setFillColor(RED)
    c.drawString(M, y, str(i + 1))
    c.setFont('NB', 8.6); c.setFillColor(INK)
    c.drawString(M + 4.5*mm, y, S[t])
    yy = para(M + 4.5*mm, y - 5*mm, S[b], s=6.5, lead=8.4,
              mw=W - 2*M - 4.5*mm)
    y = yy - 2.4*mm

# cost table
y -= 0.5*mm
c.setFont('NB', 7.6); c.setFillColor(BLUE)
c.drawString(M, y, S['cost'])
y -= 6*mm

CR = [W - M - 34*mm, W - M - 17*mm, W - M]
c.setFont('N', 5.9); c.setFillColor(GRAY)
c.drawString(M, y, S['colD'])
for i, k in enumerate(('c1', 'c2', 'c3')):
    c.drawRightString(CR[i], y, S[k])
y -= 2.6*mm
c.setStrokeColor(RULE); c.setLineWidth(0.5); c.line(M, y, W - M, y)
y -= 5.6*mm

for key, a, b, d in ROWS:
    c.setFont('N', 6.9); c.setFillColor(INK)
    c.drawString(M, y, S[key])
    c.setFont('NB' if key == 'r1' else 'N', 6.9)
    c.setFillColor(INK if key == 'r1' else GRAY)
    for i, v in enumerate((a, b, d)):
        c.drawRightString(CR[i], y, v)
    y -= 2.8*mm
    c.setStrokeColor(RULE); c.setLineWidth(0.35); c.line(M, y, W - M, y)
    y -= 4.4*mm

y += 1.5*mm
y = para(M, y, S['note'], s=6, lead=8, col=GRAY)

# restrictions
y -= 2.5*mm
nh = 11.5*mm
c.setFillColor(PANEL); c.rect(M, y - nh, W - 2*M, nh, stroke=0, fill=1)
c.setFillColor(RED);   c.rect(M, y - nh, 1.2*mm, nh, stroke=0, fill=1)
para(M + 4.5*mm, y - 5*mm, S['no'], s=6, lead=7.8, col=GRAY,
     mw=W - 2*M - 9*mm)
y -= nh

# bottom: QR to calculator
y = SB + 9*mm
qp2 = qr_img(URL_COST)
qs2 = 17*mm
c.drawImage(ImageReader(qp2), M, y, qs2, qs2, mask=None)
c.setFont('NB', 8.2); c.setFillColor(INK)
c.drawString(M + qs2 + 4*mm, y + 11*mm, S['calc'])
c.setFont('N', 6); c.setFillColor(GRAY)
c.drawString(M + qs2 + 4*mm, y + 6.5*mm, S['brand'] + '  ·  ' + S['langs'])
c.drawString(M + qs2 + 4*mm, y + 2.5*mm, S['legal'])

c.save()
print('saved', OUT, '->', URL_LP)
