// The site can live in a sub-folder (GitHub Pages: /kes-crust-co/). Every internal
// link goes through u() so moving to a custom domain later only means changing `base`.
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
export const u = (path: string) => `${BASE}${path}`;
/** Current page path without the base, ".html" or trailing slash: "/menu", "/" */
export const pagePath = (pathname: string) =>
  pathname.slice(BASE.length).replace(/\.html$/, '').replace(/\/index$/, '').replace(/(.)\/$/, '$1') || '/';
