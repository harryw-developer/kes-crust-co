// HTML renderers shared by the build (instant snapshot) and the browser (live data from
// Supabase), so both always produce identical markup.
import { seeded } from './random';
import { SAUCES } from './toppings';
import { ALLERGENS, TAGS, allergenLabel, price } from './allergens';
import { dayShort, dayNum, monthShort, dateLong, epoch, googleCalUrl, mapsUrl, times, type Pitch } from './dates';
import type { MenuItem } from './supabase';
import { u } from './paths';

export const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export const icon = (name: string, cls = '', topping = false) =>
  `<svg class="icon ${cls}" aria-hidden="true" focusable="false"><use href="#${topping ? 't' : 'i'}-${name}"/></svg>`;

const f = (n: number) => n.toFixed(1);

/* ---------- Illustrations ---------- */
export function pizzaArt(art: Record<string, any> = {}, seed: string, cls = '') {
  const rnd = seeded(seed);
  if (art.can) return canArt(art, cls);
  let out = `<circle cx="100" cy="100" r="95" fill="#E9B36A" stroke="#111" stroke-width="4"/>`;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + rnd() * 0.4, r = 86 + rnd() * 5;
    out += `<circle cx="${f(100 + Math.cos(a) * r)}" cy="${f(100 + Math.sin(a) * r)}" r="${f(1.8 + rnd() * 2.6)}" fill="#3B1C0C" opacity="0.75"/>`;
  }
  out += `<circle cx="100" cy="100" r="79" fill="${SAUCES[art.sauce] ?? SAUCES.tomato}" stroke="#B3762F" stroke-width="3"/>`;
  if (art.cheese) {
    for (let i = 0; i < 11; i++) {
      const a = rnd() * Math.PI * 2, r = rnd() * 56;
      out += `<circle cx="${f(100 + Math.cos(a) * r)}" cy="${f(100 + Math.sin(a) * r)}" r="${f(12 + rnd() * 10)}" fill="#FFE7A0" opacity="0.95"/>`;
    }
  }
  const tops: [string, number][] = Array.isArray(art.toppings) ? art.toppings : [];
  const total = tops.reduce((n, [, c]) => n + c, 0);
  let k = 0;
  for (const [t, c] of tops) {
    for (let j = 0; j < c; j++) {
      const i = k++;
      const a = i * 2.39996 + rnd() * 0.5;
      const r = 14 + Math.sqrt((i + 0.5) / Math.max(total, 1)) * 50 + rnd() * 6;
      const x = 100 + Math.cos(a) * r, y = 100 + Math.sin(a) * r, s = 26 + rnd() * 6, rot = Math.round(rnd() * 360);
      out += `<use href="#t-${esc(t)}" x="${f(x - s / 2)}" y="${f(y - s / 2)}" width="${f(s)}" height="${f(s)}" transform="rotate(${rot} ${f(x)} ${f(y)})"/>`;
    }
  }
  return `<svg class="pizza-art ${cls}" viewBox="0 0 200 200" aria-hidden="true" focusable="false">${out}</svg>`;
}

function canArt(art: Record<string, any>, cls: string) {
  const c = /^#[0-9a-f]{3,8}$/i.test(art.can) ? art.can : '#C9CED6';
  const b = /^#[0-9a-f]{3,8}$/i.test(art.band) ? art.band : '#930037';
  return `<svg class="pizza-art can-art ${cls}" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
    <ellipse cx="100" cy="182" rx="46" ry="8" fill="#111" opacity=".15"/>
    <path d="M60 38c0-10 80-10 80 0v124c0 12-80 12-80 0Z" fill="${c}" stroke="#111" stroke-width="4" stroke-linejoin="round"/>
    <path d="M60 86c20 14 60-14 80 0v38c-20-14-60 14-80 0Z" fill="${b}" stroke="#111" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="100" cy="36" rx="40" ry="9" fill="#E7E9EE" stroke="#111" stroke-width="4"/>
    <ellipse cx="100" cy="36" rx="12" ry="3.5" fill="#9AA0AA"/>
    <path d="M72 50v100" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".45"/>
    <circle cx="150" cy="40" r="5" fill="#fff" stroke="#111" stroke-width="2"/><circle cx="160" cy="62" r="3.5" fill="#fff" stroke="#111" stroke-width="2"/><circle cx="44" cy="58" r="4" fill="#fff" stroke="#111" stroke-width="2"/>
  </svg>`;
}

export const priceTag = (n: number) =>
  `<span class="price">${price(n)}<svg viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true"><path d="M58 6C30 3 6 14 5 31s26 25 50 23 40-12 39-26S70 5 44 9" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg></span>`;

/* ---------- Dates ---------- */
const MAP_ROADS = (seed: string) => {
  const rnd = seeded(seed);
  let roads = '';
  for (let i = 0; i < 4; i++) {
    const y1 = 30 + rnd() * 100, y2 = 30 + rnd() * 100;
    roads += `<path d="M-10 ${y1.toFixed(0)}C80 ${(y1 + 40 - rnd() * 80).toFixed(0)} 160 ${(y2 - 40 + rnd() * 80).toFixed(0)} 250 ${y2.toFixed(0)}" fill="none" stroke="#111" stroke-width="3" stroke-dasharray="${rnd() > 0.5 ? '0' : '8 6'}" stroke-linecap="round"/>`;
  }
  const river = `M${(40 + rnd() * 40).toFixed(0)} 10C${(100 + rnd() * 30).toFixed(0)} 60 ${(20 + rnd() * 40).toFixed(0)} 100 ${(110 + rnd() * 40).toFixed(0)} 150`;
  return `<path d="${river}" fill="none" stroke="#7FD3F0" stroke-width="16" stroke-linecap="round"/>${roads}`;
};

export const icsPayload = (p: Pitch) => esc(JSON.stringify(p));

export function dateCard(p: Pitch, i: number) {
  const colours = ['var(--yellow)', 'var(--white)', 'var(--pink)', 'var(--cream)', 'var(--green)', 'var(--orange)'];
  const id = esc(p.id), back = `back-${id}`;
  return `<li class="date-card" id="d-${id}" data-reveal data-start="${epoch(p.date, p.start)}" data-end="${epoch(p.date, p.end)}" style="--r:${[-1.2, 0.8, -0.4, 1.1][i % 4]}deg">
  <div class="flip" data-flip>
    <article class="face front sticker" style="--bg:${colours[i % colours.length]}" aria-labelledby="t-${id}">
      <div class="dc-top">
        <p class="dc-date" aria-hidden="true"><span class="label">${dayShort(p.date)}</span><strong>${dayNum(p.date)}</strong><span class="label">${monthShort(p.date)}</span></p>
        <div>
          <h3 id="t-${id}"><span class="sr-only">${dateLong(p.date)}: </span>${esc(p.name)}</h3>
          <p class="dc-meta">${icon('clock')} ${times(p)}</p>
          ${p.area ? `<p class="dc-meta">${icon('pin')} ${esc(p.area)}</p>` : ''}
        </div>
      </div>
      ${p.note ? `<p class="dc-note">${esc(p.note)}</p>` : ''}
      <p class="dc-live label" data-live hidden>Oven's lit · cooking now</p>
      <div class="dc-actions">
        <button class="btn btn--small" type="button" data-flip-toggle aria-expanded="false" aria-controls="${back}">Where's the oven? ${icon('flip')}</button>
        <button class="btn btn--small btn--white" type="button" data-ics="${icsPayload(p)}">Add to calendar ${icon('calendar')}</button>
      </div>
    </article>
    <article class="face back sticker" id="${back}" aria-label="Map and details for ${esc(p.name)}">
      <svg class="dc-map" viewBox="0 20 240 120" aria-hidden="true"><rect y="20" width="240" height="120" fill="#FFF6E8"/>${MAP_ROADS(p.id)}
        <circle cx="200" cy="42" r="14" fill="#2BB673" stroke="#111" stroke-width="2.5"/><circle cx="40" cy="122" r="10" fill="#2BB673" stroke="#111" stroke-width="2.5"/>
        <g transform="translate(120 82)"><circle r="26" fill="#FF6B1A" opacity=".25"/><path d="M0 6c-10-12-16-18-16-27a16 16 0 0 1 32 0c0 9-6 15-16 27Z" fill="#930037" stroke="#111" stroke-width="3"/><circle cy="-21" r="6" fill="#FFF6E8"/></g>
      </svg>
      <p class="dc-addr"><strong>${esc(p.name)}</strong>${p.address ? `<br>${esc(p.address)}` : ''}</p>
      <p class="dc-meta">${icon('clock')} ${dateLong(p.date)}, ${times(p)}</p>
      <div class="dc-actions">
        ${p.address ? `<a class="btn btn--small" href="${esc(mapsUrl(p))}" target="_blank" rel="noopener">Open in Maps ${icon('pin')}</a>` : ''}
        <button class="btn btn--small btn--white" type="button" data-ics="${icsPayload(p)}">Calendar (.ics)</button>
        <a class="btn btn--small btn--white" href="${esc(googleCalUrl(p))}" target="_blank" rel="noopener">Google Calendar</a>
        <button class="btn btn--small btn--yellow" type="button" data-flip-toggle aria-expanded="true" aria-controls="${back}">Flip back ${icon('flip')}</button>
      </div>
    </article>
  </div>
</li>`;
}

export function soonItem(p: Pitch) {
  return `<li class="soon-item sticker" data-reveal><a href="${u('/find-us#d-')}${esc(p.id)}">
    <span class="soon-date"><span class="label">${dayShort(p.date)}</span><strong>${dayNum(p.date)}</strong><span class="label">${monthShort(p.date)}</span></span>
    <span class="soon-info"><strong>${esc(p.name)}</strong><span>${times(p)}${p.area ? ` · ${esc(p.area)}` : ''}</span></span>
    ${icon('arrow', 'soon-arrow')}</a></li>`;
}

/* ---------- Menu ---------- */
const CATEGORY: Record<string, string> = { pizza: 'Pizza', drink: 'Drink', side: 'Side', sweet: 'Sweet' };

export function menuCard(item: MenuItem, i: number) {
  const id = esc(item.id), back = `menu-back-${id}`;
  const bg = ['var(--white)', 'var(--yellow)', 'var(--cream)', 'var(--white)', 'var(--pink)', 'var(--cream)'][i % 6];
  const contains = item.contains.length ? item.contains.map((a) => allergenLabel(a, true)).join(', ') : 'none of the 14 allergens';
  const tags = item.tags.map((t) => `<li class="chip chip--${TAGS[t]?.colour ?? 'yellow'}">${esc(TAGS[t]?.label ?? t)}</li>`).join('');
  const allergens = ALLERGENS.map((a) => {
    const s = item.contains.includes(a.key) ? 'yes' : item.mayContain.includes(a.key) ? 'may' : 'no';
    return `<li class="al al--${s}"><span aria-hidden="true">${s === 'yes' ? '●' : s === 'may' ? '◐' : '○'}</span>${allergenLabel(a.key, true)}<span class="sr-only">${s === 'yes' ? ': contains' : s === 'may' ? ': may contain' : ': not an ingredient'}</span></li>`;
  }).join('');
  return `<li class="menu-card${item.available ? '' : ' is-soldout'}" id="m-${id}" data-item data-id="${id}" data-tags="${esc(item.tags.join(' '))}" data-category="${esc(item.category)}" data-price="${item.price}" data-name="${esc(item.name)}" data-reveal style="--r:${[-1, 1, -0.5, 0.7][i % 4]}deg">
  <div class="flip" data-flip>
    <article class="face front sticker" style="--bg:${bg}" aria-labelledby="n-${id}">
      ${item.available ? '' : '<p class="soldout-sticker label">Sold out today</p>'}
      <div class="mc-art">${pizzaArt(item.art, item.id)}</div>
      <div class="mc-head"><h3 id="n-${id}">${esc(item.name)}</h3>${priceTag(item.price)}</div>
      <p class="mc-desc">${esc(item.description)}</p>
      <ul class="mc-tags" role="list"><li class="chip chip--white">${CATEGORY[item.category] ?? 'Menu'}</li>${tags}</ul>
      <p class="mc-contains"><strong>Contains:</strong> ${contains}</p>
      <div class="mc-actions">
        <div class="qty" role="group" aria-label="How many ${esc(item.name)}">
          <button class="qty-btn" type="button" data-qty="-1" aria-label="One less ${esc(item.name)}" ${item.available ? '' : 'disabled'}>−</button>
          <output class="qty-n" data-qty-n aria-live="polite">0</output>
          <button class="qty-btn" type="button" data-qty="1" aria-label="One more ${esc(item.name)}" ${item.available ? '' : 'disabled'}>+</button>
        </div>
        <button class="btn btn--small btn--white mc-flip" type="button" data-flip-toggle aria-expanded="false" aria-controls="${back}" aria-label="Ingredients and allergens for ${esc(item.name)}">Allergens ${icon('flip')}</button>
        <button class="fave-btn" type="button" data-fave="${id}" aria-pressed="false" aria-label="Add ${esc(item.name)} to favourites">${icon('heart', 'h-off')}${icon('heart-fill', 'h-on')}</button>
      </div>
    </article>
    <article class="face back sticker" id="${back}" aria-label="${esc(item.name)}: ingredients and allergens">
      <h3>${esc(item.name)}</h3>
      <div><p class="label">What's in it</p><ul class="ingredients">${item.ingredients.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div><p class="label">The 14 allergens</p><ul class="allergen-grid" role="list">${allergens}</ul>
        <p class="al-key">● contains &nbsp; ◐ may contain &nbsp; ○ not in the recipe</p></div>
      <button class="btn btn--small btn--yellow" type="button" data-flip-toggle aria-expanded="true" aria-controls="${back}">Flip back ${icon('flip')}</button>
    </article>
  </div>
</li>`;
}

export function matrixRows(items: MenuItem[]) {
  return items.map((i) => `<tr><th scope="row">${esc(i.name)} <small>${price(i.price)}</small></th>${ALLERGENS.map((a) => {
    const s = i.contains.includes(a.key) ? 'yes' : i.mayContain.includes(a.key) ? 'may' : 'no';
    return `<td class="m-${s}">${s === 'yes' ? '<span aria-hidden="true">●</span><span class="sr-only">Contains</span>' : s === 'may' ? '<span aria-hidden="true">◐</span><span class="sr-only">May contain</span>' : '<span class="sr-only">No</span>'}</td>`;
  }).join('')}</tr>`).join('');
}

export function featureCard(item: MenuItem, i: number) {
  return `<li class="fave-card sticker" data-reveal style="--r:${[-2, 1.5, -1][i % 3]}deg"><a href="${u('/menu#m-')}${esc(item.id)}" class="fave-link">
    ${pizzaArt(item.art, item.id, 'fave-art')}
    <span class="fave-name">${esc(item.name)}</span><span class="fave-desc">${esc(item.description)}</span>${priceTag(item.price)}
    ${item.available ? '' : '<span class="chip chip--pink">Sold out today</span>'}</a></li>`;
}
