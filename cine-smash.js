// Page 2: the sunglasses film, played by scrolling. The clip is encoded with every frame as a
// keyframe, so seeking is instant in both directions. Scroll takes him from standing, to taking
// the glasses off, to throwing them at the camera; the screen shatters to black and the dark
// pages open underneath.
(function () {
  const section = document.getElementById('smash');
  const video = document.getElementById('smash-video');
  if (!section || !video) return;
  const fade = section.querySelector('.smash-fade');
  const hint = section.querySelector('.smash-hint');
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FRAME = 1 / 24;

  // load the whole clip into memory: seeking then never depends on the server supporting
  // byte-range requests (simple static servers don't)
  const src = video.getAttribute('src');
  fetch(src).then((r) => r.blob()).then((b) => { video.src = URL.createObjectURL(b); }).catch(() => {});

  let dur = 5.9, cur = 0, visible = false;
  video.addEventListener('loadedmetadata', () => { if (isFinite(video.duration)) dur = video.duration - FRAME; });
  // iOS only decodes frames for seeking after the video has been started once
  const prime = () => { const p = video.play(); if (p && p.then) p.then(() => video.pause()).catch(() => {}); removeEventListener('touchstart', prime); };
  addEventListener('touchstart', prime, { passive: true, once: true });

  function progress() {
    const r = section.getBoundingClientRect();
    const span = section.offsetHeight - innerHeight;
    return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
  }

  function loop() {
    if (visible) {
      const p = progress();
      // the film uses the first 92% of the scroll; the rest holds the shattered frame as it fades to black
      const target = Math.min(1, p / 0.92) * dur;
      cur += (target - cur) * (RM ? 1 : 0.18);
      if (Math.abs(target - cur) < 0.004) cur = target;
      if (!video.seeking && Math.abs(video.currentTime - cur) > FRAME * 0.5) video.currentTime = cur;
      fade.style.opacity = Math.max(0, (p - 0.9) / 0.1).toFixed(3);
      hint.style.opacity = Math.max(0, 1 - p * 12).toFixed(3);
    }
    requestAnimationFrame(loop);
  }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '100px 0px' }).observe(section);
  requestAnimationFrame(loop);
})();
