// fast reload
const $ = s => document.querySelector(s);
const CATS = CONFIG.categories, CV = CONFIG.canvas;
let S, tab = CATS[0].k, PIN = '', poll = null;

/* ---------- warna ---------- */
const rgb = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const shade = (h, f) => hex(rgb(h).map(v => v * f));
const mix = (h, t) => hex(rgb(h).map(v => v + (255 - v) * t));
function evalColor(e, cat, S) {
  const q = e.match(/^(\w+)(?:([*+])([\d.]+))?$/); if (!q) return null;
  const source = q[1] === 'self' ? S[cat.k] : S[q[1]] || S[cat.k];
  const face = q[1] === 'kulit' && source
    ? CATS.find(c => c.k === 'kulit')?.parts[source.s]
    : null;
  const base = face?.color || source.c;
  return !q[2] ? base : q[2] === '*' ? shade(base, +q[3]) : mix(base, +q[3]);
}
function colorize(svg, cat, part, S) {
  if (part.colorOnUserChoice && !S[cat.k].colorSelected) return svg;
  const m = { ...cat.map, ...(part.map || {}) };
  const gradient = S[cat.k].gradient;
  let usesGradient = false;
  const colored = svg.replace(/(fill|stroke|stop-color)="(#[0-9a-fA-F]{6})"/g, (a, at, h) => {
    const e = m[h.toUpperCase()]; const c = e && evalColor(e, cat, S);
    if (c && gradient) {
      usesGradient = true;
      return `${at}="url(#user-${cat.k}-gradient)"`;
    }
    return c ? `${at}="${c}"` : a;
  });
  return usesGradient
    ? `<defs><linearGradient id="user-${cat.k}-gradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${gradient[0]}"/><stop offset="100%" stop-color="${gradient[1]}"/></linearGradient></defs>${colored}`
    : colored;
}

/* ---------- muat SVG dari assets/svg ---------- */
function prep(text, pre) {
  const s = text.replace(/<filter\b[\s\S]*?<\/filter>/g, '').replace(/\s*filter="url\(#[^)]*\)"/g, '');
  const u = x => x.replace(/id="([^"]+)"/g, `id="${pre}$1"`).replace(/url\(#([^)]+)\)/g, `url(#${pre}$1)`).replace(/\b(href|xlink:href)="#([^"]+)"/g, `$1="#${pre}$2"`);
  const defs = (s.match(/<defs>[\s\S]*?<\/defs>/g) || []).join('');
  const body = s.replace(/<defs>[\s\S]*?<\/defs>/g, '').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim();
  return { defs: u(defs), body: u(body) };
}

// ini perlu dinaikin V nya setiap berubah di assets
async function loadAll() {
  const V = 3; // naikkan angka ini setiap kali ada file di assets/svg yang diganti
  let n = 0;
  // ,done = 0;
  const jobs = [];
  for (const c of CATS) for (const p of c.parts) if (p && !p.solid) jobs.push([c, p]);
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;left:0;right:0;top:0;padding:8px 12px;font:14px system-ui;background:#6C4DFF;color:#fff;z-index:99';
  // bar.textContent = 'Memuat 0/' + jobs.length;
  document.body.appendChild(bar);
  const one = async ([c, p]) => {
    const r = await fetch('assets/svg/' + p.file + '?v=' + V);
    if (!r.ok) throw new Error('File tidak ditemukan: assets/svg/' + p.file);
    const t = `translate(${p.x || 0} ${p.y || 0})` + (p.scale ? ` scale(${p.scale})` : '');
    const wrap = x => `<g transform="${t}">${x}</g>`, z = p.z ?? c.z;
    if (/\.(png|jpe?g|webp)$/i.test(p.file)) {
      const blob = await r.blob();
      const dataUrl = await new Promise(res => { const fr = new FileReader(); fr.onloadend = () => res(fr.result); fr.readAsDataURL(blob); });
      const w = p.w || CV.w, h = p.h || CV.h;
      p.layers = [{ z, svg: wrap(`<image href="${dataUrl}" width="${w}" height="${h}" preserveAspectRatio="${p.fit || 'xMidYMid slice'}"/>`) }];
      return;
    }
    const raw = await r.text();
    if (!p.color) {
      const cm = raw.match(/<linearGradient id="paint0_linear[^"]*"[^>]*>[\s\S]*?<stop[^>]*stop-color="(#[0-9a-fA-F]{6})"[^>]*\/?>[\s\S]*?(?:<stop[^>]*stop-color="(#[0-9a-fA-F]{6})"[^>]*\/?>)?[\s\S]*?<\/linearGradient>/i)
        || raw.match(/stop-color="(#[0-9a-fA-F]{6})"/i)
        || raw.match(/fill="(#[0-9a-fA-F]{6})"/i);
      if (cm) p.color = cm[2] || cm[1];
    }
    const { defs, body } = prep(raw, 'p' + (n++) + '_');
    if (p.backPaths) {
      const backPaths = new Set(p.backPaths);
      const els = body.match(/<path\b[^>]*\/>/g) || [];
      const back = els.filter((_, i) => backPaths.has(i)).join('');
      const front = els.filter((_, i) => !backPaths.has(i)).join('');
      p.layers = [
        ...(back ? [{ z: p.backZ ?? 0, svg: wrap(defs + back) }] : []),
        ...(front ? [{ z, svg: wrap(front) }] : []),
      ];
    } else if (p.backFirst) {
      const els = body.match(/<path\b[^>]*\/>/g);
      p.layers = [{ z: p.backZ ?? 0, svg: wrap(defs + els[0]) }, { z, svg: wrap(els.slice(1).join('')) }];
    } else p.layers = [{ z, svg: wrap(defs + body) }];
  };
  let i = 0;
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (i < jobs.length) { await one(jobs[i++]);}
      // bar.textContent = 'Memuat ' + (++done) + '/' + jobs.length; }
  }));
  bar.remove();
}

/* ---------- render ---------- */
function svgStr(S, uid, crop, attr) {
  const L = [], backgrounds = [];
  for (const c of CATS) {
    const p = c.parts[S[c.k].s];
    const target = c.k === 'bg' ? backgrounds : L;
    if (p?.solid) target.push({ z: p.z ?? c.z, svg: `<rect x="0" y="0" width="${CV.w}" height="${CV.h}" fill="${S[c.k].c}"/>` });
    else if (p) p.layers.forEach(l => target.push({ z: l.z, svg: colorize(l.svg, c, p, S) }));
  }
  const sortedSvg = layers => layers.sort((a, b) => a.z - b.z).map(l => l.svg).join('');
  const scale = CONFIG.characterScale ?? 1;
  const cx = CV.w / 2, cy = CV.h / 2;
  let b = sortedSvg(backgrounds)
  // buat geser karakter
    + `<g transform="translate(${cx + 20} ${cy+22}) scale(${scale}) translate(${-cx} ${-cy})">${sortedSvg(L)}</g>`;
  if (uid) b = b.replace(/id="([^"]+)"/g, `id="${uid}$1"`).replace(/url\(#([^)]+)\)/g, `url(#${uid}$1)`).replace(/\b(href|xlink:href)="#([^"]+)"/g, `$1="#${uid}$2"`);
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${crop || `0 0 ${CV.w} ${CV.h}`}" ${attr || ''}>${b}</svg>`;
}
const initState = () => Object.fromEntries(CATS.map(c => { const s = c.default || 0, p = c.parts?.[s]; return [c.k, { s, c: (p && p.color) || c.color, gradient: null, colorSelected: false }]; }));
const draw = () => { $('#prev').innerHTML = svgStr(S, 'pv'); if (AVS.length) renderAvs(); };

/* ---------- panel ---------- */
function panel() {
  const C = CATS.find(c => c.k === tab), many = C.parts.length > 1;
  $('#tabs').innerHTML = CATS.map(c => `<button class="${c.k === tab ? 'on' : ''}" data-t="${c.k}">${c.t}</button>`).join('');
  $('#ttl').textContent = many ? 'Pilih model ' + C.t.toLowerCase() : 'Warna ' + C.t.toLowerCase();
  $('#opts').innerHTML = many ? C.parts.map((p, i) => {
    const uid = `t${C.k.replace(/[^a-zA-Z0-9_-]/g, '-')}${i}`;
    const pState = p?.color ? { ...S[C.k], s: i, c: p.color } : { ...S[C.k], s: i };
    const previewCrop = p?.previewCrop || C.crop;
    const inner = p ? svgStr({ ...S, [C.k]: pState }, uid, previewCrop) : '🚫';
    return `<button class="opt ${p ? '' : 'none'} ${S[C.k].s === i ? 'on' : ''}" data-i="${i}">${inner}<span>${p ? p.name : 'Tanpa'}</span></button>`;
  }).join('') : '';

  const selectedPart = C.parts[S[C.k].s];
  const hasSolidParts = C.parts.some(p => p?.solid);
  const hasColor = !selectedPart?.hideColor && Array.isArray(C.palette) && C.palette.length > 0
    && (!hasSolidParts || selectedPart?.solid);
  const colHeading = $('#cols').previousElementSibling;
  if (colHeading) colHeading.style.display = hasColor ? '' : 'none';
  $('#cols').style.display = hasColor ? '' : 'none';
  if (!hasColor) { $('#cols').innerHTML = ''; return; }
  
  const cur = S[C.k].c.toLowerCase();
  const colorActive = !C.parts.some(p => p && p.colorOnUserChoice) || S[C.k].colorSelected;
  const frontHair = C.k === 'rambut belakang' ? S['rambut depan'] : null;
  $('#cols').innerHTML = C.palette.map((choice, i) => {
    const isGradient = typeof choice !== 'string';
    const selected = isGradient
      ? JSON.stringify(S[C.k].gradient) === JSON.stringify(choice.colors)
      : !S[C.k].gradient && choice.toLowerCase() === cur;
      const frontSelected = frontHair && (isGradient
      ? JSON.stringify(frontHair.gradient) === JSON.stringify(choice.colors)
      : !frontHair.gradient && choice.toLowerCase() === frontHair.c.toLowerCase());
    const background = isGradient ? `linear-gradient(135deg,${choice.colors.join(',')})` : choice;
    const label = isGradient ? choice.name : choice;
    const frontMark = frontSelected ? '<span class="sw-front-mark" aria-hidden="true"></span>' : '';
    const frontLabel = frontSelected ? ' (dipakai rambut depan)' : '';
    return `<button class="sw ${colorActive && selected ? 'on' : ''} ${frontSelected ? 'front-selected' : ''}" style="background:${background}" data-p="${i}" title="${label}${frontLabel}" aria-label="${label}${frontLabel}">${frontMark}</button>`;
  }).join('');
}
$('#tabs').onclick = e => { const t = e.target.closest('[data-t]'); if (t) { tab = t.dataset.t; panel(); } };
$('#opts').onclick = e => { const o = e.target.closest('[data-i]'); if (o) { const i = +o.dataset.i; S[tab].s = i; const p = CATS.find(c => c.k === tab).parts[i]; if (p && p.color) { S[tab].c = p.color; S[tab].gradient = null; } draw(); panel(); } };
$('#cols').onclick = e => {
  const swatch = e.target.closest('[data-p]');
  if (!swatch) return;
  const choice = CATS.find(c => c.k === tab).palette[+swatch.dataset.p];
  S[tab].gradient = typeof choice === 'string' ? null : choice.colors;
  if (typeof choice === 'string') S[tab].c = choice;
  else S[tab].c = choice.colors[0];
  S[tab].colorSelected = true;
  draw(); panel();
};
$('#rst').onclick = () => { S = AVS[cur].s = initState(); draw(); panel(); };
$('#rnd').onclick = () => {
  const r = a => a[Math.random() * a.length | 0];
  CATS.forEach(c => {
    if (c.palette && c.palette.length) { const choice = r(c.palette);
    S[c.k].gradient = typeof choice === 'string' ? null : choice.colors;
    S[c.k].c = typeof choice === 'string' ? choice : choice.colors[0];
    S[c.k].colorSelected = true; }
    if (c.parts.length > 1) S[c.k].s = c.rare ? (Math.random() < .25 ? 1 : 0)
      : c.parts[0] === null ? 1 + Math.floor(Math.random() * (c.parts.length - 1)) : Math.floor(Math.random() * c.parts.length);
  });
  draw(); panel();
};

/* ---------- simpan ke server (folder hasil/) ---------- */
const toPNG = (svg, w = 1388) => new Promise((resolve, reject) => {
  const image = new Image();
  const svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  let settled = false;
  const finish = (callback, value) => {
    if (settled) return;
    settled = true;
    clearTimeout(timeout);
    URL.revokeObjectURL(svgUrl);
    callback(value);
  };
  const timeout = setTimeout(() => finish(reject, new Error('Pembuatan PNG terlalu lama.')), 30000);
  image.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = Math.round(w * CV.h / CV.w);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas tidak dapat dibuat.');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(pngBlob => {
        if (!pngBlob || !pngBlob.size) {
          finish(reject, new Error('Browser gagal menghasilkan file PNG.'));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result !== 'string' || !reader.result.startsWith('data:image/png;base64,')) {
            finish(reject, new Error('Hasil konversi PNG tidak valid.'));
            return;
          }
          finish(resolve, reader.result);
        };
        reader.onerror = () => finish(reject, new Error('PNG gagal dibaca setelah dibuat.'));
        reader.readAsDataURL(pngBlob);
      }, 'image/png');
    } catch (e) {
      finish(reject, e);
    }
  };
  image.onerror = () => finish(reject, new Error('SVG gagal dirender menjadi PNG.'));
  image.src = svgUrl;
});
/* ---------- PESANAN: data diri, banyak avatar, charm, ringkasan, tiket ---------- */
let PRICE = 25000, CHARM = 3000, MAXAV = 5, SETTINGS_OPEN = true;
const SB_URL = 'https://njndbvyaoubvhmoydile.supabase.co';
const SB_KEY = 'sb_publishable_FXs9NU8WRLOoFvc-u76HcA_LfbB4ID2'; // kunci publishable memang boleh terlihat publik. JANGAN PERNAH menaruh secret key di file ini.
let tok = ''; try { tok = sessionStorage.getItem('mimo_tok') || ''; } catch (e) {}
const sb = (path, opt = {}) => fetch(SB_URL + path, { ...opt, headers: { apikey: SB_KEY, 'Content-Type': 'application/json', ...(opt.auth && tok ? { Authorization: 'Bearer ' + tok } : {}), ...(opt.headers || {}) } });
async function loadSettings() {
  let r; try { r = await sb('/rest/v1/settings?select=open,price,charm_price,max_avatars&id=eq.1'); } catch (e) { throw new Error('Tidak bisa terhubung. Muat ulang halaman.'); }
  const j = await r.json().catch(() => null);
  if (!r.ok || !Array.isArray(j) || !j[0]) throw new Error('Gagal memuat pengaturan. Muat ulang halaman.');
  ({ open: SETTINGS_OPEN, price: PRICE, charm_price: CHARM, max_avatars: MAXAV } = j[0]);
}
const WA_NUMBER = '6285814115810'; // isi nomor WhatsApp admin, format 628xxxxxxxxxx (tanpa + dan spasi). Kosong = hanya menampilkan contoh pesan.
const AL = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const fmt = n => 'Rp ' + n.toLocaleString('id-ID');
const fcode = c => c.slice(0, 3) + '-' + c.slice(3);
const PAY_INFO = [{nama: 'BCA', nomor: '1772682284', an:'CLIFF TANASA'}];
// isi tujuan pembayaran, contoh: [{ nama: 'BCA', nomor: '1234567890', an: 'Nama Pemilik' }, { nama: 'DANA', nomor: '081234567890', an: 'Nama Pemilik' }]
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const normPhone = v => { let d = v.replace(/[\s\-().]/g, ''); if (d.startsWith('+')) d = d.slice(1); if (d.startsWith('0')) d = '62' + d.slice(1); return /^628\d{8,11}$/.test(d) ? d : ''; };
let AVS = [], cur = 0, order = null, cust = { name: '', phone: '', phoneRaw: '' }, tUrl = null;
const newAv = () => ({ s: initState(), charm: false });
const subtotal = () => AVS.reduce((t, a) => t + PRICE + (a.charm ? CHARM : 0), 0);
const charmCount = () => AVS.filter(a => a.charm).length;

function renderAvs() {
  $('#avbar').innerHTML = AVS.map((a, i) => `<button class="${i === cur ? 'on' : ''}" data-v="${i}">Avatar ${i + 1}</button>`).join('')
    + (AVS.length < MAXAV ? '<button class="add" data-add="1">+ Tambah</button>' : `<span class="mx">Maksimal ${MAXAV}</span>`)
    + (AVS.length > 1 ? '<button class="del" data-del="1">Hapus ini</button>' : '')
    + `<span class="tot">Total: <b>${fmt(subtotal())}</b></span>`;
  $('#charm').checked = AVS[cur].charm;
  $('#save').textContent = `Lihat ringkasan (${AVS.length} avatar)`;
}
function setCur(i) { cur = i; S = AVS[i].s; draw(); panel(); }
$('#avbar').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.v !== undefined) setCur(+b.dataset.v);
  else if (b.dataset.add && AVS.length < MAXAV) { AVS.push(newAv()); setCur(AVS.length - 1); }
  else if (b.dataset.del && AVS.length > 1 && confirm('Hapus Avatar ' + (cur + 1) + '?')) { AVS.splice(cur, 1); setCur(Math.min(cur, AVS.length - 1)); }
};
$('#charm').onchange = e => { AVS[cur].charm = e.target.checked; renderAvs(); };

$('#backToForm').onclick = () => document.body.classList.add('intro');
$('#go').onclick = () => {
  const n = $('#cn').value.trim(), pr = $('#cp').value.trim(), ph = normPhone(pr);
  if (!n) { $('#ierr').textContent = 'Isi nama lengkap dulu ya.'; return; }
  if (!ph) { $('#ierr').textContent = 'Nomor telepon belum benar. Contoh: 081234567890.'; return; }
  $('#ierr').textContent = '';
  cust = { name: n, phone: ph, phoneRaw: pr };
  document.body.classList.remove('intro');
};

/* ringkasan (m1) */
$('#save').onclick = () => {
  $('#sum').innerHTML = AVS.map((a, i) => `<div class="ln">${svgStr(a.s, 'sm' + i)}<div><b>Avatar ${i + 1}</b><small>${a.charm ? 'Dengan charm' : 'Tanpa charm'}</small></div><b>${fmt(PRICE + (a.charm ? CHARM : 0))}</b></div>`).join('')
    + `<div class="ln" style="border-top:2px dashed #d9dcec;margin-top:6px;padding-top:10px"><div><b>Subtotal</b></div><b>${fmt(subtotal())}</b></div><small>Kode unik 2 digit ditambahkan setelah konfirmasi.</small>`;
  $('#m1').classList.add('show');
};
const closeSaveModal = () => { if ($('#ok').disabled) return; $('#m1').classList.remove('show'); };
$('#cancelSave').onclick = closeSaveModal;
$('#closeSave').onclick = closeSaveModal;

/* Mengirim pesanan ke Supabase. Harga, kode pesanan, dan kode unik dibuat server; hasil di sini hanya ditampilkan. */
async function submitOrder(p) {
  let r;
  try {
    r = await sb('/rest/v1/rpc/create_order', { method: 'POST', body: JSON.stringify({ p_name: p.cust.name, p_phone: p.cust.phone, p_items: p.avatars }) });
  } catch (e) { throw new Error('Tidak bisa terhubung ke server. Cek sinyal lalu coba lagi.'); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.message || 'Pesanan gagal disimpan. Coba lagi.');
  PRICE = j.price; CHARM = j.charm_price;
  return { ...p, code: j.code, uq: j.uq, total: j.total, subtotal: j.subtotal };
}
$('#ok').onclick = async () => {
  const b = $('#ok'); if (b.disabled) return;
  b.disabled = true; b.textContent = 'Menyimpan...'; $('#cancelSave').disabled = $('#closeSave').disabled = true;
  try {
    order = await submitOrder({ cust, avatars: AVS.map(a => ({ state: a.s, charm: a.charm })), subtotal: subtotal() });
    showTicket(); $('#m1').classList.remove('show'); $('#m2').classList.add('show');
  } catch (e) { alert('Gagal menyimpan: ' + (e.message || 'coba lagi.')); }
  finally { b.disabled = false; b.textContent = 'Konfirmasi pesanan'; $('#cancelSave').disabled = $('#closeSave').disabled = false; }
};

/* tiket + pembayaran (m2) */
function showTicket() {
  const k = charmCount();
  $('#keys').innerHTML = AVS.map((a, i) => svgStr(a.s, 'k' + i)).join('');
  $('#who').textContent = `${cust.name} · ${AVS.length} avatar${k ? ' · ' + k + ' charm' : ''}`;
  $('#code').textContent = fcode(order.code);
  $('#pay').innerHTML = `<small>Transfer tepat</small><div class="amt">${fmt(order.total)}</div><button type="button" class="cp" data-amt="1">Salin nominal</button><small>${AVS.length} avatar × ${fmt(PRICE)}${k ? ` + ${k} charm × ${fmt(CHARM)}` : ''} + ${order.uq} (kode unik pesananmu). Apabila pesanan belum dibayar dalam 24 jam maka pesanan akan hangus.</small>`
    + (PAY_INFO.length ? '<div class="payto"><small>Transfer ke</small>' + PAY_INFO.map((p, i) => `<div class="pto"><div><b>${escH(p.nama)}</b> ${escH(p.nomor)}<small>a.n. ${escH(p.an)}</small></div><button type="button" class="cp" data-i="${i}">Salin</button></div>`).join('') + '</div>' : '')
    + '<ol class="paysteps"><li>Transfer sesuai nominal tepat di atas. Biaya transfer antar bank ditanggung pengirim, pastikan jumlah yang masuk tepat.</li><li>Screenshot bukti transfer.</li><li>Tekan tombol hijau di bawah, lalu lampirkan screenshot di WhatsApp.</li></ol>';
}
$('#pay').onclick = e => {
  const b = e.target.closest('.cp'); if (!b || !order) return;
  const txt = b.dataset.amt ? String(order.total) : PAY_INFO[+b.dataset.i].nomor, old = b.textContent;
  if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => { b.textContent = 'Tersalin'; setTimeout(() => { b.textContent = old; }, 1500); }).catch(() => {});
};
$('#wa').onclick = () => {
  const k = charmCount();
  const msg = `Halo admin Mimo, ini bukti bayarku.\nKode: ${fcode(order.code)}\nNama: ${cust.name}\nTelepon: ${cust.phoneRaw}\nJumlah avatar: ${AVS.length}, charm: ${k}\nNominal: ${fmt(order.total)}`;
  if (WA_NUMBER) window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg), '_blank');
  else alert('Nomor WhatsApp admin belum diisi (WA_NUMBER di app.js). Pesan yang akan terkirim:\n\n' + msg);
};
$('#done').onclick = () => {
  $('#m2').classList.remove('show'); order = null; AVS = [newAv()]; setCur(0);
  document.body.classList.add('intro'); $('#cn').value = cust.name; $('#cp').value = cust.phoneRaw;
};

/* tiket sebagai gambar (m3) */
const rr = (x, a, b, w, h, r) => { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); };
const loadImg = src => new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => no(new Error('Avatar gagal digambar ke tiket.')); im.src = src; });
async function ticketBlob() {
  const n = AVS.length, W = 720, gap = 16, ratio = CV.h / CV.w, k = charmCount();
  const cols = n <= 2 ? n : 3, rows = Math.ceil(n / cols);
  const tw = n === 1 ? 300 : n === 2 ? 290 : 190, th = Math.round(tw * ratio);
  const y1 = 140 + rows * th + (rows - 1) * gap + 60, H = y1 + 485;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'), F = 'system-ui,sans-serif';
  x.fillStyle = '#e8ebf3'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#fff'; rr(x, 30, 30, W - 60, H - 60, 36); x.fill();
  x.textAlign = 'left'; x.fillStyle = '#7c4dff'; x.font = `800 42px ${F}`; x.fillText('Mimo', 70, 102);
  const urls = [];
  const ims = await Promise.all(AVS.map((a, i) => {
    const u = URL.createObjectURL(new Blob([svgStr(a.s, 't' + i, '', `width="${CV.w}" height="${CV.h}"`)], { type: 'image/svg+xml;charset=utf-8' }));
    urls.push(u); return loadImg(u);
  }));
  ims.forEach((im, i) => {
    const r = Math.floor(i / cols), cnt = Math.min(cols, n - r * cols), col = i - r * cols;
    const xx = (W - (cnt * tw + (cnt - 1) * gap)) / 2 + col * (tw + gap), yy = 140 + r * (th + gap);
    x.drawImage(im, xx, yy, tw, th);
    if (AVS[i].charm) { x.fillStyle = '#ffc93c'; rr(x, xx + tw / 2 - 44, yy + th - 20, 88, 34, 17); x.fill(); x.fillStyle = '#222'; x.textAlign = 'center'; x.font = `700 20px ${F}`; x.fillText('+ charm', xx + tw / 2, yy + th + 4); }
  });
  urls.forEach(u => URL.revokeObjectURL(u));
  x.textAlign = 'center'; x.fillStyle = '#222';
  let fs = 38; x.font = `800 ${fs}px ${F}`;
  while (x.measureText(cust.name).width > W - 140 && fs > 20) { fs -= 2; x.font = `800 ${fs}px ${F}`; }
  x.fillText(cust.name, W / 2, y1);
  x.fillStyle = '#6b7080'; x.font = `400 26px ${F}`; x.fillText(`${n} avatar${k ? ' · ' + k + ' charm' : ''}`, W / 2, y1 + 42);
  x.setLineDash([12, 10]); x.strokeStyle = '#d9dcec'; x.lineWidth = 3; x.beginPath(); x.moveTo(70, y1 + 90); x.lineTo(W - 70, y1 + 90); x.stroke(); x.setLineDash([]);
  x.fillStyle = '#6b7080'; x.font = `400 24px ${F}`; x.fillText('Kode pesanan', W / 2, y1 + 140);
  x.fillStyle = '#7c4dff'; x.font = '700 104px ui-monospace,Menlo,monospace'; x.fillText(fcode(order.code), W / 2, y1 + 250);
  x.fillStyle = '#222'; x.font = `600 30px ${F}`; x.fillText('Total transfer ' + fmt(order.total), W / 2, y1 + 325);
  x.fillStyle = '#6b7080'; x.font = `400 22px ${F}`; x.fillText('Tunjukkan kode ini ke kasir di booth.', W / 2, y1 + 425);
  return new Promise((ok, no) => c.toBlob(b => b ? ok(b) : no(new Error('Browser gagal membuat gambar tiket.')), 'image/png'));
}
$('#img').onclick = async () => {
  const b = $('#img'); b.disabled = true; b.textContent = 'Menyiapkan tiket...';
  try {
    const u = URL.createObjectURL(await ticketBlob());
    if (tUrl) URL.revokeObjectURL(tUrl); tUrl = u;
    $('#timg').src = u; $('#tdl').href = u; $('#tdl').download = 'tiket-mimo-' + order.code + '.png';
    $('#m3').classList.add('show');
  } catch (e) { alert('Tiket gagal dibuat: ' + (e.message || 'coba lagi.')); }
  finally { b.disabled = false; b.textContent = 'Simpan tiket sebagai gambar'; }
};
$('#close3').onclick = () => $('#m3').classList.remove('show');

/* ---------- admin (#admin): login Supabase + daftar pesanan ---------- */
const ST_ID = { menunggu: 'Menunggu bayar', lunas: 'Lunas', dicetak: 'Dicetak', siap: 'Siap diambil', diambil: 'Diambil', kedaluwarsa: 'Kedaluwarsa' };
const FWD = { menunggu: [['lunas', 'Tandai lunas']], lunas: [['dicetak', 'Tandai dicetak'], ['siap', 'Langsung siap']], dicetak: [['siap', 'Siap diambil']], siap: [['diambil', 'Tandai diambil']], kedaluwarsa: [['lunas', 'Dibayar terlambat: lunas']], diambil: [] };
const BCK = { lunas: ['menunggu', 'Batalkan lunas'], dicetak: ['lunas', 'Kembali ke lunas'], siap: ['dicetak', 'Kembali ke dicetak'] };
let ORD = [], flt = 'menunggu', qry = '', admBusy = false;
const adm = (path, opt = {}) => sb(path, { ...opt, auth: true });
const fdt = d => new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const fullState = st => { const base = initState(); return Object.fromEntries(CATS.map(c => [c.k, { ...base[c.k], ...((st && st[c.k]) || {}) }])); };
const itemSvg = it => svgStr(fullState(it.state), '', '', `width="${CV.w}" height="${CV.h}"`);
const thumb = it => { try { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(itemSvg(it)); } catch (e) { return ''; } };
function saveHref(href, name) { const a = document.createElement('a'); a.href = href; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }

function card(o) {
  const items = (o.order_items || []).slice().sort((a, b) => a.idx - b.idx), id = escH(o.id);
  return `<div class="item ord"><b>${fcode(escH(o.code))}</b><span class="pill s-${escH(o.status)}">${escH(ST_ID[o.status] || o.status)}</span>
   <small>${escH(o.name)}${o.angkatan ? ' · ' + escH(o.angkatan) : ''} · <a href="https://wa.me/${escH(o.phone)}" target="_blank" rel="noopener">${escH(o.phone)}</a></small>
   <small>${o.avatar_count} avatar${o.charm_count ? ' · ' + o.charm_count + ' charm' : ''} · ${fmt(o.total)}</small>
   <small>Dibuat ${fdt(o.created_at)}${o.status === 'menunggu' ? ' · batas bayar ' + fdt(o.expires_at) : ''}${o.paid_at ? ' · ditandai lunas ' + fdt(o.paid_at) : ''}${o.picked_at ? ' · diambil ' + fdt(o.picked_at) + (o.picked_by ? ' oleh ' + escH(o.picked_by) : '') : ''}</small>
   <div class="thumbs">${items.map(it => `<div class="th"><img src="${thumb(it)}" alt="Avatar ${it.idx + 1}"><small>${it.charm ? 'dengan charm' : 'tanpa charm'}</small><div class="row"><button data-a="print" data-id="${id}" data-i="${it.idx}">Cetak</button><button data-a="png" data-id="${id}" data-i="${it.idx}">PNG</button><button data-a="svg" data-id="${id}" data-i="${it.idx}">SVG</button></div></div>`).join('')}</div>
   <div class="row">${(FWD[o.status] || []).map(([s, t]) => `<button class="go" data-a="st" data-id="${id}" data-s="${s}">${t}</button>`).join('')}${BCK[o.status] ? `<button data-a="st" data-id="${id}" data-s="${BCK[o.status][0]}">${BCK[o.status][1]}</button>` : ''}<button class="del" data-a="del" data-id="${id}">Hapus</button></div></div>`;
}
function renderOrders() {
  const counts = {}; ORD.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
  $('#astat').innerHTML = [['semua', 'Semua', ORD.length], ...Object.keys(ST_ID).map(k => [k, ST_ID[k], counts[k] || 0])]
    .map(([k, t, n]) => `<button class="${k === flt ? 'on' : ''}" data-f="${k}">${t} (${n})</button>`).join('');
  const q = qry.trim().toLowerCase().replace(/-/g, '');
  const rows = ORD.filter(o => (flt === 'semua' || o.status === flt)
    && (!q || [o.code, o.name, o.phone, o.angkatan || ''].some(v => String(v).toLowerCase().replace(/-/g, '').includes(q))));
  $('#alist').innerHTML = rows.length ? rows.map(card).join('') : '<p>Tidak ada pesanan.</p>';
}
function showLogin(msg) { $('#alogin').hidden = false; $('#apanel').hidden = true; $('#aerr').textContent = msg || ''; }
function admLogout(msg) { tok = ''; try { sessionStorage.removeItem('mimo_tok'); } catch (e) {} showLogin(msg); }
async function loadOrders() {
  if (!tok) return;
  try {
    await adm('/rest/v1/rpc/admin_refresh', { method: 'POST', body: '{}' });
    const r = await adm('/rest/v1/orders?select=*,order_items(idx,state,charm)&order=created_at.desc&limit=500');
    if (r.status === 401) return admLogout('Sesi habis. Masuk lagi.');
    const j = await r.json(); if (!Array.isArray(j)) throw new Error('bad');
    ORD = j; renderOrders();
  } catch (e) { $('#alist').innerHTML = '<p>Gagal memuat pesanan. Tekan Muat ulang.</p>'; }
}
async function showPanel() {
  $('#alogin').hidden = true; $('#apanel').hidden = false; $('#anot').hidden = true;
  try {
    const r = await adm('/rest/v1/rpc/is_admin', { method: 'POST', body: '{}' });
    if (r.status === 401) return admLogout('Sesi habis. Masuk lagi.');
    if ((await r.json()) !== true) { $('#anot').hidden = false; $('#alist').innerHTML = ''; $('#astat').innerHTML = ''; return; }
    const s = await (await adm('/rest/v1/settings?select=open,price,charm_price,max_avatars&id=eq.1')).json();
    if (s[0]) { $('#aopen').checked = s[0].open; $('#apr').value = s[0].price; $('#ach').value = s[0].charm_price; $('#amx').value = s[0].max_avatars; }
  } catch (e) { $('#alist').innerHTML = '<p>Tidak bisa terhubung. Tekan Muat ulang.</p>'; return; }
  loadOrders();
}
$('#alog').onclick = async () => {
  const email = $('#aem').value.trim(), password = $('#apw').value;
  if (!email || !password) { $('#aerr').textContent = 'Isi email dan password.'; return; }
  $('#alog').disabled = true;
  try {
    const r = await fetch(SB_URL + '/auth/v1/token?grant_type=password', { method: 'POST', headers: { apikey: SB_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.access_token) { $('#aerr').textContent = 'Email atau password salah.'; return; }
    tok = j.access_token; try { sessionStorage.setItem('mimo_tok', tok); } catch (e) {}
    $('#apw').value = ''; $('#aerr').textContent = ''; showPanel();
  } catch (e) { $('#aerr').textContent = 'Tidak bisa terhubung. Cek sinyal.'; }
  finally { $('#alog').disabled = false; }
};
$('#aset').onclick = async () => {
  const price = parseInt($('#apr').value, 10), charm = parseInt($('#ach').value, 10), mx = parseInt($('#amx').value, 10);
  if (!(price >= 1000) || !(charm >= 0) || !(mx >= 1 && mx <= 20)) { alert('Isi harga (minimal 1000), harga charm (0 atau lebih), dan batas avatar (1 sampai 20) dengan benar.'); return; }
  if (!confirm(`Simpan pengaturan?\nHarga avatar ${fmt(price)}, charm +${fmt(charm)}, maksimal ${mx} avatar.\nBerlaku untuk pesanan baru.`)) return;
  try {
    const r = await adm('/rest/v1/settings?id=eq.1', { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ price, charm_price: charm, max_avatars: mx }) });
    const j = await r.json().catch(() => []);
    if (r.status === 401) return admLogout('Sesi habis. Masuk lagi.');
    if (!r.ok || !Array.isArray(j) || !j.length) throw new Error('Tidak diizinkan atau gagal menyimpan.');
    alert('Pengaturan tersimpan.');
  } catch (err) { alert(err.message); }
};
$('#aout').onclick = () => admLogout('');
$('#aref').onclick = () => loadOrders();
$('#aq').oninput = e => { qry = e.target.value; renderOrders(); };
$('#astat').onclick = e => { const b = e.target.closest('[data-f]'); if (b) { flt = b.dataset.f; renderOrders(); } };
$('#aopen').onchange = async e => {
  const want = e.target.checked;
  try {
    const r = await adm('/rest/v1/settings?id=eq.1', { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ open: want }) });
    const j = await r.json().catch(() => []);
    if (r.status === 401) return admLogout('Sesi habis. Masuk lagi.');
    if (!r.ok || !Array.isArray(j) || !j.length) throw new Error('Tidak diizinkan atau gagal menyimpan.');
  } catch (err) { e.target.checked = !want; alert(err.message); }
};
$('#alist').onclick = async e => {
  const b = e.target.closest('button[data-a]'); if (!b || admBusy) return;
  const o = ORD.find(x => x.id === b.dataset.id); if (!o) return;
  const t = b.dataset.a;
  const w = t === 'print' ? open('', '_blank') : null; // jendela cetak dibuka sekarang supaya tidak diblokir browser
  admBusy = true;
  try {
    if (t === 'del') {
      const heavy = o.status !== 'menunggu' && o.status !== 'kedaluwarsa';
      if (heavy) {
        const a = prompt(`Pesanan ${fcode(o.code)} (${o.name}) berstatus "${ST_ID[o.status]}". Menghapusnya tidak bisa dibatalkan.\nKetik kode pesanan untuk melanjutkan:`);
        if (a === null) return;
        if (a.trim().toUpperCase().replace(/-/g, '') !== o.code) { alert('Kode tidak cocok. Pesanan tidak dihapus.'); return; }
      } else if (!confirm(`Hapus pesanan ${fcode(o.code)} milik ${o.name}? Tindakan ini tidak bisa dibatalkan.`)) return;
      const r = await adm('/rest/v1/rpc/delete_order', { method: 'POST', body: JSON.stringify({ p_id: o.id }) });
      const j = await r.json().catch(() => ({}));
      if (r.status === 401) return admLogout('Sesi habis. Masuk lagi.');
      if (!r.ok) throw new Error(j.message || 'Gagal menghapus pesanan.');
      await loadOrders();
    } else if (t === 'st') {
      const s = b.dataset.s; let pb = null;
      if (s === 'diambil') { pb = prompt('Diambil oleh (nama, boleh dikosongkan):'); if (pb === null) return; }
      else if (s === 'menunggu' && !confirm('Batalkan status lunas untuk ' + fcode(o.code) + '?')) return;
      const r = await adm('/rest/v1/rpc/set_status', { method: 'POST', body: JSON.stringify({ p_id: o.id, p_status: s, p_picked_by: pb }) });
      const j = await r.json().catch(() => ({}));
      if (r.status === 401) return admLogout('Sesi habis. Masuk lagi.');
      if (!r.ok) throw new Error(j.message || 'Gagal mengubah status.');
      await loadOrders();
    } else {
      const it = (o.order_items || []).find(x => x.idx === +b.dataset.i); if (!it) return;
      const svg = itemSvg(it), name = `${o.code}-${it.idx + 1}`;
      if (t === 'svg') { const u = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })); saveHref(u, name + '.svg'); setTimeout(() => URL.revokeObjectURL(u), 5000); }
      else {
        const png = await toPNG(svg);
        if (t === 'png') saveHref(png, name + '.png');
        else if (w) { w.document.write(`<style>@page{margin:0}body{margin:0;text-align:center}img{width:${CONFIG.printWidthMm}mm}</style><img src="${png}" onload="print()">`); w.document.close(); }
      }
    }
  } catch (err) { if (w) w.close(); alert(err.message || 'Gagal.'); }
  finally { admBusy = false; if (w && t !== 'print') w.close(); }
};
$('#back').onclick = () => { location.hash = ''; };
function route() {
  clearInterval(poll);
  if (location.hash === '#admin') {
    document.body.classList.add('adm'); tok ? showPanel() : showLogin('');
    poll = setInterval(() => { if (tok && !document.hidden && !admBusy) loadOrders(); }, 20000);
  } else document.body.classList.remove('adm');
}
addEventListener('hashchange', route);

/* ---------- start ---------- */
(async () => {
  try { await loadAll(); } catch (e) {
    document.body.innerHTML = `<p style="padding:30px;font:18px system-ui">⚠️ ${e.message}<br><br>Buka lewat server: jalankan <b>server.py</b> lalu buka <b>http://localhost:8000</b> (jangan klik dobel index.html).</p>`; return;
  }
  AVS = [newAv()]; S = AVS[0].s; draw(); panel(); route();
  const go = $('#go');
  try {
    await loadSettings();
    $('#iprice').textContent = `${fmt(PRICE)} per avatar. Charm +${fmt(CHARM)} per avatar. Maksimal ${MAXAV} avatar per pesanan.`;
    go.disabled = !SETTINGS_OPEN; go.textContent = SETTINGS_OPEN ? 'Mulai buat avatar' : 'Pemesanan sedang ditutup';
  } catch (e) { go.textContent = e.message; }
})();