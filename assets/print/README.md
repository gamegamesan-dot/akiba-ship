# assets/print — 印刷用PDF

配布・提案用の印刷物（確定版PDF）。

| ファイル | 用途 | 判型 |
|---|---|---|
| `店舗様ご提案_OmakaseShip_A4.pdf` | 物販店（フィギュア・ホビー店等）向け 導入提案書 | A4 |
| `コンカフェ様ご提案_OmakaseShip_A4.pdf` | コンカフェ向け 導入提案書 | A4 |
| `チラシA6_両面_OmakaseShip.pdf` | 店頭配布用チラシ（表: サービス+QR / 裏: 手順+料金+QR） | A6 両面 |

## 印刷メモ

- **A6チラシは A4 に 4面付けで印刷**してください（A4 1枚から A6 が4枚取れます）。
- 掲載価格は [`rates.js`](../../rates.js) の値と一致しています（料金の唯一の正）。
- チラシPDFは [`tools/flyer/gen_flyer.py`](../../tools/flyer/gen_flyer.py) で生成しています。
  `rates.js` を変更した場合は、生成スクリプト側の価格を合わせて更新し、
  チラシPDFを再作成してください（詳細は `tools/flyer/README.md`）。
