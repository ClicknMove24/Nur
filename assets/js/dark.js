// חוט למחשבה — THE DARK SIDE. The thread remembers.

// ---- content source (admin preview can override) ----
let CONTENT = window.NOOR_CONTENT || { settings: {}, dark: {}, darkCharacters: [] };
try {
  if (new URLSearchParams(location.search).has('preview')) {
    const draft = localStorage.getItem('noorContentDraft');
    if (draft) CONTENT = JSON.parse(draft);
  }
} catch (e) { /* fall back to published */ }

const DARK = CONTENT.dark || {};
const WHATSAPP_NUMBER = (CONTENT.settings && CONTENT.settings.whatsapp) || '972548690829';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---- the consent gate (also catches direct visits) ----
(function () {
  const gate = document.getElementById('darkGate');
  if (!gate) return;
  let consent = false;
  try { consent = sessionStorage.getItem('noorDarkConsent') === '1'; } catch (e) {}
  if (!consent) {
    gate.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  const yes = document.getElementById('gateYes');
  if (yes) yes.addEventListener('click', () => {
    try { sessionStorage.setItem('noorDarkConsent', '1'); } catch (e) {}
    gate.hidden = true;
    document.body.style.overflow = '';
  });
})();

// ---- render the lost gallery from content.js (editable in admin) ----
(function renderLost() {
  const box = document.getElementById('darkScrapbook');
  if (!box) return;
  const list = CONTENT.darkCharacters || [];
  if (!list.length) return; // keep the hand-written fallback already in the HTML
  const rots = [-2.5, 3, -3.5, 2, -1.5, 4];
  const srots = [-9, 8, -12, 10, -7, 11];
  box.innerHTML = list.map((ch, i) => `
    <figure class="polaroid" style="--r:${rots[i % rots.length]}deg">
      <span class="tape" aria-hidden="true"></span>
      <img src="assets/img/${esc(ch.img)}" alt="" loading="lazy">
      ${ch.bubble ? `<span class="bubble hand">${esc(ch.bubble)}</span>` : ''}
      <figcaption>
        <span class="polaroid__fig typewriter">exhibit ${String(i + 1).padStart(2, '0')}</span><span class="stamp hand" style="--sr:${srots[i % srots.length]}deg" aria-hidden="true">${esc(ch.stamp || 'ננטש ✶')}</span><span class="polaroid__name hand">${esc(ch.name)}</span>
        <span class="polaroid__story">${esc(ch.story)}</span>
        ${ch.status ? `<span class="polaroid__status typewriter">כרגע: ${esc(ch.status)}</span>` : ''}
      </figcaption>
    </figure>`).join('');
})();

// ---- editable copy (intro / law / warning), if set in admin ----
(function applyDarkCopy() {
  const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.innerHTML = val; };
  set('darkLaw', DARK.law);
  set('darkWarning', DARK.warning);
})();

// ---- the contract form ----
(function () {
  const form = document.getElementById('darkForm');
  if (!form) return;

  const steps = Array.from(form.querySelectorAll('.step'));
  const knots = Array.from(document.querySelectorAll('#knots path'));
  const knotNum = document.getElementById('knotNum');
  const backBtn = document.getElementById('backBtn');
  const nextBtn = document.getElementById('nextBtn');
  const TOTAL = steps.length;
  let current = 1;

  const state = { who: '', whoDetail: '', character: '', miss: '5', forWhom: '', deadline: '', name: '', contact: '' };

  function wireChips(id, key) {
    const box = document.getElementById(id);
    box.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      const was = chip.classList.contains('is-selected');
      box.querySelectorAll('.chip').forEach((c) => c.classList.remove('is-selected'));
      if (!was) { chip.classList.add('is-selected'); state[key] = chip.dataset.value; }
      else { state[key] = ''; }
    });
  }
  wireChips('whoChips', 'who');
  wireChips('forChips', 'forWhom');

  const missRange = document.getElementById('missRange');
  const missOut = document.getElementById('missOut');
  missRange.addEventListener('input', () => {
    const v = Number(missRange.value);
    missOut.textContent = v;
    state.miss = missRange.value;
    missOut.style.transform = `rotate(${(v - 5) * 2.2}deg) scale(${1 + v / 24})`;
    missOut.style.textShadow = v > 7 ? `0 0 ${(v - 7) * 4}px var(--blood-bright)` : 'none';
  });

  function collect() {
    state.whoDetail = document.getElementById('whoDetail').value.trim();
    state.character = document.getElementById('character').value.trim();
    state.deadline = document.getElementById('deadline').value.trim();
    state.name = document.getElementById('name').value.trim();
    state.contact = document.getElementById('contact').value.trim();
  }

  function validate(step) {
    collect();
    if (step === 1) return state.who || state.whoDetail;
    if (step === 2) return state.character;
    if (step === 4) return state.name && state.contact;
    return true;
  }

  function shake(step) {
    const el = steps[step - 1];
    el.classList.remove('is-shaking');
    void el.offsetWidth;
    el.classList.add('is-shaking');
    const hint = el.querySelector('.step__hint');
    if (hint) hint.classList.add('is-missing');
  }

  function show(step) {
    current = step;
    steps.forEach((el, i) => el.classList.toggle('is-active', i === step - 1));
    knots.forEach((k, i) => k.classList.toggle('done', i < step));
    knotNum.textContent = step;
    backBtn.hidden = step === 1;
    nextBtn.textContent = step === TOTAL ? 'לחתום בדם (או בעט) ✶' : 'עמוק יותר ←';
    if (step === TOTAL) writeDeed();
    const f = steps[step - 1].querySelector('input, textarea');
    if (f) f.focus({ preventScroll: true });
  }

  function composeLines() {
    collect();
    const whoLine = [state.who, state.whoDetail].filter(Boolean).join(' — ');
    return [
      'נור,',
      `אני, ${state.name || '—'}, מבקש.ת להחזיר את מי שאיבדתי.`,
      `מי: ${whoLine || 'מישהו. את יודעת מי.'}.`,
      state.character ? `הם היו: ${state.character}` : '',
      `דרגת הגעגוע: ${state.miss}/10.`,
      state.forWhom ? `ההחזרה ${state.forWhom}.` : '',
      state.deadline ? `אני מוכנ.ה לחכות: ${state.deadline}.` : '',
      '',
      'אני מבינ.ה שזה לא ניתן לביטול.',
      `${state.name || ''} ✶`,
    ].filter((l) => l !== '');
  }

  function writeDeed() {
    const deed = document.getElementById('deed');
    deed.innerHTML = '';
    composeLines().forEach((text, i) => {
      const p = document.createElement('p');
      p.textContent = text;
      p.style.animationDelay = `${i * 0.14}s`;
      deed.appendChild(p);
    });
  }

  backBtn.addEventListener('click', () => show(current - 1));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate(current)) { shake(current); return; }
    if (current < TOTAL) { show(current + 1); return; }
    const lines = composeLines();
    if (state.contact) lines.push(`(אם תצטרכי למצוא אותי: ${state.contact})`);
    const waUrl = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(lines.join('\n'));
    window.open(waUrl, '_blank', 'noopener');
    form.innerHTML = `
      <div class="contract__sent">
        <span class="stamp hand" style="--sr:-6deg">נחתם ✶</span>
        <p class="hand contract__sent-big">החוזה נשלח.</p>
        <p class="typewriter">נור קיבלה אותו. עכשיו זה כבר לא בידיים שלכם.</p>
        <a class="contract__walink typewriter" href="${waUrl}" target="_blank" rel="noopener">לא נפתח? לחצו כאן. אם אתם בטוחים ✶</a>
      </div>`;
  });

  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); nextBtn.click(); }
  });
  form.addEventListener('input', () => {
    const hint = steps[current - 1].querySelector('.step__hint.is-missing');
    if (hint) hint.classList.remove('is-missing');
  });
})();
