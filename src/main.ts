import type { Gallery } from './scene';

const sections = [...document.querySelectorAll<HTMLElement>('.scene-section')];
const chapterLinks = [...document.querySelectorAll<HTMLAnchorElement>('.side-progress a')];
const toggle = document.querySelector<HTMLButtonElement>('#motion-toggle')!;
const label = document.querySelector<HTMLElement>('#mode-label')!;
const status = document.querySelector<HTMLElement>('#display-status')!;
const progressBar = document.querySelector<HTMLElement>('#progress-bar')!;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const forcedStatic = new URLSearchParams(location.search).has('no3d');
let gallery: Gallery | undefined;
let enabled = false;
let loading = false;
let metrics: { top: number; height: number; scene: number }[] = [];
let scrollFrame = 0;

function measure() {
  metrics = sections.map(section => ({
    top: section.getBoundingClientRect().top + scrollY,
    height: section.offsetHeight,
    scene: Number(section.dataset.scene)
  }));
  update();
}

function update() {
  scrollFrame = 0;
  const viewport = innerHeight;
  const center = scrollY + viewport * .5;
  let active = 0;
  metrics.forEach((metric, i) => { if (center >= metric.top) active = i; });
  const metric = metrics[active];
  if (!metric) return;
  const local = Math.max(0, Math.min(1, (center - metric.top) / metric.height));
  gallery?.setScroll(metric.scene, local, active === 0, metric.top - scrollY + (active === 0 ? 280 : 220));
  const currentId = sections[active].id;
  document.body.classList.toggle('in-collection', active > 0 && active < sections.length - 1);
  chapterLinks.forEach(link => {
    if (link.hash === `#${currentId}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  progressBar.style.transform = `scaleX(${Math.min(1, scrollY / Math.max(1, document.documentElement.scrollHeight - viewport))})`;
}

function setEnabled(value: boolean, announce = true) {
  enabled = value;
  document.body.classList.toggle('has-3d', value);
  toggle.setAttribute('aria-pressed', String(value));
  toggle.setAttribute('aria-label', value ? '静止画表示に切り替える' : '3D表示に切り替える');
  label.textContent = value ? '3D ON' : '3D OFF';
  gallery?.setEnabled(value);
  if (announce) status.textContent = value ? '3D表示を有効にしました。' : '静止画表示に切り替えました。';
}

async function start3D() {
  if (loading) return;
  if (gallery) { setEnabled(true); update(); return; }
  loading = true;
  toggle.disabled = true;
  toggle.setAttribute('aria-busy', 'true');
  label.textContent = 'LOADING';
  try {
    const { createGallery } = await import('./scene');
    gallery = createGallery(document.querySelector('#stage')!, () => {
      gallery?.dispose();
      gallery = undefined;
      setEnabled(false);
      status.textContent = '3D表示を続けられないため、静止画を表示しています。';
    }, reducedMotion.matches);
    update();
    setEnabled(true, false);
  } catch (error) {
    console.warn('3D is unavailable. The illustrated collection remains available.', error);
    setEnabled(false, false);
    status.textContent = 'この環境では静止画でコレクションを表示します。';
  } finally {
    loading = false;
    toggle.disabled = false;
    toggle.removeAttribute('aria-busy');
  }
}

toggle.hidden = false;
toggle.addEventListener('click', () => { if (enabled) setEnabled(false); else void start3D(); });
reducedMotion.addEventListener('change', () => {
  gallery?.setReducedMotion(reducedMotion.matches);
  if (reducedMotion.matches) setEnabled(false);
});
addEventListener('scroll', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(update); }, { passive: true });
addEventListener('resize', measure, { passive: true });
new ResizeObserver(measure).observe(document.querySelector('main')!);
void document.fonts.ready.then(measure);
measure();
if (!reducedMotion.matches && !forcedStatic) void start3D();
else setEnabled(false, false);
