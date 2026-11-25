# Omakase Ship by Play Japan — ランディングページ / チラシ

インバウンド向け国際発送代行サービス「Omakase Ship by Play Japan」の検証用一式(Phase 0)。

コンセプト: **スーツケースに入らない大きい荷物**（箱入りフィギュア・箱物）を、秋葉原で預かって1箱にまとめて自国へ送る。
小さい荷物・国内のホテル間の配送も受け付けます（主役は大きい荷物）。
スマホでQRを読ませることを前提に、モバイル優先で作っています。

## ファイル

| パス | 用途 |
|---|---|
| `index.html` | ランディングページ本体(5言語) |
| `cost/` | 料金計算機ページ |
| `partner/` | 提携店募集ページ（日英切替・業種別提案PDFへのリンク） |
| `rates.js` | 料金の唯一の正（手数料・梱包・送料表・`quoteAll()`/`fitsSize()`）。LP と cost が参照 |
| `tracking.js` | 紹介元トラッキング（`?s=CODE`）。右下バッジ・5言語 |
| `assets/print/` | 印刷用PDF（提案書A4×3〔ホテル/物販/カフェ〕、チラシA6） |
| `tools/flyer/` | チラシ生成スクリプト |
| `qr_print.png` | チラシ・POP印刷用(940×1024px) |
| `qr_web.png` | SNS・画面表示用(376×409px) |
| `make_qr.py` | QR再生成スクリプト |

## 公開する前に必ず変更するもの（連絡先）

`index.html` の先頭 `<script>` 内、`CONFIG` は**連絡先だけ**です。ここを実値に書き換えてください（連絡ボタンの宛先は**ここだけで反映**されます）。

```js
var CONFIG = {
  bizName:  "Omakase Ship by Play Japan",
  email:    "gamegamesan@gmail.com"   // 質問の窓口はメールだけ
};
```

> 料金は `CONFIG` にはありません。すべて `rates.js` にあります（下記）。

## 予約フォーム（入口）

いちばん目立つボタンは「**予約する（Book a drop-off）**」で、Google フォームを開きます
（`index.html` の `FORM`）。質問の窓口は**メールだけ**です（2026-11-25〜。WhatsApp・LINE はやめました）。アドレスを文字でも表示し、コピーボタンを付けています（メールアプリが無いスマホ向け）。

料金の目安で選んだ内容と紹介コードを、`usp=pp_url` の事前入力で入れて開きます。
選択肢の文字は**フォームと完全一致**にしてあります（`–` は en ダッシュ U+2013）。
フォームの選択肢を変えたら `rates.js` の `COUNTRIES`（`form`）と `index.html` の `FORM_SIZE` も合わせてください。

| フォームの項目 | entry | LP から入れる値 |
|---|---|---|
| 送り先の国 | `entry.68402568` | United States／Canada／Australia／United Kingdom／South Korea／Taiwan／Hong Kong／Singapore／Malaysia／Philippines／Thailand は国名。それ以外（China・France・Germany・Italy・Spain・Netherlands・New Zealand・Vietnam・Indonesia・India・Other country in Europe／Asia）は「Other (please write below)」 |
| 大きさ | `entry.314454876` | 小形包装物になるとき →「Small – up to 2 kg and up to 90 cm (length + width + height)」、EMS になるとき →「Large – one box over 90 cm or over 2 kg」。「Several large boxes」「Not sure yet」は LP からは入れない |
| 紹介コード | `entry.2128966062` | `?s=` で保存した紹介元のコード（`omakase_ref`）。無ければ入れない |

梱包の質問（`entry.1194186612`）はフォームから消したので、LP からも入れません。
紹介コードはメールの本文にも「Referral code: ◯◯」で入ります。
住所・部屋番号は LP に書きません（受付場所は予約確認メールで伝えます）。
LP の「お預かりの場所（where_）」欄には、大まかな場所（秋葉原と御徒町のあいだ）・最寄り駅と徒歩分数・範囲だけを示す簡単な地図だけを載せています（2026-11-25〜）。

## 送り方は2つだけ（2026-11-23〜）

| 条件 | 送り方 |
|---|---|
| 梱包後 2kg 以下、かつ 縦＋横＋高さ 90cm 以下（いちばん長い辺 60cm 以下） | 小形包装物（`airPacketRates` の表。計算は今までと同じ） |
| それ以外 | EMS |

- 梱包は**箱だけ**（封筒はやめた）。国際小包・船便・SAL は使わない（表も消した）。
- Service fee は **¥1,950**（`handling`。梱包・箱・緩衝材・通関書類を含む）。
- 重さは LP で 30kg まで選べる。送り方と送料は**梱包後の重さ**（`max(中身×1.3, 中身+200g)`）で決めるので、
  梱包後に1箱の上限（30kg。国によって 20kg・23kg）を超える重さは「箱を分ける」案内になる（金額は出さない）。
- LP の「箱の大きさ」で 90cm を超えると選ぶと、2kg 以下でも EMS になる。
- 送り先は国ごとの選択肢（`rates.js` の `COUNTRIES`）。送料は地帯ごとのまま。発送している範囲は変えていない
  （今までの「Europe」「Asia」は「Other country in Europe／Asia」として残した）。

### EMS の料金・大きさの出典（日本郵便公式・確認日 2026-11-23）

| 内容 | 出典 |
|---|---|
| EMS 料金（全42段・第1〜第4地帯をそのまま写した。第3・第4地帯は特別追加料金を含む額） | https://www.post.japanpost.jp/send/oversea/charge/list-ems/all.html |
| EMS 取り扱い国・地域と地帯 | https://www.post.japanpost.jp/service/send/oversea/list/delivery/ems/country/all.html |
| EMS 大きさ・重量制限一覧表 | https://www.post.japanpost.jp/service/send/oversea/list/delivery/ems/size/ |

- 地帯：第1＝中国・韓国・台湾／第2＝アジア（左記を除く。**香港はここ**）／第3＝オセアニア・カナダ・メキシコ・中近東・ヨーロッパ／第4＝米国。
  第5地帯（中南米・アフリカ）は発送していないので持っていない。
- 以前は香港を第1地帯で計算していたが、公式の一覧では第2地帯なので直した（香港あての金額が少し上がる）。
- **EMS の大きさの上限：最大の長さ 1.5m、長さ＋胴回り（横周）3m、30kg。** 国によって違う：
  米国 長さ＋胴回り 2.75m／オーストラリア 長さ 1.05m・20kg／ドイツ・スペイン 長さ 1.05m・長さ＋胴回り 2m／
  中国 長さ 1.8m／フィリピン 20kg／オランダ 23kg（`emsSizeByCountry`・`emsMaxKgByCountry`）。
- 小形包装物の表（`airPacketRates`）は 2026-08-07 取得のまま。今回は確かめ直していない。

### 米国あての輸入の費用（Zonos）

LP と `cost/` の金額には**入れていない**（小形包装物でも EMS でも同じ）。`cost/` で米国を選ぶと、
「関税の前払いは見積りに含まない」と目安の式（申告額 × 13.74% ＋ ¥562、2026-09-05 確認）を注記で出す。
この式は**申告額だけ**で決まり、重さ・送り方では変わらない。

## 料金の変更は `rates.js` だけ

料金・送料・サイズ制限・各種係数は **`rates.js`（`window.AKIBA_RATES`）が唯一の正**。LP と `cost/` の両方がここを参照します。

| キー | 意味 |
|---|---|
| `handling` / `freeDays` / `perDay` | 取扱手数料（¥1,950・梱包と箱を含む）・無料保管日数・超過分の1日保管料 |
| `PACK_RATIO` / `PACK_MIN_ADD` | 課金重量 = `max(中身×1.3, 中身+200g)` |
| `HOTEL_BASE` | 国内ホテル配送の基本料金（LP「2つの送り方」に表示） |
| `airPacketRates`（100g刻み） | 小形包装物（〜2kg）に使う送料表（国際エアパケットの表。旧称：国際eパケットライト／2026-06-01改称） |
| `smallSize` | 小形包装物の大きさ（3辺の合計 90cm・いちばん長い辺 60cm） |
| `emsRates` / `emsSteps` | EMS の送料表（500g〜30kg・公式の全42段） |
| `emsSize` / `emsSizeByCountry` / `emsMaxKgByCountry` | EMS の大きさ・重さの上限（基本と、国ごとの違い） |
| `SERVICES` | 各サービスの表示名（`label`主表示 ＋ `officialName`副表記）。**表示名の唯一の正・HTMLにハードコードしない** |
| `COUNTRIES` / `DOMESTIC` | 仕向国テーブル（地帯・フォームの国名）／ 国内ホテル配送（ゆうパック 170cm・25kg・`HOTEL_BASE`概算） |
| `quoteAll()` / `route()` / `fitsSize()` / `emsLimit()` / `domesticQuote()` | 2つの送り方の見積り・送り方の決定・大きさの判定・EMS の上限・国内見積 |

- 送料は日本郵便公式（EMS は**確認日 2026-11-23**、小形包装物の表は取得日 2026-08-07。出典URLは上の表と `rates.js` 冒頭コメント）。値上げ時はここを差し替え。
- **`rates.js` を変更したら、`cost/` の静的表と JSON-LD の数値、および `assets/print/` のPDFを再生成/更新すること**（静的数値はスクリプトで再計算し手打ちしない）。
- あわせて **`tools/flyer/gen_flyer.py` の価格を更新し、チラシPDFを再作成すること**（`gen_flyer.py` は価格をハードコードしており `rates.js` とは手動同期）。
  **2026-11-23 の変更（2kg 超は EMS）は、チラシ・提案書PDFにはまだ入れていない**（「米国500g ¥4,410〜」は変わらない）。

> 同じ日本郵便の料金表を `pj_price/index.html` の AIR / EMS 定数でも保持しています。値上げ時は両方を更新してください。

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
