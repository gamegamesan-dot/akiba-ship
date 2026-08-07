# tools/flyer — チラシ生成スクリプト

Omakase Ship の A6 両面チラシ（PDF）を生成します。紹介元コード付きの
パートナー配布用チラシを、コードごとに作り分けられます。

## 実行例

```bash
# 汎用チラシ（コードなし＝QRに ?s= は付かない）
python gen_flyer.py

# パートナー店舗コード付き（QRに ?s=CF01 が付く）
python gen_flyer.py --code CF01
python gen_flyer.py --code FG02 --store "秋葉原フィギュア堂"
```

- `--code` … 紹介元コード。`[A-Z]{2}\d{2,3}`（例 `CF01` `FG02` `HT101`）。空なら汎用チラシ。
- `--store` … 店名（出力ファイル名の見分け用のみ。誌面には出ない）。
- `--base` … 公開URL（既定 `https://gamegamesan-dot.github.io/akiba-ship/`）。

## コード規則（先頭2文字＝業種）

| 接頭 | 業種 |
|---|---|
| `FG` | 物販店 |
| `CF` | コンカフェ |
| `HT` | ホテル |

数字は各店の連番（2〜3桁）。誌面には `CF-01` の形で表示されます。

## QR コード

チラシ表面の QR は LP（`/`）、裏面の QR は料金計算機（`/cost/`）を指します。
`--code` を付けると両方の URL に **`?s=CODE`** が付与され、
[`tracking.js`](../../tracking.js) が来訪者を紹介元コードで記録します。

## 日本語フォント（mkfont.py）

`gen_flyer.py` は実行時に [`mkfont.py`](mkfont.py) を呼び、**Noto Sans CJK**（JP フェイス）を
誌面で使う文字だけに**サブセット化**して埋め込みます（OTF/CFF → glyf TTF に変換）。
これによりPDFが軽量になり、環境非依存で日本語・中文・한국어が表示されます。

- 元フォント: `/usr/share/fonts/opentype/noto/NotoSansCJK-{Regular,Bold}.ttc`
- 中間・出力: `/home/claude/...`（生成元サンドボックスのパス）
- ⚠️ **Windows で動かす場合**は、`mkfont.py` の `/usr/share/fonts` と、
  `gen_flyer.py`／`mkfont.py` 内の `/home/claude` パスを**自環境に合わせて要修正**。
  Noto Sans CJK 本体（`.ttc`）も別途インストールが必要です。
- 依存: `reportlab` / `qrcode` / `pillow` / `fonttools`

## 掲載価格は rates.js と手動同期

チラシの価格（例 `From ¥4,410`、料金表 4,410 / 5,460 / 11,050 …）は
このスクリプト内に**ハードコード**されており、[`rates.js`](../../rates.js) とは**手動同期**です。

> **`rates.js` を変更したら、このスクリプトの価格を合わせて更新し、
> PDF を再生成し直すこと。** 料金の唯一の正は `rates.js`。
