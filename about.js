// This is a variant of clock-prototype.js — same spin-in and
// cursor-tracking mechanics, but with one addition: hovering (or
// focusing) a label "pins" both hands to point at that label instead
// of the cursor, and swaps the headline for a time + bio blurb. Kept
// as its own file rather than sharing clock-prototype.js so each
// page's clock behavior can diverge without touching the other.
(function () {
  const clock = document.getElementById('clock');
  const hourEl = document.getElementById('hand-hour');
  const minuteEl = document.getElementById('hand-minute');
  const wrap = document.getElementById('headline-wrap');
  const hoverTimeEl = document.getElementById('hover-time');
  const hoverBioEl = document.getElementById('hover-bio');
  const hoverTagsEl = document.getElementById('hover-tags');
  if (!clock || !hourEl || !minuteEl) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const RESTING_TARGET = 140;
  const MINUTE_EASE = 0.12;
  const HOUR_EASE = 0.025;
  const HOUR_SPIN = -540, HOUR_SPIN_DURATION = 1100;
  const MINUTE_SPIN = -720, MINUTE_SPIN_DURATION = 1300;

  // subtle time-of-day background tint per label, keyed by its
  // data-angle. Purely decorative — tweak or delete freely.
  const TIME_COLORS = {
    '240': '#F5F1E8', // wake up — 8am, pale morning warmth
    '300': '#EAF3F1', // explore — 10am, cool minty morning
    '0':   '#FFF8ED', // eat — noon, bright warm daylight
    '60':  '#EDF1FA', // build — 2pm, cool focused afternoon
    '150': '#FBEDE3', // create — 5pm, golden hour
  };
  const DEFAULT_BG = '#FFFFFF';

  function setAngle(el, deg) {
    el.style.transform = `translate(-50%, -100%) rotate(${deg}deg)`;
  }
  function easeOutBack(t) {
    const c1 = 1.4, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
  function normalize(deg) {
    return ((deg % 360) + 360) % 360;
  }
  function shortestDiff(target, current) {
    let diff = normalize(target - current);
    if (diff > 180) diff -= 360;
    return diff;
  }
  function angleFromCenter(clientX, clientY) {
    const rect = clock.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const raw = Math.atan2(dy, dx) * (180 / Math.PI);
    return normalize(raw + 90);
  }

  let mouseTarget = RESTING_TARGET;
  let hourCurrent = RESTING_TARGET;
  let minuteCurrent = RESTING_TARGET;
  let hourSettled = false;
  let minuteSettled = false;
  let hoverAngle = null; // non-null while a label is pinning the hands

  window.addEventListener('mousemove', (e) => {
    if (hoverAngle !== null) return; // a label has control — ignore the cursor
    mouseTarget = angleFromCenter(e.clientX, e.clientY);
    if (reduceMotion) {
      hourCurrent = mouseTarget;
      minuteCurrent = mouseTarget;
      setAngle(hourEl, hourCurrent);
      setAngle(minuteEl, minuteCurrent);
    }
  });

  function spinIn(el, spinAmount, duration, onDone) {
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = easeOutBack(t);
      const offset = spinAmount * (1 - eased);
      const angle = mouseTarget + offset;
      setAngle(el, angle);
      if (t < 1) requestAnimationFrame(frame);
      else onDone(angle);
    }
    requestAnimationFrame(frame);
  }

  function trackLoop() {
    if (hourSettled) {
      hourCurrent += shortestDiff(mouseTarget, hourCurrent) * HOUR_EASE;
      setAngle(hourEl, hourCurrent);
    }
    if (minuteSettled) {
      minuteCurrent += shortestDiff(mouseTarget, minuteCurrent) * MINUTE_EASE;
      setAngle(minuteEl, minuteCurrent);
    }
    requestAnimationFrame(trackLoop);
  }

  if (reduceMotion) {
    setAngle(hourEl, RESTING_TARGET);
    setAngle(minuteEl, RESTING_TARGET);
  } else {
    requestAnimationFrame(trackLoop);
    spinIn(hourEl, HOUR_SPIN, HOUR_SPIN_DURATION, (a) => { hourCurrent = a; hourSettled = true; });
    spinIn(minuteEl, MINUTE_SPIN, MINUTE_SPIN_DURATION, (a) => { minuteCurrent = a; minuteSettled = true; });
  }

  // ---- label hover / focus: pin the hands + swap the headline ----
  document.querySelectorAll('.clock__label[data-angle]').forEach((label) => {
    const angle = parseFloat(label.dataset.angle);
    const time = label.dataset.time;

    function activate() {
      hoverAngle = angle;
      mouseTarget = angle;
      wrap.classList.add('is-hover');
      hoverTimeEl.textContent = time;
      hoverBioEl.textContent = label.dataset.blurb || '';
      const tags = (label.dataset.tags || '')
        .split('|')
        .map((t) => t.trim())
        .filter(Boolean);
      hoverTagsEl.innerHTML = tags.map((t) => `<span class="tag">${t}</span>`).join('');
      document.body.style.backgroundColor = TIME_COLORS[label.dataset.angle] || DEFAULT_BG;
      if (reduceMotion) {
        hourCurrent = angle;
        minuteCurrent = angle;
        setAngle(hourEl, angle);
        setAngle(minuteEl, angle);
      }
    }
    function deactivate() {
      // only release the hands back to cursor-tracking — the headline,
      // blurb, and background stay put until another label is hovered
      hoverAngle = null;
    }

    label.addEventListener('mouseenter', activate);
    label.addEventListener('mouseleave', deactivate);
    label.addEventListener('focus', activate);
    label.addEventListener('blur', deactivate);
  });
})();