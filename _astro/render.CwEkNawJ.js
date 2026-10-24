import{c as e,i as t,l as n,n as r,o as i,r as a,t as o,u as s}from"./dates.Cw6frSIA.js";import{t as c}from"./paths.Be6asBA4.js";import{i as l,t as u}from"./toppings.Ca-xUnz9.js";var d=[{key:`celery`,label:`Celery`},{key:`gluten`,label:`Cereals containing gluten`},{key:`crustaceans`,label:`Crustaceans`},{key:`eggs`,label:`Eggs`},{key:`fish`,label:`Fish`},{key:`lupin`,label:`Lupin`},{key:`milk`,label:`Milk`},{key:`molluscs`,label:`Molluscs`},{key:`mustard`,label:`Mustard`},{key:`nuts`,label:`Tree nuts`},{key:`peanuts`,label:`Peanuts`},{key:`sesame`,label:`Sesame`},{key:`soya`,label:`Soya`},{key:`sulphites`,label:`Sulphur dioxide / sulphites`}],f={gluten:`Gluten`,nuts:`Tree nuts`,sulphites:`Sulphites`},p=(e,t=!1)=>t&&f[e]||d.find(t=>t.key===e)?.label||e,m={veggie:{label:`Veggie`,colour:`green`},vegan:{label:`Vegan`,colour:`green`},spicy:{label:`Spicy`,colour:`orange`}},h=e=>`£${Number.isInteger(e)?e:e.toFixed(2)}`,g=e=>String(e??``).replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e]),_=(e,t=``,n=!1)=>`<svg class="icon ${t}" aria-hidden="true" focusable="false"><use href="#${n?`t`:`i`}-${e}"/></svg>`,v=e=>e.toFixed(1);function y(e={},t,n=``){let r=l(t);if(e.can)return b(e,n);let i=`<circle cx="100" cy="100" r="95" fill="#E9B36A" stroke="#111" stroke-width="4"/>`;for(let e=0;e<12;e++){let t=e/12*Math.PI*2+r()*.4,n=86+r()*5;i+=`<circle cx="${v(100+Math.cos(t)*n)}" cy="${v(100+Math.sin(t)*n)}" r="${v(1.8+r()*2.6)}" fill="#3B1C0C" opacity="0.75"/>`}if(i+=`<circle cx="100" cy="100" r="79" fill="${u[e.sauce]??u.tomato}" stroke="#B3762F" stroke-width="3"/>`,e.cheese)for(let e=0;e<11;e++){let e=r()*Math.PI*2,t=r()*56;i+=`<circle cx="${v(100+Math.cos(e)*t)}" cy="${v(100+Math.sin(e)*t)}" r="${v(12+r()*10)}" fill="#FFE7A0" opacity="0.95"/>`}let a=Array.isArray(e.toppings)?e.toppings:[],o=a.reduce((e,[,t])=>e+t,0),s=0;for(let[e,t]of a)for(let n=0;n<t;n++){let t=s++,n=t*2.39996+r()*.5,a=14+Math.sqrt((t+.5)/Math.max(o,1))*50+r()*6,c=100+Math.cos(n)*a,l=100+Math.sin(n)*a,u=26+r()*6,d=Math.round(r()*360);i+=`<use href="#t-${g(e)}" x="${v(c-u/2)}" y="${v(l-u/2)}" width="${v(u)}" height="${v(u)}" transform="rotate(${d} ${v(c)} ${v(l)})"/>`}return`<svg class="pizza-art ${n}" viewBox="0 0 200 200" aria-hidden="true" focusable="false">${i}</svg>`}function b(e,t){return`<svg class="pizza-art can-art ${t}" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
    <ellipse cx="100" cy="182" rx="46" ry="8" fill="#111" opacity=".15"/>
    <path d="M60 38c0-10 80-10 80 0v124c0 12-80 12-80 0Z" fill="${/^#[0-9a-f]{3,8}$/i.test(e.can)?e.can:`#C9CED6`}" stroke="#111" stroke-width="4" stroke-linejoin="round"/>
    <path d="M60 86c20 14 60-14 80 0v38c-20-14-60 14-80 0Z" fill="${/^#[0-9a-f]{3,8}$/i.test(e.band)?e.band:`#930037`}" stroke="#111" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="100" cy="36" rx="40" ry="9" fill="#E7E9EE" stroke="#111" stroke-width="4"/>
    <ellipse cx="100" cy="36" rx="12" ry="3.5" fill="#9AA0AA"/>
    <path d="M72 50v100" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".45"/>
    <circle cx="150" cy="40" r="5" fill="#fff" stroke="#111" stroke-width="2"/><circle cx="160" cy="62" r="3.5" fill="#fff" stroke="#111" stroke-width="2"/><circle cx="44" cy="58" r="4" fill="#fff" stroke="#111" stroke-width="2"/>
  </svg>`}var x=e=>`<span class="price">${h(e)}<svg viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true"><path d="M58 6C30 3 6 14 5 31s26 25 50 23 40-12 39-26S70 5 44 9" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg></span>`,S=e=>{let t=l(e),n=``;for(let e=0;e<4;e++){let e=30+t()*100,r=30+t()*100;n+=`<path d="M-10 ${e.toFixed(0)}C80 ${(e+40-t()*80).toFixed(0)} 160 ${(r-40+t()*80).toFixed(0)} 250 ${r.toFixed(0)}" fill="none" stroke="#111" stroke-width="3" stroke-dasharray="${t()>.5?`0`:`8 6`}" stroke-linecap="round"/>`}return`<path d="${`M${(40+t()*40).toFixed(0)} 10C${(100+t()*30).toFixed(0)} 60 ${(20+t()*40).toFixed(0)} 100 ${(110+t()*40).toFixed(0)} 150`}" fill="none" stroke="#7FD3F0" stroke-width="16" stroke-linecap="round"/>${n}`},C=e=>g(JSON.stringify(e));function w(c,l){let u=[`var(--yellow)`,`var(--white)`,`var(--pink)`,`var(--cream)`,`var(--green)`,`var(--orange)`],d=g(c.id),f=`back-${d}`;return`<li class="date-card" id="d-${d}" data-reveal data-start="${t(c.date,c.start)}" data-end="${t(c.date,c.end)}" style="--r:${[-1.2,.8,-.4,1.1][l%4]}deg">
  <div class="flip" data-flip>
    <article class="face front sticker" style="--bg:${u[l%u.length]}" aria-labelledby="t-${d}">
      <div class="dc-top">
        <p class="dc-date" aria-hidden="true"><span class="label">${a(c.date)}</span><strong>${r(c.date)}</strong><span class="label">${n(c.date)}</span></p>
        <div>
          <h3 id="t-${d}"><span class="sr-only">${o(c.date)}: </span>${g(c.name)}</h3>
          <p class="dc-meta">${_(`clock`)} ${s(c)}</p>
          ${c.area?`<p class="dc-meta">${_(`pin`)} ${g(c.area)}</p>`:``}
        </div>
      </div>
      ${c.note?`<p class="dc-note">${g(c.note)}</p>`:``}
      <p class="dc-live label" data-live hidden>Oven's lit · cooking now</p>
      <div class="dc-actions">
        <button class="btn btn--small" type="button" data-flip-toggle aria-expanded="false" aria-controls="${f}">Where's the oven? ${_(`flip`)}</button>
        <button class="btn btn--small btn--white" type="button" data-ics="${C(c)}">Add to calendar ${_(`calendar`)}</button>
      </div>
    </article>
    <article class="face back sticker" id="${f}" aria-label="Map and details for ${g(c.name)}">
      <svg class="dc-map" viewBox="0 20 240 120" aria-hidden="true"><rect y="20" width="240" height="120" fill="#FFF6E8"/>${S(c.id)}
        <circle cx="200" cy="42" r="14" fill="#2BB673" stroke="#111" stroke-width="2.5"/><circle cx="40" cy="122" r="10" fill="#2BB673" stroke="#111" stroke-width="2.5"/>
        <g transform="translate(120 82)"><circle r="26" fill="#FF6B1A" opacity=".25"/><path d="M0 6c-10-12-16-18-16-27a16 16 0 0 1 32 0c0 9-6 15-16 27Z" fill="#930037" stroke="#111" stroke-width="3"/><circle cy="-21" r="6" fill="#FFF6E8"/></g>
      </svg>
      <p class="dc-addr"><strong>${g(c.name)}</strong>${c.address?`<br>${g(c.address)}`:``}</p>
      <p class="dc-meta">${_(`clock`)} ${o(c.date)}, ${s(c)}</p>
      <div class="dc-actions">
        ${c.address?`<a class="btn btn--small" href="${g(e(c))}" target="_blank" rel="noopener">Open in Maps ${_(`pin`)}</a>`:``}
        <button class="btn btn--small btn--white" type="button" data-ics="${C(c)}">Calendar (.ics)</button>
        <a class="btn btn--small btn--white" href="${g(i(c))}" target="_blank" rel="noopener">Google Calendar</a>
        <button class="btn btn--small btn--yellow" type="button" data-flip-toggle aria-expanded="true" aria-controls="${f}">Flip back ${_(`flip`)}</button>
      </div>
    </article>
  </div>
</li>`}function T(e){return`<li class="soon-item sticker" data-reveal><a href="${c(`/find-us#d-`)}${g(e.id)}">
    <span class="soon-date"><span class="label">${a(e.date)}</span><strong>${r(e.date)}</strong><span class="label">${n(e.date)}</span></span>
    <span class="soon-info"><strong>${g(e.name)}</strong><span>${s(e)}${e.area?` · ${g(e.area)}`:``}</span></span>
    ${_(`arrow`,`soon-arrow`)}</a></li>`}var E={pizza:`Pizza`,drink:`Drink`,side:`Side`,sweet:`Sweet`};function D(e,t){let n=g(e.id),r=`menu-back-${n}`,i=[`var(--white)`,`var(--yellow)`,`var(--cream)`,`var(--white)`,`var(--pink)`,`var(--cream)`][t%6],a=e.contains.length?e.contains.map(e=>p(e,!0)).join(`, `):`none of the 14 allergens`,o=e.tags.map(e=>`<li class="chip chip--${m[e]?.colour??`yellow`}">${g(m[e]?.label??e)}</li>`).join(``),s=d.map(t=>{let n=e.contains.includes(t.key)?`yes`:e.mayContain.includes(t.key)?`may`:`no`;return`<li class="al al--${n}"><span aria-hidden="true">${n===`yes`?`●`:n===`may`?`◐`:`○`}</span>${p(t.key,!0)}<span class="sr-only">${n===`yes`?`: contains`:n===`may`?`: may contain`:`: not an ingredient`}</span></li>`}).join(``);return`<li class="menu-card${e.available?``:` is-soldout`}" id="m-${n}" data-item data-id="${n}" data-tags="${g(e.tags.join(` `))}" data-category="${g(e.category)}" data-price="${e.price}" data-name="${g(e.name)}" data-reveal style="--r:${[-1,1,-.5,.7][t%4]}deg">
  <div class="flip" data-flip>
    <article class="face front sticker" style="--bg:${i}" aria-labelledby="n-${n}">
      ${e.available?``:`<p class="soldout-sticker label">Sold out today</p>`}
      <div class="mc-art">${y(e.art,e.id)}</div>
      <div class="mc-head"><h3 id="n-${n}">${g(e.name)}</h3>${x(e.price)}</div>
      <p class="mc-desc">${g(e.description)}</p>
      <ul class="mc-tags" role="list"><li class="chip chip--white">${E[e.category]??`Menu`}</li>${o}</ul>
      <p class="mc-contains"><strong>Contains:</strong> ${a}</p>
      <div class="mc-actions">
        <div class="qty" role="group" aria-label="How many ${g(e.name)}">
          <button class="qty-btn" type="button" data-qty="-1" aria-label="One less ${g(e.name)}" ${e.available?``:`disabled`}>−</button>
          <output class="qty-n" data-qty-n aria-live="polite">0</output>
          <button class="qty-btn" type="button" data-qty="1" aria-label="One more ${g(e.name)}" ${e.available?``:`disabled`}>+</button>
        </div>
        <button class="btn btn--small btn--white mc-flip" type="button" data-flip-toggle aria-expanded="false" aria-controls="${r}" aria-label="Ingredients and allergens for ${g(e.name)}">Allergens ${_(`flip`)}</button>
        <button class="fave-btn" type="button" data-fave="${n}" aria-pressed="false" aria-label="Add ${g(e.name)} to favourites">${_(`heart`,`h-off`)}${_(`heart-fill`,`h-on`)}</button>
      </div>
    </article>
    <article class="face back sticker" id="${r}" aria-label="${g(e.name)}: ingredients and allergens">
      <h3>${g(e.name)}</h3>
      <div><p class="label">What's in it</p><ul class="ingredients">${e.ingredients.map(e=>`<li>${g(e)}</li>`).join(``)}</ul></div>
      <div><p class="label">The 14 allergens</p><ul class="allergen-grid" role="list">${s}</ul>
        <p class="al-key">● contains &nbsp; ◐ may contain &nbsp; ○ not in the recipe</p></div>
      <button class="btn btn--small btn--yellow" type="button" data-flip-toggle aria-expanded="true" aria-controls="${r}">Flip back ${_(`flip`)}</button>
    </article>
  </div>
</li>`}function O(e){return e.map(e=>`<tr><th scope="row">${g(e.name)} <small>${h(e.price)}</small></th>${d.map(t=>{let n=e.contains.includes(t.key)?`yes`:e.mayContain.includes(t.key)?`may`:`no`;return`<td class="m-${n}">${n===`yes`?`<span aria-hidden="true">●</span><span class="sr-only">Contains</span>`:n===`may`?`<span aria-hidden="true">◐</span><span class="sr-only">May contain</span>`:`<span class="sr-only">No</span>`}</td>`}).join(``)}</tr>`).join(``)}function k(e,t){return`<li class="fave-card sticker" data-reveal style="--r:${[-2,1.5,-1][t%3]}deg"><a href="${c(`/menu#m-`)}${g(e.id)}" class="fave-link">
    ${y(e.art,e.id,`fave-art`)}
    <span class="fave-name">${g(e.name)}</span><span class="fave-desc">${g(e.description)}</span>${x(e.price)}
    ${e.available?``:`<span class="chip chip--pink">Sold out today</span>`}</a></li>`}export{D as a,O as i,g as n,T as o,k as r,h as s,w as t};