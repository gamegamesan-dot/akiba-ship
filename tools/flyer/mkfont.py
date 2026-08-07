# -*- coding: utf-8 -*-
"""Subset Noto Sans CJK (CFF/OTF) and convert to glyf TTF for ReportLab."""
import os
from fontTools.ttLib import TTFont, TTCollection, newTable
from fontTools.subset import Subsetter, Options
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen

TEXT = open('/home/claude/flyer_chars.txt', encoding='utf-8').read()
CHARS = ''.join(sorted(set(TEXT)))
print('unique chars:', len(CHARS))

SRC = {
    'reg': '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
    'bold': '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',
}
os.makedirs('/home/claude/fonts', exist_ok=True)


def pick_jp(path):
    coll = TTCollection(path, lazy=False)
    for f in coll.fonts:
        if f['name'].getDebugName(1) == 'Noto Sans CJK JP':
            return f
    raise SystemExit('JP face not found in ' + path)


def otf_to_ttf(font, tolerance=1.0):
    glyphOrder = font.getGlyphOrder()
    cff_glyphs = font.getGlyphSet()
    glyf = newTable('glyf')
    glyf.glyphOrder = glyphOrder
    glyf.glyphs = {}
    for name in glyphOrder:
        pen = TTGlyphPen(cff_glyphs)
        cff_glyphs[name].draw(Cu2QuPen(pen, tolerance, reverse_direction=True))
        glyf[name] = pen.glyph()

    upem = font['head'].unitsPerEm
    font['loca'] = newTable('loca')
    font['glyf'] = glyf

    maxp = font['maxp']
    maxp.tableVersion = 0x00010000
    maxp.maxZones = 1
    maxp.maxTwilightPoints = 0
    maxp.maxStorage = 0
    maxp.maxFunctionDefs = 0
    maxp.maxInstructionDefs = 0
    maxp.maxStackElements = 0
    maxp.maxSizeOfInstructions = 0
    maxp.maxComponentElements = max(
        (len(g.components) if g.isComposite() else 0) for g in glyf.glyphs.values())

    post = font['post']
    post.formatType = 2.0
    post.extraNames = []
    post.mapping = {}
    post.glyphOrder = glyphOrder

    font['head'].indexToLocFormat = 0
    for t in ('CFF ', 'VORG', 'CFF2'):
        if t in font:
            del font[t]
    font.sfntVersion = '\000\001\000\000'
    assert upem == font['head'].unitsPerEm
    return font


for key, path in SRC.items():
    f = pick_jp(path)
    opts = Options()
    opts.glyph_names = True
    opts.notdef_outline = True
    opts.recalc_bounds = True
    opts.drop_tables += ['DSIG']
    opts.layout_features = ['*']
    sub = Subsetter(options=opts)
    sub.populate(text=CHARS)
    sub.subset(f)
    f = otf_to_ttf(f)
    out = f'/home/claude/fonts/NotoCJK-{key}.ttf'
    f.save(out)
    print('saved', out, os.path.getsize(out) // 1024, 'KB')
