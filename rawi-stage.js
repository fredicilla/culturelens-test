/**
 * rawi-stage.js: a live scene with one of Rawi's characters. The top is a stage the page fills (Abu Fahad's majlis
 * where you serve, Grandma Haya's loom where your story is woven), the bottom is the character: their line, spoken
 * out loud, hold to talk (the agent's ear, Whisper) or type. What you do on the stage goes to the agent as events,
 * and what the agent does (its tools) comes back to the stage.
 *
 *   import('./rawi-stage.js').then((m) => m.openStage({
 *     experience: 'qahwa', title, kicker, intro, start, face, context,
 *     build(stageEl, api),      // draw the scene; api.event(name, data) tells the agent what happened
 *     actions: { tool(args, spoken) {} },
 *     onClose() {}
 *   }))
 */
import { createRawi, PERSONA, recorder, hush } from './rawi.js';

const isAr = () => window.currentLang === 'ar';
const L = (o) => (o == null ? '' : typeof o === 'string' ? o : isAr() ? (o.ar ?? o.en) : o.en);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (s, r) => (r || document).querySelector(s);

const T = {
  ai: { en: 'AI', ar: 'ذكاء اصطناعي' },
  close: { en: 'Close', ar: 'إغلاق' },
  ask: { en: 'Hold to talk', ar: 'اضغط وتكلّم' },
  asking: { en: 'Listening... let go', ar: 'أسمعك... فك' },
  ph: { en: 'Or type here', ar: 'أو اكتب هنا' },
  send: { en: 'Send', ar: 'إرسال' },
  finish: { en: 'Finish', ar: 'خلصت' },
  you: { en: 'You said: ', ar: 'قلت: ' },
  mic: { en: 'Allow the microphone to talk, or type below.', ar: 'اسمح للمايك عشان تتكلّم، أو اكتب تحت.' },
  short: { en: "I didn't catch that. Hold the button while you talk.", ar: 'ما سمعتك زين. اضغط الزر وأنت تتكلّم.' },
  busy: { en: 'Too many people are here right now. Try again in a moment.', ar: 'فيه ناس كثير الحين، جرّب بعد شوي.' },
  failed: { en: "Couldn't connect. Check the connection and try again.", ar: 'ما قدرت أتصل. تأكد من الاتصال وجرّب مرة ثانية.' },
  retry: { en: 'Try again', ar: 'جرّب مرة ثانية' },
};

const CSS = `
#rg-ov [hidden] { display: none !important; }
#rg-ov { --rg-acc: #E3B25A; --rg-bg: #150D09; position: fixed; inset: 0; z-index: 2147481000; background: var(--rg-bg); color: #F6EEE2; display: none; flex-direction: column; overflow: hidden;
  font-family: var(--font-ui, 'CL Saudi', 'IBM Plex Sans Arabic', system-ui, sans-serif); }
#rg-ov.open { display: flex; }
#rg-ov * { box-sizing: border-box; }
.rg-top { flex: none; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: calc(10px + env(safe-area-inset-top, 0px)) 14px 8px; position: relative; z-index: 5; }
.rg-top button { color: #F6EEE2; background: rgba(246,238,226,.08); border: 1px solid rgba(246,238,226,.18); border-radius: 999px; min-width: 38px; height: 38px; padding: 0 12px; font: inherit; font-size: 13.5px; font-weight: 700; cursor: pointer; }
.rg-title { text-align: center; line-height: 1.25; }
.rg-title small { display: block; font-size: 11.5px; color: var(--rg-acc); font-weight: 700; }
.rg-title b { font-size: 16px; }
.rg-title i { font-style: normal; font-size: 10.5px; color: #150D09; background: var(--rg-acc); border-radius: 999px; padding: 1px 7px; margin-inline-start: 6px; vertical-align: 2px; }
.rg-stage { flex: 1; min-height: 0; position: relative; }
.rg-card { flex: none; position: relative; z-index: 4; margin: 0 10px calc(10px + env(safe-area-inset-bottom, 0px)); background: rgba(31,21,15,.96); border: 1px solid rgba(227,178,90,.35); border-radius: 22px; padding: 12px 14px 12px;
  box-shadow: 0 -10px 30px rgba(0,0,0,.35); }
.rg-who { display: flex; align-items: center; gap: 10px; }
.rg-face { width: 44px; height: 44px; border-radius: 50%; overflow: hidden; flex: none; border: 2px solid var(--rg-acc); background: #2A1B12; transition: transform .15s; }
.rg-face svg { width: 100%; height: 100%; display: block; }
.rg-face.talk { animation: rgTalk .5s ease-in-out infinite alternate; }
@keyframes rgTalk { to { transform: scale(1.07); box-shadow: 0 0 0 5px rgba(227,178,90,.18); } }
.rg-who b { display: block; font-size: 15px; color: var(--rg-acc); }
.rg-who small { display: block; font-size: 11.5px; color: rgba(246,238,226,.55); }
.rg-say { font-size: 16.5px; line-height: 1.7; margin-top: 8px; min-height: 1.7em; max-height: 132px; overflow: auto; }
.rg-say .dots i { display: inline-block; width: 6px; height: 6px; margin: 0 2px; border-radius: 50%; background: var(--rg-acc); animation: rgDot 1s infinite; }
.rg-say .dots i:nth-child(2) { animation-delay: .15s; } .rg-say .dots i:nth-child(3) { animation-delay: .3s; }
@keyframes rgDot { 50% { opacity: .2; transform: translateY(-3px); } }
.rg-heard { font-size: 12.5px; color: rgba(246,238,226,.55); margin-top: 2px; }
.rg-row { display: flex; gap: 8px; margin-top: 10px; align-items: center; }
.rg-row input { flex: 1; min-width: 0; background: rgba(246,238,226,.07); color: #F6EEE2; border: 1px solid rgba(246,238,226,.2); border-radius: 999px; padding: 11px 15px; font: inherit; font-size: 15px; }
.rg-row input:focus { outline: 2px solid var(--rg-acc); outline-offset: -1px; }
.rg-btn { background: var(--rg-acc); color: #150D09; border: 0; border-radius: 999px; padding: 0 18px; height: 46px; font: inherit; font-weight: 800; font-size: 15px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
.rg-btn svg { width: 18px; height: 18px; }
.rg-btn.ghost { background: transparent; color: #F6EEE2; border: 1px solid rgba(246,238,226,.28); }
.rg-btn.round { width: 46px; padding: 0; flex: none; }
.rg-btn.mic { flex: 1; touch-action: none; user-select: none; -webkit-user-select: none; }
.rg-btn.mic.on { background: #FF8A6B; }
.rg-btn:disabled { opacity: .45; cursor: default; }
`;
const MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
const SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

const S = { cfg: null, agent: null, busy: false, rec: null, queue: [], started: false };

function build() {
  if ($('#rg-ov')) return;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const ov = document.createElement('div'); ov.id = 'rg-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
  ov.innerHTML = '<header class="rg-top"><button type="button" id="rg-close" aria-label="Close">✕</button><div class="rg-title"><small id="rg-kicker"></small><b id="rg-title"></b><i id="rg-ai"></i></div><button type="button" id="rg-lang"></button></header>' +
    '<div class="rg-stage" id="rg-stage"></div>' +
    '<section class="rg-card"><div class="rg-who"><span class="rg-face" id="rg-face"></span><div><b id="rg-name"></b><small id="rg-tag"></small></div></div>' +
    '<div class="rg-say" id="rg-say" aria-live="polite"></div><div class="rg-heard" id="rg-heard"></div><div class="rg-row" id="rg-btns"></div>' +
    '<form class="rg-row" id="rg-form" hidden autocomplete="off"><input id="rg-in" dir="auto" maxlength="300"><button type="submit" class="rg-btn round" id="rg-send">' + SEND + '</button></form></section>';
  document.body.appendChild(ov);
  $('#rg-close').addEventListener('click', close);
  $('#rg-lang').addEventListener('click', () => { if (typeof window.toggleLanguage === 'function') window.toggleLanguage(); });
  $('#rg-form').addEventListener('submit', (e) => { e.preventDefault(); const t = $('#rg-in').value.trim(); if (!t) return; $('#rg-in').value = ''; send({ type: 'say', text: t }); });
  document.addEventListener('languageChanged', labels);
}
function labels() {
  if (!S.cfg) return;
  const p = PERSONA[S.cfg.experience] || PERSONA.general;
  $('#rg-title').textContent = L(S.cfg.title); $('#rg-kicker').textContent = L(S.cfg.kicker || ''); $('#rg-ai').textContent = L(T.ai);
  $('#rg-lang').textContent = isAr() ? 'EN' : 'ع';
  $('#rg-name').textContent = L(p.name); $('#rg-tag').textContent = L(S.cfg.tag || { en: 'Rawi · AI agent', ar: 'راوي · وكيل ذكاء اصطناعي' });
  $('#rg-in').placeholder = L(T.ph); $('#rg-send').setAttribute('aria-label', L(T.send));
  if (!S.started) intro(); else if (!S.busy) talkUI();
  if (S.cfg.onLanguage) try { S.cfg.onLanguage(); } catch (e) {}
}
function say(html) { $('#rg-say').innerHTML = html; }
function buttons(list) {
  const box = $('#rg-btns'); box.innerHTML = '';
  list.forEach((b) => {
    const el = document.createElement('button'); el.type = 'button'; el.className = 'rg-btn' + (b.ghost ? ' ghost' : '') + (b.mic ? ' mic' : '');
    el.innerHTML = (b.mic ? MIC : '') + '<span>' + esc(L(b.label)) + '</span>';
    if (b.mic) wireMic(el); else el.addEventListener('click', b.onClick);
    box.appendChild(el);
  });
}
function intro() {
  say(esc(L(S.cfg.intro))); $('#rg-heard').textContent = ''; $('#rg-form').hidden = true;
  buttons([{ label: S.cfg.start, onClick: begin }, { label: T.close, ghost: true, onClick: close }]);
}
function talkUI() {
  $('#rg-form').hidden = false;
  buttons([{ label: T.ask, mic: true }, { label: T.finish, ghost: true, onClick: () => send({ type: 'finish' }, true) }]);
}

const api = {
  // something happened on the stage: the agent hears it (one at a time; the next waits for the reply)
  event(name, data) { if (!S.agent) return; send({ type: 'event', name, data }); },
  started: () => S.started,
  busy: () => S.busy,
  say: (text) => say(esc(text)),
};

export function openStage(cfg) {
  build();
  if (!S.cfg || S.cfg.experience !== cfg.experience) { S.agent = null; S.started = false; }
  S.cfg = cfg;
  const ov = $('#rg-ov');
  if (cfg.accent) ov.style.setProperty('--rg-acc', cfg.accent);
  if (cfg.bg) ov.style.setProperty('--rg-bg', cfg.bg);
  const p = PERSONA[cfg.experience] || PERSONA.general;
  $('#rg-face').innerHTML = cfg.face || p.face;
  const stage = $('#rg-stage'); stage.innerHTML = '';
  if (cfg.build) cfg.build(stage, api);
  labels();
  ov.classList.add('open');
  return api;
}
function close() {
  hush(); stopRec(); $('#rg-face').classList.remove('talk');
  $('#rg-ov').classList.remove('open');
  if (S.cfg && S.cfg.onClose) try { S.cfg.onClose(); } catch (e) {}
}
function begin() {
  if (window.clSound) window.clSound.prime();
  // the face moves with the voice itself (it can take a moment to arrive), not with a guess at its length
  S.agent = createRawi({ experience: S.cfg.experience, actions: S.cfg.actions || {}, onLevel: talking });
  S.started = true; talkUI();
  if (S.cfg.onStart) try { S.cfg.onStart(); } catch (e) {}
  send({ type: 'start', context: S.cfg.context || { page: S.cfg.experience } });
}

async function send(input, ending) {
  if (!S.agent) return;
  if (S.busy) { if (input.type === 'event') S.queue.push(input); return; }
  S.busy = true; S.last = input;
  hush(); $('#rg-face').classList.remove('talk');
  say('<span class="dots"><i></i><i></i><i></i></span>'); lock(true);
  let r;
  try { r = input.type === 'start' ? await S.agent.start(input.context) : input.type === 'finish' ? await S.agent.finish() : await S.agent.turn(input); } catch (e) { r = { ok: false, error: 'failed' }; }
  S.busy = false; lock(false);
  if (!r || !r.ok) {
    say(esc(L(r && r.error === 'nothing heard' ? T.short : r && (r.error === 'busy' || r.error === 'daily limit') ? T.busy : T.failed)));
    if (r && r.error !== 'nothing heard') buttons([{ label: T.retry, onClick: () => { talkUI(); send(S.last, ending); } }, { label: T.close, ghost: true, onClick: close }]);
    return;
  }
  say(esc(r.say));
  $('#rg-heard').textContent = input.audio && r.heard && r.heard.text ? L(T.you) + r.heard.text : '';
  if (S.cfg.onReply) try { S.cfg.onReply(r); } catch (e) {}
  if (ending) { $('#rg-form').hidden = true; buttons([{ label: T.close, onClick: close }]); return; }
  if (S.queue.length) { const next = S.queue.shift(); S.queue = []; setTimeout(() => send(next), 400); }
}
// the face keeps moving through the short gaps between words, and stops a moment after the voice does
function talking(v) {
  if (v <= 0.1) return;
  const f = $('#rg-face'); f.classList.add('talk');
  clearTimeout(S.quietT); S.quietT = setTimeout(() => f.classList.remove('talk'), 320);
}
function lock(on) { $('#rg-btns').querySelectorAll('button').forEach((b) => (b.disabled = on)); $('#rg-in').disabled = on; $('#rg-send').disabled = on; }

// hold to talk: the recording goes to the agent, whose ear (Whisper) writes down what was said
function wireMic(el) {
  let down = false;
  const label = () => { el.querySelector('span').textContent = L(down ? T.asking : T.ask); };
  el.addEventListener('pointerdown', async (e) => {
    e.preventDefault(); if (S.busy || down) return;
    down = true; hush(); try { el.setPointerCapture(e.pointerId); } catch (x) {}
    el.classList.add('on'); label();
    try { S.rec = await recorder(); } catch (x) { S.rec = null; down = false; el.classList.remove('on'); label(); say(esc(L(T.mic))); return; }
    if (!down) stopRec();
  });
  const up = () => {
    if (!down) return; down = false; el.classList.remove('on'); label();
    const wav = stopRec();
    if (!wav) return;
    if (wav.secs < 0.5) { say(esc(L(T.short))); return; }
    send({ type: 'say', audio: { b64: wav.b64, mime: wav.mime } });
  };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
}
function stopRec() { const r = S.rec; S.rec = null; if (!r) return null; try { return r.stop(); } catch (e) { return null; } }
