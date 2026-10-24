# KES Crust Co. website

Three friends. One mission: awesome pizza.

Built with [Astro](https://astro.build) (fast static pages) plus a [Supabase](https://supabase.com) database, so **events, menu, enquiries and Crust Club sign-ups are all live**. Edit them at `/admin` and the site updates straight away, with no rebuild.

## Run it on your computer

```bash
npm install
npm run dev
```

Then open http://localhost:4321. `npm run build` makes the finished site in `dist/`.

## The admin area: `/admin`

- **First time:** the page shows "First-time setup". Type your name and choose a PIN, then type it again to confirm. This only works once; after that, it's a normal log-in.
- **Log in:** name + PIN on the keypad. Five wrong PINs locks that name for 15 minutes.
- **Events:** add, edit, hide or delete dates. Past ones drop off the site automatically.
- **Menu:** prices, descriptions, allergens, "sold out today", and new items.
- **Enquiries:** booking requests from the Events page. Mark them replied once you have.
- **Crust Club:** mailing-list emails. Copy them all, or download a CSV.
- **Team:** add the other two crew members (each with their own PIN), change your PIN, remove people.

PINs are stored scrambled (bcrypt) inside the database and checked there; they're never in the website code.

## Where things live

| What | Where |
| --- | --- |
| Logo (original file, only trimmed/resized) | `public/brand/`, regenerate sizes with `node scripts/make-brand-assets.mjs` |
| Email, phone, Instagram handle | `src/data/site.json` (**placeholders: replace these**) |
| About page story and crew bios | `src/data/about.json` (**placeholders: add your names**) |
| Backup copy of the menu (used only if the database is unreachable during a build) | `src/data/menu.json` |
| Colours, fonts, buttons | `src/styles/global.css` |
| Database connection (public key, safe to publish) | `src/lib/supabase.ts` |

Supabase project: **KES Crust Co** (London region, free plan), in Harry's Org.

## Before you go live

1. **Check every allergen** on the menu against your real recipes and suppliers (Admin → Menu → Edit).
2. Replace the placeholder email, phone and Instagram in `src/data/site.json`, and the crew bios in `src/data/about.json`.
3. Hosting: GitHub Pages at https://harryw-developer.github.io/kes-crust-co/ . After code or design changes, run `npm run deploy` to publish. Menu and date edits in `/admin` are live straight away and don't need a push.
4. Own domain later? Set `url` in `src/data/site.json` to it, update `public/robots.txt`, and add the domain under the repo's Settings → Pages.
5. Optional: set `plausibleDomain` in `site.json` for cookie-free visitor stats.
6. Free Supabase projects pause after a week with no traffic. Visiting the site wakes it, but upgrade if you want it always-on.
