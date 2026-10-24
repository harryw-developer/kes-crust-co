// Crew admin: name + PIN log-in (checked by the database, with lockout after
// 5 wrong tries), then manage events, menu, enquiries, Crust Club and team.
import { rpc, type EventRow } from '../lib/supabase';
import { esc } from '../lib/render';
import { price } from '../lib/allergens';
import { dateLong } from '../lib/dates';
import { confetti, toast } from './ui';

const $ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s)!;
const TOKEN = 'kes-admin-token';
let token = '';
try { token = sessionStorage.getItem(TOKEN) || ''; } catch {}
const setToken = (t: string) => { token = t; try { t ? sessionStorage.setItem(TOKEN, t) : sessionStorage.removeItem(TOKEN); } catch {} };

// Tell the public pages to skip their one-minute cache after an edit
const bustPublicCache = () => { try { sessionStorage.removeItem('kes-live-dates'); sessionStorage.removeItem('kes-live-menu'); } catch {} };

function show(screen: string) {
  document.querySelectorAll<HTMLElement>('[data-screen]').forEach((s) => (s.hidden = s.dataset.screen !== screen));
  $('[data-logout]').hidden = screen !== 'dash';
  $('[data-who]').hidden = screen !== 'dash';
}

async function call<T = unknown>(fn: string, args: Record<string, unknown> = {}) {
  try {
    return await rpc<T>(fn, { p_token: token, ...args });
  } catch (e: any) {
    if (/not signed in/i.test(e.message)) { setToken(''); toast('Signed out. Log in again.'); boot(); }
    throw e;
  }
}

/* ================= PIN screen ================= */
const pinForm = $<HTMLFormElement>('[data-pin-form]');
const pinInput = $<HTMLInputElement>('[data-pin-input]');
const dots = $('[data-pin-dots]');
const pinError = $('[data-pin-error]');
let setupMode = false;
let confirmPin = '';

function renderDots() {
  const n = pinInput.value.length;
  dots.innerHTML = Array.from({ length: Math.max(4, n) }, (_, i) => `<span class="${i < n ? 'on' : ''}"></span>`).join('');
}
function pinErr(msg: string) {
  pinError.textContent = msg;
  pinError.hidden = !msg;
  if (msg) { dots.classList.remove('is-shake'); void dots.offsetWidth; dots.classList.add('is-shake'); }
}
$('[data-keypad]').addEventListener('click', (e) => {
  const k = (e.target as Element).closest<HTMLElement>('[data-key]')?.dataset.key;
  if (!k) return;
  if (k === 'clear') pinInput.value = '';
  else if (k === 'back') pinInput.value = pinInput.value.slice(0, -1);
  else if (pinInput.value.length < 8) pinInput.value += k;
  pinErr('');
  renderDots();
});
// typing on a keyboard works too
document.addEventListener('keydown', (e) => {
  if ($<HTMLElement>('[data-screen="pin"]').hidden || document.activeElement === $('[data-pin-name]') || document.activeElement === pinInput) return;
  if (/^[0-9]$/.test(e.key) && pinInput.value.length < 8) { pinInput.value += e.key; renderDots(); }
  else if (e.key === 'Backspace') { pinInput.value = pinInput.value.slice(0, -1); renderDots(); }
});
pinInput.addEventListener('input', () => { pinInput.value = pinInput.value.replace(/\D/g, '').slice(0, 8); renderDots(); });

pinForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = $<HTMLInputElement>('[data-pin-name]').value.trim();
  const pin = pinInput.value;
  if (!name) return pinErr('Pop your name in first.');
  if (!/^[0-9]{4,8}$/.test(pin)) return pinErr('PINs are 4 to 8 digits.');
  const btn = $<HTMLButtonElement>('[data-pin-submit]');
  btn.disabled = true;
  try {
    if (setupMode) {
      if (!confirmPin) {
        confirmPin = pin;
        pinInput.value = '';
        renderDots();
        $('[data-pin-label]').textContent = 'Type the same PIN again';
        btn.textContent = 'Create my account';
        return;
      }
      if (confirmPin !== pin) {
        confirmPin = '';
        pinInput.value = '';
        renderDots();
        $('[data-pin-label]').textContent = 'Choose a PIN';
        btn.textContent = 'Next';
        return pinErr("Those PINs didn't match. Try again.");
      }
      const r = await rpc<{ token: string; name: string }>('admin_setup', { p_name: name, p_pin: pin });
      setToken(r.token);
      confetti({ count: 120 });
    } else {
      const r = await rpc<{ token: string; name: string }>('admin_login', { p_name: name, p_pin: pin });
      setToken(r.token);
    }
    pinInput.value = '';
    renderDots();
    boot();
  } catch (err: any) {
    pinInput.value = '';
    renderDots();
    pinErr(err.message || 'That didn’t work.');
  } finally {
    btn.disabled = false;
  }
});

/* ================= Boot ================= */
async function boot() {
  show('loading');
  if (token) {
    try {
      const me = await rpc<{ name: string }>('admin_me', { p_token: token });
      $('[data-who]').textContent = `Hi, ${me.name} 👋`;
      show('dash');
      loadAll();
      return;
    } catch { setToken(''); }
  }
  try {
    const status = await rpc<{ has_admins: boolean }>('admin_status');
    setupMode = !status.has_admins;
  } catch {
    $('[data-screen="loading"]').innerHTML = '<p class="error-msg">Can’t reach the database right now. Check your connection and refresh.</p>';
    return;
  }
  confirmPin = '';
  $('[data-pin-title]').textContent = setupMode ? 'First-time setup' : 'Crew log-in';
  $('[data-pin-help]').textContent = setupMode
    ? 'No accounts yet. Create the first one: your name and a PIN you’ll remember.'
    : 'Type your name, then your PIN.';
  $('[data-pin-label]').textContent = setupMode ? 'Choose a PIN' : 'PIN';
  $('[data-pin-submit]').textContent = setupMode ? 'Next' : 'Let me in';
  renderDots();
  show('pin');
  $<HTMLInputElement>('[data-pin-name]').focus();
}

$('[data-logout]').addEventListener('click', async () => {
  try { await rpc('admin_logout', { p_token: token }); } catch {}
  setToken('');
  toast('Logged out. See you next bake!');
  boot();
});

/* ================= Tabs ================= */
const tabs = [...document.querySelectorAll<HTMLButtonElement>('[data-tab]')];
tabs.forEach((t) => t.addEventListener('click', () => {
  tabs.forEach((x) => x.setAttribute('aria-selected', String(x === t)));
  document.querySelectorAll<HTMLElement>('[data-panel]').forEach((p) => (p.hidden = p.dataset.panel !== t.dataset.tab));
}));

function loadAll() {
  loadEvents(); loadMenu(); loadEnquiries(); loadClub(); loadTeam();
}

/* ================= Events ================= */
const evDialog = $<HTMLDialogElement>('[data-event-dialog]');
const evForm = $<HTMLFormElement>('[data-event-form]');
let events: EventRow[] = [];

async function loadEvents() {
  events = await call<EventRow[]>('admin_list_events');
  const today = new Date().toISOString().slice(0, 10);
  const up = events.filter((e) => e.date >= today);
  const past = events.filter((e) => e.date < today).reverse();
  const row = (e: EventRow) => `<li class="ad-item ${e.date < today ? 'is-past' : ''} ${e.published ? '' : 'is-off'}">
    <div class="ad-item-main"><strong>${esc(e.name)}${e.published ? '' : '<span class="ad-pill ad-pill--pink">Hidden</span>'}</strong>
    <small>${dateLong(e.date)} · ${e.start_time.slice(0, 5)}–${e.end_time.slice(0, 5)}${e.area ? ` · ${esc(e.area)}` : ''}</small></div>
    <button class="btn btn--small btn--white" type="button" data-edit-event="${e.id}">Edit</button>
    <button class="btn btn--small btn--white" type="button" data-del-event="${e.id}">Delete</button></li>`;
  $('[data-events-list]').innerHTML =
    (up.length ? `<ul class="ad-list" role="list">${up.map(row).join('')}</ul>` : `<p class="ad-empty">No upcoming events. The site is showing “Oven’s cooling for now”. Add one when you’ve got a date!</p>`) +
    (past.length ? `<h3 class="ad-subhead">Past events</h3><ul class="ad-list" role="list">${past.map(row).join('')}</ul>` : '');
}

function openEvent(e?: EventRow) {
  evForm.reset();
  $('[data-event-title]', evDialog).textContent = e ? 'Edit event' : 'New event';
  const f = evForm.elements as any;
  f.id.value = e?.id ?? '';
  f.name.value = e?.name ?? '';
  f.date.value = e?.date ?? '';
  f.start_time.value = e?.start_time?.slice(0, 5) ?? '12:00';
  f.end_time.value = e?.end_time?.slice(0, 5) ?? '17:00';
  f.area.value = e?.area ?? '';
  f.address.value = e?.address ?? '';
  f.note.value = e?.note ?? '';
  f.published.checked = e ? !!e.published : true;
  $('[data-form-error]', evForm).hidden = true;
  evDialog.showModal();
}
$('[data-new-event]').addEventListener('click', () => openEvent());
$('[data-events-list]').addEventListener('click', async (ev) => {
  const t = ev.target as HTMLElement;
  const edit = t.closest<HTMLElement>('[data-edit-event]')?.dataset.editEvent;
  const del = t.closest<HTMLElement>('[data-del-event]')?.dataset.delEvent;
  if (edit) openEvent(events.find((e) => e.id === edit));
  if (del) {
    const e = events.find((x) => x.id === del);
    if (!confirm(`Delete “${e?.name}”? This can't be undone.`)) return;
    await call('admin_delete_event', { p_id: del });
    bustPublicCache();
    toast('Event deleted');
    loadEvents();
  }
});
evForm.addEventListener('submit', async (e) => {
  const submitter = (e as SubmitEvent).submitter as HTMLButtonElement | null;
  if (submitter?.value !== 'save') return;
  e.preventDefault();
  const f = evForm.elements as any;
  const err = $('[data-form-error]', evForm);
  if (f.end_time.value <= f.start_time.value) { err.textContent = 'The end time needs to be after the start time.'; err.hidden = false; return; }
  try {
    await call('admin_save_event', { p_event: {
      id: f.id.value || undefined, name: f.name.value.trim(), date: f.date.value, start_time: f.start_time.value, end_time: f.end_time.value,
      area: f.area.value.trim(), address: f.address.value.trim(), note: f.note.value.trim(), published: f.published.checked,
    } });
    evDialog.close();
    bustPublicCache();
    toast(f.id.value ? 'Event updated 🔥' : 'Event added 🔥');
    if (!f.id.value) confetti({ count: 80 });
    loadEvents();
  } catch (ex: any) {
    err.textContent = ex.message; err.hidden = false;
  }
});

/* ================= Menu ================= */
type Row = { id: string; category: string; name: string; price: number | string; description: string; ingredients: string[]; tags: string[]; contains: string[]; may_contain: string[]; available: boolean; sort: number; art: any };
const itDialog = $<HTMLDialogElement>('[data-item-dialog]');
const itForm = $<HTMLFormElement>('[data-item-form]');
let menu: Row[] = [];

async function loadMenu() {
  const { select } = await import('../lib/supabase');
  menu = await select<Row[]>('menu_items?select=*&order=sort.asc,name.asc');
  $('[data-menu-list]').innerHTML = menu.length ? `<ul class="ad-list" role="list">${menu.map((m) => `<li class="ad-item ${m.available ? '' : 'is-off'}">
    <div class="ad-item-main"><strong>${esc(m.name)}${m.available ? '' : '<span class="ad-pill ad-pill--pink">Sold out</span>'}</strong><small>${esc(m.category)} · ${price(Number(m.price))}</small></div>
    <label class="check"><input type="checkbox" data-toggle-available="${m.id}" ${m.available ? 'checked' : ''}/> Available</label>
    <button class="btn btn--small btn--white" type="button" data-edit-item="${m.id}">Edit</button>
    <button class="btn btn--small btn--white" type="button" data-del-item="${m.id}">Delete</button></li>`).join('')}</ul>` : '<p class="ad-empty">Nothing on the menu yet.</p>';
}

function syncArtFields() {
  const cat = (itForm.elements as any).category.value;
  $('[data-art-pizza]', itForm).hidden = cat === 'drink';
  $('[data-art-can]', itForm).hidden = cat !== 'drink';
}
(itForm.elements as any).category.addEventListener('change', syncArtFields);

function openItem(m?: Row) {
  itForm.reset();
  const f = itForm.elements as any;
  $('[data-item-title]', itDialog).textContent = m ? `Edit ${m.name}` : 'New item';
  f.id.value = m?.id ?? '';
  f.name.value = m?.name ?? '';
  f.price.value = m ? Number(m.price).toFixed(2) : '';
  f.category.value = m?.category ?? 'pizza';
  f.sort.value = m?.sort ?? (menu.length + 1) * 10;
  f.description.value = m?.description ?? '';
  f.ingredients.value = (m?.ingredients ?? []).join('\n');
  itForm.querySelectorAll<HTMLInputElement>('[name="tag"]').forEach((c) => (c.checked = !!m?.tags.includes(c.value)));
  itForm.querySelectorAll<HTMLSelectElement>('select[name^="al-"]').forEach((s) => {
    const k = s.name.slice(3);
    s.value = m?.contains.includes(k) ? 'yes' : m?.may_contain.includes(k) ? 'may' : 'no';
  });
  const art = m?.art ?? {};
  f.art_sauce.value = art.sauce ?? 'tomato';
  f.art_cheese.checked = art.cheese ?? true;
  f.art_topping.value = art.toppings?.[0]?.[0] ?? '';
  f.art_can.value = art.can ?? '#C9CED6';
  f.art_band.value = art.band ?? '#E41E2B';
  f.available.checked = m ? m.available : true;
  $('[data-form-error]', itForm).hidden = true;
  syncArtFields();
  itDialog.showModal();
}
$('[data-new-item]').addEventListener('click', () => openItem());
$('[data-menu-list]').addEventListener('click', async (ev) => {
  const t = ev.target as HTMLElement;
  const edit = t.closest<HTMLElement>('[data-edit-item]')?.dataset.editItem;
  const del = t.closest<HTMLElement>('[data-del-item]')?.dataset.delItem;
  if (edit) openItem(menu.find((m) => m.id === edit));
  if (del) {
    const m = menu.find((x) => x.id === del);
    if (!confirm(`Remove “${m?.name}” from the menu?`)) return;
    await call('admin_delete_menu_item', { p_id: del });
    bustPublicCache();
    toast('Removed from the menu');
    loadMenu();
  }
});
$('[data-menu-list]').addEventListener('change', async (ev) => {
  const box = (ev.target as HTMLElement).closest<HTMLInputElement>('[data-toggle-available]');
  if (!box) return;
  const m = menu.find((x) => x.id === box.dataset.toggleAvailable)!;
  await call('admin_save_menu_item', { p_item: { ...m, available: box.checked } });
  bustPublicCache();
  toast(box.checked ? `${m.name} is back on` : `${m.name} marked sold out`);
  loadMenu();
});
itForm.addEventListener('submit', async (e) => {
  const submitter = (e as SubmitEvent).submitter as HTMLButtonElement | null;
  if (submitter?.value !== 'save') return;
  e.preventDefault();
  const f = itForm.elements as any;
  const err = $('[data-form-error]', itForm);
  const priceVal = Number(String(f.price.value).replace('£', ''));
  if (!Number.isFinite(priceVal) || priceVal < 0) { err.textContent = 'Price should look like 4.00'; err.hidden = false; return; }
  const contains: string[] = [], may: string[] = [];
  itForm.querySelectorAll<HTMLSelectElement>('select[name^="al-"]').forEach((s) => {
    if (s.value === 'yes') contains.push(s.name.slice(3));
    if (s.value === 'may') may.push(s.name.slice(3));
  });
  const cat = f.category.value;
  const old = menu.find((m) => m.id === f.id.value);
  const art = cat === 'drink'
    ? { can: f.art_can.value, band: f.art_band.value }
    : { sauce: f.art_sauce.value, cheese: f.art_cheese.checked, toppings: f.art_topping.value ? [[f.art_topping.value, old?.art?.toppings?.[0]?.[0] === f.art_topping.value ? old.art.toppings[0][1] : 7]] : [] };
  try {
    await call('admin_save_menu_item', { p_item: {
      id: f.id.value || undefined, name: f.name.value.trim(), price: priceVal, category: cat, sort: Number(f.sort.value) || 0,
      description: f.description.value.trim(),
      ingredients: f.ingredients.value.split('\n').map((x: string) => x.trim()).filter(Boolean),
      tags: [...itForm.querySelectorAll<HTMLInputElement>('[name="tag"]:checked')].map((c) => c.value),
      contains, may_contain: may, available: f.available.checked, art,
    } });
    itDialog.close();
    bustPublicCache();
    toast('Menu saved 🍕');
    loadMenu();
  } catch (ex: any) {
    err.textContent = ex.message; err.hidden = false;
  }
});

/* ================= Enquiries ================= */
type Enq = { id: string; occasion: string; event_date: string | null; guests: string; location: string; details: string; name: string; email: string; phone: string; crust_club: boolean; handled: boolean; created_at: string };
let enquiries: Enq[] = [];
async function loadEnquiries() {
  enquiries = await call<Enq[]>('admin_list_enquiries');
  const open = enquiries.filter((e) => !e.handled).length;
  const badge = $('[data-badge-enquiries]');
  badge.textContent = String(open);
  badge.hidden = open === 0;
  $('[data-enquiries-list]').innerHTML = enquiries.length ? `<ul class="ad-list" role="list">${enquiries.map((e) => `<li class="ad-item ad-enq ${e.handled ? 'is-off' : ''}">
    <div class="ad-item-main"><strong>${esc(e.occasion)} · ${esc(e.name)}${e.handled ? '<span class="ad-pill ad-pill--green">Replied</span>' : '<span class="ad-pill">New</span>'}</strong>
      <small>Sent ${new Date(e.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</small>
      <dl><dt>When</dt><dd>${e.event_date ? dateLong(e.event_date) : '—'}</dd><dt>Guests</dt><dd>${esc(e.guests) || '—'}</dd><dt>Where</dt><dd>${esc(e.location)}</dd>
      <dt>Email</dt><dd><a href="mailto:${esc(e.email)}?subject=${encodeURIComponent('Your KES Crust Co. enquiry')}">${esc(e.email)}</a></dd>
      ${e.phone ? `<dt>Phone</dt><dd><a href="tel:${esc(e.phone)}">${esc(e.phone)}</a></dd>` : ''}
      ${e.details ? `<dt>Notes</dt><dd>${esc(e.details)}</dd>` : ''}</dl></div>
    <button class="btn btn--small btn--white" type="button" data-handled="${e.id}">${e.handled ? 'Mark as new' : 'Mark replied'}</button>
    <button class="btn btn--small btn--white" type="button" data-del-enq="${e.id}">Delete</button></li>`).join('')}</ul>` : '<p class="ad-empty">No enquiries yet. They’ll land here when someone fills in the form on the Events page.</p>';
}
$('[data-enquiries-list]').addEventListener('click', async (ev) => {
  const t = ev.target as HTMLElement;
  const h = t.closest<HTMLElement>('[data-handled]')?.dataset.handled;
  const d = t.closest<HTMLElement>('[data-del-enq]')?.dataset.delEnq;
  if (h) { const e = enquiries.find((x) => x.id === h)!; await call('admin_set_enquiry_handled', { p_id: h, p_handled: !e.handled }); loadEnquiries(); }
  if (d && confirm('Delete this enquiry? This can’t be undone.')) { await call('admin_delete_enquiry', { p_id: d }); toast('Enquiry deleted'); loadEnquiries(); }
});

/* ================= Crust Club ================= */
type Sub = { id: string; email: string; source: string; created_at: string };
let subs: Sub[] = [];
async function loadClub() {
  subs = await call<Sub[]>('admin_list_subscribers');
  $('[data-club-list]').innerHTML = subs.length ? `<p style="margin-bottom:10px"><strong>${subs.length}</strong> member${subs.length === 1 ? '' : 's'}</p><ul class="ad-list" role="list">${subs.map((s) => `<li class="ad-item">
    <div class="ad-item-main"><strong style="font-size:1.05rem">${esc(s.email)}</strong><small>Joined ${new Date(s.created_at).toLocaleDateString('en-GB')} · via ${esc(s.source)}</small></div>
    <button class="btn btn--small btn--white" type="button" data-del-sub="${s.id}">Remove</button></li>`).join('')}</ul>` : '<p class="ad-empty">No Crust Club members yet.</p>';
}
$('[data-club-list]').addEventListener('click', async (ev) => {
  const d = (ev.target as HTMLElement).closest<HTMLElement>('[data-del-sub]')?.dataset.delSub;
  if (d && confirm('Remove this email from the Crust Club?')) { await call('admin_delete_subscriber', { p_id: d }); toast('Removed'); loadClub(); }
});
$('[data-copy-emails]').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(subs.map((s) => s.email).join(', ')); toast(`Copied ${subs.length} emails`); } catch { toast('Couldn’t copy, try the CSV'); }
});
$('[data-csv]').addEventListener('click', () => {
  const csv = ['email,joined,source', ...subs.map((s) => `${s.email},${s.created_at.slice(0, 10)},${s.source}`)].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: 'crust-club.csv' });
  a.dataset.noWipe = '';
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
});

/* ================= Team ================= */
type Admin = { id: string; name: string; created_at: string };
async function loadTeam() {
  const [team, me] = await Promise.all([call<Admin[]>('admin_list_admins'), call<{ id: string }>('admin_me')]);
  $('[data-team-list]').innerHTML = `<ul class="ad-list" role="list">${team.map((a) => `<li class="ad-item">
    <div class="ad-item-main"><strong>${esc(a.name)}${a.id === me.id ? '<span class="ad-pill ad-pill--green">You</span>' : ''}</strong><small>Since ${new Date(a.created_at).toLocaleDateString('en-GB')}</small></div>
    ${a.id === me.id ? '' : `<button class="btn btn--small btn--white" type="button" data-del-admin="${a.id}" data-name="${esc(a.name)}">Remove</button>`}</li>`).join('')}</ul>`;
}
$('[data-team-list]').addEventListener('click', async (ev) => {
  const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-del-admin]');
  if (b && confirm(`Remove ${b.dataset.name}? They won't be able to log in any more.`)) { await call('admin_remove_admin', { p_id: b.dataset.delAdmin }); toast('Removed'); loadTeam(); }
});
$<HTMLFormElement>('[data-add-admin]').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.currentTarget as HTMLFormElement;
  const f = form.elements as any;
  try {
    await call('admin_add_admin', { p_name: f.name.value.trim(), p_pin: f.pin.value });
    toast(`${f.name.value.trim()} can now log in 🎉`);
    form.reset();
    loadTeam();
  } catch (ex: any) { toast(ex.message); }
});
$<HTMLFormElement>('[data-change-pin]').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.currentTarget as HTMLFormElement;
  const f = form.elements as any;
  try {
    const r = await call<{ token: string }>('admin_change_pin', { p_old: f.old.value, p_new: f.new.value });
    setToken(r.token);
    toast('PIN changed. Don’t forget it!');
    form.reset();
  } catch (ex: any) { toast(ex.message); }
});

boot();
