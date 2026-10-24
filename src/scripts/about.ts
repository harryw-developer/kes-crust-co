// About: scroll-driven oven timeline. The fire grows as the story goes on.
import { motionOK } from './ui';

const story = document.querySelector<HTMLElement>('[data-story]');
if (story) {
  const chapters = [...story.querySelectorAll<HTMLElement>('[data-chapter]')];
  const heat = story.querySelector<HTMLElement>('[data-heat]')!;
  const oven = story.querySelector<HTMLElement>('.oven')!;

  const setProgress = (p: number) => {
    p = Math.max(0, Math.min(1, p));
    oven.style.setProperty('--fire', (0.3 + p * 0.95).toFixed(3));
    oven.style.setProperty('--glow', (0.25 + p * 0.75).toFixed(3));
    heat.textContent = String(Math.round(120 + p * 330));
  };

  // Highlight whichever chapter is in the middle of the screen
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && chapters.forEach((c) => c.classList.toggle('is-active', c === e.target))),
    { rootMargin: '-45% 0px -45% 0px' },
  );
  chapters.forEach((c) => io.observe(c));

  if (motionOK()) {
    Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.create({
        trigger: story.querySelector('.chapters'),
        start: 'top 70%',
        end: 'bottom 60%',
        onUpdate: (self) => setProgress(self.progress),
      });
    });
  } else {
    // Reduced motion: no scrubbing, just set the fire by chapter
    const step = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) setProgress(chapters.indexOf(e.target as HTMLElement) / (chapters.length - 1));
    }), { rootMargin: '-45% 0px -45% 0px' });
    chapters.forEach((c) => step.observe(c));
  }
}
