/* ============================================================
   Omakase Ship — 共通料金・ロジックモジュール
   ルート(/) と 料金計算機(/cost/) が参照する「料金の唯一の正」。
   ------------------------------------------------------------
   送り方は2つだけ（2026-11-23〜）：
     ・梱包後 2kg 以下、かつ 縦＋横＋高さ 90cm 以下（いちばん長い辺 60cm 以下）
         → 小形包装物（airPacket の表。計算は今までと同じ）
     ・それ以外 → EMS
     国際小包・船便・SAL は使わない（表も持たない）。梱包は箱だけ（封筒はやめた）。
   ------------------------------------------------------------
   出典：日本郵便公式
     EMS 料金（確認日 2026-11-23・全42段をそのまま写した）
       https://www.post.japanpost.jp/send/oversea/charge/list-ems/all.html
       ※第3地帯・第4地帯は特別追加料金を含む額（公式の表の注記どおり）
     EMS 取り扱い国・地域と地帯（確認日 2026-11-23）
       https://www.post.japanpost.jp/service/send/oversea/list/delivery/ems/country/all.html
     EMS 大きさ・重量制限一覧表（確認日 2026-11-23）
       https://www.post.japanpost.jp/service/send/oversea/list/delivery/ems/size/
     小形包装物（airPacket の表）は 2026-08-07 取得のまま（今回は変えていない）
   地帯：1=中国/韓国/台湾, 2=アジア(左記除く・香港はここ),
         3=オセアニア/カナダ/メキシコ/中近東/ヨーロッパ, 4=米国
         （第5地帯＝中南米・アフリカは、いま発送していないので持たない）
   ※米国あては関税の前払い（Zonos）が別にかかる。送料の表には入っていない
     （申告額で決まるので、重さや送り方では変わらない。cost/ の注記を参照）。
   ============================================================ */
(function () {
  var R = {
    // ===== 手数料・梱包・保管 =====
    handling: 1950,                         // 取扱手数料（梱包・箱・緩衝材・ラベル作成・申告・持込を含む）
    packing: {
      box: { cost: 0 }                      // 箱は取扱手数料に含める（封筒はやめた・2026-11-23）
    },
    PACK_RATIO: 1.3,     // 梱包後重量 = max(w*PACK_RATIO, w+PACK_MIN_ADD)
    PACK_MIN_ADD: 200,   //   重い荷ほど厚い箱が要るため1.3倍。軽量品の非現実化を防ぐ下限200g
    freeDays: 3,
    perDay: 200,
    HOTEL_BASE: 1980,
    // ===== 米国あての輸入の費用（Zonos の前払い）の目安 =====
    // 申告額 × rate ＋ fixed。合計には入れない（米国を選んだときだけ、合計の下に別の行で出す）。
    // 実測 2026-09-05（cost/ と同じ値）。重さ・送り方では変わらない。
    usDuty: { rate: 0.1374, fixed: 562, example: 30000 },    // 国内ホテル配送の基本料金（仮値・後で調整）

    // ===== 国際エアパケット（航空・2kgまで・100g刻み。index0=〜100g … 19=〜2000g）=====
    // ★2026-06-01改称。旧称：国際eパケットライト。国際eパケット（別サービス）は2023-09-30廃止。
    //   料金はUS 500g¥2,040/1kg¥3,090/2kg¥5,190 が公式の国際エアパケットと一致（確認日2026-08-08）。
    airPacketRates: {
      1: [720,820,920,1020,1120,1220,1320,1420,1520,1620,1720,1820,1920,2020,2120,2220,2320,2420,2520,2620],
      2: [750,870,990,1110,1230,1350,1470,1590,1710,1830,1950,2070,2190,2310,2430,2550,2670,2790,2910,3030],
      3: [880,1060,1240,1420,1600,1780,1960,2140,2320,2500,2680,2860,3040,3220,3400,3580,3760,3940,4120,4300],
      4: [1200,1410,1620,1830,2040,2250,2460,2670,2880,3090,3300,3510,3720,3930,4140,4350,4560,4770,4980,5190]
    },

    // ===== EMS（公式の全42段。500g〜1kgは100g刻み、〜2kgは250g刻み、〜6kgは500g刻み、以降1kg刻み。上限30kg） =====
    // 確認日 2026-11-23（出典は冒頭）。第3・第4地帯は特別追加料金を含む額。
    emsSteps: [500,600,700,800,900,1000,1250,1500,1750,2000,2500,3000,3500,4000,4500,5000,5500,6000,7000,8000,9000,10000,11000,12000,13000,14000,15000,16000,17000,18000,19000,20000,21000,22000,23000,24000,25000,26000,27000,28000,29000,30000],
    emsRates: {
      1: [1450,1600,1750,1900,2050,2200,2500,2800,3100,3400,3900,4400,4900,5400,5900,6400,6900,7400,8200,9000,9800,10600,11400,12200,13000,13800,14600,15400,16200,17000,17800,18600,19400,20200,21000,21800,22600,23400,24200,25000,25800,26600],
      2: [1900,2150,2400,2650,2900,3150,3500,3850,4200,4550,5150,5750,6350,6950,7550,8150,8750,9350,10350,11350,12350,13350,14350,15350,16350,17350,18350,19350,20350,21350,22350,23350,24350,25350,26350,27350,28350,29350,30350,31350,32350,33350],
      3: [3150,3400,3650,3900,4150,4400,5000,5550,6150,6700,7750,8800,9850,10900,11950,13000,14050,15100,17200,19300,21400,23500,25600,27700,29800,31900,34000,36100,38200,40300,42400,44500,46600,48700,50800,52900,55000,57100,59200,61300,63400,65500],
      4: [3900,4180,4460,4740,5020,5300,5990,6600,7290,7900,9100,10300,11500,12700,13900,15100,16300,17500,19900,22300,24700,27100,29500,31900,34300,36700,39100,41500,43900,46300,48700,51100,53500,55900,58300,60700,63100,65500,67900,70300,72700,75100]
    },

    // ===== 小形包装物の大きさ（cm）：3辺の合計 90 以下・いちばん長い辺 60 以下 =====
    smallSize: { sum3: 90, longest: 60 },

    // ===== EMS の大きさ・重さ（公式「EMS大きさ・重量制限一覧表」確認日 2026-11-23）=====
    // 基本：最大の長さ 1.5m・長さ＋横周 3m・30kg。違う国だけ下に書く。
    emsSize: { len: 150, girth: 300 },
    emsSizeByCountry: {
      US: { len: 150, girth: 275 },   // 米国 1.5m／2.75m
      AU: { len: 105, girth: 300 },   // オーストラリア 1.05m／3m
      DE: { len: 105, girth: 200 },   // ドイツ 1.05m／2m
      ES: { len: 105, girth: 200 },   // スペイン 1.05m／2m
      CN: { len: 180, girth: 300 }    // 中国 1.8m／3m
    },
    emsMaxKgByCountry: { AU: 20, PH: 20, NL: 23 },   // ほかは 30kg

    // 各サービスの目安日数（ゾーン別）。出典：日本郵便サービス比較/料金・日数。
    days: {
      airPacket: { 1: '5–10 days', 2: '6–12 days', 3: '7–14 days', 4: '6–13 days' },
      ems: { 1: '2–4 days', 2: '3–5 days', 3: '4–7 days', 4: '4–7 days' }
    },

    // 表示名の唯一の正：label（客向け主表示）＋ officialName（郵便局呼称・副表記）。
    // HTML側にサービス名をハードコードしないこと（prose もここから流し込む）。
    SERVICES: {
      airPacket: { label: 'Small Parcel (up to 2 kg)', officialName: 'International Air Packet' },
      ems:       { label: 'EMS Express',                officialName: '' }   // 副表記なし
    },

    // 国内配送（ホテル配送）。ゾーン/サイズ基準/上限重量は国際とは別体系。
    // ゆうパック（[公式] 3辺合計170cm以下・25kgまで／25〜30kgは重量ゆうパック。確認日2026-08-08）。
    // HOTEL_BASE は仮値・画面では「概算(estimate)」と明示する。
    DOMESTIC: {
      courier: 'Yu-Pack (ゆうパック)',
      maxSizeCm: 170,   // 3辺（縦+横+高さ）の合計
      maxKg: 25,        // 標準。25〜30kgは重量ゆうパック（要相談）
      options: [
        { code: 'JP-TOKYO', nameEn: 'Hotel in Tokyo',            days: 'Next day' },
        { code: 'JP-OTHER', nameEn: 'Hotel elsewhere in Japan',  days: '1–2 days' }
      ]
    },

    // ===== 仕向国テーブル（LP と cost の国の選択肢）=====
    // { code(ISO2), nameEn, zone, form }
    //   zone … 日本郵便の地帯（確認日 2026-11-23・出典は冒頭。香港は第2地帯）
    //   form … 予約フォームの「送り先の国」の選択肢（完全一致）。無い国は LP が Other を入れる
    // ★いま発送している範囲だけ。国を増やすときは、公式の一覧で地帯と上限を確かめてから足す。
    COUNTRIES: [
      { code: 'US', nameEn: 'United States',   zone: 4, form: 'United States' },
      { code: 'CA', nameEn: 'Canada',          zone: 3, form: 'Canada' },
      { code: 'AU', nameEn: 'Australia',       zone: 3, form: 'Australia' },
      { code: 'GB', nameEn: 'United Kingdom',  zone: 3, form: 'United Kingdom' },
      { code: 'KR', nameEn: 'South Korea',     zone: 1, form: 'South Korea' },
      { code: 'TW', nameEn: 'Taiwan',          zone: 1, form: 'Taiwan' },
      { code: 'HK', nameEn: 'Hong Kong',       zone: 2, form: 'Hong Kong' },
      { code: 'SG', nameEn: 'Singapore',       zone: 2, form: 'Singapore' },
      { code: 'MY', nameEn: 'Malaysia',        zone: 2, form: 'Malaysia' },
      { code: 'PH', nameEn: 'Philippines',     zone: 2, form: 'Philippines' },
      { code: 'TH', nameEn: 'Thailand',        zone: 2, form: 'Thailand' },
      // --- フォームに国名の選択肢が無い国（フォームは Other） ---
      { code: 'CN', nameEn: 'China',           zone: 1 },
      { code: 'FR', nameEn: 'France',          zone: 3 },
      { code: 'DE', nameEn: 'Germany',         zone: 3 },
      { code: 'IT', nameEn: 'Italy',           zone: 3 },
      { code: 'ES', nameEn: 'Spain',           zone: 3 },
      { code: 'NL', nameEn: 'Netherlands',     zone: 3 },
      { code: 'NZ', nameEn: 'New Zealand',     zone: 3 },
      { code: 'VN', nameEn: 'Vietnam',         zone: 2 },
      { code: 'ID', nameEn: 'Indonesia',       zone: 2 },
      { code: 'IN', nameEn: 'India',           zone: 2 },
      // --- 上に無い国（今までの「Europe」「Asia」の選択肢と同じ範囲・地帯で計算） ---
      { code: 'X3', nameEn: 'Other country in Europe', zone: 3, other: true },
      { code: 'X2', nameEn: 'Other country in Asia',   zone: 2, other: true }
    ]
  };
  R.country = function (code) {
    for (var i = 0; i < R.COUNTRIES.length; i++) if (R.COUNTRIES[i].code === code) return R.COUNTRIES[i];
    return null;
  };

  // ---- 梱包後重量（g）：1.3倍 と +200g の大きい方 ----
  R.packedWeight = function (grams) {
    return Math.ceil(Math.max(grams * R.PACK_RATIO, grams + R.PACK_MIN_ADD));
  };

  // ---- 各サービスの送料（円）。範囲外は null ----
  function stepRate(steps, rates, zone, g) {
    var arr = rates[zone];
    if (!arr) return null;
    for (var i = 0; i < steps.length; i++) if (g <= steps[i]) return arr[i];
    return null; // 上限超
  }
  R.airPacketYen = function (zone, g) {
    if (g <= 0 || g > 2000) return null;          // 2kg上限
    var i = Math.ceil(g / 100) - 1;
    var arr = R.airPacketRates[zone];
    return arr ? arr[i] : null;
  };
  R.emsYen = function (zone, g) {
    if (g <= 0) return null;                        // EMSは500gブラケットから30kgまで
    return stepRate(R.emsSteps, R.emsRates, zone, g);
  };
  // ---- 上限（国ごと）----
  R.emsMaxG = 30000;
  R.emsLimit = function (country) {
    var sz = (country && R.emsSizeByCountry[country]) || R.emsSize;
    var kg = (country && R.emsMaxKgByCountry[country]) || 30;
    return { len: sz.len, girth: sz.girth, maxKg: kg };
  };

  // ---- 大きさの判定：fitsSize(service, sizeCm, opts) ----
  // sizeCm = { length(いちばん長い辺), girth(長さ＋横周), sum3(3辺の合計) }。分からない値は null。
  // opts.over90 = true … 「90cm を超える」と選ばれた（小形包装物にはしない）
  // 戻り: { ok:bool, over:[...] }
  R.fitsSize = function (service, sizeCm, opts) {
    sizeCm = sizeCm || {}; opts = opts || {};
    var over = [], L = sizeCm.length, G = sizeCm.girth, S3 = sizeCm.sum3;
    if (service === 'airPacket') {
      if (opts.over90 || (S3 != null && S3 > R.smallSize.sum3) || (L != null && L > R.smallSize.longest))
        over.push('over ' + R.smallSize.sum3 + ' cm (length + width + height) or longest side over '
                  + R.smallSize.longest + ' cm');
    } else if (service === 'ems') {
      var lim = R.emsLimit(opts.country);
      if (L != null && L > lim.len) over.push('length ' + L + ' cm > ' + lim.len + ' cm');
      if (G != null && G > lim.girth) over.push('length + girth ' + G + ' cm > ' + lim.girth + ' cm');
    }
    return { ok: over.length === 0, over: over };
  };

  // ---- 見積り：quoteAll(zone, grams, sizeCm, opts) ----
  // grams=中身の重さ（この中で packedWeight を当てる）。opts={ country, over90 }。
  // 戻り: [{service, label, officialName, postage, days, available, reason}]（小形包装物・EMS の2つ）
  //   postage = 送料だけ（円）。取扱手数料・保管はページ側で足す。
  //   重さの上限・料金・判定はすべて梱包後の重さ（packed）で見る。
  R.quoteAll = function (zone, grams, sizeCm, opts) {
    sizeCm = sizeCm || {}; opts = opts || {};
    var packed = R.packedWeight(grams);
    var out = [];

    // 1) 小形包装物（梱包後 2kg まで・3辺の合計 90cm まで）
    (function () {
      var reason = '', yen = R.airPacketYen(zone, packed), ok = (yen != null);
      if (!ok) reason = 'over weight limit (2 kg)';
      var sc = R.fitsSize('airPacket', sizeCm, opts);
      if (ok && !sc.ok) { ok = false; reason = 'over size limit (' + sc.over.join('; ') + ')'; }
      out.push({ service: 'airPacket', postage: ok ? yen : null, days: R.days.airPacket[zone],
                 available: ok, reason: reason });
    })();

    // 2) EMS（国ごとの重さ・大きさの上限）
    (function () {
      var lim = R.emsLimit(opts.country);
      var reason = '', ok = true, yen = R.emsYen(zone, packed);
      if (packed > lim.maxKg * 1000 || yen == null) { ok = false; reason = 'over weight limit (' + lim.maxKg + ' kg)'; }
      var sc = R.fitsSize('ems', sizeCm, opts);
      if (ok && !sc.ok) { ok = false; reason = 'over size limit (' + sc.over.join('; ') + ')'; }
      out.push({ service: 'ems', postage: ok ? yen : null, days: R.days.ems[zone],
                 available: ok, reason: reason });
    })();

    // 表示名は R.SERVICES に一元化して付与（HTML側でハードコードしない）
    out.forEach(function (o) {
      var s = R.SERVICES[o.service] || {};
      o.label = s.label; o.officialName = s.officialName || '';
    });
    return out;
  };

  // ---- 送り方を決める：小形包装物にできればそれ、できなければ EMS。どちらも無理なら null ----
  R.route = function (zone, grams, sizeCm, opts) {
    var qs = R.quoteAll(zone, grams, sizeCm, opts);
    if (qs[0].available) return qs[0];
    if (qs[1].available) return qs[1];
    return null;
  };
  R.bestQuote = R.route;   // 以前の名前

  // ---- 国内ホテル配送の見積り（国際とは別体系）。sizeCm.sum3=3辺合計(cm) ----
  R.domesticQuote = function (code, grams, sizeCm) {
    var opt = null, i;
    for (i = 0; i < R.DOMESTIC.options.length; i++) if (R.DOMESTIC.options[i].code === code) opt = R.DOMESTIC.options[i];
    if (!opt) return null;
    sizeCm = sizeCm || {};
    var packed = R.packedWeight(grams);
    var sum3 = (sizeCm.sum3 != null) ? sizeCm.sum3 : null;
    var over = [];
    if (packed > R.DOMESTIC.maxKg * 1000) over.push('over ' + R.DOMESTIC.maxKg + ' kg');
    if (sum3 != null && sum3 > R.DOMESTIC.maxSizeCm) over.push('over ' + R.DOMESTIC.maxSizeCm + ' cm (3-side total)');
    return {
      code: opt.code, nameEn: opt.nameEn, days: opt.days, courier: R.DOMESTIC.courier,
      base: R.HOTEL_BASE, estimate: true, packed: packed,
      available: over.length === 0, over: over
    };
  };

  if (typeof window !== 'undefined') window.AKIBA_RATES = R;
  if (typeof module !== 'undefined' && module.exports) module.exports = R;
})();
