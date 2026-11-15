// Slower, smoother wheel scrolling. Each wheel notch moves the page about half as far as the
// browser default, and the page glides toward that target instead of jumping, so the pinned
// scenes (skills network, AI arsenal, journey) play out at a calmer pace.
// Touch, keyboard and the scrollbar keep their native behaviour.
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const SPEED = 0.38;   // fraction of the native wheel distance
  const EASE = 0.085;   // how quickly the page catches up each frame (lower = floatier)

  let target = scrollY, current = scrollY, running = false;
  const maxScroll = () => document.documentElement.scrollHeight - innerHeight;

  // let inner scroll areas (modals, carousels) keep their own wheel
  function canScrollInside(el, dy) {
    for (; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
      const cs = getComputedStyle(el);
      if (!/(auto|scroll)/.test(cs.overflowY) || el.scrollHeight <= el.clientHeight + 1) continue;
      if (dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return true;
    }
    return false;
  }

  function tick() {
    current += (target - current) * EASE;
    if (Math.abs(target - current) < 0.5) { current = target; running = false; }
    scrollTo({ top: current, behavior: 'instant' });
    if (running) requestAnimationFrame(tick);
  }

  addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.defaultPrevented) return;              // pinch-zoom, or a component handled it
    let dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 16; else if (e.deltaMode === 2) dy *= innerHeight;
    if (!dy || canScrollInside(e.target, dy)) return;
    e.preventDefault();
    if (!running) { target = current = scrollY; }
    target = Math.max(0, Math.min(maxScroll(), target + dy * SPEED));
    if (!running) { running = true; requestAnimationFrame(tick); }
  }, { passive: false });

  // anything else that scrolls the page (links, keyboard, scrollbar) resets our position
  addEventListener('scroll', () => { if (!running) target = current = scrollY; }, { passive: true });
})();
