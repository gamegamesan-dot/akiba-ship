/* ============================================================
   Omakase Ship — 紹介元トラッキング（?s=CODE）
   ・URL の ?s= が /^[A-Z]{2}\d{2,3}$/ に一致する時だけ localStorage に保存
     （キー omakase_ref / 値 {code, firstSeen(ISO)} / 既存があれば上書きしない）
   ・保存済みなら右下に控えめなバッジを表示（値は textContent のみ・タップで閉じる）
   ・?s= が無い/不正なら一切表示を変えない
   ・index.html と cost/index.html の両方から読み込む
   ============================================================ */
(function () {
  "use strict";
  var CODE_RE = /^[A-Z]{2}\d{2,3}$/;
  var KEY = "omakase_ref";

  /* 1) ?s= を読み、正当なコードのみ保存（既存があれば初回接触を優先して上書きしない） */
  try {
    var s = new URLSearchParams(window.location.search).get("s");
    if (s && CODE_RE.test(s) && !localStorage.getItem(KEY)) {
      localStorage.setItem(KEY, JSON.stringify({
        code: s,
        firstSeen: new Date().toISOString()
      }));
    }
  } catch (e) { /* localStorage 無効/プライベート等は無視 */ }

  /* 2) 保存済みの紹介コードを取得。無ければ/不正なら何もしない（表示を変えない） */
  var ref = null;
  try { ref = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}
  if (!ref || typeof ref.code !== "string" || !CODE_RE.test(ref.code)) return;

  /* 表示用コード（CF01 → CF-01）。値は必ず textContent で入れる（innerHTML 不使用） */
  var displayCode = ref.code.replace(/^([A-Z]{2})(\d+)$/, "$1-$2");

  /* 内蔵5言語テーブル（window.I18N を持たないページ = cost 等 のフォールバック）。
     ★要同期★ root の index.html の I18N 内 trackRef / trackCounter と同一文言に保つこと。
     （root の辞書と二重管理になるため、片方を変えたらもう片方も更新する） */
  var TRACK_TABLE = {
    "en":      { trackRef: "Referred by ", trackCounter: "Show this at our counter" },
    "ja":      { trackRef: "紹介元 ",       trackCounter: "受付でこの画面をご提示ください" },
    "zh-Hant": { trackRef: "介紹來源 ",     trackCounter: "請在櫃檯出示此畫面" },
    "zh-Hans": { trackRef: "介绍来源 ",     trackCounter: "请在柜台出示此画面" },
    "ko":      { trackRef: "추천인 ",       trackCounter: "카운터에서 이 화면을 보여주세요" }
  };

  /* cost 側の言語判定：navigator.language の先頭から。判定不能は英語 */
  function detectLang() {
    var n = (navigator.language || "").toLowerCase();
    if (n.indexOf("zh") === 0) {
      return (n.indexOf("tw") > -1 || n.indexOf("hk") > -1) ? "zh-Hant" : "zh-Hans";
    }
    if (n.indexOf("ko") === 0) return "ko";
    if (n.indexOf("ja") === 0) return "ja";
    return "en";
  }

  /* 文言：root は既存 window.I18N を優先（言語切替に追従）。
     無ければ内蔵テーブル＋navigator判定（cost）でフォールバック */
  function phrase(key) {
    if (window.I18N) {
      var lang = document.documentElement.getAttribute("lang") || "en";
      var d = window.I18N[lang] || window.I18N.en;
      if (d && d[key]) return d[key];
    }
    var t = TRACK_TABLE[detectLang()] || TRACK_TABLE.en;
    return t[key] || TRACK_TABLE.en[key];
  }

  /* ---- バッジ生成（DOMは全て textContent で構築） ---- */
  var badge = document.createElement("div");
  badge.id = "omakaseRefBadge";
  badge.setAttribute("role", "note");
  badge.style.cssText =
    "position:fixed;right:12px;bottom:12px;z-index:2147483000;max-width:230px;" +
    "background:#16181d;color:#f2efe8;padding:10px 30px 10px 12px;border-radius:6px;" +
    "font:600 12.5px/1.35 -apple-system,BlinkMacSystemFont,'Segoe UI','Hiragino Sans'," +
    "'Noto Sans JP','Noto Sans TC','Noto Sans SC','Noto Sans KR',sans-serif;" +
    "box-shadow:0 4px 14px rgba(0,0,0,.28);opacity:.96";

  var line1 = document.createElement("div");
  var refLabel = document.createElement("span");
  var codeSpan = document.createElement("span");
  codeSpan.style.cssText = "color:#ffd34d;font-weight:800";
  line1.appendChild(refLabel);
  line1.appendChild(codeSpan);

  var line2 = document.createElement("div");
  line2.style.cssText = "margin-top:2px;font-weight:400;font-size:11px;color:#b9bec6";

  var closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.textContent = "×";
  closeBtn.style.cssText =
    "position:absolute;top:3px;right:6px;background:none;border:0;color:#8d939c;" +
    "font-size:16px;line-height:1;cursor:pointer;padding:3px";

  badge.appendChild(closeBtn);
  badge.appendChild(line1);
  badge.appendChild(line2);

  function render() {
    refLabel.textContent = phrase("trackRef");   // 静的文言も textContent
    codeSpan.textContent = displayCode;          // 紹介コード＝必ず textContent
    line2.textContent = phrase("trackCounter");
  }
  render();

  /* 言語切替（ルートは applyLang が <html lang> を書き換える）に追従して文言更新 */
  try {
    new MutationObserver(render).observe(document.documentElement,
      { attributes: true, attributeFilter: ["lang"] });
  } catch (e) {}

  /* タップ（クリック）で閉じる */
  closeBtn.addEventListener("click", function () { badge.remove(); });

  function mount() { (document.body || document.documentElement).appendChild(badge); }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
