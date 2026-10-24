// Build-time snapshot: live from Supabase, falling back to the bundled copies.
// The browser refreshes this with live data on every visit (see scripts/live.ts).
import { loadMenu, loadPitches, type MenuItem } from './supabase';
import { upcoming, type Pitch } from './dates';
import datesFallback from '../data/dates.json';
import menuFallback from '../data/menu.json';

let pitches: Promise<Pitch[]> | undefined;
let menu: Promise<MenuItem[]> | undefined;

export const getPitches = () =>
  (pitches ??= loadPitches().catch((e) => {
    console.warn('[kes] using fallback dates:', e.message);
    return datesFallback.dates as Pitch[];
  }).then((d) => upcoming(d)));

export const getMenu = () =>
  (menu ??= loadMenu().catch((e) => {
    console.warn('[kes] using fallback menu:', e.message);
    return menuFallback.items as MenuItem[];
  }));

export const kitchenNote = menuFallback.kitchenNote;
