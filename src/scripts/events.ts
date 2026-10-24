// Events: multi-step enquiry. A pizza fills two slices per finished step,
// then confetti on submit. Without JS it's one plain form.
import { confetti, postForm } from './ui';

const form = document.querySelector<HTMLFormElement>('[data-enquiry]');
if (form) {
  form.noValidate = true;
  const steps = [...form.querySelectorAll<HTMLFieldSetElement>('[data-step]')];
  const slices = [...document.querySelectorAll<SVGGElement>('[data-slice]')];
  const label = document.querySelector<HTMLElement>('[data-sp-label]');
  const count = form.querySelector<HTMLElement>('[data-step-count]')!;
  const prev = form.querySelector<HTMLButtonElement>('[data-prev]')!;
  const next = form.querySelector<HTMLButtonElement>('[data-next]')!;
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]')!;
  const error = form.querySelector<HTMLElement>('[data-error]')!;
  const done = form.querySelector<HTMLElement>('[data-done]')!;
  let current = 0;

  const fill = (completed: number) => {
    slices.forEach((s, i) => setTimeout(() => s.classList.toggle('is-on', i < completed * 2), (i % 2) * 120));
    if (label) label.textContent = completed >= steps.length ? 'Pizza complete!' : `${completed} of ${steps.length} done`;
  };

  const show = (i: number, focus = true) => {
    current = i;
    steps.forEach((s, n) => s.classList.toggle('is-current', n === i));
    count.textContent = `Step ${i + 1} of ${steps.length}`;
    prev.hidden = i === 0;
    next.hidden = i === steps.length - 1;
    submit.hidden = i !== steps.length - 1;
    error.hidden = true;
    if (focus) steps[i].querySelector<HTMLElement>('input, textarea')?.focus({ preventScroll: true });
  };

  const validate = (i: number) => {
    const fields = [...steps[i].querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea')];
    fields.forEach((f) => f.removeAttribute('aria-invalid'));
    const bad = fields.find((f) => !f.checkValidity());
    if (!bad) return true;
    const msgs: Record<string, string> = {
      occasion: 'Pick an occasion first. "Something else" counts!',
      guests: 'Give us a rough number of guests.',
      date: 'Pop in a date, even a rough one.',
      location: 'Where are we heading? A town or postcode is plenty.',
      name: "What should we call you?",
      email: "That email doesn't look quite right.",
    };
    error.textContent = msgs[bad.name] ?? 'Fill this bit in first.';
    error.hidden = false;
    if (bad.type !== 'radio') bad.setAttribute('aria-invalid', 'true');
    bad.focus();
    return false;
  };

  next.addEventListener('click', () => {
    if (!validate(current)) return;
    fill(current + 1);
    show(current + 1);
  });
  prev.addEventListener('click', () => show(current - 1));
  // Picking a radio answer moves straight on, to keep it under a minute
  steps[0].addEventListener('change', () => setTimeout(() => next.click(), 220));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate(current)) return;
    submit.disabled = true;
    submit.textContent = 'Firing up…';
    try {
      await postForm(form);
      fill(steps.length);
      form.classList.add('is-done');
      done.hidden = false;
      done.focus();
      const r = form.getBoundingClientRect();
      confetti({ x: r.left + r.width / 2, y: r.top + 80, count: 160 });
    } catch {
      error.textContent = "Oven's playing up and that didn't send. Try again, or email us instead.";
      error.hidden = false;
    } finally {
      submit.disabled = false;
      submit.innerHTML = 'Fire it up <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg>';
    }
  });

  show(0, false);
  fill(0);
}
