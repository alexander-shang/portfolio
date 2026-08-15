(function () {
  const clock = document.getElementById('clock');
  const hourEl = document.getElementById('hand-hour');
  const minuteEl = document.getElementById('hand-minute');
  if (!clock || !hourEl || !minuteEl) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const RESTING_TARGET = 0; // where the hands aim before the mouse has moved at all

  // how quickly each hand catches up to the mouse once it's settled —
  // minute hand is responsive, hour hand trails well behind it
  const MINUTE_EASE = 0.12;
  const HOUR_EASE = 0.025;

  // spin-in: how much extra rotation each hand carries in, and how long
  // it takes to decay to zero (degrees, milliseconds)
  const HOUR_SPIN = -340;
  const HOUR_SPIN_DURATION = 1100;
  const MINUTE_SPIN = -520;
  const MINUTE_SPIN_DURATION = 1300;

  // shorter, gentler continuation used when arriving from another
  // clock page (see the sessionStorage handoff below) — no need for
  // a dramatic flourish since the hands are already moving
  const CONTINUE_DURATION = 800;

  // ---- cross-page hand continuity ----
  // Right before navigating away, save the hands' exact current angle.
  // The next clock page reads it and animates FROM that angle instead
  // of its usual multi-spin flourish — so the hands feel like they
  // keep winding/unwinding continuously across the page transition
  // instead of resetting.
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
      sessionStorage.setItem(HAND_STORAGE_KEY, JSON.stringify({ hour, minute }));
    } catch (e) {
      // ignore — continuity is a nice-to-have, not essential
    }
  }

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
    const raw = Math.atan2(dy, dx) * (180 / Math.PI); // 0 = east, clockwise positive
    return normalize(raw + 90); // rotate so 0 = north
  }

  let mouseTarget = RESTING_TARGET;
  let hourCurrent = RESTING_TARGET;
  let minuteCurrent = RESTING_TARGET;
  let hourSettled = false;
  let minuteSettled = false;

  window.addEventListener('mousemove', (e) => {
    mouseTarget = angleFromCenter(e.clientX, e.clientY);
    if (reduceMotion) {
      hourCurrent = mouseTarget;
      minuteCurrent = mouseTarget;
      setAngle(hourEl, hourCurrent);
      setAngle(minuteEl, minuteCurrent);
    }
  });

  window.addEventListener('pagehide', () => {
    writeStoredAngles(hourCurrent, minuteCurrent);
  });

  // Spin-in: the hand's angle is the LIVE mouse target plus a decaying
  // extra-rotation offset. As the offset eases to exactly 0, the hand is
  // already sitting on the current cursor angle — so tracking can take
  // over with zero jump.
  function spinIn(el, spinAmount, duration, onDone) {
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = easeOutBack(t);
      const offset = spinAmount * (1 - eased);
      const angle = mouseTarget + offset;
      setAngle(el, angle);
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        onDone(angle);
      }
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
    const stored = readStoredAngles();
    const hourSpin = stored ? stored.hour - mouseTarget : HOUR_SPIN;
    const minuteSpin = stored ? stored.minute - mouseTarget : MINUTE_SPIN;
    const hourDuration = stored ? CONTINUE_DURATION : HOUR_SPIN_DURATION;
    const minuteDuration = stored ? CONTINUE_DURATION : MINUTE_SPIN_DURATION;
    spinIn(hourEl, hourSpin, hourDuration, (finalAngle) => {
      hourCurrent = finalAngle;
      hourSettled = true;
    });
    spinIn(minuteEl, minuteSpin, minuteDuration, (finalAngle) => {
      minuteCurrent = finalAngle;
      minuteSettled = true;
    });
  }
})();