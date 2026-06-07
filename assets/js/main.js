// חוט למחשבה — the site renders itself from assets/data/content.js.
// Editing happens in admin.html, never here.

// ---- content source (admin preview can override via localStorage) ----
let CONTENT = window.NOOR_CONTENT || { settings: {}, characters: [], waiting: [] };
try {
  if (new URLSearchParams(location.search).has('preview')) {
    const draft = localStorage.getItem('noorContentDraft');
    if (draft) CONTENT = JSON.parse(draft);
  }
} catch (e) { /* fall back to the published content */ }

const WHATSAPP_NUMBER = (CONTENT.settings && CONTENT.settings.whatsapp) || '972548690829';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---- render the galleries ----
(function renderGalleries() {
  const rots = [-2.5, 3, -3.5, 2, -1.5, 4, -2.8, 2.2, -1.8];
  const srots = [-9, 8, -12, 10, -7, 11, -8, 9, -10];

  const scrapbook = document.getElementById('scrapbook');
  if (scrapbook) {
    scrapbook.innerHTML = (CONTENT.characters || []).map((ch, i) => `
      <figure class="polaroid" style="--r:${rots[i % rots.length]}deg">
        <span class="tape" aria-hidden="true"></span>
        <img src="assets/img/${esc(ch.img)}" alt="${esc(ch.name)} — דמות סרוגה בעבודת יד" loading="lazy">
        ${ch.bubble ? `<span class="bubble hand">${esc(ch.bubble)}</span>` : ''}
        <figcaption>
          <span class="polaroid__fig typewriter">fig. ${String(i + 1).padStart(2, '0')}</span><span class="stamp hand" style="--sr:${srots[i % srots.length]}deg" aria-hidden="true">אומץ ✶</span><span class="polaroid__name hand">${esc(ch.name)}</span>
          <span class="polaroid__story">${esc(ch.story)}</span>
          ${ch.status ? `<span class="polaroid__status typewriter">כרגע: ${esc(ch.status)}</span>` : ''}${ch.owner ? `<span class="polaroid__owner hand">של ${esc(ch.owner)} ✶</span>` : ''}
        </figcaption>
      </figure>`).join('');
  }

  const adoptGrid = document.getElementById('adoptGrid');
  if (adoptGrid) {
    adoptGrid.innerHTML = (CONTENT.waiting || []).map((ch, i) => `
      <figure class="polaroid is-developed" style="--r:${rots[(i + 1) % rots.length]}deg">
        <span class="tape" aria-hidden="true"></span>
        <img src="assets/img/${esc(ch.img)}" alt="${esc(ch.name)} — דמות סרוגה שמחכה לאימוץ" loading="lazy">
        ${ch.bubble ? `<span class="bubble hand">${esc(ch.bubble)}</span>` : ''}
        <figcaption>
          <span class="stamp stamp--wait hand" style="--sr:${srots[(i + 2) % srots.length]}deg" aria-hidden="true">${esc(ch.stamp || 'מחפש בית ✶')}</span>
          <span class="polaroid__name hand">${esc(ch.name)}</span>
          <span class="polaroid__story">${esc(ch.story)}</span>
          <a class="adopt__btn" data-adopt="${esc(ch.adoptName || ch.name)}" href="#">לאמץ את ${esc(ch.name)} ✶</a>
        </figcaption>
      </figure>`).join('');
  }

  // empty waiting list → hide the adoption button
  const adoptWrap = document.querySelector('.characters__adopt-wrap');
  const outro = document.querySelector('.characters__outro');
  if (adoptWrap && !(CONTENT.waiting || []).length) {
    adoptWrap.hidden = true;
    if (outro) outro.innerHTML = '<span class="scribble">וכולם כבר אומצו.</span> הבא בתור — שלכם.';
  }
})();

// ---- settings into the page ----
(function applySettings() {
  const s = CONTENT.settings || {};
  const price = document.getElementById('priceFrom');
  const lead = document.getElementById('leadTime');
  if (price && s.priceFrom) price.textContent = s.priceFrom;
  if (lead && s.leadTime) lead.textContent = s.leadTime;

  const waFooter = document.getElementById('waLink');
  if (waFooter) waFooter.href = 'https://wa.me/' + WHATSAPP_NUMBER;

  const ig = document.getElementById('igLink');
  if (ig && s.instagram) ig.href = s.instagram;

  // adopt buttons open WhatsApp with the chosen character's name
  document.querySelectorAll('.adopt__btn[data-adopt]').forEach((btn) => {
    const msg = 'היי נור! ראיתי באתר את ' + btn.dataset.adopt + ' ואני רוצה לאמץ ✶';
    btn.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg);
    btn.target = '_blank';
    btn.rel = 'noopener';
  });
})();

// ---- polaroids develop as they enter view, like real instant film ----
(function () {
  const developer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-developed');
        developer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.3 });
  document.querySelectorAll('.polaroid').forEach((p) => developer.observe(p));
})();

// ---- waiting-for-adoption overlay ----
(function () {
  const adoptModal = document.getElementById('adoptModal');
  const adoptOpen = document.getElementById('adoptOpen');
  if (!adoptModal || !adoptOpen) return;
  adoptOpen.addEventListener('click', () => {
    adoptModal.hidden = false;
    document.body.style.overflow = 'hidden';
  });
  const closeAdopt = () => {
    adoptModal.hidden = true;
    document.body.style.overflow = '';
  };
  adoptModal.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) closeAdopt();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !adoptModal.hidden) closeAdopt();
  });
})();

// ---- the postcard flow. one stitch at a time ----
(function () {
  const form = document.getElementById('orderForm');
  if (!form) return;

  const steps = Array.from(form.querySelectorAll('.step'));
  const stitches = Array.from(document.querySelectorAll('#seam path'));
  const stepNum = document.getElementById('stepNum');
  const backBtn = document.getElementById('backBtn');
  const nextBtn = document.getElementById('nextBtn');
  const TOTAL = steps.length;
  let current = 1;

  const state = {
    who: '', whoDetail: '',
    character: '', weird: '5',
    forWhom: '', deadline: '',
    name: '', contact: '',
  };

  // chips: single-select, toggleable
  function wireChips(containerId, key) {
    const box = document.getElementById(containerId);
    box.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      const wasSelected = chip.classList.contains('is-selected');
      box.querySelectorAll('.chip').forEach((c) => c.classList.remove('is-selected'));
      if (!wasSelected) {
        chip.classList.add('is-selected');
        state[key] = chip.dataset.value;
      } else {
        state[key] = '';
      }
    });
  }
  wireChips('whoChips', 'who');
  wireChips('forChips', 'forWhom');

  // weirdness meter
  const weirdRange = document.getElementById('weirdRange');
  const weirdOut = document.getElementById('weirdOut');
  weirdRange.addEventListener('input', () => {
    const v = Number(weirdRange.value);
    weirdOut.textContent = v;
    state.weird = weirdRange.value;
    // the digit itself gets weirder as the value climbs
    weirdOut.style.transform = `rotate(${(v - 5) * 2.2}deg) scale(${1 + v / 30})`;
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
    void el.offsetWidth; // restart animation
    el.classList.add('is-shaking');
    const hint = el.querySelector('.step__hint');
    if (hint) hint.classList.add('is-missing');
  }

  function show(step) {
    current = step;
    steps.forEach((el, i) => el.classList.toggle('is-active', i === step - 1));
    stitches.forEach((s, i) => s.classList.toggle('done', i < step));
    stepNum.textContent = step;
    backBtn.hidden = step === 1;
    nextBtn.textContent = step === TOTAL ? 'לשלוח לנור ✶' : 'ממשיכים ←';
    if (step === TOTAL) writeLetter();
    const firstInput = steps[step - 1].querySelector('input, textarea');
    if (firstInput) firstInput.focus({ preventScroll: true });
  }

  // the letter: answers woven into a real postcard
  function composeLines() {
    collect();
    const whoLine = [state.who, state.whoDetail].filter(Boolean).join(' — ');
    return [
      'שלום נור,',
      `קוראים לי ${state.name || '—'}, ויש לי רעיון לדמות.`,
      `מי היא: ${whoLine || 'עוד לא בטוח, אבל זה יבוא'}.`,
      state.character ? `הסיפור שלה: ${state.character}` : '',
      `מדד מוזרות: ${state.weird}/10.`,
      state.forWhom ? `זה ${state.forWhom}.` : '',
      state.deadline ? `מתי צריך: ${state.deadline}.` : '',
      '',
      'מחכה לשמוע ממך,',
      `${state.name || ''} ✶`,
    ].filter((l) => l !== '');
  }

  function writeLetter() {
    const letter = document.getElementById('letter');
    letter.innerHTML = '';
    composeLines().forEach((text, i) => {
      const p = document.createElement('p');
      p.textContent = text;
      p.style.animationDelay = `${i * 0.12}s`;
      letter.appendChild(p);
    });
  }

  backBtn.addEventListener('click', () => show(current - 1));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate(current)) { shake(current); return; }
    if (current < TOTAL) { show(current + 1); return; }

    // final send — the letter becomes a WhatsApp message to Noor
    const lines = composeLines();
    if (state.contact) lines.push(`(ליצירת קשר חוזר: ${state.contact})`);
    const waUrl = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(lines.join('\n'));
    window.open(waUrl, '_blank', 'noopener');
    form.innerHTML = `
      <div class="postcard__sent">
        <span class="stamp hand" style="--sr:-6deg">נשלח ✶</span>
        <p class="hand postcard__sent-big">הגלויה עברה לוואטסאפ.</p>
        <p class="typewriter">נפתח חלון עם המכתב המוכן — נשאר רק ללחוץ שליחה.</p>
        <a class="postcard__walink typewriter" href="${waUrl}" target="_blank" rel="noopener">לא נפתח? לחצו כאן ✶</a>
      </div>`;
  });

  // Enter inside inputs advances instead of submitting blindly
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
      e.preventDefault();
      nextBtn.click();
    }
  });

  // clear "missing" hint once the user starts fixing
  form.addEventListener('input', () => {
    const hint = steps[current - 1].querySelector('.step__hint.is-missing');
    if (hint) hint.classList.remove('is-missing');
  });
})();
