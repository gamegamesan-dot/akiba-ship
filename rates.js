/* ============================================================
   Omakase Ship — 共通料金・ロジックモジュール
   ルート(/) と 料金計算機(/cost/) が参照する「料金の唯一の正」。
   ------------------------------------------------------------
   出典：日本郵便公式（取得日 2026-08-07）
     EMS料金       https://www.post.japanpost.jp/int/charge/list/ems_all.html
     国際小包(航空) https://www.post.japanpost.jp/send/oversea/charge/list-parcel/zone1..4.html
     EMSサイズ     https://www.post.japanpost.jp/int/ems/size/index.html
     小包サイズ(国別) https://www.post.japanpost.jp/cgi-kokusai/country_hikaku.php?cid=N
     発送方法比較(SAL停止) https://www.post.japanpost.jp/int/service/dispatch/index.html
   ゾーン：1=中国/韓国/台湾, 2=アジア(左記除く), 3=欧州/カナダ/豪州, 4=米国
   ※米国の関税事前支払い制度は変動が激しい → 最終確認日 2026-08-07（tracking/表示は要定期確認）
   ============================================================ */
(function () {
  var R = {
    // ===== 手数料・梱包・保管 =====
    handling: 1800,                         // 取扱手数料（ラベル作成・申告・持込）
    packing: {
      box: { cost: 150 },                   // 段ボール箱
      env: { cost: 50, maxGrams: 2000 }     // クッション封筒（2kgまで）
    },
    PACK_RATIO: 1.3,     // 梱包後重量 = max(w*PACK_RATIO, w+PACK_MIN_ADD)
    PACK_MIN_ADD: 200,   //   重い荷ほど厚い箱が要るため1.3倍。軽量品の非現実化を防ぐ下限200g
    freeDays: 3,
    perDay: 200,
    HOTEL_BASE: 1980,    // 国内ホテル配送の基本料金（仮値・後で調整）

    // ===== 国際eパケット/小形包装物（航空・2kgまで・100g刻み。index0=〜100g … 19=〜2000g） =====
    epacketRates: {
      1: [720,820,920,1020,1120,1220,1320,1420,1520,1620,1720,1820,1920,2020,2120,2220,2320,2420,2520,2620],
      2: [750,870,990,1110,1230,1350,1470,1590,1710,1830,1950,2070,2190,2310,2430,2550,2670,2790,2910,3030],
      3: [880,1060,1240,1420,1600,1780,1960,2140,2320,2500,2680,2860,3040,3220,3400,3580,3760,3940,4120,4300],
      4: [1200,1410,1620,1830,2040,2250,2460,2670,2880,3090,3300,3510,3720,3930,4140,4350,4560,4770,4980,5190]
    },

    // ===== EMS（0.5kg〜6.0kgは500g刻み→7〜30kgは1kg刻み。上限30kg） =====
    emsSteps: [500,1000,1500,2000,2500,3000,3500,4000,4500,5000,5500,6000,7000,8000,9000,10000,11000,12000,13000,14000,15000,16000,17000,18000,19000,20000,21000,22000,23000,24000,25000,26000,27000,28000,29000,30000],
    emsRates: {
      1: [1450,2200,2800,3400,3900,4400,4900,5400,5900,6400,6900,7400,8200,9000,9800,10600,11400,12200,13000,13800,14600,15400,16200,17000,17800,18600,19400,20200,21000,21800,22600,23400,24200,25000,25800,26600],
      2: [1900,3150,3850,4550,5150,5750,6350,6950,7550,8150,8750,9350,10350,11350,12350,13350,14350,15350,16350,17350,18350,19350,20350,21350,22350,23350,24350,25350,26350,27350,28350,29350,30350,31350,32350,33350],
      3: [3150,4400,5550,6700,7750,8800,9850,10900,11950,13000,14050,15100,17200,19300,21400,23500,25600,27700,29800,31900,34000,36100,38200,40300,42400,44500,46600,48700,50800,52900,55000,57100,59200,61300,63400,65500],
      4: [3900,5300,6600,7900,9100,10300,11500,12700,13900,15100,16300,17500,19900,22300,24700,27100,29500,31900,34300,36700,39100,41500,43900,46300,48700,51100,53500,55900,58300,60700,63100,65500,67900,70300,72700,75100]
    },

    // ===== 国際小包 航空便（1kg刻み。index0=1kg … 29=30kg） =====
    parcelAirSteps: [1000,2000,3000,4000,5000,6000,7000,8000,9000,10000,11000,12000,13000,14000,15000,16000,17000,18000,19000,20000,21000,22000,23000,24000,25000,26000,27000,28000,29000,30000],
    parcelAirRates: {
      1: [2050,2750,3450,4150,4850,5550,6250,6950,7650,8350,8850,9350,9850,10350,10850,11350,11850,12350,12850,13350,13850,14350,14850,15350,15850,16350,16850,17350,17850,18350],
      2: [2500,3700,4900,6100,7300,8500,9700,10900,12100,13300,13950,14600,15250,15900,16550,17200,17850,18500,19150,19800,20450,21100,21750,22400,23050,23700,24350,25000,25650,26300],
      3: [3850,6000,8150,10300,12450,14600,16750,18900,21050,23200,24800,26400,28000,29600,31200,32800,34400,36000,37600,39200,40800,42400,44000,45600,47200,48800,50400,52000,53600,55200],
      4: [4200,6700,9200,11700,14200,16700,19200,21700,24200,26700,28700,30700,32700,34700,36700,38700,40700,42700,44700,46700,48700,50700,52700,54700,56700,58700,60700,62700,64700,66700]
    },

    // ===== 国際小包 船便（参考データ・cost非表示。米国のみ取得＝代表点。将来の法人向けに保持） =====
    // 出典 parcel zone4 / 取得日2026-08-07。全ブラケット未取得（代表点）。
    parcelSeaRef: { 4: { 1000:2600, 2000:3300, 5000:5400, 10000:8900, 30000:20900 } },

    // ===== SAL（引受停止中・参考データ・cost非表示。米国のみ取得） =====
    // 2026-08-07時点で引受停止（発送方法比較ページに明記）。再開時は要更新。
    salRef: { 4: { 1000:2900, 2000:4100, 5000:7700, 10000:12700, 30000:32700 } },

    // ===== サイズ基準（cm）=====
    // 国際小包：基準A / 基準B。長さ(len) と 長さ+胴回り(girth) の上限。
    STD_A: { len: 105, girth: 200 },
    STD_B: { len: 150, girth: 300 },
    // 国別のどちらか（ISO2）。取得済み以外は 'unknown'（fitsSizeで保守的にA判定）。
    // ★将来国を追加する時はこの表に1行足すだけ。出典：国別条件表（取得日2026-08-07）
    parcelSizeStandard: {
      US: 'A', DE: 'A', FR: 'A', AU: 'A', KR: 'A',   // 基準A（105/200）
      CA: 'B', GB: 'B', SG: 'B', TH: 'B', TW: 'B', CN: 'B', HK: 'B'  // 基準B（150/300）
    },
    // 小包の国別 最大重量(kg) 上書き（既定30kg）。豪・韓は20kg。
    parcelMaxKg: { AU: 20, KR: 20 },

    // EMSサイズ：一般 150/300、米国のみ 150/275。上限重量30kg。
    emsSize: { len: 150, girth: 300 },
    emsSizeByCountry: { US: { len: 150, girth: 275 } },

    // 各サービスの目安日数（ゾーン別）。出典：日本郵便サービス比較/料金・日数。
    days: {
      epacket: { 1: '5–10 days', 2: '6–12 days', 3: '7–14 days', 4: '6–13 days' },
      airParcel: { 1: '5–10 days', 2: '6–12 days', 3: '7–14 days', 4: '6–13 days' },
      ems: { 1: '2–4 days', 2: '3–5 days', 3: '4–7 days', 4: '4–7 days' },
      sea: { 1: '1–3 months', 2: '1–3 months', 3: '1–3 months', 4: '1–3 months' }
    },

    // cost ページはゾーン選択のため、ゾーン内で最も厳しい小包基準/上限を保守的に採用。
    // （ゾーン内に基準A国や20kg国が混在するため、安全側で判定）
    zoneConservative: {
      1: { parcelStd: 'A', parcelMaxKg: 20 },  // 中(B)/韓(A,20kg)/台(B) → A・20kg
      2: { parcelStd: 'A', parcelMaxKg: 30 },  // 星(B)/泰(B)/他unknown → A(保守)
      3: { parcelStd: 'A', parcelMaxKg: 20 },  // 独仏豪(A)/加英(B)、豪20kg → A・20kg
      4: { parcelStd: 'A', parcelMaxKg: 30 }   // 米(A)
    }
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
  R.epacketYen = function (zone, g) {
    if (g <= 0 || g > 2000) return null;          // 2kg上限
    var i = Math.ceil(g / 100) - 1;
    var arr = R.epacketRates[zone];
    return arr ? arr[i] : null;
  };
  R.emsYen = function (zone, g) {
    if (g <= 0) return null;                        // EMSは500gブラケットから30kgまで
    return stepRate(R.emsSteps, R.emsRates, zone, g);
  };
  R.parcelAirYen = function (zone, g) {
    if (g <= 0) return null;
    return stepRate(R.parcelAirSteps, R.parcelAirRates, zone, g);
  };

  // ---- サイズ判定：fitsSize(service, lengthCm, girthCm, opts) ----
  // opts.country（ISO2）優先、無ければ opts.zone（保守判定）。
  // 戻り: { ok:bool, over:[...], note:string }
  R.fitsSize = function (service, lengthCm, girthCm, opts) {
    opts = opts || {};
    var lim, note = '';
    if (service === 'ems') {
      lim = (opts.country && R.emsSizeByCountry[opts.country]) || R.emsSize;
    } else if (service === 'airParcel' || service === 'sea') {
      var std;
      if (opts.country) {
        var s = R.parcelSizeStandard[opts.country];
        if (!s) { std = R.STD_A; note = '国により異なるため要確認'; }      // unknown → 保守的にA
        else std = (s === 'A') ? R.STD_A : R.STD_B;
      } else if (opts.zone && R.zoneConservative[opts.zone]) {
        std = (R.zoneConservative[opts.zone].parcelStd === 'A') ? R.STD_A : R.STD_B;
        note = '同一ゾーン内で最も厳しい基準で判定（国により異なるため要確認）';
      } else { std = R.STD_A; note = '国により異なるため要確認'; }
      lim = std;
    } else {
      return { ok: true, over: [], note: 'no size rule' }; // eパケット等はサイズ判定対象外
    }
    var over = [];
    if (lengthCm != null && lengthCm > lim.len) over.push('length ' + lengthCm + 'cm > ' + lim.len + 'cm');
    if (girthCm != null && girthCm > lim.girth) over.push('length+girth ' + girthCm + 'cm > ' + lim.girth + 'cm');
    return { ok: over.length === 0, over: over, note: note };
  };

  // ---- 重量上限（g）----
  R.emsMaxG = 30000;
  R.zoneParcelMaxG = function (zone) {
    var z = R.zoneConservative[zone];
    return (z ? z.parcelMaxKg : 30) * 1000;
  };

  // ---- 全サービス見積り：quoteAll(zone, grams, sizeCm) ----
  // grams=中身重量（この関数内で packedWeight を適用）。sizeCm={length, girth}（任意）。
  // 戻り: [{service, label, postage, days, available, reason}]
  //   postage = 送料のみ（円）。手数料・梱包・保管はページ側で共通加算する。
  //   available=false のとき postage=null、reason に理由（over weight/size limit 等）。
  //   船便・SAL は常に available=false（データは保持しつつ cost では非表示）。
  R.quoteAll = function (zone, grams, sizeCm) {
    sizeCm = sizeCm || {};
    var packed = R.packedWeight(grams);
    var L = (sizeCm.length != null) ? sizeCm.length : null;
    var G = (sizeCm.girth != null) ? sizeCm.girth : null;
    var out = [];

    function sizeCheck(service) {
      if (L == null && G == null) return { ok: true, over: [] };
      return R.fitsSize(service, L, G, { zone: zone });
    }

    // 1) 国際eパケット/小形包装物（2kg上限・サイズ判定は対象外）
    (function () {
      var yen = R.epacketYen(zone, packed);
      out.push({ service: 'epacket', label: 'ePacket', postage: yen, days: R.days.epacket[zone],
                 available: yen != null, reason: yen != null ? '' : 'over weight limit (2 kg)' });
    })();

    // 2) 国際小包 航空便
    (function () {
      var reason = '', ok = true, yen = R.parcelAirYen(zone, packed);
      if (packed > R.zoneParcelMaxG(zone) || yen == null) { ok = false; reason = 'over weight limit'; }
      var sc = sizeCheck('airParcel');
      if (ok && !sc.ok) { ok = false; reason = 'over size limit (' + sc.over.join('; ') + ')'; }
      out.push({ service: 'airParcel', label: 'Air Parcel', postage: ok ? yen : null,
                 days: R.days.airParcel[zone], available: ok, reason: reason });
    })();

    // 3) EMS
    (function () {
      var reason = '', ok = true, yen = R.emsYen(zone, packed);
      if (packed > R.emsMaxG || yen == null) { ok = false; reason = 'over weight limit (30 kg)'; }
      var sc = sizeCheck('ems');
      if (ok && !sc.ok) { ok = false; reason = 'over size limit (' + sc.over.join('; ') + ')'; }
      out.push({ service: 'ems', label: 'EMS', postage: ok ? yen : null,
                 days: R.days.ems[zone], available: ok, reason: reason });
    })();

    // 4) 船便（旅行者には輸送日数が不適 → 常に非表示扱い。データは保持）
    out.push({ service: 'sea', label: 'Sea Parcel', postage: null, days: R.days.sea[zone],
               available: false, reason: 'not offered — transit time unsuitable for travelers' });

    // 5) SAL（引受停止中。2026-08-07時点。再開時は要更新）
    out.push({ service: 'sal', label: 'SAL', postage: null, days: null,
               available: false, reason: 'service suspended (2026-08-07)' });

    return out;
  };

  // ---- 利用可能な最安サービス（送料ベース）。ルートLPのヒーロー/概算用 ----
  R.bestQuote = function (zone, grams, sizeCm) {
    var qs = R.quoteAll(zone, grams, sizeCm).filter(function (q) { return q.available && q.postage != null; });
    qs.sort(function (a, b) { return a.postage - b.postage; });
    return qs[0] || null;
  };

  if (typeof window !== 'undefined') window.AKIBA_RATES = R;
  if (typeof module !== 'undefined' && module.exports) module.exports = R;
})();
