# Omakase Ship by Play Japan — ランディングページ / チラシ

インバウンド向け国際発送代行サービス「Omakase Ship by Play Japan」の検証用一式(Phase 0)。

コンセプト: 手ぶらで日本を楽しんで、住所のスクショだけでホテルや自国へ国際発送。
スマホでQRを読ませることを前提に、モバイル優先で作っています。

## ファイル

| パス | 用途 |
|---|---|
| `index.html` | ランディングページ本体(5言語) |
| `cost/` | 料金計算機ページ |
| `rates.js` | 料金の唯一の正（手数料・梱包・送料表・`quoteAll()`/`fitsSize()`）。LP と cost が参照 |
| `tracking.js` | 紹介元トラッキング（`?s=CODE`）。右下バッジ・5言語 |
| `assets/print/` | 印刷用PDF（提案書A4×2、チラシA6） |
| `tools/flyer/` | チラシ生成スクリプト |
| `qr_print.png` | チラシ・POP印刷用(940×1024px) |
| `qr_web.png` | SNS・画面表示用(376×409px) |
| `make_qr.py` | QR再生成スクリプト |

## 公開する前に必ず変更するもの（連絡先）

`index.html` の先頭 `<script>` 内、`CONFIG` は**連絡先だけ**です。ここを実値に書き換えてください（連絡ボタンの宛先は**ここだけで反映**されます）。

```js
var CONFIG = {
  bizName:  "Omakase Ship by Play Japan",
  whatsapp: "819000000000",   // ← 国番号81 + 先頭0を除いた番号
  lineId:   "your-line-id",   // ← LINE公式アカウントID(@は除く)
  email:    "hello@example.com"
};
```

> 料金は `CONFIG` にはありません。すべて `rates.js` にあります（下記）。

## 料金の変更は `rates.js` だけ

料金・送料・サイズ制限・各種係数は **`rates.js`（`window.AKIBA_RATES`）が唯一の正**。LP と `cost/` の両方がここを参照します。

| キー | 意味 |
|---|---|
| `handling` / `freeDays` / `perDay` | 取扱手数料・無料保管日数・超過分の1日保管料 |
| `packing.box` / `packing.env` | 箱・封筒の梱包費用（封筒は梱包後2kgまで） |
| `PACK_RATIO` / `PACK_MIN_ADD` | 課金重量 = `max(中身×1.3, 中身+200g)` |
| `HOTEL_BASE` | 国内ホテル配送の基本料金（LP「2つの送り方」に表示） |
| `epacketRates`（100g刻み） | 国際eパケット/小形包装物（〜2kg）の送料表 |
| `emsRates` / `emsSteps` | EMS の送料表（0.5〜30kg） |
| `parcelAirRates` / `parcelAirSteps` | 国際小包 航空便の送料表（1〜30kg） |
| `parcelSeaRef` / `salRef` | 船便・SALの参考データ（**cost では非表示**・法人向け用に保持） |
| `parcelSizeStandard` / `STD_A` / `STD_B` | 小包サイズ基準（国別 A=105/200・B=150/300、未登録は保守的にA判定） |
| `quoteAll()` / `fitsSize()` / `bestQuote()` | 全サービス比較・サイズ判定・最安取得 |

- 送料は日本郵便公式（**取得日 2026-08-07**、出典URLは `rates.js` 冒頭コメント）。値上げ時はここを差し替え。
- **`rates.js` を変更したら、`cost/` の静的表と JSON-LD の数値、および `assets/print/` のPDFを再生成/更新すること**（静的数値はスクリプトで再計算し手打ちしない）。

## 公開手順(GitHub Pages)

1. 新しいリポジトリを作る(例: `akiba-ship`)。Public
2. リポジトリ直下に **`index.html`・`rates.js`・`tracking.js`・`cost/`**（`assets/`・`tools/` も任意で）をアップロード
3. Settings → Pages → Branch を `main / (root)` → Save
4. `https://<ユーザー名>.github.io/akiba-ship/` で公開

## QRコードの再生成

公開URLが上記と違う場合は、`make_qr.py` の `URL` を書き換えて実行してください。

```bash
python make_qr.py
```

## 対応言語

英語 / 繁體中文 / 简体中文 / 한국어 / 日本語

端末の言語設定を見て初期表示を自動で切り替えます。上部のバーで手動切替も可能。

## 意図的に入れている注意書き

- **免税の警告**: 2026年11月1日以降、発送した商品は消費税還付の対象外になります。
  これを黙っていると後でクレームになるため、独立したセクションで明示しています。
- **差出人はお客様本人**: 貨物利用運送事業に当たらないよう、取次寄りの立て付けにしています。
  実際の運用形態は行政書士に確認してください。
- **通関業者ではない旨**: フッターに明記。税務助言も行わない旨を記載。

## 未確定・要確認事項

- 料金体系(手数料・保管料)は仮の数字です
- 法人としての立て付け(取次 / 利用運送)は専門家確認が必要
- 禁制品リストは代表例のみ。仕向地により異なります
