/**
 * ============================================================
 * NusaPangan-Market — app2.js (skrip khusus halaman market.html)
 * ------------------------------------------------------------
 * Berisi logika KATALOG, PROMO BANNER CAROUSEL, KERANJANG, CHECKOUT, dan RIWAYAT.
 * Data, utilitas, Daftar Transaksi, aksi kartu, sidebar akun, dan lonceng
 * ada di transaksi.js.
 * Urutan muat di market.html (akhir <body>):
 *     <script src="transaksi.js"></script>
 *     <script src="app2.js"></script>
 * (app.js tetap di <head>)
 * ============================================================
 */
'use strict';

/* =====================================================================
 * NAVBAR: dropdown Market + menu mobile
 * ===================================================================== */

/**
 * Navbar: menu mobile + penempatan tombol keranjang. Dropdown "Market" murni CSS
 * (hover / fokus keyboard), lihat kelas .dd di <style>.
 */
const Navbar = {
  init() {
    const tombol = $('btn-menu'), menu = $('menu-mobile');
    tombol.addEventListener('click', () => tombol.setAttribute('aria-expanded', String(menu.classList.toggle('hidden') === false)));

    // Pindahkan tombol keranjang ke grup tombol navbar bentukan app.js (di samping tema & akun)
    const tema = $('btn-tema');
    if (tema) tema.parentNode.insertBefore($('btn-keranjang'), tema.parentNode.firstChild);
  }
};

/* =====================================================================
 * INDIKATOR STOK VISUAL (progress bar)
 * ===================================================================== */

const Stok = {
  /**
   * Menentukan tampilan stok: aman (hijau), menipis < 10 (oranye), kritis < 5 (merah), habis.
   * @param {Produk} p
   * @returns {{label:string, info:string, warna:string, teks:string, lebar:number, urgen:boolean}}
   */
  info(p) {
    const lebar = Math.max(8, Math.min(100, Math.round(p.stok / STOK_REF * 100)));
    if (p.stok === 0) return { label: 'Stok habis', info: '0', warna: 'bg-red-500', teks: 'text-red-700', lebar: 0, urgen: false };
    if (p.stok < STOK_KRITIS) return { label: 'Hampir habis!', info: `Sisa ${p.stok}`, warna: 'bg-red-500', teks: 'text-red-700', lebar, urgen: true };
    if (p.stok < STOK_TIPIS) return { label: 'Stok menipis', info: `Sisa ${p.stok}`, warna: 'bg-panen', teks: 'text-amber-700', lebar, urgen: true };
    return { label: 'Stok aman', info: `${p.stok} tersedia`, warna: 'bg-segar', teks: 'text-green-900', lebar, urgen: false };
  },

  /** HTML label + progress bar (role="progressbar": isinya dianimasikan oleh AnimasiBar di app.js). @param {Produk} p @returns {string} */
  html(p) {
    const s = this.info(p);
    const titik = s.urgen ? `<span class="relative flex w-2 h-2" aria-hidden="true"><span class="animate-ping absolute inline-flex h-full w-full rounded-full ${s.warna} opacity-75"></span><span class="relative inline-flex w-2 h-2 rounded-full ${s.warna}"></span></span>` : '';
    return `<div>
      <div class="flex items-center justify-between gap-2 text-[11px] font-bold ${s.teks}"><span class="inline-flex items-center gap-1.5">${titik}${s.label}</span><span>${s.info}</span></div>
      <div class="mt-1 h-1.5 rounded-full bg-tua/10 overflow-hidden" role="progressbar" aria-valuemin="0" aria-valuemax="${STOK_REF}" aria-valuenow="${Math.min(p.stok, STOK_REF)}" aria-valuetext="${esc(s.label + ', ' + s.info)}" aria-label="Ketersediaan stok ${esc(p.nama)}"><div class="h-full rounded-full ${s.warna}" style="width:${s.lebar}%"></div></div>
    </div>`;
  }
};

/* =====================================================================
 * MIKRO-INTERAKSI TAMBAH KE KERANJANG
 * ===================================================================== */

const Umpan = {
  /**
   * Tombol berubah sesaat menjadi "✓ Ditambahkan" dengan denyut cincin oranye.
   * Selama umpan aktif (data-fb), Keranjang.segarkan() tidak menimpa labelnya.
   * @param {?HTMLElement} b - tombol yang diklik
   */
  tombol(b) {
    if (!b || !b.isConnected) return;
    const label = b.querySelector('[data-label]');
    if (!label) return;
    b.dataset.fb = '1';
    label.textContent = '✓ Ditambahkan';
    b.classList.remove('tb-ok'); void b.offsetWidth; b.classList.add('tb-ok');
    clearTimeout(b._fb);
    b._fb = setTimeout(() => { delete b.dataset.fb; b.classList.remove('tb-ok'); Keranjang.segarkan(); }, 1300);
  },

  /** Badge jumlah di navbar memantul dan ikon keranjang bergoyang. */
  badge() {
    [['badge-keranjang', 'badge-pantul'], ['btn-keranjang', 'kereta-goyang']].forEach(([id, kelas]) => {
      const el = $(id); if (!el) return;
      el.classList.remove(kelas); void el.offsetWidth; el.classList.add(kelas);
    });
  },

  /**
   * Lencana emoji produk terbang melengkung dari tombol ke ikon keranjang, lalu badge memantul.
   * Tanpa animasi bila gerak dikurangi atau ada modal terbuka (modal berada di lapisan teratas).
   * @param {Produk} p @param {?HTMLElement} dari - tombol asal
   */
  terbang(p, dari) {
    const ke = $('btn-keranjang');
    if (REDUKSI || !dari || !dari.isConnected || !ke || !('animate' in Element.prototype) || document.querySelector('dialog[open]')) { this.badge(); return; }
    const a = dari.getBoundingClientRect(), b = ke.getBoundingClientRect();
    const sx = a.left + a.width / 2 - 20, sy = a.top + a.height / 2 - 20, ex = b.left + b.width / 2 - 20, ey = b.top + b.height / 2 - 20;
    const el = document.createElement('div');
    el.textContent = p.ikon; el.setAttribute('aria-hidden', 'true');
    el.style.cssText = 'position:fixed;left:0;top:0;z-index:2100;width:2.5rem;height:2.5rem;border-radius:9999px;background:#F4A261;display:grid;place-items:center;font-size:1.3rem;box-shadow:0 8px 20px rgba(0,0,0,.25);pointer-events:none;will-change:transform';
    document.body.appendChild(el);
    el.animate([
      { transform: `translate(${sx}px,${sy}px) scale(1)`, opacity: 1 },
      { transform: `translate(${(sx + ex) / 2}px,${Math.min(sy, ey) - 90}px) scale(.9)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${ex}px,${ey}px) scale(.25)`, opacity: 0.5 }
    ], { duration: 700, easing: 'cubic-bezier(.45,.05,.55,.95)' }).onfinish = () => { el.remove(); this.badge(); };
  }
};

/* =====================================================================
 * KERANJANG
 * ===================================================================== */

/* =====================================================================
 * VOUCHER SUBSIDI & SALDO NUSAPAY PANGAN
 * ===================================================================== */

/**
 * Aturan voucher subsidi (kode sama dengan VOUCHER_SUBSIDI di transaksi.js).
 * flat = potongan tetap (Rp), persen = diskon % dari subtotal barang terpilih,
 * kat = potongan hanya dihitung dari barang berkategori ini, min = minimal belanja (Rp).
 */
const VOUCHER_ATURAN = {
  PANGANHEMAT: { judul: 'Diskon Rp 5.000', syarat: 'Min. belanja Rp 50.000', flat: 5000, min: 50000 },
  ONGKIRKOMUNITAS: { judul: 'Subsidi ongkir komunitas Rp 3.000', syarat: 'Tanpa minimum belanja', flat: 3000, min: 0 },
  SAYURLOKAL10: { judul: 'Diskon 10% produk sayur', syarat: 'Khusus kategori sayur', persen: 10, kat: 'sayur', min: 0 }
};

/** @param {string} kode @returns {string} judul voucher */
const VOUCHER_ARTI = (kode) => (VOUCHER_ATURAN[kode] ? VOUCHER_ATURAN[kode].judul : kode);

/** Metode bayar tambahan: saldo NusaPay Pangan (METODE dari transaksi.js dipakai juga oleh invoice & daftar transaksi). */
if (typeof METODE === 'object' && !METODE.nusapay) {
  METODE.nusapay = { nama: 'NusaPay Pangan', ikon: 'wallet', info: 'Bayar memakai saldo NusaPay Pangan Anda' };
}

/** Saldo NusaPay Pangan di LocalStorage "nusapangan:nusapay" ({saldo, sembunyi}); bawaan Rp 150.000. */
const SaldoPay = {
  BAWAAN: (typeof SALDO_AWAL === 'number' ? SALDO_AWAL : 150000),

  /** @returns {{saldo:number, sembunyi:boolean}} */
  ambil() {
    const d = Simpan.ambil('nusapay', null);
    if (!d || typeof d !== 'object') return { saldo: this.BAWAAN, sembunyi: false };
    const n = Number(d.saldo);
    return { saldo: Number.isFinite(n) ? n : this.BAWAAN, sembunyi: !!d.sembunyi };
  },

  /** @returns {number} saldo aktif (Rp) */
  saldo() { return this.ambil().saldo; },

  /** Menyimpan saldo baru tanpa mengubah pilihan sembunyikan. @param {number} nilai @param {boolean} [sembunyi] @returns {boolean} */
  set(nilai, sembunyi) {
    const lama = this.ambil();
    const ok = Simpan.simpan('nusapay', { saldo: Math.max(0, Math.round(nilai)), sembunyi: sembunyi === undefined ? lama.sembunyi : !!sembunyi });
    if (ok && typeof AkunSidebar !== 'undefined' && AkunSidebar.renderSaldo) { try { AkunSidebar.renderSaldo(); } catch (e) { /* sidebar tidak ada di halaman ini */ } }
    return ok;
  }
};

/**
 * Status & logika keranjang. Disimpan ke LocalStorage "keranjang" sebagai [{id, qty, pilih}]
 * dan "donasi" sebagai boolean. `pilih` = barang dicentang untuk checkout (default true; data lama tanpa `pilih` dianggap terpilih).
 */
const Keranjang = {
  /** @type {Object<string, number>} id produk -> jumlah */
  item: {},
  /** @type {Object<string, boolean>} id produk -> dicentang untuk checkout (default true) */
  pilih: {},
  /** True bila pembeli mencentang Donasi Pangan. */
  donasi: false,
  /** Kode voucher subsidi yang dipasang (kunci VOUCHER_ATURAN) atau null. */
  voucher: null,

  /** Memuat dari LocalStorage; produk tak dikenal/habis dibuang, jumlah dibatasi stok. */
  muat() {
    const d = Simpan.ambil('keranjang', []);
    this.item = {}; this.pilih = {};
    (Array.isArray(d) ? d : []).forEach((x) => {
      const p = x && cariProduk(x.id), q = Math.floor(Number(x && x.qty));
      if (p && p.stok > 0 && q > 0) { this.item[p.id] = Math.min(q, p.stok); this.pilih[p.id] = x.pilih !== false; }
    });
    this.donasi = Simpan.ambil('donasi', false) === true;
    const v = Simpan.ambil('voucher', null);
    this.voucher = typeof v === 'string' && VOUCHER_ATURAN[v] ? v : null;
  },

  /** Menyimpan keranjang & pilihan donasi ke LocalStorage. */
  simpan() {
    Simpan.simpan('keranjang', Object.keys(this.item).map((id) => ({ id, qty: this.item[id], pilih: this.pilih[id] !== false })));
    Simpan.simpan('donasi', this.donasi);
    Simpan.simpan('voucher', this.voucher);
  },

  /** @returns {number} total kuantitas semua barang */
  jumlah() { return Object.keys(this.item).reduce((a, id) => a + this.item[id], 0); },

  /** @returns {{p: Produk, qty: number, pilih: boolean}[]} semua baris keranjang (terpilih maupun tidak) */
  baris() { return Object.keys(this.item).map((id) => ({ p: cariProduk(id), qty: this.item[id], pilih: this.pilih[id] !== false })).filter((b) => b.p); },

  /** @returns {{p: Produk, qty: number, pilih: boolean}[]} hanya baris yang dicentang (dasar total & checkout) */
  barisPilih() { return this.baris().filter((b) => b.pilih); },

  /** @returns {number} total kuantitas barang yang dicentang */
  jumlahPilih() { return this.barisPilih().reduce((a, b) => a + b.qty, 0); },

  /** @returns {boolean} true bila keranjang tidak kosong dan semua barang dicentang */
  semuaTerpilih() { const b = this.baris(); return b.length > 0 && b.every((x) => x.pilih); },

  /** Mencentang/membatalkan centang satu barang. @param {string} id @param {boolean} nilai */
  setPilih(id, nilai) { if (this.item[id]) { this.pilih[id] = !!nilai; this.simpan(); } },

  /** Mencentang atau membatalkan centang semua barang. @param {boolean} nilai */
  pilihSemua(nilai) { Object.keys(this.item).forEach((id) => { this.pilih[id] = !!nilai; }); this.simpan(); },

  /**
   * Menghitung potongan satu voucher terhadap barang yang DICENTANG saat ini.
   * @param {string} kode kunci VOUCHER_ATURAN
   * @returns {{potongan:number, pesan:string}} potongan 0 + pesan alasan bila voucher tidak bisa dipakai
   */
  hitungVoucher(kode) {
    const a = VOUCHER_ATURAN[kode], b = this.barisPilih();
    if (!a) return { potongan: 0, pesan: 'Kode voucher tidak dikenali. Periksa lagi penulisannya.' };
    if (!b.length) return { potongan: 0, pesan: 'Centang minimal satu barang agar voucher bisa dihitung.' };
    const sub = b.reduce((n, { p, qty }) => n + p.harga * qty, 0);
    if (sub < a.min) return { potongan: 0, pesan: `Min. belanja ${Rp(a.min)} belum terpenuhi (kurang ${Rp(a.min - sub)}).` };
    let potongan = a.flat || 0;
    if (a.persen) {
      const dasar = b.filter(({ p }) => p.kat === a.kat).reduce((n, { p, qty }) => n + p.harga * qty, 0);
      if (!dasar) return { potongan: 0, pesan: 'Voucher ini khusus produk sayur, dan belum ada sayur yang dicentang.' };
      potongan = Math.floor(dasar * a.persen / 100);
    }
    return { potongan: Math.min(potongan, sub), pesan: '' };
  },

  /**
   * @returns {{bayar:number, pasar:number, hemat:number, donasi:number, potongan:number, voucher:?string, voucherPesan:string, tagihan:number}}
   * Hanya barang yang DICENTANG yang dihitung.
   * bayar = harga barang terpilih, donasi = Rp 2.000 bila dicentang dan ada barang terpilih,
   * potongan = nilai voucher aktif (0 bila syarat tidak terpenuhi; voucherPesan menjelaskan alasannya),
   * tagihan = bayar + donasi - potongan (hemat tidak memuat donasi maupun voucher)
   */
  total() {
    const b = this.barisPilih();
    const t = b.reduce((a, { p, qty }) => ({ bayar: a.bayar + p.harga * qty, pasar: a.pasar + p.pasar * qty }), { bayar: 0, pasar: 0 });
    const donasi = this.donasi && b.length ? DONASI : 0;
    const v = this.voucher ? this.hitungVoucher(this.voucher) : { potongan: 0, pesan: '' };
    return {
      bayar: t.bayar, pasar: t.pasar, hemat: t.pasar - t.bayar, donasi,
      potongan: v.potongan, voucher: v.potongan ? this.voucher : null, voucherPesan: this.voucher && !v.potongan ? v.pesan : '',
      tagihan: t.bayar + donasi - v.potongan
    };
  },

  /**
   * Menambah/mengurangi kuantitas. Kuantitas 0 menghapus barang; melewati stok ditolak.
   * @param {string} id - id produk
   * @param {number} delta - +1 / -1
   * @param {HTMLElement} [tombol] - tombol asal klik (untuk umpan visual)
   * @returns {boolean} true bila kuantitas berubah
   */
  ubah(id, delta, tombol) {
    const p = cariProduk(id); if (!p) return false;
    const kini = this.item[id] || 0;
    if (delta > 0 && kini >= p.stok) { toast(`Stok ${p.nama} hanya ${p.stok} ${p.sat}`); return false; }
    const q = Math.max(0, Math.min(p.stok, kini + delta));
    if (q === 0) { delete this.item[id]; delete this.pilih[id]; }
    else {
      this.item[id] = q;
      // barang baru, atau ditambah dari katalog/Quick View (ada tombol asal) = otomatis dicentang; +/− di dalam keranjang tidak mengubah centang
      if (kini === 0 || (delta > 0 && tombol) || !(id in this.pilih)) this.pilih[id] = true;
    }
    if (delta > 0) { toast(`${p.nama} masuk keranjang`); Umpan.tombol(tombol); }
    this.simpan(); this.segarkan();
    if (delta > 0) Umpan.terbang(p, tombol);
    return true;
  },

  /** Menghapus satu barang. @param {string} id */
  hapus(id) { delete this.item[id]; delete this.pilih[id]; this.simpan(); this.segarkan(); },

  /** Menyelaraskan badge, tombol kartu/Quick View, dan isi modal dengan status terbaru. */
  segarkan() {
    const n = this.jumlah(), badge = $('badge-keranjang');
    badge.textContent = n > 99 ? '99+' : n;
    badge.classList.toggle('scale-0', n === 0);
    $('btn-keranjang').setAttribute('aria-label', n ? `Buka keranjang belanja, ${n} item` : 'Buka keranjang belanja');
    document.querySelectorAll('[data-tambah]').forEach((b) => {
      const p = cariProduk(b.dataset.tambah), q = this.item[p.id] || 0;
      b.disabled = p.stok === 0; // batas "stok maksimal" tidak lagi menonaktifkan tombol kartu
      if (b.dataset.fb) return; // umpan "✓ Ditambahkan" sedang tampil
      b.querySelector('[data-label]').textContent = p.stok === 0 ? 'Stok Habis' : q ? `Tambah lagi (${q})` : 'Tambah ke Keranjang';
    });
    if (Modal.mode === 'keranjang') Modal.render();
  }
};

/* =====================================================================
 * MODAL KERANJANG & CHECKOUT BERTAHAP
 * ===================================================================== */

/** Aturan validasi formulir alamat: [fungsi uji, pesan galat]. */
const ATURAN = {
  nama: [(v) => v.length >= 3, 'Nama penerima minimal 3 huruf.'],
  hp: [(v) => /^(\+62|62|0)8\d{7,11}$/.test(v.replace(/[\s-]/g, '')), 'Nomor HP tidak valid. Contoh: 0812 3456 7890.'],
  alamat: [(v) => v.length >= 10, 'Alamat minimal 10 karakter: nama jalan, nomor rumah, RT/RW.'],
  kota: [(v) => v.length >= 3, 'Isi kota atau kecamatan.']
};

/**
 * Membuat satu kolom formulir beserta tempat pesan galat.
 * @param {string} id @param {string} label @param {string} nilai
 * @param {{tipe?:string, ac?:string, ph?:string, area?:boolean}} [o]
 * @returns {string}
 */
function medan(id, label, nilai, o = {}) {
  const { tipe = 'text', ac = 'off', ph = '', area = false } = o;
  const attr = `id="f-${id}" name="${id}" autocomplete="${ac}" placeholder="${esc(ph)}" aria-describedby="e-${id}" class="isian mt-1"`;
  return `<div><label for="f-${id}" class="text-sm font-semibold">${label}</label>
    ${area ? `<textarea ${attr} rows="3">${esc(nilai)}</textarea>` : `<input type="${tipe}" ${attr} value="${esc(nilai)}" ${tipe === 'tel' ? 'inputmode="tel"' : ''} />`}
    <p id="e-${id}" class="hidden text-xs font-semibold text-red-700 mt-1" role="alert"></p></div>`;
}

/**
 * Modal keranjang berbasis <dialog> (fokus terkunci & Esc bawaan browser).
 * Mode: 'keranjang' -> 'alamat' -> 'bayar' -> 'sukses'.
 */
const Modal = {
  mode: 'keranjang',
  /** Data alamat pengiriman selama sesi (tidak disimpan ke riwayat selain kota). */
  alamat: { nama: '', hp: '', alamat: '', kota: '', catatan: '' },
  metode: 'qris',
  bank: 'BCA',
  /** Nomor pesanan sementara (juga benih QR & virtual account). */
  noPesanan: null,
  sibuk: false,
  galat: '',
  /** Pesan galat percobaan voucher terakhir & isi kolom kode yang belum dipakai. */
  pesanVoucher: '',
  kodeDraf: '',

  /** Membuka modal pada langkah keranjang. */
  buka() { const d = $('modal-keranjang'); this.mode = 'keranjang'; this.noPesanan = null; this.pesanVoucher = ''; this.kodeDraf = ''; this.render(); if (!d.open) d.showModal(); },

  /** Menutup modal dengan animasi singkat. */
  tutup() { tutupDialog($('modal-keranjang')); },

  /** Berpindah langkah, menggambar ulang, lalu memfokuskan judul langkah (aksesibilitas). @param {string} mode */
  pindah(mode) {
    this.mode = mode; this.render();
    const h = $('judul-langkah') || $('btn-checkout'); if (h) h.focus();
    $('isi-keranjang').scrollTop = 0;
  },

  /** Penunjuk langkah checkout (Keranjang, Alamat, Pembayaran). @param {number} n langkah aktif (1-3) @returns {string} */
  stepper(n) {
    const L = ['Keranjang', 'Alamat', 'Pembayaran'];
    return `<ol class="flex items-center gap-2 pt-4" aria-label="Langkah checkout">${L.map((t, i) => {
      const s = i + 1, selesai = s < n, aktif = s === n;
      return `<li class="flex items-center gap-2 ${i ? 'flex-1' : ''}" ${aktif ? 'aria-current="step"' : ''}>
        ${i ? `<span class="flex-1 h-0.5 rounded ${s <= n ? 'bg-segar' : 'bg-tua/10'}" aria-hidden="true"></span>` : ''}
        <span class="w-7 h-7 shrink-0 rounded-full grid place-items-center text-xs font-extrabold ${selesai ? 'bg-segar text-white' : aktif ? 'bg-tua text-white ring-2 ring-panen' : 'border border-tua/30 text-tua/60'}">${selesai ? '✓' : s}</span>
        <span class="text-xs font-bold ${aktif ? '' : 'hidden sm:inline text-tua/60'}">${t}</span></li>`;
    }).join('')}</ol>`;
  },

  /** Menggambar langkah sesuai mode. Langkah "sukses" digambar sekali oleh renderSukses(). @param {string} [fokus] selektor yang difokuskan ulang */
  render(fokus) {
    if (this.mode === 'alamat') this.renderAlamat();
    else if (this.mode === 'bayar') this.renderBayar();
    else if (this.mode === 'keranjang') this.renderKeranjang(fokus);
  },

  /** Memperbarui ringkasan total & kotak donasi tanpa menggambar ulang daftar barang. */
  renderTotal() {
    const t = Keranjang.total();
    $('total-pasar').textContent = Rp(t.pasar);
    $('total-hemat').textContent = Rp(t.hemat);
    $('total-donasi').textContent = Rp(t.donasi);
    $('baris-donasi').classList.toggle('hidden', !t.donasi);
    let rv = $('baris-voucher'); // baris potongan voucher dibuat sekali, disisipkan sebelum baris donasi
    if (!rv) {
      rv = document.createElement('div'); rv.id = 'baris-voucher';
      rv.className = 'flex items-center justify-between gap-3 text-segar font-semibold';
      rv.innerHTML = '<span data-v-label></span><span data-v-nilai></span>';
      const d = $('baris-donasi'); if (d && d.parentNode) d.parentNode.insertBefore(rv, d);
    }
    rv.classList.toggle('hidden', !t.potongan);
    rv.querySelector('[data-v-label]').textContent = t.voucher ? `🎟️ Voucher ${t.voucher}` : '';
    rv.querySelector('[data-v-nilai]').textContent = t.potongan ? '−' + Rp(t.potongan) : '';
    $('cek-donasi').checked = Keranjang.donasi;
    $('total-bayar').textContent = Rp(t.tagihan);
  },

  /** Langkah 1: daftar barang, total, dan kotak Donasi Pangan. */
  renderKeranjang(fokus) {
    const b = Keranjang.baris(), kosong = b.length === 0;
    $('kaki-keranjang').classList.toggle('hidden', kosong);
    $('isi-keranjang').innerHTML = kosong
      ? '<div class="my-8 text-center text-sm text-tua/60 border border-dashed border-tua/20 rounded-2xl p-8">Keranjang masih kosong. Pilih produk di katalog, lalu tekan "Tambah ke Keranjang".</div>'
      : this.stepper(1) + `
        <div class="mt-3 flex items-center justify-between gap-3">
          <button type="button" data-pilih-semua aria-pressed="${Keranjang.semuaTerpilih()}" class="inline-flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-xl border border-tua/20 hover:bg-tua/5">
            <i data-lucide="${Keranjang.semuaTerpilih() ? 'square-check' : 'square'}" class="w-4 h-4"></i>${Keranjang.semuaTerpilih() ? 'Batal Pilih Semua' : 'Pilih Semua'}
          </button>
          <p class="text-xs text-tua/60" aria-live="polite">${b.filter((x) => x.pilih).length} dari ${b.length} barang dipilih</p>
        </div>
        <ul class="mt-1">` + b.map(({ p, qty, pilih }, i) => `
        <li class="flex gap-3 py-3 ${i ? 'border-t border-tua/10' : ''}">
          <input type="checkbox" data-pilih="${p.id}" ${pilih ? 'checked' : ''} class="self-center w-5 h-5 shrink-0 accent-segar cursor-pointer" aria-label="Pilih ${esc(p.nama)} untuk checkout" />
          <div class="${pilih ? '' : 'opacity-50'} w-14 h-14 relative overflow-hidden shrink-0 rounded-xl bg-segar/15 grid place-items-center text-3xl" aria-hidden="true">${p.ikon}${p.foto ? `<img src="${esc(p.foto)}" alt="" loading="lazy" class="absolute inset-0 w-full h-full object-cover" onerror="this.remove()" />` : ''}</div>
          <div class="flex-1 min-w-0 ${pilih ? '' : 'opacity-50'}">
            <p class="font-bold text-sm leading-snug">${p.nama}</p>
            <p class="text-xs text-tua/60">${Rp(p.harga)} / ${p.sat}</p>
            <div class="mt-2 flex items-center justify-between gap-2">
              <div class="inline-flex items-center border border-tua/20 rounded-xl" role="group" aria-label="Jumlah ${p.nama}">
                <button type="button" data-min="${p.id}" class="w-8 h-8 font-bold" aria-label="Kurangi ${p.nama}">−</button>
                <span class="w-8 text-center text-sm font-bold" aria-live="polite">${qty}</span>
                <button type="button" data-plus="${p.id}" class="w-8 h-8 font-bold disabled:opacity-40" aria-label="Tambah ${p.nama}" ${qty >= p.stok ? 'disabled' : ''}>+</button>
              </div>
              <p class="font-extrabold text-sm">${Rp(p.harga * qty)}</p>
            </div>
          </div>
          <button type="button" data-del="${p.id}" class="self-start p-1.5 rounded-lg hover:bg-tua/5" aria-label="Hapus ${p.nama} dari keranjang"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
        </li>`).join('') + '</ul>' + this.htmlVoucher();
    this.renderTotal();
    ikon();
    if (fokus) { const el = $('modal-keranjang').querySelector(fokus + ':not(:disabled)') || $('modal-keranjang').querySelector('[data-tutup]'); if (el) el.focus(); }
  },

  /** Kotak kode voucher subsidi di langkah keranjang: input + Pakai/Lepas, status potongan, dan pilihan cepat. @returns {string} */
  htmlVoucher() {
    const t = Keranjang.total(), aktif = Keranjang.voucher;
    let teks = '', kelas = 'text-tua/60';
    if (t.potongan) { teks = `✓ ${aktif} dipakai: ${VOUCHER_ARTI(aktif)}. Potongan ${Rp(t.potongan)}.`; kelas = 'text-segar'; }
    else if (t.voucherPesan) { teks = `${aktif} belum berlaku. ${t.voucherPesan}`; kelas = 'text-red-700'; }
    else if (this.pesanVoucher) { teks = this.pesanVoucher; kelas = 'text-red-700'; }
    const chip = Object.keys(VOUCHER_ATURAN).map((k) => `<button type="button" data-voucher-pilih="${k}" title="${esc(VOUCHER_ATURAN[k].judul + ' · ' + VOUCHER_ATURAN[k].syarat)}" class="text-xs font-semibold border border-tua/20 rounded-full px-2.5 py-1 hover:bg-tua/5">${k}</button>`).join('');
    return `
      <form id="form-voucher" novalidate class="mt-3 rounded-2xl border border-tua/15 p-3">
        <label for="f-voucher" class="text-sm font-bold inline-flex items-center gap-1.5"><i data-lucide="ticket" class="w-4 h-4"></i>Kode voucher subsidi</label>
        <div class="mt-2 flex gap-2">
          <input id="f-voucher" name="kode" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Mis. PANGANHEMAT" value="${esc(aktif || this.kodeDraf)}" ${aktif ? 'disabled' : ''} aria-describedby="pesan-voucher" class="isian flex-1 min-w-0 uppercase" />
          ${aktif
            ? '<button type="button" data-lepas-voucher class="px-4 py-2 rounded-xl border border-tua/20 font-bold text-sm hover:bg-tua/5">Lepas</button>'
            : '<button type="submit" class="px-4 py-2 rounded-xl bg-tua text-white font-bold text-sm hover:brightness-110">Pakai</button>'}
        </div>
        <p id="pesan-voucher" class="mt-2 text-xs font-semibold ${kelas} ${teks ? '' : 'hidden'}" role="status" aria-live="polite">${esc(teks)}</p>
        ${aktif ? '' : `<div class="mt-2 flex flex-wrap gap-1.5" aria-label="Voucher tersedia">${chip}</div>`}
      </form>`;
  },

  /**
   * Memasang kode voucher bila valid untuk barang yang dicentang; bila tidak, menampilkan alasannya.
   * @param {string} kode
   */
  pakaiVoucher(kode) {
    kode = String(kode || '').replace(/\s+/g, '').toUpperCase();
    this.kodeDraf = kode;
    const h = kode ? Keranjang.hitungVoucher(kode) : { potongan: 0, pesan: 'Masukkan kode voucher terlebih dahulu.' };
    if (!h.potongan) { this.pesanVoucher = h.pesan || 'Voucher tidak bisa dipakai.'; this.render('#f-voucher'); return; }
    Keranjang.voucher = kode; Keranjang.simpan();
    this.pesanVoucher = ''; this.kodeDraf = '';
    toast(`Voucher ${kode} dipakai, hemat ${Rp(h.potongan)}`);
    this.render('[data-lepas-voucher]');
  },

  /** Melepas voucher yang sedang dipakai. */
  lepasVoucher() {
    Keranjang.voucher = null; Keranjang.simpan();
    this.pesanVoucher = ''; this.kodeDraf = '';
    this.render('#f-voucher');
  },

  /** Langkah 2: formulir alamat pengiriman rumah. */
  renderAlamat() {
    const a = this.alamat, t = Keranjang.total();
    $('kaki-keranjang').classList.add('hidden');
    $('isi-keranjang').innerHTML = this.stepper(2) + `
      <form id="form-alamat" novalidate class="pt-3 pb-2 space-y-3">
        <h3 id="judul-langkah" tabindex="-1" class="text-lg font-extrabold outline-none">Alamat pengiriman</h3>
        <p class="text-sm text-tua/70">${Keranjang.jumlahPilih()} barang, total ${Rp(t.tagihan)}. Pesanan diantar kurir komunitas ke rumah Anda.</p>
        ${medan('nama', 'Nama penerima', a.nama, { ac: 'name', ph: 'Nama lengkap' })}
        ${medan('hp', 'Nomor HP', a.hp, { tipe: 'tel', ac: 'tel', ph: '0812 3456 7890' })}
        ${medan('alamat', 'Alamat lengkap', a.alamat, { ac: 'street-address', ph: 'Jalan, nomor rumah, RT/RW', area: true })}
        ${medan('kota', 'Kota / kecamatan', a.kota, { ac: 'address-level2', ph: 'Mis. Depok, Beji' })}
        ${medan('catatan', 'Catatan untuk kurir (opsional)', a.catatan, { ph: 'Mis. titip di pos satpam' })}
        <div class="sticky bottom-0 bg-white py-3 flex gap-2">
          <button type="button" data-balik="keranjang" class="px-4 py-3 rounded-xl border border-tua/20 font-bold hover:bg-tua/5">Kembali</button>
          <button type="submit" class="flex-1 inline-flex justify-center items-center gap-2 bg-tua text-white font-bold px-5 py-3 rounded-xl hover:brightness-110">Lanjut ke Pembayaran</button>
        </div>
      </form>`;
    ikon();
  },

  /** Memvalidasi formulir alamat; bila valid lanjut ke pembayaran. @param {HTMLFormElement} form */
  kirimAlamat(form) {
    let pertama = null; const data = {};
    Object.keys(ATURAN).forEach((k) => {
      const el = form.elements[k], v = el.value.trim(), salah = !ATURAN[k][0](v), err = $('e-' + k);
      data[k] = v;
      err.textContent = salah ? ATURAN[k][1] : ''; err.classList.toggle('hidden', !salah);
      el.setAttribute('aria-invalid', String(salah)); el.style.borderColor = salah ? '#DC2626' : '';
      if (salah && !pertama) pertama = el;
    });
    data.catatan = form.elements.catatan.value.trim();
    this.alamat = data;
    if (pertama) { pertama.focus(); return; }
    this.pindah('bayar');
  },

  /** Nomor virtual account simulasi (16 digit) yang konsisten untuk pesanan & bank terpilih. @returns {string} */
  va() {
    const r = acak(this.noPesanan + this.bank);
    return ('8808' + Array.from({ length: 12 }, () => Math.floor(r() * 10)).join('')).replace(/(\d{4})(?=\d)/g, '$1 ');
  },

  /** Teks tombol bayar menurut metode terpilih. @returns {string} */
  labelBayar() { return this.metode === 'cod' ? 'Pesan Sekarang, Bayar di Tempat' : `Bayar ${Rp(Keranjang.total().tagihan)}`; },

  /** Keterangan satu opsi metode bayar (NusaPay menampilkan saldo aktif). @param {string} k @returns {string} */
  infoMetode(k) {
    if (k !== 'nusapay') return METODE[k].info;
    const s = SaldoPay.saldo(), cukup = s >= Keranjang.total().tagihan;
    return `Saldo aktif ${Rp(s)}${cukup ? '' : ' · tidak cukup untuk pesanan ini'}`;
  },

  /** Panel simulasi sesuai metode: QRIS (kode QR), Transfer Bank (VA), atau COD. @returns {string} */
  panelMetode() {
    const tagihan = Rp(Keranjang.total().tagihan);
    if (this.metode === 'qris') return `<div class="flex flex-col sm:flex-row items-center gap-4">
      <div class="rounded-xl p-2 shrink-0" style="background:#fff">${kodeQr(this.noPesanan)}</div>
      <div class="text-sm space-y-1"><p class="font-bold">Scan untuk membayar ${tagihan}</p>
        <p class="text-tua/70">Buka e-wallet atau m-banking, pilih Scan QR. Kode berlaku 15 menit.</p>
        <p class="text-xs text-tua/60">Simulasi: kode ini contoh dan tidak memproses uang sungguhan.</p></div></div>`;
    if (this.metode === 'transfer') return `
      <label for="pilih-bank" class="text-sm font-semibold">Bank tujuan</label>
      <select id="pilih-bank" class="isian mt-1">${BANK.map((b) => `<option ${b === this.bank ? 'selected' : ''}>${b}</option>`).join('')}</select>
      <p class="mt-3 text-xs text-tua/60">Nomor virtual account <span id="nama-bank">${this.bank}</span></p>
      <p id="no-va" class="font-extrabold text-lg tracking-wider">${this.va()}</p>
      <p class="mt-1 text-sm text-tua/70">Transfer tepat ${tagihan}. Simulasi: tidak ada transfer sungguhan.</p>`;
    if (this.metode === 'nusapay') {
      const s = SaldoPay.saldo(), tg = Keranjang.total().tagihan, cukup = s >= tg;
      return `<div class="flex gap-3 text-sm"><i data-lucide="wallet" class="w-5 h-5 shrink-0 text-segar"></i><div class="space-y-1">
        <p class="font-bold">Saldo NusaPay Pangan: ${Rp(s)}</p>
        ${cukup ? `<p class="text-tua/70">Tagihan ${Rp(tg)}. Sisa saldo setelah bayar <b>${Rp(s - tg)}</b>.</p>`
          : `<p class="font-semibold text-red-700">Saldo kurang ${Rp(tg - s)} dari tagihan ${Rp(tg)}. Isi saldo lewat Top Up NusaPay atau pilih metode lain.</p>`}
        <p class="text-xs text-tua/60">Simulasi: saldo hanya tersimpan di perangkat ini, bukan uang sungguhan.</p></div></div>`;
    }
    return `<div class="flex gap-3 text-sm"><i data-lucide="banknote" class="w-5 h-5 shrink-0 text-segar"></i>
      <p>Siapkan uang pas <b>${tagihan}</b> untuk kurir. Pesanan diantar kurir komunitas NusaPangan. Simulasi: tidak ada uang yang berpindah.</p></div>`;
  },

  /** Langkah 3: pilihan pembayaran simulasi (QRIS, Transfer Bank, COD) dan ringkasan akhir. */
  renderBayar() {
    const t = Keranjang.total(), a = this.alamat;
    if (!this.noPesanan) this.noPesanan = 'NPM-' + Date.now().toString(36).toUpperCase();
    $('kaki-keranjang').classList.add('hidden');
    $('isi-keranjang').innerHTML = this.stepper(3) + `
      <form id="form-bayar" novalidate class="pt-3 pb-2 space-y-4">
        <h3 id="judul-langkah" tabindex="-1" class="text-lg font-extrabold outline-none">Pilih cara bayar</h3>
        <div class="rounded-xl bg-tua/5 p-3 text-sm flex gap-2"><i data-lucide="map-pin" class="w-4 h-4 shrink-0 mt-0.5"></i>
          <p>Dikirim ke <b>${esc(a.nama)}</b>, ${esc(a.alamat)}, ${esc(a.kota)}. <button type="button" data-balik="alamat" class="font-semibold text-segar underline">Ubah</button></p></div>
        <fieldset class="space-y-2"><legend class="sr-only">Metode pembayaran</legend>
          ${Object.keys(METODE).map((k) => `<label class="opsi-bayar flex items-center gap-3 rounded-xl border border-tua/20 p-3 cursor-pointer">
            <input type="radio" name="metode" value="${k}" class="w-4 h-4 accent-segar" ${k === this.metode ? 'checked' : ''} />
            <i data-lucide="${METODE[k].ikon}" class="w-5 h-5 shrink-0"></i>
            <span class="flex-1"><b class="block text-sm">${METODE[k].nama}</b><span class="block text-xs text-tua/70">${this.infoMetode(k)}</span></span></label>`).join('')}
        </fieldset>
        <div id="panel-metode" class="rounded-2xl border border-dashed border-tua/20 p-4" aria-live="polite">${this.panelMetode()}</div>
        <dl class="text-sm space-y-1 border-t border-tua/10 pt-3">
          <div class="flex justify-between"><dt class="text-tua/70">Belanja (${Keranjang.jumlahPilih()} barang)</dt><dd class="font-semibold">${Rp(t.bayar)}</dd></div>
          ${t.potongan ? `<div class="flex justify-between text-segar font-semibold"><dt>🎟️ Voucher ${esc(t.voucher)}</dt><dd>−${Rp(t.potongan)}</dd></div>` : ''}
          ${t.donasi ? `<div class="flex justify-between text-segar font-semibold"><dt>💚 Donasi Pangan</dt><dd>${Rp(t.donasi)}</dd></div>` : ''}
          <div class="flex justify-between text-lg font-extrabold"><dt>Total bayar</dt><dd>${Rp(t.tagihan)}</dd></div>
        </dl>
        ${this.galat ? `<p class="text-sm font-semibold text-red-700" role="alert">${esc(this.galat)}</p>` : ''}
        <div class="sticky bottom-0 bg-white py-3 flex gap-2">
          <button type="button" data-balik="alamat" class="px-4 py-3 rounded-xl border border-tua/20 font-bold hover:bg-tua/5">Kembali</button>
          <button type="submit" id="btn-bayar" class="flex-1 inline-flex justify-center items-center gap-2 bg-tua text-white font-bold px-5 py-3 rounded-xl hover:brightness-110 disabled:opacity-70"><span data-label>${this.labelBayar()}</span></button>
        </div>
      </form>`;
    this.galat = '';
    ikon();
  },

  /** Memulai pemrosesan simulasi (tombol berputar sebentar) lalu menyelesaikan pesanan. */
  bayar() {
    if (this.sibuk) return;
    if (this.metode === 'nusapay') { // saldo dicek sebelum proses dimulai
      const s = SaldoPay.saldo(), tg = Keranjang.total().tagihan;
      if (s < tg) { this.galat = `Saldo NusaPay Pangan tidak cukup (kurang ${Rp(tg - s)}). Isi saldo lewat Top Up atau pilih metode lain.`; this.renderBayar(); return; }
    }
    this.sibuk = true;
    const b = $('btn-bayar'); b.disabled = true;
    b.innerHTML = '<span class="inline-block w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-hidden="true"></span><span>Memproses pembayaran…</span>';
    setTimeout(() => {
      this.sibuk = false;
      if (!$('modal-keranjang').open || this.mode !== 'bayar') return; // modal ditutup saat diproses: pesanan dibatalkan
      this.selesai();
    }, REDUKSI ? 150 : 1200);
  },

  /**
   * Menyimpan pesanan ke riwayat (LocalStorage), mengeluarkan barang terpilih dari keranjang, mereset donasi,
   * lalu menampilkan layar sukses. Hanya kota yang disimpan, bukan alamat lengkap.
   */
  selesai() {
    const b = Keranjang.barisPilih(), t = Keranjang.total();
    if (!b.length) { this.pindah('keranjang'); return; }
    const pesanan = {
      id: this.noPesanan, tgl: new Date().toISOString(),
      item: b.map(({ p, qty }) => ({ id: p.id, nama: p.nama, sat: p.sat, qty, harga: p.harga })),
      belanja: t.bayar, donasi: t.donasi, bayar: t.tagihan, pasar: t.pasar, hemat: t.hemat,
      voucher: t.voucher, potongan: t.potongan,
      metode: this.metode, kota: this.alamat.kota, status: 'berlangsung'
    };
    // NusaPay: saldo dicek ulang (bisa berubah selama proses) lalu dikurangi sebelum pesanan dicatat
    let saldoLama = null;
    if (this.metode === 'nusapay') {
      saldoLama = SaldoPay.ambil();
      if (saldoLama.saldo < t.tagihan) { this.galat = `Saldo NusaPay Pangan tidak cukup (kurang ${Rp(t.tagihan - saldoLama.saldo)}). Isi saldo lewat Top Up atau pilih metode lain.`; this.render(); return; }
      if (!SaldoPay.set(saldoLama.saldo - t.tagihan)) { this.galat = 'Saldo gagal diperbarui: penyimpanan perangkat penuh atau tidak tersedia.'; this.render(); return; }
    }
    const r = Riwayat.data(); r.unshift(pesanan);
    if (!Simpan.simpan('riwayatBelanja', r.slice(0, 30))) {
      if (saldoLama) SaldoPay.set(saldoLama.saldo, saldoLama.sembunyi); // batalkan pemotongan saldo
      this.galat = 'Penyimpanan perangkat penuh. Hapus riwayat lama terlebih dahulu, lalu coba lagi.'; this.render(); return;
    }
    this.mode = 'sukses';
    // Hanya barang yang dicentang yang ikut ter-checkout; barang tidak dicentang tetap tersimpan di keranjang.
    b.forEach(({ p }) => { delete Keranjang.item[p.id]; delete Keranjang.pilih[p.id]; });
    Keranjang.donasi = false; Keranjang.voucher = null; this.pesanVoucher = ''; this.kodeDraf = '';
    Keranjang.simpan(); Keranjang.segarkan(); Riwayat.render();
    this.renderSukses(pesanan);
  },

  /** Layar sukses: centang beranimasi, ringkasan pesanan, dan ucapan terima kasih donasi. @param {Object} p pesanan tersimpan */
  renderSukses(p) {
    const tiba = new Date(); tiba.setDate(tiba.getDate() + 1);
    const baris = (k, v) => `<div class="flex justify-between gap-3"><dt class="text-tua/70">${k}</dt><dd class="font-semibold text-right">${v}</dd></div>`;
    $('kaki-keranjang').classList.add('hidden');
    $('isi-keranjang').innerHTML = `
      <div class="relative overflow-hidden py-8 text-center" id="area-sukses">
        <svg viewBox="0 0 56 56" class="mx-auto w-20 h-20" aria-hidden="true" fill="none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
          <circle class="cek-lingkar" cx="28" cy="28" r="25" stroke="#40916C"/><path class="cek-tanda" d="M17 29l8 8 14-16" stroke="#F4A261"/></svg>
        <h3 id="judul-langkah" tabindex="-1" class="mt-4 text-xl font-extrabold outline-none">Pesanan berhasil (simulasi)</h3>
        <p class="mt-1 text-sm text-tua/70">Nomor ${esc(p.id)}</p>
        <dl class="mt-5 text-sm space-y-2 text-left rounded-2xl border border-tua/10 p-4">
          ${baris('Dikirim ke', `${esc(this.alamat.nama)}, ${esc(p.kota)}`)}
          ${baris('Estimasi tiba', tiba.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }))}
          ${baris('Metode bayar', esc(METODE[p.metode].nama))}
          ${p.potongan ? baris(`Voucher ${esc(p.voucher)}`, `<span class="text-segar">−${Rp(p.potongan)}</span>`) : ''}
          ${baris('Dibayar', Rp(p.bayar))}
          ${p.metode === 'nusapay' ? baris('Sisa saldo NusaPay', Rp(SaldoPay.saldo())) : ''}
          ${baris('Total hemat', `<span class="text-segar">${Rp(p.hemat)}</span>`)}
        </dl>
        ${p.donasi ? `<p class="mt-4 rounded-2xl border border-panen/60 bg-panen/10 p-4 text-sm text-left leading-relaxed">💚 <b>Terima kasih!</b> Donasi ${Rp(p.donasi)} Anda dicatat sebagai dukungan aksi Food Rescue untuk Paket Pangan Warga Pra-Sejahtera. <a href="foodrescue.html" class="font-semibold text-segar underline">Lihat gerakan Food Rescue</a></p>` : ''}
        <div class="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
          <button type="button" data-riwayat class="px-5 py-3 rounded-xl border border-tua/20 font-bold hover:bg-tua/5">Lihat daftar transaksi</button>
          <button type="button" data-tutup class="px-5 py-3 rounded-xl bg-tua text-white font-bold hover:brightness-110">Lanjut belanja</button>
        </div>
      </div>`;
    ikon();
    $('judul-langkah').focus();
    konfeti($('area-sukses'));
    toast(`Hemat ${Rp(p.hemat)} untuk keluarga Anda`);
  },

  /** Memasang semua event modal dan tombol pembukanya (delegasi). */
  init() {
    const d = $('modal-keranjang');
    d.addEventListener('cancel', (e) => { e.preventDefault(); this.tutup(); }); // Esc
    d.addEventListener('close', () => { this.mode = 'keranjang'; this.sibuk = false; });
    d.addEventListener('click', (e) => {
      if (e.target === d) { this.tutup(); return; } // klik latar
      const t = e.target.closest('button'); if (!t) return;
      const k = t.dataset;
      if (t.hasAttribute('data-tutup')) this.tutup();
      else if (k.plus) { Keranjang.ubah(k.plus, 1); this.render(`[data-plus="${k.plus}"]`); }
      else if (k.min) { Keranjang.ubah(k.min, -1); this.render(`[data-min="${k.min}"]`); }
      else if (k.del) { Keranjang.hapus(k.del); this.render(); }
      else if (t.hasAttribute('data-pilih-semua')) { Keranjang.pilihSemua(!Keranjang.semuaTerpilih()); this.render('[data-pilih-semua]'); }
      else if (k.voucherPilih) this.pakaiVoucher(k.voucherPilih);
      else if (t.hasAttribute('data-lepas-voucher')) this.lepasVoucher();
      else if (k.balik) this.pindah(k.balik);
      else if (t.hasAttribute('data-riwayat')) { location.href = 'transaksi.html'; }
      else if (t.id === 'btn-checkout') {
        if (!Keranjang.jumlah()) toast('Keranjang masih kosong');
        else if (!Keranjang.jumlahPilih()) toast('Centang minimal satu barang untuk checkout');
        else this.pindah('alamat');
      }
      else if (t.id === 'btn-kosongkan') { if (Keranjang.jumlah() && confirm('Kosongkan semua barang di keranjang?')) { Keranjang.item = {}; Keranjang.pilih = {}; Keranjang.simpan(); Keranjang.segarkan(); } }
    });
    d.addEventListener('submit', (e) => {
      e.preventDefault();
      if (e.target.id === 'form-alamat') this.kirimAlamat(e.target);
      else if (e.target.id === 'form-bayar') this.bayar();
      else if (e.target.id === 'form-voucher') this.pakaiVoucher(e.target.elements.kode.value);
    });
    d.addEventListener('input', (e) => { // hapus pesan galat saat kolom diperbaiki
      const el = e.target;
      if (el.id === 'f-voucher') this.kodeDraf = el.value; // simpan ketikan agar tidak hilang saat keranjang digambar ulang
      if (el.getAttribute('aria-invalid') === 'true') { el.setAttribute('aria-invalid', 'false'); el.style.borderColor = ''; const g = $('e-' + el.name); if (g) g.classList.add('hidden'); }
    });
    d.addEventListener('change', (e) => {
      const t = e.target;
      if (t.dataset && t.dataset.pilih) { // centang barang: total ikut diperbarui
        Keranjang.setPilih(t.dataset.pilih, t.checked); this.render(`[data-pilih="${t.dataset.pilih}"]`);
      } else if (t.id === 'cek-donasi') {
        Keranjang.donasi = t.checked; Keranjang.simpan(); this.renderTotal();
        const l = $('label-donasi'); l.classList.remove('denyut'); void l.offsetWidth; if (t.checked) l.classList.add('denyut');
      } else if (t.name === 'metode') {
        this.metode = t.value;
        $('panel-metode').innerHTML = this.panelMetode(); $('btn-bayar').querySelector('[data-label]').textContent = this.labelBayar(); ikon();
      } else if (t.id === 'pilih-bank') {
        this.bank = t.value; $('no-va').textContent = this.va(); $('nama-bank').textContent = this.bank;
      }
    });
    document.addEventListener('click', (e) => { if (e.target.closest('#btn-keranjang, [data-buka-keranjang]')) this.buka(); });
  }
};

/* =====================================================================
 * QUICK VIEW (PRATINJAU CEPAT PRODUK)
 * ---------------------------------------------------------------------
 * Fitur: pengatur jumlah + "Beli Langsung", rating & ulasan, lencana keunggulan
 * per kategori, wishlist (LocalStorage "nusapangan:wishlist"), dan gaya kontras
 * tinggi untuk Mode Terang maupun Mode Malam (html.dark). Seluruh warna isi modal
 * dikendalikan variabel CSS kelas .qv (lihat QV_CSS), sehingga tidak bergantung
 * pada warna latar dialog.
 * ===================================================================== */

/** Wishlist produk: daftar id produk di LocalStorage kunci "nusapangan:wishlist". */
const WishlistProduk = {
  KEY: 'nusapangan:wishlist',

  /** @returns {string[]} id produk yang disimpan (data rusak diabaikan) */
  daftar() {
    try {
      const d = JSON.parse(localStorage.getItem(this.KEY) || '[]');
      return Array.isArray(d) ? d.filter((x) => typeof x === 'string') : [];
    } catch (e) { return []; }
  },

  /** @param {string} id @returns {boolean} */
  ada(id) { return this.daftar().includes(String(id)); },

  /**
   * Menambah/menghapus id dari wishlist.
   * @param {string} id
   * @returns {?boolean} true = kini tersimpan, false = dihapus, null = penyimpanan gagal
   */
  ubah(id) {
    id = String(id);
    const d = this.daftar(), i = d.indexOf(id);
    if (i >= 0) d.splice(i, 1); else d.push(id);
    try { localStorage.setItem(this.KEY, JSON.stringify(d)); } catch (e) { return null; }
    return i < 0;
  }
};

/** Lencana keunggulan di bawah foto, menurut kategori produk. Kategori lain memakai bawaan. */
const QV_BADGE_DEFAULT = ['🌿 100% Organik & Alami', '⏱️ Panen Cepat / Siap Pakai', '🛡️ Garansi Kualitas'];
const QV_BADGE = {
  benih: ['🌱 Benih Alami, Daya Tumbuh Teruji', '⏱️ Cepat Tumbuh & Panen', '🛡️ Garansi Kualitas'],
  'alat-tani': ['🔩 Bahan Kokoh & Tahan Lama', '⏱️ Siap Pakai di Kebun', '🛡️ Garansi Kualitas'],
  'alat-hidro': ['💧 Mudah Dirakit di Rumah', '⏱️ Panen Cepat dari Teras', '🛡️ Garansi Kualitas'],
  'bahan-hidro': ['🧪 Takaran Akurat & Aman', '⏱️ Siap Pakai', '🛡️ Garansi Kualitas']
};

/** CSS Quick View. Warna lewat variabel: terang = teks gelap di latar putih, malam (html.dark) = teks terang di latar gelap. */
const QV_CSS = `
.qv{--qv-bg:#ffffff;--qv-bg2:#f2f8f4;--qv-teks:#10261a;--qv-sub:#34503f;--qv-garis:#9fb8a9;--qv-aksen:#0f6a3e;--qv-coret:#566b5f;--qv-amber:#8a4300;--qv-red:#b91c1c;--qv-trek:rgba(16,38,26,.14);background:var(--qv-bg);color:var(--qv-teks);border-radius:inherit}
html.dark .qv{--qv-bg:#0d1912;--qv-bg2:#16291f;--qv-teks:#f4faf6;--qv-sub:#c9dad0;--qv-garis:#4a7a60;--qv-aksen:#7ae8ae;--qv-coret:#a9bfb2;--qv-amber:#ffc977;--qv-red:#ff9a9a;--qv-trek:rgba(244,250,246,.2)}
.qv h2,.qv h3,.qv b,.qv li{color:var(--qv-teks)}
.qv p,.qv span.qv-ikut{color:inherit}
.qv .qv-sub{color:var(--qv-sub)}
.qv .qv-aksen{color:var(--qv-aksen)}
.qv s{color:var(--qv-coret)}
.qv .text-green-900{color:var(--qv-aksen)!important}
.qv .text-amber-700{color:var(--qv-amber)!important}
.qv .text-red-700{color:var(--qv-red)!important}
.qv [role=progressbar]{background:var(--qv-trek)!important}
.qv-kiri{background:var(--qv-bg2);border-color:var(--qv-garis)!important}
.qv-kartu{background:var(--qv-bg2);border:1px solid var(--qv-garis);border-radius:.85rem}
.qv-ikon{background:var(--qv-trek);color:var(--qv-aksen)}
.qv-ceklis{color:var(--qv-aksen)}
.qv-tips{background:#fff3e0;border:1px solid #cf8a3c;color:#2b1a05;border-radius:1rem}
.qv-tips h3,.qv-tips li,.qv-tips p{color:#2b1a05}
html.dark .qv-tips{background:#2c2312;border-color:#b0802f}
html.dark .qv-tips h3,html.dark .qv-tips li,html.dark .qv-tips p{color:#fbf0da}
.qv-hijau{background:#e8f5ed;border:1px solid #6fae8c;border-radius:1rem}
html.dark .qv-hijau{background:#12291d;border-color:#4a8a66}
.qv-bulat{background:#0f6a3e;color:#fff}
html.dark .qv-bulat{background:#4ade95;color:#04170c}
.qv-rantai{background:var(--qv-garis)}
.qv-rating{display:inline-flex;align-items:center;gap:.4rem;flex-wrap:wrap;background:#dcf4e5;color:#073d22;border:1px solid #4f9f74;border-radius:9999px;padding:.3rem .8rem;font-size:.78rem;font-weight:700;line-height:1.3}
.qv .qv-rating b,.qv .qv-rating span{color:#073d22}
html.dark .qv-rating{background:#14412b;border-color:#58bd8b}
html.dark .qv .qv-rating b,html.dark .qv .qv-rating span{color:#d9fbe7}
.qv .qv-rating .qv-bintang{color:#9a4a00;letter-spacing:1px}
html.dark .qv .qv-rating .qv-bintang{color:#ffd166}
.qv-lencana{display:inline-flex;align-items:center;gap:.35rem;background:var(--qv-bg);color:var(--qv-teks);border:1px solid var(--qv-garis);border-radius:9999px;padding:.35rem .75rem;font-size:.75rem;font-weight:700;line-height:1.25}
.qv-qty{display:inline-flex;align-items:center;border:2px solid var(--qv-garis);border-radius:.75rem;background:var(--qv-bg)}
.qv-qty button{width:2.6rem;height:2.6rem;font-size:1.3rem;font-weight:800;color:var(--qv-teks);border-radius:.6rem}
.qv-qty button:hover:not(:disabled){background:var(--qv-trek)}
.qv-qty button:disabled{opacity:.35;cursor:not-allowed}
.qv-qty .qv-angka{min-width:2.6rem;text-align:center;font-weight:800;color:var(--qv-teks)}
.qv-qty input.qv-angka{width:3.6rem;height:2.6rem;padding:0 .25rem;border:0;border-radius:0;background:transparent;font:inherit;font-weight:800;font-size:1rem;-moz-appearance:textfield;appearance:textfield}
.qv-qty input.qv-angka::-webkit-outer-spin-button,.qv-qty input.qv-angka::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.qv-qty input.qv-angka:focus-visible{outline:3px solid var(--qv-aksen);outline-offset:-3px}
.qv-qty input.qv-angka:disabled{opacity:.5;cursor:not-allowed}
.qv-btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;font-weight:800;padding:.8rem 1.25rem;border-radius:.75rem;transition:filter .15s,transform .15s}
.qv-btn:hover:not(:disabled){filter:brightness(1.1)}
.qv-btn:active:not(:disabled){transform:scale(.98)}
.qv-btn:disabled{opacity:.5;cursor:not-allowed}
.qv-beli{background:#b93800;color:#fff}
.qv-utama{background:#0f6a3e;color:#fff}
.qv-garisbtn{border:2px solid var(--qv-garis);color:var(--qv-teks);background:transparent}
.qv-garisbtn:hover{background:var(--qv-trek)}
html.dark .qv-beli{background:#ffb066;color:#1c0f00}
html.dark .qv-utama{background:#4ade95;color:#04170c}
.qv-wish{width:3.1rem;flex-shrink:0;display:grid;place-items:center;border:2px solid var(--qv-garis);border-radius:.75rem;color:var(--qv-teks);background:var(--qv-bg);transition:transform .15s,color .15s}
.qv-wish:hover{transform:scale(1.06)}
.qv-wish[aria-pressed="true"]{color:#c70029;border-color:#c70029;background:rgba(199,0,41,.1)}
html.dark .qv-wish[aria-pressed="true"]{color:#ff7a95;border-color:#ff7a95;background:rgba(255,122,149,.14)}
.qv-wish[aria-pressed="true"] svg{fill:currentColor}
.qv button:focus-visible,.qv a:focus-visible{outline:3px solid var(--qv-aksen);outline-offset:2px}
@media (prefers-reduced-motion:reduce){.qv-btn,.qv-wish{transition:none}}
`;

const Detail = {
  /** Produk yang sedang dibuka dan jumlah yang dipilih. */
  p: null,
  qty: 1,

  /** Memasang CSS Quick View satu kali. */
  pasangGaya() {
    if (document.getElementById('qv-gaya')) return;
    const s = document.createElement('style');
    s.id = 'qv-gaya'; s.textContent = QV_CSS;
    document.head.appendChild(s);
  },

  /**
   * Rating & jumlah ulasan. Memakai p.rating / p.ulasan bila ada; bila tidak, nilai simulasi
   * yang konsisten (diturunkan dari id produk) agar tidak berubah tiap dibuka.
   * @param {Produk} p @returns {{r:number, n:number}}
   */
  rating(p) {
    let h = 0; const s = String(p.id);
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    const r = typeof p.rating === 'number' ? p.rating : 4.5 + (h % 6) / 10;
    const n = typeof p.ulasan === 'number' ? p.ulasan : 12 + ((h >>> 3) % 140);
    return { r: Math.min(5, Math.max(0, r)), n };
  },

  /** @param {Produk} p @returns {string[]} tiga lencana keunggulan sesuai kategori */
  lencana(p) {
    if (p.kat === 'resep') return ['🌿 Bahan Segar & Alami', `⏱️ Siap Masak${p.resep ? ` ${p.resep.menit} menit` : ''}`, '🛡️ Garansi Kualitas'];
    return QV_BADGE[p.kat] || QV_BADGE_DEFAULT;
  },

  /** Ikon hati (SVG sendiri; warna isi diatur CSS lewat aria-pressed). @returns {string} */
  hati() {
    return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/></svg>';
  },

  /**
   * HTML isi Quick View: foto berbingkai + lencana keunggulan, rating, kontrol jumlah & Beli Langsung,
   * wishlist, indikator kepercayaan, deskripsi, tips pakai & tanam, isi paket, dan traceability.
   * @param {Produk} p @returns {string}
   */
  isi(p) {
    const tips = [].concat(p.tips), bahan = p.isi ? p.isi.split(', ') : [];
    const jaminan = [['truck', 'Dikirim langsung dari hub/penangkar lokal', 'Lebih segar, tanpa perantara berlapis'], ['shield-check', 'Jaminan kualitas & daya tumbuh', 'Tidak sesuai? Kami bantu ganti']];
    const rantai = [['sprout', 'Mitra Lokal', p.asal], ['warehouse', 'Hub NusaPangan', `± ${p.km} km dari mitra`], ['home', 'Kebun Anda', 'Tanpa tengkulak']];
    const { r, n } = this.rating(p), bintang = Math.round(r);
    const fav = WishlistProduk.ada(p.id);
    return `
    <div class="qv grid md:grid-cols-5">
      <div class="qv-kiri md:col-span-2 p-4 md:p-5 border-b md:border-b-0 md:border-r">
        <div class="md:sticky md:top-4 w-full max-w-[22rem] md:max-w-none mx-auto">
          <div style="background:#ffffff" class="relative aspect-square rounded-2xl overflow-hidden ring-1 ring-black/10 shadow-sm flex items-center justify-center">
            <span class="text-[6rem] md:text-[7rem] leading-none" aria-hidden="true">${p.ikon}</span>
            ${p.foto ? `<img src="${esc(p.foto)}" alt="Foto ${esc(p.nama)}" loading="eager" decoding="async" style="background:#ffffff" class="absolute inset-0 w-full h-full object-contain object-center p-4 md:p-5" onerror="this.remove()" />` : ''}
            <span style="color:#14301f;background:#F4A261" class="absolute top-3 left-3 z-10 text-xs font-extrabold rounded-full px-3 py-1 shadow-sm">Hemat ${persenHemat(p)}%</span>
          </div>
          <ul class="mt-3 flex flex-wrap gap-2" aria-label="Keunggulan produk">${this.lencana(p).map((x) => `<li class="qv-lencana">${esc(x)}</li>`).join('')}</ul>
        </div>
      </div>
      <div class="md:col-span-3 p-5 md:p-7 space-y-5">
        <div class="pr-10">
          <p class="qv-aksen text-xs font-bold">${esc(KATEGORI[p.kat])}</p>
          <h2 id="judul-detail" class="mt-1 text-2xl md:text-3xl font-extrabold leading-tight">${p.nama}</h2>
          <p class="qv-sub mt-1 text-sm flex items-start gap-1"><i data-lucide="map-pin" class="w-4 h-4 shrink-0 mt-0.5"></i>${p.asal}</p>
          <p class="mt-3"><span class="qv-rating" role="img" aria-label="Rating ${r.toFixed(1)} dari 5, berdasarkan ${n} ulasan pembeli"><span class="qv-bintang" aria-hidden="true">${'★'.repeat(bintang)}${'☆'.repeat(5 - bintang)}</span><b>${r.toFixed(1)} / 5.0</b><span>dari ${n} ulasan pembeli</span></span></p>
        </div>
        <div class="flex items-baseline gap-x-3 flex-wrap">
          <span class="text-3xl font-extrabold">${Rp(p.harga)}</span><span class="qv-sub text-sm">/ ${p.sat}</span><s class="text-sm">${Rp(p.pasar)}</s>
          <span class="qv-aksen w-full text-sm font-bold">Hemat ${Rp(p.pasar - p.harga)} dari harga pasar</span>
        </div>
        ${Stok.html(p)}
        <section class="qv-kartu p-4 space-y-3" aria-label="Beli produk">
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <div class="qv-qty" role="group" aria-label="Jumlah pembelian ${esc(p.nama)}">
              <button type="button" id="qv-min" data-qv-min aria-label="Kurangi jumlah">−</button>
              <input type="number" id="qv-qty" class="qv-angka" min="1" max="${p.stok}" step="1" value="1" inputmode="numeric" pattern="[0-9]*" autocomplete="off" aria-label="Jumlah pembelian ${esc(p.nama)} (maksimal ${p.stok})" />
              <button type="button" id="qv-plus" data-qv-plus aria-label="Tambah jumlah">+</button>
            </div>
            <p class="text-sm text-right"><span class="qv-sub">Subtotal</span> <b id="qv-sub" class="text-lg font-extrabold">${Rp(p.harga)}</b></p>
          </div>
          <p id="qv-info" class="qv-sub text-xs" aria-live="polite"></p>
          <div class="flex gap-2">
            <button type="button" id="qv-beli" data-qv-beli class="qv-btn qv-beli flex-1"><i data-lucide="zap" class="w-4 h-4"></i><span data-qv-label>Beli Langsung</span></button>
            <button type="button" id="qv-wish" data-qv-wish aria-pressed="${fav}" aria-label="${fav ? 'Hapus dari wishlist' : 'Simpan ke wishlist'}" title="${fav ? 'Hapus dari wishlist' : 'Simpan ke wishlist'}" class="qv-wish">${this.hati()}</button>
          </div>
          <div class="flex gap-2">
            <button type="button" data-tambah="${p.id}" class="qv-btn qv-utama flex-1"><i data-lucide="shopping-cart" class="w-4 h-4"></i><span data-label>Tambah ke Keranjang</span></button>
            <button type="button" data-tutup class="qv-btn qv-garisbtn">Tutup</button>
          </div>
        </section>
        <ul class="grid sm:grid-cols-2 gap-2" aria-label="Jaminan NusaPangan">${jaminan.map((j) => `
          <li class="qv-kartu flex items-start gap-3 p-3">
            <span class="qv-ikon shrink-0 w-8 h-8 rounded-full grid place-items-center"><i data-lucide="${j[0]}" class="w-4 h-4"></i></span>
            <span class="min-w-0"><span class="block text-xs font-bold leading-snug">${j[1]}</span><span class="qv-sub block mt-0.5 text-[11px] leading-snug">${j[2]}</span></span>
          </li>`).join('')}</ul>
        <p class="qv-sub text-sm leading-relaxed">${p.desk}</p>
        ${bahan.length ? `<section><h3 class="font-bold text-sm">Isi paket${p.resep ? ` untuk ${p.resep.porsi} porsi, ${p.resep.menit} menit` : ''}</h3>
          <ul class="mt-2 grid sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">${bahan.map((x) => `<li class="flex gap-2"><i data-lucide="check" class="qv-ceklis w-4 h-4 shrink-0 mt-0.5"></i>${esc(x)}</li>`).join('')}</ul></section>` : ''}
        <section class="qv-tips p-4">
          <h3 class="font-bold text-sm flex items-center gap-2"><i data-lucide="lightbulb" class="w-4 h-4"></i>Tips pakai &amp; tanam</h3>
          ${tips.length > 1 ? `<ol class="mt-2 list-decimal pl-5 space-y-1 text-sm leading-relaxed">${tips.map((x) => `<li>${x}</li>`).join('')}</ol>` : `<p class="mt-2 text-sm leading-relaxed">${tips[0]}</p>`}
        </section>
        <section class="qv-hijau p-4" aria-labelledby="judul-trace">
          <h3 id="judul-trace" class="font-bold text-sm flex items-center gap-2"><i data-lucide="route" class="qv-aksen w-4 h-4"></i>Jejak asal-usul dan rantai pasok pendek</h3>
          <ol class="mt-3 flex items-start">${rantai.map((s, i) => `
            <li class="relative flex-1 min-w-0 flex flex-col items-center text-center">
              <span class="qv-bulat relative z-10 w-9 h-9 rounded-full grid place-items-center"><i data-lucide="${s[0]}" class="w-4 h-4"></i></span>
              <span class="mt-1.5 text-xs font-bold">${s[1]}</span>
              <span class="qv-sub px-1 text-[11px] leading-tight">${s[2]}</span>
              ${i < 2 ? '<span class="qv-rantai absolute top-[1.125rem] left-1/2 w-full h-0.5" aria-hidden="true"></span>' : ''}
            </li>`).join('')}</ol>
          <p class="mt-3 text-sm italic">“${p.cerita}”</p>
          <p class="qv-sub mt-2 text-xs">${INFO_PANEN[p.kat]}. Hanya satu simpul (hub NusaPangan) antara mitra dan kebun Anda.</p>
        </section>
        <p class="qv-sub text-xs">Data produk, petani, jarak, rating, dan ulasan adalah simulasi untuk demo.</p>
      </div>
    </div>`;
  },

  /**
   * Menyelaraskan kontrol jumlah, subtotal, info, dan tombol Beli Langsung dengan stok & isi keranjang.
   * @param {string} [pesan] teks info pengganti (mis. pemberitahuan jumlah disesuaikan)
   */
  sinkron(pesan) {
    const p = this.p; if (!p || !$('qv-qty')) return;
    const kini = Keranjang.item[p.id] || 0, sisa = Math.max(0, p.stok - kini);
    this.qty = sisa === 0 ? 0 : Math.max(1, Math.min(this.qty || 1, sisa));
    const inp = $('qv-qty');
    inp.value = this.qty; inp.max = sisa; inp.min = sisa === 0 ? 0 : 1; inp.disabled = sisa === 0;
    $('qv-min').disabled = this.qty <= 1;
    $('qv-plus').disabled = this.qty >= sisa;
    $('qv-sub').textContent = Rp(p.harga * this.qty);
    $('qv-info').textContent = pesan ? pesan : p.stok === 0 ? 'Stok habis.'
      : sisa === 0 ? `Seluruh stok (${p.stok} ${p.sat}) sudah ada di keranjang Anda.`
      : `Maksimal ${sisa} ${p.sat}${kini ? `, ${kini} sudah di keranjang` : ''}.`;
    const b = $('qv-beli'); b.disabled = p.stok === 0;
    b.querySelector('[data-qv-label]').textContent = p.stok === 0 ? 'Stok Habis' : sisa === 0 ? 'Buka Keranjang & Bayar' : 'Beli Langsung';
  },

  /**
   * Menangani ketikan langsung pada kolom jumlah. Saat kolom kosong/sedang diketik, nilai tidak dipaksa;
   * angka valid langsung memperbarui jumlah & subtotal, dibatasi 1 sampai sisa stok.
   * @param {HTMLInputElement} el @param {boolean} final true saat change/blur (kolom kosong/tak valid dikembalikan)
   */
  ketik(el, final) {
    const p = this.p; if (!p) return;
    const sisa = Math.max(0, p.stok - (Keranjang.item[p.id] || 0));
    if (sisa === 0) { this.sinkron(); return; }
    const mentah = el.value.trim(), n = Math.floor(Number(mentah));
    if (mentah === '' || !isFinite(n)) { if (final) this.sinkron(); return; } // masih mengetik: jangan timpa
    const bat = Math.max(1, Math.min(n, sisa));
    this.qty = bat;
    if (n > sisa) this.sinkron(`Jumlah disesuaikan ke maksimal ${sisa} ${p.sat}.`);
    else if (n < 1) this.sinkron('Jumlah minimal 1.');
    else if (final) this.sinkron();
    else { // angka valid saat mengetik: perbarui tanpa menulis ulang isi kolom
      $('qv-sub').textContent = Rp(p.harga * this.qty);
      $('qv-min').disabled = this.qty <= 1; $('qv-plus').disabled = this.qty >= sisa;
    }
  },

  /** Beli Langsung: masukkan jumlah terpilih ke keranjang, tutup Quick View, buka keranjang/checkout. @param {HTMLElement} tombol */
  beli(tombol) {
    const p = this.p; if (!p || p.stok === 0) return;
    const sisa = p.stok - (Keranjang.item[p.id] || 0);
    if (sisa > 0 && this.qty > 0) Keranjang.ubah(p.id, Math.min(this.qty, sisa), tombol);
    if (Keranjang.item[p.id]) { Keranjang.pilih[p.id] = true; Keranjang.simpan(); } // Beli Langsung selalu mencentang barang ini
    tutupDialog($('modal-detail'));
    Modal.buka();
  },

  /** Simpan/hapus dari wishlist dan perbarui tampilan tombol hati. @param {HTMLElement} b */
  wish(b) {
    if (!this.p) return;
    const aktif = WishlistProduk.ubah(this.p.id);
    if (aktif === null) { toast('Wishlist gagal disimpan: penyimpanan perangkat tidak tersedia'); return; }
    const label = aktif ? 'Hapus dari wishlist' : 'Simpan ke wishlist';
    b.setAttribute('aria-pressed', String(aktif)); b.setAttribute('aria-label', label); b.title = label;
    toast(aktif ? 'Produk disimpan ke wishlist' : 'Produk dihapus dari wishlist');
  },

  /** Membuka Quick View untuk satu produk. @param {string} id */
  buka(id) {
    const p = cariProduk(id), d = $('modal-detail'); if (!p) return;
    this.pasangGaya();
    this.p = p; this.qty = 1;
    $('isi-detail').innerHTML = this.isi(p);
    $('isi-detail').scrollTop = 0;
    ikon(); Keranjang.segarkan(); this.sinkron();
    if (!d.open) d.showModal();
  },

  /** Memasang event Quick View (tutup, Esc, klik latar, jumlah, beli langsung, wishlist, tambah ke keranjang). */
  init() {
    const d = $('modal-detail');
    this.pasangGaya();
    d.addEventListener('cancel', (e) => { e.preventDefault(); tutupDialog(d); });
    d.addEventListener('click', (e) => {
      if (e.target === d) { tutupDialog(d); return; }
      const t = e.target.closest('button'); if (!t || t.disabled) return;
      if (t.hasAttribute('data-tutup')) tutupDialog(d);
      else if (t.hasAttribute('data-qv-min')) { this.qty--; this.sinkron(); }
      else if (t.hasAttribute('data-qv-plus')) { this.qty++; this.sinkron(); }
      else if (t.hasAttribute('data-qv-beli')) this.beli(t);
      else if (t.hasAttribute('data-qv-wish')) this.wish(t);
      else if (t.dataset.tambah) { Keranjang.ubah(t.dataset.tambah, 1, t); this.sinkron(); }
    });
    // Input jumlah via keyboard
    d.addEventListener('input', (e) => { if (e.target.id === 'qv-qty') this.ketik(e.target, false); });
    d.addEventListener('change', (e) => { if (e.target.id === 'qv-qty') this.ketik(e.target, true); });
    d.addEventListener('keydown', (e) => {
      if (e.target.id !== 'qv-qty') return;
      if (['e', 'E', '+', '-', '.', ','].includes(e.key)) e.preventDefault(); // hanya bilangan bulat positif
      else if (e.key === 'Enter') { e.preventDefault(); this.ketik(e.target, true); }
    });
    d.addEventListener('wheel', (e) => { if (e.target.id === 'qv-qty') e.target.blur(); }, { passive: true }); // cegah ubah angka tak sengaja
  }
};

/* =====================================================================
 * KATALOG: pencarian real-time + filter kategori
 * ===================================================================== */

const Katalog = {
  kat: 'semua',
  kata: '',
  /** Isi wishlist saat grid terakhir digambar (untuk menyegarkan filter Wishlist setelah Quick View). */
  wlSnap: '',

  /**
   * HTML satu kartu produk. Gambar dan judul membuka Quick View.
   * @param {Produk} p
   * @returns {string}
   */
  kartu(p) {
    return `
      <article data-lihat="${p.id}" class="bg-white border border-tua/10 rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-transform transition-shadow duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-segar/60 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
        <button type="button" data-lihat="${p.id}" class="group relative aspect-[4/3] w-full bg-segar/15 grid place-items-center text-6xl overflow-hidden cursor-zoom-in" aria-label="Lihat detail ${esc(p.nama)}">
          <span aria-hidden="true">${p.ikon}</span>
          ${p.foto ? `<img src="${esc(p.foto)}" alt="" loading="lazy" class="absolute inset-0 w-full h-full object-cover" onerror="this.remove()" />` : ''}
          <span class="absolute top-3 left-3 bg-panen text-tua text-xs font-extrabold rounded-full px-2.5 py-1">Hemat ${persenHemat(p)}%</span>
          ${p.resep ? '<span class="absolute top-3 right-3 bg-tua text-white text-[11px] font-bold rounded-full px-2.5 py-1">Siap masak</span>' : ''}
          <span class="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 group-focus-visible:translate-y-0 transition-transform bg-tua/90 text-white text-xs font-bold py-2 inline-flex justify-center items-center gap-1.5"><i data-lucide="eye" class="w-3.5 h-3.5"></i>Pratinjau cepat</span>
        </button>
        <div class="p-4 flex flex-col flex-1">
          <h3 class="font-bold leading-snug"><button type="button" data-lihat="${p.id}" class="text-left hover:underline decoration-segar underline-offset-2">${p.nama}</button></h3>
          <p class="text-xs text-tua/60 mt-1 flex items-start gap-1"><i data-lucide="map-pin" class="w-3.5 h-3.5 shrink-0 mt-px"></i>${p.asal}</p>
          ${p.resep ? `<p class="mt-2 flex gap-3 text-xs font-semibold text-tua/70"><span class="inline-flex items-center gap-1"><i data-lucide="users" class="w-3.5 h-3.5"></i>${p.resep.porsi} porsi</span><span class="inline-flex items-center gap-1"><i data-lucide="clock" class="w-3.5 h-3.5"></i>${p.resep.menit} menit</span></p>` : ''}
          ${p.isi ? `<p class="text-xs text-tua/70 mt-2 leading-relaxed">Isi: ${p.isi}</p>` : ''}
          <div class="mt-3 flex items-baseline gap-x-2 flex-wrap">
            <span class="text-xl font-extrabold">${Rp(p.harga)}</span>
            <span class="text-xs text-tua/60">/ ${p.sat}</span>
            <s class="text-xs text-tua/50">${Rp(p.pasar)}</s>
          </div>
          <p class="text-xs font-semibold text-segar mt-1">Hemat ${Rp(p.pasar - p.harga)} dari harga pasar</p>
          <div class="mt-3">${Stok.html(p)}</div>
          <div class="mt-auto pt-4 space-y-2">
            <button type="button" data-beli="${p.id}" ${p.stok === 0 ? 'disabled' : ''} style="background:#F4A261;color:#14301f" class="w-full inline-flex justify-center items-center gap-2 text-sm font-extrabold px-4 py-2.5 rounded-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed">
              <i data-lucide="zap" class="w-4 h-4"></i><span>Beli Langsung</span>
            </button>
            <button type="button" data-tambah="${p.id}" data-uid="${p.id}" class="w-full inline-flex justify-center items-center gap-2 bg-segar text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed">
              <i data-lucide="shopping-cart" class="w-4 h-4"></i><span data-label>Tambah ke Keranjang</span>
            </button>
          </div>
        </div>
      </article>`;
  },

  /** Menyaring produk (kategori + kata kunci pada nama/asal/kategori/isi) lalu menggambar kartu. */
  render() {
    const k = this.kata.trim().toLowerCase();
    const wl = this.kat === 'wishlist' ? WishlistProduk.daftar() : [];
    this.wlSnap = WishlistProduk.daftar().join('|');
    const hasil = PRODUK.filter((p) => (this.kat === 'semua' || (this.kat === 'wishlist' ? wl.includes(String(p.id)) : p.kat === this.kat)) &&
      (!k || [p.nama, p.asal, KATEGORI[p.kat], p.isi || ''].join(' ').toLowerCase().includes(k)));
    $('jumlah-hasil').textContent = `Menampilkan ${hasil.length} dari ${PRODUK.length} produk`;
    $('katalog-grid').innerHTML = hasil.length ? hasil.map((p) => this.kartu(p)).join('')
      : `<p class="col-span-full text-center text-tua/60 py-10">${this.kat === 'wishlist' && !wl.length && !k ? 'Wishlist masih kosong. Buka pratinjau produk lalu tekan ikon hati untuk menyimpannya.' : 'Produk tidak ditemukan. Coba kata kunci lain atau pilih kategori "Semua".'}</p>`;
    document.querySelectorAll('[data-kat]').forEach((b) => {
      const aktif = b.dataset.kat === this.kat;
      b.setAttribute('aria-pressed', String(aktif));
      b.classList.toggle('bg-tua', aktif); b.classList.toggle('text-white', aktif);
      b.classList.toggle('border-tua/20', !aktif);
    });
    ikon();
    Keranjang.segarkan();
  },

  /**
   * Dipakai tombol CTA Promo Banner: menyaring katalog ke kategori pertama dari `kandidat`
   * yang ada sebagai chip (mis. ['alat-hidro', 'benih']), mengosongkan kata kunci, lalu menggulir ke grid.
   * Klik lewat chip agar animasi cascade app.js ikut berjalan.
   * @param {string[]} kandidat kunci kategori, urut prioritas
   */
  saringKe(kandidat) {
    const kat = kandidat.find((k) => document.querySelector(`#filter-kat [data-kat="${k}"]`));
    this.kata = ''; $('cari').value = '';
    if (kat) document.querySelector(`#filter-kat [data-kat="${kat}"]`).click();
    else { this.kat = 'semua'; this.render(); toast('Kategori promo belum tersedia, menampilkan semua produk'); }
    $('katalog-grid').scrollIntoView({ behavior: REDUKSI ? 'auto' : 'smooth', block: 'start' });
  },

  /** Membuat chip kategori dan memasang event pencarian/filter/Quick View/tambah. */
  init() {
    $('filter-kat').innerHTML = [['semua', 'Semua'], ['wishlist', 'Wishlist']].concat(Object.keys(KATEGORI).map((k) => [k, KATEGORI[k]]))
      .map(([k, n]) => `<button type="button" data-kat="${k}" aria-pressed="false" class="border text-sm font-semibold rounded-full px-4 py-2 hover:bg-tua/5">${k === 'resep' ? '🍲 ' : k === 'wishlist' ? '❤️ ' : ''}${n}</button>`).join('');
    $('filter-kat').addEventListener('click', (e) => { const b = e.target.closest('[data-kat]'); if (b) { this.kat = b.dataset.kat; this.render(); } });
    $('cari').addEventListener('input', (e) => { this.kata = e.target.value; this.render(); });
    $('btn-reset-filter').addEventListener('click', () => { this.kat = 'semua'; this.kata = ''; $('cari').value = ''; this.render(); });
    $('katalog-grid').addEventListener('click', (e) => {
      const bl = e.target.closest('[data-beli]');
      if (bl) { // Beli Langsung dari kartu: tambah 1 (bila stok masih cukup) lalu buka keranjang/checkout
        if (bl.disabled) return;
        const id = bl.dataset.beli, p = cariProduk(id);
        if (p && p.stok > 0) {
          if ((Keranjang.item[id] || 0) < p.stok) Keranjang.ubah(id, 1); // barang baru otomatis dicentang
          if (Keranjang.item[id]) { Keranjang.pilih[id] = true; Keranjang.simpan(); }
          Modal.buka();
        }
        return;
      }
      const t = e.target.closest('[data-tambah]');
      if (t) { if (!t.disabled) Keranjang.ubah(t.dataset.tambah, 1, t); return; }
      // Seluruh kartu membuka Quick View. Guard: klik pada kontrol fungsional lain
      // (tombol, tautan, input kuantitas, dsb.) yang BUKAN pemicu [data-lihat] diabaikan.
      const kontrol = e.target.closest('button, a, input, select, textarea, label');
      if (kontrol && !kontrol.hasAttribute('data-lihat')) return;
      // Jangan buka pratinjau bila pengguna sedang menyeleksi teks di dalam kartu
      const sel = window.getSelection && window.getSelection();
      if (sel && !sel.isCollapsed && String(sel).trim()) return;
      const l = e.target.closest('[data-lihat]');
      if (l) Detail.buka(l.dataset.lihat);
    });
    // Quick View bisa mengubah wishlist: bila filter Wishlist aktif, segarkan grid setelah dialog ditutup
    $('modal-detail').addEventListener('close', () => { if (this.kat === 'wishlist' && WishlistProduk.daftar().join('|') !== this.wlSnap) this.render(); });
    // Dibuka dari menu Wishlist sidebar (market.html?filter=wishlist)
    try { if (new URLSearchParams(location.search).get('filter') === 'wishlist') this.kat = 'wishlist'; } catch (e) { /* abaikan */ }
    this.render();
  }
};

/* =====================================================================
 * PROMO BANNER CAROUSEL: 5 slide otomatis tiap 4 detik
 * ---------------------------------------------------------------------
 * - Transisi fade + slide, dots, geser (swipe), tombol panah keyboard. Tanpa panah di layar dan tanpa penunjuk sisa waktu.
 * - Jeda otomatis: fokus KEYBOARD di dalam banner, tab tersembunyi, banner di luar layar,
 *   dan prefers-reduced-motion (tanpa autoplay).
 * - Hover mouse TIDAK menjeda banner: animasi tetap berjalan walau kursor di atas banner.
 * - Foto latar: ubah `foto` (ID Unsplash) pada PROMO_SLIDE. Bila gagal dimuat, gradasi hijau tetap tampil.
 * ===================================================================== */

const PROMO_JEDA_MS = 4000;
const PROMO_GRAD = {
  tua: 'linear-gradient(100deg, rgba(27,67,50,.96) 0%, rgba(27,67,50,.88) 45%, rgba(64,145,108,.55) 100%)',
  segar: 'linear-gradient(115deg, rgba(27,67,50,.92) 0%, rgba(47,110,82,.85) 50%, rgba(64,145,108,.65) 100%)'
};
const promoFoto = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;

/**
 * @typedef {Object} PromoCta
 * @property {string} label teks tombol
 * @property {Function} [aksi] dipanggil saat diklik
 * @property {string} [atribut] atribut HTML tambahan (mis. 'data-buka-keranjang')
 */
const PROMO_SLIDE = [
  {
    judul: 'Benih Sayur & Buah Berkualitas', ikon: '🌱', badge: 'Benih Unggul', warna: 'tua',
    foto: 'photo-1416879595882-3373a0480b5b',
    teks: 'Benih kangkung, cabai, tomat, semangka, melon, hingga pepaya dari penangkar lokal. Daya tumbuh sudah diuji sebelum dikemas.',
    chips: ['🥬 Benih sayur', '🍉 Benih buah', '✅ Daya tumbuh diuji'],
    cta: [{ label: 'Lihat benih unggul', aksi: () => Katalog.saringKe(['benih']) }]
  },
  {
    judul: 'Alat Tani & Berkebun Harga Hemat', ikon: '⛏️', badge: 'Promo Alat Tani', warna: 'segar',
    foto: 'photo-1523348837708-15d4a09cfac2',
    teks: 'Sekop baja anti-karat, gunting pangkas, polybag tebal, dan gembor 5L. Hemat hingga 33% dari harga pasaran, langsung dari perajin.',
    chips: ['⛏️ Sekop & gunting', '🪴 Polybag tebal', '🪣 Gembor 5L'],
    cta: [{ label: 'Belanja alat tani', aksi: () => Katalog.saringKe(['alat-tani']) }]
  },
  {
    judul: 'Voucher Hemat & Gratis Ongkir', ikon: '🎟️', badge: 'Voucher Hemat', warna: 'tua',
    foto: 'photo-1466692476868-aef1dfb1e735',
    teks: 'Salin kodenya, tempel saat checkout. PANGANHEMAT memotong Rp 5.000 dari belanja Anda, ONGKIRKOMUNITAS membebaskan ongkir lokal.',
    chips: ['PANGANHEMAT · Diskon Rp 5.000', 'ONGKIRKOMUNITAS · Gratis Ongkir Lokal'],
    cta: [
      { label: 'Salin PANGANHEMAT', aksi: () => PromoBanner.salin('PANGANHEMAT') },
      { label: 'Salin ONGKIRKOMUNITAS', aksi: () => PromoBanner.salin('ONGKIRKOMUNITAS') }
    ]
  },
  {
    judul: 'Starter Kit Hidroponik Rumah', ikon: '💧', badge: 'Promo Hidroponik', warna: 'segar',
    foto: 'photo-1558449028-b53a39d100fc',
    teks: 'Modul wick dan pipa DFT, TDS meter, netpot, rockwool, hydroton, hingga nutrisi AB Mix. Lengkap untuk panen pertama dari teras rumah.',
    chips: ['🪴 Modul wick & DFT', '🧪 Nutrisi AB Mix', '🧱 Rockwool & hydroton'],
    cta: [{ label: 'Mulai hidroponik', aksi: () => Katalog.saringKe(['alat-hidro', 'bahan-hidro']) }]
  },
  {
    judul: 'Gerakan Pay-It-Forward Food Rescue', ikon: '💚', badge: 'Berbagi · Rp 2.000', warna: 'tua',
    foto: 'photo-1593113598332-cd288d649433',
    teks: 'Tambahkan donasi Rp 2.000 di keranjang belanja Anda. Terkumpul sebagai Paket Pangan untuk Warga Pra-Sejahtera di sekitar kita.',
    chips: ['🤝 Cukup Rp 2.000', '📦 Paket Pangan Warga'],
    cta: [{ label: 'Buka keranjang & donasi', atribut: 'data-buka-keranjang' }]
  }
];

const PromoBanner = {
  idx: 0, waktu: 0, rafId: 0, tPrev: 0, tKeluar: 0, geserX: null,
  fokus: false, kurangi: false, terlihat: true,

  /** @param {Object} s slide @param {number} i indeks @returns {string} HTML satu slide */
  htmlSlide(s, i) {
    const chips = s.chips.map((c) => `<li class="inline-flex items-center bg-white/15 border border-white/25 rounded-full px-3 py-1 text-xs font-bold">${c}</li>`).join('');
    const cta = s.cta.map((c, k) => `<button type="button" ${c.atribut || ''} data-promo-aksi="${i}:${k}" class="inline-flex items-center justify-center gap-2 font-bold px-6 py-3 rounded-xl ${k === 0 ? 'bg-panen text-tua hover:brightness-110' : 'border border-white/40 text-white hover:bg-white/10'}">${c.label}</button>`).join('');
    return `<div class="promo-slide" role="group" aria-roledescription="slide" aria-label="${i + 1} dari ${PROMO_SLIDE.length}: ${s.judul}">
      <img class="promo-foto absolute inset-0 w-full h-full object-cover" src="${promoFoto(s.foto)}" alt="" ${i === 0 ? '' : 'loading="lazy"'} decoding="async" onerror="this.remove()" />
      <div class="absolute inset-0" style="background:${PROMO_GRAD[s.warna]}"></div>
      <div class="promo-isi relative px-6 sm:px-8 md:px-12 pt-8 pb-14 md:py-10 md:pb-12 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
        <div class="hidden md:block text-7xl shrink-0" aria-hidden="true">${s.ikon}</div>
        <div class="flex-1 min-w-0">
          <span class="inline-block bg-panen text-tua text-xs font-extrabold rounded-full px-3 py-1">${s.badge}</span>
          <h3 class="mt-3 font-extrabold text-xl md:text-3xl leading-tight">${s.judul}</h3>
          <p class="mt-2 text-sm md:text-base text-white/90 max-w-2xl leading-relaxed">${s.teks}</p>
          <ul class="mt-3 flex flex-wrap gap-2" aria-label="Isi promo">${chips}</ul>
        </div>
        <div class="flex flex-col gap-2 shrink-0 md:items-stretch">${cta}</div>
      </div>
    </div>`;
  },

  /** @returns {boolean} apakah autoplay sedang berjalan */
  berjalan() { return !this.kurangi && !this.fokus && this.terlihat && !document.hidden; },

  /** Menyinkronkan aria-live dengan status jeda. */
  sinkron() {
    this.track.setAttribute('aria-live', this.berjalan() ? 'off' : 'polite');
  },


  /**
   * Pindah ke slide `i` (dibungkus melingkar) dengan animasi fade + slide.
   * @param {number} i @param {number} [arah] 1 = maju (masuk dari kanan), -1 = mundur
   */
  ke(i, arah) {
    const n = this.slides.length, baru = ((i % n) + n) % n;
    if (baru === this.idx) return;
    const dir = arah || (baru > this.idx ? 1 : -1), lama = this.slides[this.idx], el = this.slides[baru];
    this.root.style.setProperty('--dir', dir);
    void this.root.offsetWidth; // pastikan arah baru terbaca sebelum kelas berganti
    this.slides.forEach((s) => { if (s !== lama) s.classList.remove('is-keluar'); });
    lama.classList.remove('is-aktif'); lama.classList.add('is-keluar');
    el.classList.remove('is-keluar'); el.classList.add('is-aktif');
    this.slides.forEach((s) => { s.inert = s !== el; });
    clearTimeout(this.tKeluar);
    this.tKeluar = setTimeout(() => lama.classList.remove('is-keluar'), 750);
    this.idx = baru; this.waktu = 0;
    this.dots.forEach((d, k) => { if (k === baru) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
    this.sinkron();
  },

  /** Putaran autoplay berbasis requestAnimationFrame: waktu hanya bertambah saat tidak dijeda. */
  tick(t) {
    const dt = Math.min(t - this.tPrev, 100); this.tPrev = t;
    if (this.berjalan()) {
      this.waktu += dt;
      if (this.waktu >= PROMO_JEDA_MS) this.ke(this.idx + 1, 1);
    }
    this.rafId = requestAnimationFrame(this.tick);
  },

  mulai() { if (!this.rafId && !this.kurangi) { this.tPrev = performance.now(); this.rafId = requestAnimationFrame(this.tick); } },
  henti() { cancelAnimationFrame(this.rafId); this.rafId = 0; },

  /** Menyalin kode voucher ke clipboard (dengan cadangan execCommand) lalu menampilkan toast. @param {string} kode */
  async salin(kode) {
    let ok = false;
    try { await navigator.clipboard.writeText(kode); ok = true; } catch (e) {
      try {
        const t = document.createElement('textarea');
        t.value = kode; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
        document.body.appendChild(t); t.select(); ok = document.execCommand('copy'); t.remove();
      } catch (e2) { ok = false; }
    }
    toast(ok ? `Kode ${kode} disalin. Tempel saat checkout` : `Salin manual kode: ${kode}`);
  },

  init() {
    this.root = $('promo-carousel'); this.track = $('promo-track');
    this.tick = this.tick.bind(this);

    this.track.innerHTML = PROMO_SLIDE.map((s, i) => this.htmlSlide(s, i)).join('');
    this.slides = [...this.track.children];
    $('promo-dots').innerHTML = PROMO_SLIDE.map((s, i) => `<button type="button" class="promo-dot" data-promo-ke="${i}" aria-label="Ke slide ${i + 1}: ${s.judul}"><span></span></button>`).join('');
    this.dots = [...$('promo-dots').children];
    this.slides.forEach((s, i) => { s.inert = i !== 0; });
    this.slides[0].classList.add('is-aktif');
    this.dots[0].setAttribute('aria-current', 'true');

    // Navigasi
    $('promo-dots').addEventListener('click', (e) => { const d = e.target.closest('[data-promo-ke]'); if (d) this.ke(Number(d.dataset.promoKe)); });
    this.track.addEventListener('click', (e) => {
      const b = e.target.closest('[data-promo-aksi]'); if (!b) return;
      const [i, k] = b.dataset.promoAksi.split(':').map(Number), aksi = PROMO_SLIDE[i].cta[k].aksi;
      if (aksi) aksi();
    });
    this.root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { this.ke(this.idx - 1, -1); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { this.ke(this.idx + 1, 1); e.preventDefault(); }
    });

    // Geser (touch / pena)
    this.root.addEventListener('pointerdown', (e) => { this.geserX = e.pointerType === 'mouse' ? null : e.clientX; });
    this.root.addEventListener('pointerup', (e) => {
      if (this.geserX === null) return;
      const dx = e.clientX - this.geserX; this.geserX = null;
      if (Math.abs(dx) > 50) this.ke(this.idx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    });
    this.root.addEventListener('pointercancel', () => { this.geserX = null; });

    // Jeda: fokus keyboard, banner di luar layar, tab tersembunyi (hover mouse tidak menjeda)
    this.root.addEventListener('focusin', (e) => { this.fokus = e.target.matches(':focus-visible'); this.sinkron(); });
    this.root.addEventListener('focusout', () => { this.fokus = false; this.sinkron(); });
    document.addEventListener('visibilitychange', () => this.sinkron());
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => { this.terlihat = en.isIntersecting; this.sinkron(); }, { threshold: 0.25 }).observe(this.root);
    }

    // prefers-reduced-motion: tanpa autoplay (navigasi manual tetap tersedia)
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const atur = () => {
      this.kurangi = mq.matches; this.waktu = 0;
      this.sinkron(); this.kurangi ? this.henti() : this.mulai();
    };
    mq.addEventListener ? mq.addEventListener('change', atur) : mq.addListener(atur);
    atur();
  }
};

/* =====================================================================
 * RIWAYAT BELANJA HEMAT KELUARGA
 * ===================================================================== */

const Riwayat = {
  /** @returns {Object[]} pesanan tersimpan (data rusak disaring) */
  data() { return dataRiwayat(); },

  /** Menggambar ringkasan hemat & donasi (hero, statistik) dan daftar pesanan. */
  render() {
    const r = this.data().filter((x) => x.status !== 'dibatalkan'), hemat = r.reduce((a, x) => a + (Number(x.hemat) || 0), 0), donasi = r.reduce((a, x) => a + (Number(x.donasi) || 0), 0);
    const plus = donasi ? `, plus donasi pangan ${Rp(donasi)}` : '';
    $('hero-hemat').textContent = r.length ? `Hemat keluarga Anda sejauh ini: ${Rp(hemat)} dari ${r.length} pesanan${plus}` : 'Belum ada belanja. Pesanan pertama Anda akan tercatat di halaman Daftar Transaksi.';
  },

  /** Tidak ada lagi tombol hapus riwayat di market.html (dikelola di transaksi.html). */
  init() {}
};


/* =====================================================================
 * TITIK MASUK
 * ===================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  $('tahun').textContent = new Date().getFullYear();
  Navbar.init();
  Keranjang.muat();
  Modal.init();
  Detail.init();
  Riwayat.init();
  Riwayat.render();
  Katalog.init();
  PromoBanner.init();
  ikon();
  // Dari transaksi.html ("Beli Lagi") atau tautan keranjang: buka keranjang otomatis
  if (location.hash === '#keranjang') {
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* abaikan */ }
    Modal.buka();
  }
});

