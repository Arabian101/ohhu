'use strict';

/* ---------- Gedeelde onderdelen (header, footer, winkelwagen) op elke pagina ---------- */
const page = location.pathname.split('/').pop() || 'index.html';
const navLink = (h, t) => `<a href="${h}"${page === h ? ' class="active"' : ''}>${t}</a>`;

document.body.insertAdjacentHTML('afterbegin', `
<svg width="0" height="0" style="position:absolute">
  <symbol id="scissors" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
    <circle cx="28" cy="80" r="12"/><circle cx="72" cy="80" r="12"/><path d="M32 69 L80 6 M68 69 L20 6"/>
  </symbol>
</svg>
<header id="nav">
  <a href="index.html" class="logo">JAEGER</a>
  <nav id="menu">${navLink('collectie.html', 'Collectie')}${navLink('vakmanschap.html', 'Vakmanschap')}${navLink('contact.html', 'Contact')}</nav>
  <button id="cartBtn" aria-label="Winkelwagen">Winkelwagen <span id="cartCount">0</span></button>
  <button id="burger" aria-label="Menu"><span></span><span></span></button>
</header>`);

document.body.insertAdjacentHTML('beforeend', `
<footer>
  <div class="logo">JAEGER</div>
  <p>© <span id="year"></span> JAEGER Professional Scissors · KvK 12345678 · BTW NL001234567B01</p>
  <p><a href="#">Algemene voorwaarden</a> · <a href="#">Privacy</a> · <a href="#">Retourneren</a></p>
</footer>
<div id="overlay"></div>
<aside id="cart" aria-label="Winkelwagen">
  <div class="cart-head"><h3>Winkelwagen</h3><button id="closeCart" aria-label="Sluiten">×</button></div>
  <div id="cartItems"></div>
  <div class="cart-foot">
    <div class="total"><span>Totaal (incl. btw)</span><b id="cartTotal">€ 0,00</b></div>
    <button class="btn" id="checkout">Afrekenen met iDEAL</button>
  </div>
</aside>
<div id="toast"></div>`);

/* ---------- Productdata ---------- */
const products = [
  {id:1, name:'JAEGER Classic 6.0"', cat:'Knipschaar', price:289, tag:'Bestseller', desc:'Offset handvat, VG10-staal en een vlijmscherpe convexe snede. De standaard voor dagelijks gebruik.'},
  {id:2, name:'JAEGER Master 5.5"', cat:'Knipschaar', price:349, tag:'Nieuw', desc:'Compact en extreem gebalanceerd. Ideaal voor precisiewerk en detailsnedes.'},
  {id:3, name:'JAEGER Gold Edition 6.5"', cat:'Knipschaar', price:489, tag:'Limited', desc:'Gepolijst 440C-staal met gouden titanium coating en handgraveerd logo.'},
  {id:4, name:'JAEGER Texturizer 30T', cat:'Effileerschaar', price:259, tag:'', desc:'30 tanden voor zachte overgangen en natuurlijke textuur zonder trekken.'},
  {id:5, name:'JAEGER Thinning 40T', cat:'Effileerschaar', price:269, tag:'', desc:'Verwijdert volume gelijkmatig en soepel. Geslepen voor dik en weerbarstig haar.'},
  {id:6, name:'JAEGER Lefty 6.0"', cat:'Linkshandig', price:299, tag:'', desc:'Echt linkshandig ontworpen, geen gespiegeld model. Voor volledig natuurlijk gebruik.'},
  {id:7, name:'JAEGER Duo Set', cat:'Sets', price:519, tag:'-10%', desc:'Classic 6.0" plus Texturizer 30T in een luxe leren etui met onderhoudsset.'},
  {id:8, name:'JAEGER Onderhoudsset', cat:'Accessoires', price:39, tag:'', desc:'Scharenolie, microvezeldoek en reinigingsdoekje voor een lange levensduur.'}
];

const euro = n => '€ ' + n.toFixed(2).replace('.', ',');
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

/* ---------- Collectie renderen + filter ---------- */
const grid = $('#grid') || document.createElement('div'), filters = $('#filters') || document.createElement('div');
const cats = ['Alles', ...new Set(products.map(p => p.cat))];

filters.innerHTML = cats.map((c, i) => `<button class="${i ? '' : 'on'}" data-cat="${c}">${c}</button>`).join('');

const cardHTML = p => `
    <article class="card reveal">
      <div class="img">${p.tag ? `<span class="tag">${p.tag}</span>` : ''}<svg><use href="#scissors"/></svg></div>
      <div class="body">
        <small class="eyebrow">${p.cat}</small>
        <h3>${p.name}</h3>
        <p>${p.desc}</p>
        <div class="row"><span class="price">${euro(p.price)}</span>
        <button class="add" data-id="${p.id}">In winkelwagen</button></div>
      </div>
    </article>`;

function renderProducts(cat = 'Alles') {
  const list = cat === 'Alles' ? products : products.filter(p => p.cat === cat);
  grid.innerHTML = list.map(cardHTML).join('');
  observe();
}

/* De eerste vier scharen op de homepage */
const featured = $('#featured');
if (featured) featured.innerHTML = products.slice(0, 4).map(cardHTML).join('');
filters.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  $$('button', filters).forEach(x => x.classList.toggle('on', x === b));
  renderProducts(b.dataset.cat);
});

/* ---------- Winkelwagen ---------- */
let cart = [];
try { cart = JSON.parse(localStorage.getItem('jaegerCart')) || []; } catch (e) {}

function saveCart() { try { localStorage.setItem('jaegerCart', JSON.stringify(cart)); } catch (e) {} }

function renderCart() {
  const box = $('#cartItems');
  if (!cart.length) box.innerHTML = '<p class="empty">Je winkelwagen is nog leeg.</p>';
  else box.innerHTML = cart.map(i => {
    const p = products.find(x => x.id === i.id);
    return `<div class="item"><div><b>${p.name}</b><br><small>${euro(p.price)}</small>
      <div class="qty"><button data-act="min" data-id="${p.id}">−</button><span>${i.qty}</span><button data-act="plus" data-id="${p.id}">+</button></div></div>
      <b>${euro(p.price * i.qty)}</b></div>`;
  }).join('');
  const total = cart.reduce((s, i) => s + products.find(p => p.id === i.id).price * i.qty, 0);
  $('#cartTotal').textContent = euro(total);
  $('#cartCount').textContent = cart.reduce((s, i) => s + i.qty, 0);
  saveCart();
}

function changeQty(id, d) {
  const item = cart.find(i => i.id === id);
  if (!item) { if (d > 0) cart.push({id, qty: 1}); }
  else { item.qty += d; if (item.qty <= 0) cart = cart.filter(i => i.id !== id); }
  renderCart();
}

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2200);
}
const toggleCart = open => document.body.classList.toggle('cart-open', open);

document.addEventListener('click', e => {
  const b = e.target.closest('.add'); if (!b) return;
  changeQty(+b.dataset.id, 1); toast('Toegevoegd aan winkelwagen');
});
$('#cartItems').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  changeQty(+b.dataset.id, b.dataset.act === 'plus' ? 1 : -1);
});
$('#cartBtn').onclick = () => toggleCart(true);
$('#closeCart').onclick = $('#overlay').onclick = () => toggleCart(false);
$('#checkout').onclick = () => toast(cart.length ? 'Demo: koppel hier je betaalprovider (bijv. Mollie)' : 'Je winkelwagen is leeg');

/* ---------- Navigatie ---------- */
const nav = $('#nav'), menu = $('#menu');
addEventListener('scroll', () => nav.classList.toggle('solid', scrollY > 50), {passive: true});
$('#burger').onclick = () => menu.classList.toggle('open');
$$('a', menu).forEach(a => a.onclick = () => menu.classList.remove('open'));

/* ---------- Scroll-reveal ---------- */
const io = new IntersectionObserver((entries, o) => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target;
    el.style.transitionDelay = (el.dataset.delay || 0) + 'ms';
    el.classList.add('in'); o.unobserve(el);
    if (el.parentElement.classList.contains('stats')) countUp($('b', el));
  });
}, {threshold: .15});

function observe() {
  $$('.reveal:not(.in)').forEach((el, i) => {
    const sib = [...el.parentElement.children].indexOf(el);
    el.dataset.delay = Math.min(sib, 5) * 120;
    io.observe(el);
  });
}

/* ---------- Tellers ---------- */
function countUp(el) {
  const target = +el.dataset.count, dur = 1600, start = performance.now();
  const suffix = el.hasAttribute('data-plus') ? '+' : el.hasAttribute('data-pct') ? '%' : '';
  (function tick(now) {
    const p = Math.min((now - start) / dur, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString('nl-NL') + suffix;
    if (p < 1) requestAnimationFrame(tick);
  })(start);
}

/* ---------- Contactformulier ---------- */
$('#contactForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target, msg = $('#formMsg'); let ok = true;
  $$('input,textarea', f).forEach(i => {
    const valid = i.value.trim() && (i.type !== 'email' || /^\S+@\S+\.\S+$/.test(i.value));
    i.classList.toggle('bad', !valid); if (!valid) ok = false;
  });
  msg.textContent = ok ? 'Bedankt! We nemen binnen één werkdag contact met je op.' : 'Controleer de gemarkeerde velden.';
  if (ok) f.reset(); // Koppel hier een backend/e-mailservice voor echte verzending
});

/* ---------- Start ---------- */
$('#year').textContent = new Date().getFullYear();
renderProducts();
renderCart();
