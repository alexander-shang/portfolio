// This is a variant of clock-prototype.js — same spin-in and
// cursor-tracking mechanics, but with one addition: hovering (or
// focusing) a label "pins" both hands to point at that label instead
// of the cursor, and swaps the headline for a time + bio blurb.

(function () {
  const clock = document.getElementById('clock');
  const hourEl = document.getElementById('hand-hour');
  const minuteEl = document.getElementById('hand-minute');
  const wrap = document.getElementById('headline-wrap');
  const hoverTimeEl = document.getElementById('hover-time');
  const hoverBioEl = document.getElementById('hover-bio');
  const hoverTagsEl = document.getElementById('hover-tags');
  const sunEl = document.getElementById('sun');

  if (!clock || !hourEl || !minuteEl) return;

  const reduceMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const RESTING_TARGET = 0;

  const MINUTE_EASE = 0.12;
  const HOUR_EASE = 0.025;

  const HOUR_SPIN = -340;
  const HOUR_SPIN_DURATION = 1100;

  const MINUTE_SPIN = -520;
  const MINUTE_SPIN_DURATION = 1300;

  const CONTINUE_DURATION = 800;

  // ============================================================
  // CROSS-PAGE HAND CONTINUITY
  // ============================================================

  const HAND_STORAGE_KEY = 'clockHandAngles';

  function readStoredAngles() {
    try {
      const raw = sessionStorage.getItem(HAND_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeStoredAngles(hour, minute) {
    try {
      sessionStorage.setItem(
        HAND_STORAGE_KEY,
        JSON.stringify({ hour, minute })
      );
    } catch (e) {
      // Ignore storage errors
    }
  }

  // ============================================================
  // BACKGROUND COLORS
  // ============================================================

  const TIME_COLORS = {
    '240': 'linear-gradient(0deg, #FFDBB8 0%, #EDF7FF 40%)', // 8am
    '300': 'linear-gradient(0deg, #EDF7FF)', // 10am
    '0':   'linear-gradient(0deg, #EDF7FF)', // noon
    '60':  'linear-gradient(0deg, #EDF7FF)', // 2pm
    '150': 'linear-gradient(0deg, #FFD0C9, #EDF7FF 40%)'  // 5pm
  };

  const DEFAULT_BG = '#FFFFFF';

  // ============================================================
  // SUN
  //
  // The sun travels around a full 360° circular orbit.
  //
  // 8am  = 180° (left)
  // 10am = 135°
  // 12pm = 90°  (top)
  // 2pm  = 45°
  // 5pm  = 0°   (right)
  //
  // The rest of the circle exists below the horizon. Only the
  // 5pm -> 8am transition is forced clockwise (under the
  // viewport); every other transition takes the natural
  // shortest path, which may go either direction.
  // ============================================================

  const SUN_ORBIT = {
    centerX: 50,
    centerY: 100,
    radiusX: 45,   
    radiusY: 60    
  };

  const SUN_ANGLES = {
    '240': 180, // 8am
    '300': 135, // 10am
    '0': 90,    // 12pm
    '60': 45,   // 2pm
    '150': 0    // 5pm
  };

  // The only pair of keys that should force the sun under the
  // screen instead of swinging back over the top.
  const FORCE_CLOCKWISE_FROM = '150'; // 5pm
  const FORCE_CLOCKWISE_TO = '240';   // 8am

  function getSunPosition(angle) {
    const radians = angle * Math.PI / 180;
  
    return {
      x: SUN_ORBIT.centerX + SUN_ORBIT.radiusX * Math.cos(radians),
      y: SUN_ORBIT.centerY - SUN_ORBIT.radiusY * Math.sin(radians)
    };
  }

  let sunAngle = SUN_ANGLES['240'];
  let sunAnimation = null;
  let sunRevealed = false;

  // Tracks the last key passed to moveSun so we know whether this
  // transition is specifically 5pm -> 8am (forced clockwise) or
  // anything else (natural shortest path, either direction).
  let lastSunKey = '240';

  function resolveClockwiseTarget(target, current) {
    let t = target;
  
    while (t > current) t -= 360;
    while (t + 360 <= current) t += 360;
  
    return t;
  }

  // Shortest-path resolve: picks whichever equivalent angle
  // (target ± 360*k) is nearest to current, so the sweep can go
  // either clockwise or counter-clockwise depending on which is
  // closer — this is the "natural" default for every transition
  // except the forced 5pm -> 8am one.
  function resolveShortestTarget(target, current) {
    const diff = shortestDiff(target, normalize(current));
    return current + diff;
  }
  
  function moveSun(time) {
    if (!sunEl) return;
  
    const rawTarget = SUN_ANGLES[time];
  
    if (rawTarget === undefined) return;

    const forceClockwise =
      lastSunKey === FORCE_CLOCKWISE_FROM &&
      time === FORCE_CLOCKWISE_TO;
  
    const targetAngle = forceClockwise
      ? resolveClockwiseTarget(rawTarget, sunAngle)
      : resolveShortestTarget(rawTarget, sunAngle);

    lastSunKey = time;
  
    const startAngle = sunAngle;
    const startTime = performance.now();
    const duration = 700;
  
    if (sunAnimation) {
      cancelAnimationFrame(sunAnimation);
    }
  
    function animate(now) {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = t * (2 - t);
  
      sunAngle = startAngle + (targetAngle - startAngle) * eased;
  
      const position = getSunPosition(sunAngle);
  
      sunEl.style.left = `${position.x}%`;
      sunEl.style.top = `${position.y}%`;
  
      if (t < 1) {
        sunAnimation = requestAnimationFrame(animate);
      } else {
        sunAnimation = null;
      }
    }
  
    sunAnimation = requestAnimationFrame(animate);
  }

  // Position the sun correctly on load, but keep it hidden until
  // the first label activates it — otherwise it flashes at
  // whatever position/CSS default it has before that point.
  if (sunEl) {
    const initialPos = getSunPosition(sunAngle);
    sunEl.style.left = `${initialPos.x}%`;
    sunEl.style.top = `${initialPos.y}%`;
    sunEl.style.opacity = '0';
    sunEl.style.transition = 'opacity 400ms ease';
  }

  const bgLayerA = document.createElement('div');
  const bgLayerB = document.createElement('div');
  bgLayerA.className = 'bg-layer';
  bgLayerB.className = 'bg-layer';
  bgLayerA.style.background = DEFAULT_BG;
  bgLayerB.style.background = DEFAULT_BG;
  bgLayerA.style.opacity = '1';
  bgLayerB.style.opacity = '0';
  document.body.prepend(bgLayerB);
  document.body.prepend(bgLayerA);

  let activeBgLayer = bgLayerA;
  let inactiveBgLayer = bgLayerB;

  function setBackground(value) {
    inactiveBgLayer.style.background = value;
    inactiveBgLayer.style.opacity = '1';
    activeBgLayer.style.opacity = '0';

    const temp = activeBgLayer;
    activeBgLayer = inactiveBgLayer;
    inactiveBgLayer = temp;
  }

  // ============================================================
  // CLOCK HAND HELPERS
  // ============================================================

  function setAngle(el, deg) {
    el.style.transform =
      `translate(-50%, -100%) rotate(${deg}deg)`;
  }

  function easeOutBack(t) {
    const c1 = 1.4;
    const c3 = c1 + 1;

    return (
      1 +
      c3 * Math.pow(t - 1, 3) +
      c1 * Math.pow(t - 1, 2)
    );
  }

  function normalize(deg) {
    return ((deg % 360) + 360) % 360;
  }

  function shortestDiff(target, current) {
    let diff = normalize(target - current);

    if (diff > 180) {
      diff -= 360;
    }

    return diff;
  }

  function angleFromCenter(clientX, clientY) {
    const rect = clock.getBoundingClientRect();

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = clientX - cx;
    const dy = clientY - cy;

    const raw =
      Math.atan2(dy, dx) *
      (180 / Math.PI);

    return normalize(raw + 90);
  }

  // ============================================================
  // CLOCK STATE
  // ============================================================

  let mouseTarget = RESTING_TARGET;

  let hourCurrent = RESTING_TARGET;
  let minuteCurrent = RESTING_TARGET;

  let hourSettled = false;
  let minuteSettled = false;

  let hoverAngle = null;

  // ============================================================
  // CURSOR TRACKING
  // ============================================================

  window.addEventListener('mousemove', (e) => {
    // When hovering a clock label, the label controls the hands.
    if (hoverAngle !== null) return;

    mouseTarget = angleFromCenter(
      e.clientX,
      e.clientY
    );

    if (reduceMotion) {
      hourCurrent = mouseTarget;
      minuteCurrent = mouseTarget;

      setAngle(hourEl, hourCurrent);
      setAngle(minuteEl, minuteCurrent);
    }
  });

  // ============================================================
  // SAVE HAND POSITION WHEN LEAVING PAGE
  // ============================================================

  window.addEventListener('pagehide', () => {
    writeStoredAngles(
      hourCurrent,
      minuteCurrent
    );
  });

  // ============================================================
  // INITIAL CLOCK SPIN
  // ============================================================

  function spinIn(
    el,
    spinAmount,
    duration,
    onDone
  ) {
    const start = performance.now();

    function frame(now) {
      const t = Math.min(
        1,
        (now - start) / duration
      );

      const eased = easeOutBack(t);

      const offset =
        spinAmount * (1 - eased);

      const angle =
        mouseTarget + offset;

      setAngle(el, angle);

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        onDone(angle);
      }
    }

    requestAnimationFrame(frame);
  }

  // ============================================================
  // CONTINUOUS CLOCK TRACKING
  // ============================================================

  function trackLoop() {
    if (hourSettled) {
      hourCurrent +=
        shortestDiff(
          mouseTarget,
          hourCurrent
        ) * HOUR_EASE;

      setAngle(
        hourEl,
        hourCurrent
      );
    }

    if (minuteSettled) {
      minuteCurrent +=
        shortestDiff(
          mouseTarget,
          minuteCurrent
        ) * MINUTE_EASE;

      setAngle(
        minuteEl,
        minuteCurrent
      );
    }

    requestAnimationFrame(trackLoop);
  }

  // ============================================================
  // INITIALIZE CLOCK
  // ============================================================

  if (reduceMotion) {

    setAngle(
      hourEl,
      RESTING_TARGET
    );

    setAngle(
      minuteEl,
      RESTING_TARGET
    );

  } else {

    requestAnimationFrame(trackLoop);

    const stored = readStoredAngles();

    const hourSpin = stored
      ? stored.hour - mouseTarget
      : HOUR_SPIN;

    const minuteSpin = stored
      ? stored.minute - mouseTarget
      : MINUTE_SPIN;

    const hourDuration = stored
      ? CONTINUE_DURATION
      : HOUR_SPIN_DURATION;

    const minuteDuration = stored
      ? CONTINUE_DURATION
      : MINUTE_SPIN_DURATION;

    spinIn(
      hourEl,
      hourSpin,
      hourDuration,
      (a) => {
        hourCurrent = a;
        hourSettled = true;
      }
    );

    spinIn(
      minuteEl,
      minuteSpin,
      minuteDuration,
      (a) => {
        minuteCurrent = a;
        minuteSettled = true;
      }
    );
  }

  // ============================================================
  // LABEL HOVER / FOCUS
  // ============================================================

  document
    .querySelectorAll(
      '.clock__label[data-angle]'
    )
    .forEach((label) => {

      const angle =
        parseFloat(label.dataset.angle);

      const time =
        label.dataset.time;

      function activate() {

        // Reveal the sun on first interaction, since it starts
        // hidden until a label is hovered/focused.
        if (!sunRevealed && sunEl) {
          sunEl.style.opacity = '1';
          sunRevealed = true;
        }

        // Pin clock hands
        hoverAngle = angle;
        mouseTarget = angle;

        // Swap headline
        wrap.classList.add('is-hover');

        hoverTimeEl.textContent = time;

        hoverBioEl.textContent =
          label.dataset.blurb || '';

        // Update tags
        const tags =
          (label.dataset.tags || '')
            .split('|')
            .map((t) => t.trim())
            .filter(Boolean);

        hoverTagsEl.innerHTML =
          tags
            .map(
              (t) =>
                `<span class="tag">${t}</span>`
            )
            .join('');

        // Update background
        setBackground(
          TIME_COLORS[
            label.dataset.angle
          ] || DEFAULT_BG
        );

        // Move sun around its orbit
        moveSun(label.dataset.angle);

        // Reduced motion support
        if (reduceMotion) {

          hourCurrent = angle;
          minuteCurrent = angle;

          setAngle(
            hourEl,
            angle
          );

          setAngle(
            minuteEl,
            angle
          );
        }
      }

      function deactivate() {

        // Give control back to cursor
        hoverAngle = null;

        // Keep the headline/content/sun at
        // the last selected time until another
        // label is hovered.
      }

      label.addEventListener(
        'mouseenter',
        activate
      );

      label.addEventListener(
        'mouseleave',
        deactivate
      );

      label.addEventListener(
        'focus',
        activate
      );

      label.addEventListener(
        'blur',
        deactivate
      );
    });

})();