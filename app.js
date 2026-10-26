/**
 * ============================================================
 * NusaPangan — app.js (modul bersama untuk semua halaman)
 * ------------------------------------------------------------
 * Isi modul:
 *  0. DataAwal  : seeding data contoh kulkas & riwayat (sekali jalan, sebelum Dasbor/Nusa-Ai)
 *  1. Gaya      : CSS tambahan (mode gelap, hover kartu)
 *  2. Kait      : memancarkan event saat LocalStorage NusaPangan berubah
 *  3. Tema      : tombol Mode Gelap / Terang di navbar (semua halaman)
 *  4. Counter   : animasi angka naik
 *  5. AnimasiBar: progress bar yang mengisi dengan halus
 *  6. Dasbor    : 2 grafik Chart.js (beranda), data dari LocalStorage
 *  7. Foto      : unggah gambar, kompres, Base64 (FileReader)
 *  8. Akun      : login simulasi, ganti akun, profil, level kontributor
 *  9. Nusa-Ai   : chatbot melayang yang membaca data LocalStorage (kulkas,
 *                 kebun, gizi) + basis pengetahuan pintar berbasis kata kunci
 * 10. AnimasiHero: animasi teks H1 + fade-up badge/deskripsi/CTA di hero tiap halaman
 * 11. AnimasiUI  : reveal scroll, cascade pop-in, micro-interaction, akordeon, spotlight, toast pegas
 *
 * Cara pakai: cukup tambahkan satu baris di <head> setiap halaman,
 * SETELAH skrip Chart.js (bila halaman memakainya):
 *     <script src="app.js"></script>
 * Semua kode dibungkus IIFE agar tidak bentrok dengan skrip halaman.
 * ============================================================
 */
(function () {
  'use strict';

  /** Awalan kunci LocalStorage (sama dengan seluruh halaman). */
  const AWALAN = 'nusapangan:';

  /** True bila pengguna meminta animasi dikurangi (aksesibilitas). */
  const REDUKSI = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* =====================================================================
   * 1. GAYA — CSS tambahan yang disuntikkan ke <head>
   * ===================================================================== */

  /**
   * Menyuntikkan CSS bersama. Mode gelap bekerja dengan menimpa kelas
   * Tailwind yang sudah dipakai (bg-white, text-tua, dst.) saat <html>
   * memiliki kelas "dark", sehingga 5 halaman tidak perlu diubah satu per satu.
   */
  const Gaya = {
    css: `
      /* ---------- MODE GELAP ---------- */
      html.dark { color-scheme: dark; }
      html.dark body { background: #0E1914; color: #E6EFEA; }
      html.dark .bg-krem { background-color: #0E1914; }
      html.dark [class~="bg-krem/90"] { background-color: rgba(14,25,20,.9); }
      html.dark .bg-white { background-color: #16261E; }
      html.dark [class~="text-tua"] { color: #E6EFEA; }
      html.dark :is([class~="text-tua/80"],[class~="text-tua/70"],[class~="text-tua/60"],[class~="text-tua/50"],[class~="text-tua/40"]) { color: #A8BDB1; }
      html.dark .bg-panen[class~="text-tua"], html.dark .bg-panen [class~="text-tua"] { color: #1B4332; }
      html.dark :is([class~="border-tua/10"],[class~="border-tua/20"]) { border-color: rgba(230,239,234,.14); }
      html.dark [class~="divide-tua/10"] > * + * { border-color: rgba(230,239,234,.14); }
      html.dark :is([class~="bg-tua/10"],[class~="bg-tua/5"]) { background-color: rgba(230,239,234,.1); }
      html.dark [class~="hover:bg-tua/5"]:hover { background-color: rgba(230,239,234,.1); }
      html.dark .isian { background: #16261E; color: #E6EFEA; border-color: rgba(230,239,234,.2); }
      html.dark .isian::placeholder { color: #7F968A; }
      html.dark .bg-krem .isian { background: #16261E; }

      /* ---------- MODE GELAP: ALERT, BANNER & LENCANA STATUS ---------- */
      /* Latar pastel terang diganti latar gelap transparan agar tidak menyilaukan */
      html.dark .bg-red-50 { background-color: rgba(239,68,68,.14); }
      html.dark .bg-green-50 { background-color: rgba(34,197,94,.14); }
      html.dark .bg-amber-50 { background-color: rgba(245,158,11,.14); }
      html.dark .border-red-200 { border-color: rgba(239,68,68,.35); }
      html.dark .border-green-200 { border-color: rgba(34,197,94,.35); }
      html.dark .border-amber-200 { border-color: rgba(245,158,11,.35); }
      /* Teks gelap pada alert diganti warna terang (variasi "/90" memakai selektor atribut) */
      html.dark :is(.text-red-900, [class~="text-red-900/90"]) { color: #FECACA; }
      html.dark .text-green-900 { color: #BBF7D0; }
      html.dark .text-red-700 { color: #FCA5A5; }
      html.dark .text-amber-700 { color: #FCD34D; }
      /* Lencana status: latar transparan + teks terang (spesifisitas lebih tinggi dari kelas Tailwind) */
      html.dark .bg-red-100.text-red-800 { background-color: rgba(239,68,68,.22); color: #FECACA; }
      html.dark .bg-amber-100.text-amber-800 { background-color: rgba(245,158,11,.22); color: #FDE68A; }
      html.dark .bg-green-100.text-green-800 { background-color: rgba(34,197,94,.22); color: #BBF7D0; }
      /* Transisi halus sesaat ketika tema berganti */
      html.tema-transisi, html.tema-transisi * { transition: background-color .35s, color .35s, border-color .35s !important; }

      /* ---------- TOMBOL TEMA ---------- */
      .btn-tema { width: 2.5rem; height: 2.5rem; border-radius: .75rem; display: grid; place-items: center; color: inherit; cursor: pointer; background: transparent; border: 0; }
      .btn-tema:hover { background: rgba(27,67,50,.08); }
      html.dark .btn-tema:hover { background: rgba(230,239,234,.1); }
      .btn-tema svg { width: 1.25rem; height: 1.25rem; transition: transform .5s; }
      .btn-tema:hover svg { transform: rotate(25deg) scale(1.1); }

      /* ---------- MICRO-INTERACTION ---------- */
      main article, #grid-statistik > div, .kartu-hidup { transition: transform .3s cubic-bezier(.2,.8,.2,1), box-shadow .3s; }
      main article:hover, #grid-statistik > div:hover, .kartu-hidup:hover { transform: translateY(-4px) scale(1.012); box-shadow: 0 16px 32px -14px rgba(27,67,50,.4); }
      main button { transition: transform .15s, filter .15s; }
      main button:not(:disabled):active { transform: scale(.96); }
      [role="progressbar"] > div { transition: width .9s cubic-bezier(.2,.8,.2,1); }

      /* ---------- AKUN & FORM ---------- */
      .isian { width: 100%; border: 1px solid rgba(27,67,50,.2); background: #fff; border-radius: .75rem; padding: .6rem .9rem; font-size: .875rem; }
      .btn-akun { display: flex; align-items: center; gap: .5rem; height: 2.5rem; padding: 0 .6rem; border-radius: .75rem; border: 1px solid rgba(27,67,50,.2); font-size: .875rem; font-weight: 700; background: transparent; color: inherit; cursor: pointer; }
      .btn-akun:hover { background: rgba(27,67,50,.08); }
      html.dark .btn-akun { border-color: rgba(230,239,234,.2); }
      html.dark .btn-akun:hover { background: rgba(230,239,234,.1); }
      .btn-akun .nama-akun { display: none; }
      @media (min-width: 640px) { .btn-akun .nama-akun { display: inline; max-width: 8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } }

      /* Notifikasi singkat milik app.js */
      #toast-nusa { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #1B4332; color: #fff; font-size: 14px; font-weight: 600; padding: 12px 20px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,.3); z-index: 2000; display: none; }
    `,

    /** Memasang elemen <style> sekali saja. */
    pasang() {
      if (document.getElementById('nusa-gaya')) return;
      const s = document.createElement('style');
      s.id = 'nusa-gaya';
      s.textContent = this.css;
      document.head.appendChild(s);
    }
  };

  /* =====================================================================
   * UTILITAS RINGAN
   * ===================================================================== */

  const Util = {
    /** Mengamankan teks dari penyisipan HTML (mencegah XSS). */
    esc(teks) { const d = document.createElement('div'); d.textContent = teks; return d.innerHTML; },

    /** Selisih hari antara hari ini dan tanggal exp (negatif bila sudah lewat). */
    sisaHari(exp) {
      const hariIni = new Date().toLocaleDateString('en-CA');
      return Math.round((new Date(exp + 'T00:00:00') - new Date(hariIni + 'T00:00:00')) / 86400000);
    },

    /** Memastikan nilai berupa array. */
    arr(x) { return Array.isArray(x) ? x : []; },

    /** Membaca data JSON dari LocalStorage NusaPangan (aman dari error). */
    ambil(kunci, cadangan) {
      try { const m = localStorage.getItem(AWALAN + kunci); return m === null ? cadangan : JSON.parse(m); }
      catch (e) { return cadangan; }
    },

    /** Tanggal hari ini + `n` hari, format YYYY-MM-DD (zona waktu lokal). */
    tanggal(n) { const d = new Date(); d.setDate(d.getDate() + (n || 0)); return d.toLocaleDateString('en-CA'); },

    /** Menyimpan data ke LocalStorage NusaPangan (otomatis JSON). @returns {boolean} false bila penyimpanan penuh/diblokir. */
    simpan(kunci, nilai) {
      try { localStorage.setItem(AWALAN + kunci, JSON.stringify(nilai)); return true; }
      catch (e) { return false; }
    },

    /**
     * Menampilkan notifikasi singkat selama 2,5 detik (satu toast terpusat).
     * Memakai elemen #toast milik halaman bila ada (kelas "hidden"); bila tidak,
     * membuat #toast-nusa. Dengan begitu tidak pernah ada dua toast bertumpuk.
     * Dipakai lewat NusaPangan.toast(pesan).
     * @param {string} pesan - teks notifikasi
     */
    toast(pesan) {
      let el = document.getElementById('toast') || document.getElementById('toast-nusa');
      if (!el) { el = document.createElement('div'); el.id = 'toast-nusa'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
      const bawaan = el.id === 'toast'; // #toast halaman disembunyikan lewat kelas Tailwind "hidden"
      el.textContent = pesan;
      if (bawaan) el.classList.remove('hidden'); else el.style.display = 'block';
      clearTimeout(Util._t);
      Util._t = setTimeout(() => { if (bawaan) el.classList.add('hidden'); else el.style.display = 'none'; }, 2500);
    }
  };

  /* =====================================================================
   * 0. DATA AWAL — seeding data contoh kulkas & riwayat (global)
   * ===================================================================== */

  /**
   * Mengisi stokPangan & riwayatPangan dengan data contoh bila belum pernah
   * disiapkan. Data SAMA PERSIS dengan Data.isiContoh() di foodrescue.html,
   * sehingga beranda (grafik, counter dasbor) dan Nusa-Ai tidak kosong
   * walaupun juri membuka index.html lebih dulu. Dijalankan sebelum
   * Dasbor.init() dan NusaAi.init(); aman dipanggil berulang.
   */
  const DataAwal = {
    /** @returns {boolean} true bila data contoh baru saja diisi. */
    isi() {
      if (Util.ambil('foodrescueSiap', false)) return false;
      const u = Date.now();
      const stok = [
        { uid: u + 1, nama: 'Bayam',          jumlah: 2,   satuan: 'ikat',    kategori: 'sayur',   exp: Util.tanggal(-1),  harga: 6000 },
        { uid: u + 2, nama: 'Susu UHT',       jumlah: 1,   satuan: 'liter',   kategori: 'susu',    exp: Util.tanggal(1),   harga: 19000 },
        { uid: u + 3, nama: 'Tempe',          jumlah: 2,   satuan: 'bungkus', kategori: 'protein', exp: Util.tanggal(2),   harga: 10000 },
        { uid: u + 4, nama: 'Pisang',         jumlah: 6,   satuan: 'pcs',     kategori: 'buah',    exp: Util.tanggal(4),   harga: 12000 },
        { uid: u + 5, nama: 'Ayam fillet',    jumlah: 0.5, satuan: 'kg',      kategori: 'protein', exp: Util.tanggal(6),   harga: 35000 },
        { uid: u + 6, nama: 'Telur',          jumlah: 10,  satuan: 'pcs',     kategori: 'protein', exp: Util.tanggal(12),  harga: 24000 },
        { uid: u + 7, nama: 'Wortel',         jumlah: 0.5, satuan: 'kg',      kategori: 'sayur',   exp: Util.tanggal(15),  harga: 9000 },
        { uid: u + 8, nama: 'Beras',          jumlah: 5,   satuan: 'kg',      kategori: 'karbo',   exp: Util.tanggal(120), harga: 70000 }
      ];
      const riwayat = [
        { uid: u + 11, nama: 'Tahu',       jumlah: 5, satuan: 'pcs',     harga: 8000,  hasil: 'selamat',  tanggal: Util.tanggal(-2) },
        { uid: u + 12, nama: 'Tomat',      jumlah: 4, satuan: 'pcs',     harga: 7000,  hasil: 'selamat',  tanggal: Util.tanggal(-4) },
        { uid: u + 13, nama: 'Roti tawar', jumlah: 1, satuan: 'bungkus', harga: 15000, hasil: 'selamat',  tanggal: Util.tanggal(-6) },
        { uid: u + 14, nama: 'Selada',     jumlah: 1, satuan: 'pcs',     harga: 9000,  hasil: 'terbuang', tanggal: Util.tanggal(-8) }
      ];
      // Bila salah satu gagal disimpan (penyimpanan penuh), jangan tandai "siap"
      if (!Util.simpan('stokPangan', stok) || !Util.simpan('riwayatPangan', riwayat)) return false;
      return Util.simpan('foodrescueSiap', true);
    }
  };

  /* =====================================================================
   * 2. KAIT — mendeteksi perubahan LocalStorage di halaman yang sama
   * ===================================================================== */

  /**
   * Event "storage" bawaan browser hanya menyala di TAB LAIN. Agar grafik
   * ikut berubah saat data diubah di tab/halaman yang sama, setItem dibungkus
   * sehingga memancarkan event kustom "nusapangan:berubah" untuk kunci
   * berawalan "nusapangan:". Halaman lain tidak perlu diubah sama sekali.
   */
  const Kait = {
    pasang() {
      if (Storage.prototype.__nusaKait) return;
      const asli = Storage.prototype.setItem;
      Storage.prototype.setItem = function (kunci) {
        asli.apply(this, arguments);
        if (this === window.localStorage && String(kunci).indexOf(AWALAN) === 0) {
          window.dispatchEvent(new CustomEvent('nusapangan:berubah', { detail: { kunci: kunci } }));
        }
      };
      Storage.prototype.__nusaKait = true;
    }
  };

  /* =====================================================================
   * 3. TEMA — Mode Gelap / Terang
   * ===================================================================== */

  const ICON_BULAN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
  const ICON_MATAHARI = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';

  const Tema = {
    /** Kunci penyimpanan pilihan tema: 'gelap' atau 'terang'. */
    kunci: AWALAN + 'tema',

    /** @returns {boolean} true bila mode gelap sedang aktif. */
    aktif() { return document.documentElement.classList.contains('dark'); },

    /**
     * Menentukan tema awal: pilihan tersimpan, atau mengikuti pengaturan
     * sistem. Dipanggil segera (sebelum halaman tampil) agar tidak berkedip.
     */
    awal() {
      let t = null;
      try { t = JSON.parse(localStorage.getItem(this.kunci)); } catch (e) { t = null; }
      const gelap = t === 'gelap' ? true : t === 'terang' ? false
        : !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', gelap);
    },

    /** Mengganti tema, menyimpannya, dan memberi tahu modul lain (grafik). */
    ganti() {
      const html = document.documentElement;
      html.classList.add('tema-transisi');
      const gelap = !this.aktif();
      html.classList.toggle('dark', gelap);
      try { localStorage.setItem(this.kunci, JSON.stringify(gelap ? 'gelap' : 'terang')); } catch (e) { /* diabaikan */ }
      this.perbaruiTombol();
      window.dispatchEvent(new CustomEvent('nusapangan:tema', { detail: { gelap: gelap } }));
      setTimeout(() => html.classList.remove('tema-transisi'), 450);
    },

    /** Memperbarui ikon dan label aksesibilitas tombol sesuai tema. */
    perbaruiTombol() {
      const b = document.getElementById('btn-tema');
      if (!b) return;
      const gelap = this.aktif();
      b.innerHTML = gelap ? ICON_MATAHARI : ICON_BULAN;
      b.setAttribute('aria-label', gelap ? 'Aktifkan mode terang' : 'Aktifkan mode gelap');
      b.setAttribute('title', gelap ? 'Mode terang' : 'Mode gelap');
    },

    /**
     * Menyisipkan tombol tema ke navbar. Tombol menu mobile (#btn-menu)
     * dipindahkan ke satu pembungkus bersama agar tata letak navbar tetap rapi.
     */
    pasangTombol() {
      const nav = document.querySelector('header nav');
      if (!nav || document.getElementById('btn-tema')) return;
      const bungkus = document.createElement('div');
      bungkus.style.cssText = 'display:flex;align-items:center;gap:.25rem';
      const tombol = document.createElement('button');
      tombol.id = 'btn-tema';
      tombol.type = 'button';
      tombol.className = 'btn-tema';
      tombol.addEventListener('click', () => this.ganti());
      bungkus.appendChild(tombol);
      const menu = document.getElementById('btn-menu');
      nav.appendChild(bungkus);
      if (menu) bungkus.appendChild(menu);
      this.perbaruiTombol();
    }
  };

  /* =====================================================================
   * 4. COUNTER — angka naik halus
   * ===================================================================== */

  const Counter = {
    /**
     * Menulis angka ke elemen dengan awalan/akhiran dari atribut
     * data-awalan dan data-akhiran (contoh: "Rp " dan "%").
     * @param {HTMLElement} el - elemen tujuan
     * @param {number} n - angka yang ditulis
     */
    format(el, n) {
      el.textContent = (el.dataset.awalan || '') + Math.round(n).toLocaleString('id-ID') + (el.dataset.akhiran || '');
    },

    /**
     * Menganimasikan angka dari nilai sebelumnya ke nilai baru (±0,9 detik).
     * @param {HTMLElement} el - elemen angka
     * @param {number} ke - nilai tujuan
     */
    animasi(el, ke) {
      const dari = el._nilai || 0;
      el._nilai = ke;
      cancelAnimationFrame(el._raf);
      if (REDUKSI || dari === ke) { this.format(el, ke); return; }
      const mulai = performance.now(), durasi = 900;
      const langkah = (t) => {
        const p = Math.min((t - mulai) / durasi, 1);
        this.format(el, dari + (ke - dari) * (1 - Math.pow(1 - p, 3)));
        if (p < 1) el._raf = requestAnimationFrame(langkah);
      };
      el._raf = requestAnimationFrame(langkah);
    },

    /**
     * Mengatur nilai angka. Animasi baru berjalan saat elemen terlihat di
     * layar (supaya efeknya tidak terbuang di bagian halaman yang belum dilihat).
     * @param {HTMLElement} el - elemen angka
     * @param {number} nilai - nilai tujuan
     */
    set(el, nilai) {
      if (!el) return;
      el._target = nilai;
      if (el._terlihat || !('IntersectionObserver' in window)) { this.animasi(el, nilai); return; }
      if (el._io) return;
      el._io = new IntersectionObserver((entri, io) => {
        if (entri[0].isIntersecting) { el._terlihat = true; io.disconnect(); this.animasi(el, el._target); }
      }, { threshold: 0.3 });
      el._io.observe(el);
    }
  };

  /* =====================================================================
   * 5. ANIMASI PROGRESS BAR (semua halaman)
   * ===================================================================== */

  const AnimasiBar = {
    /**
     * Mengisi satu bar dari 0% ke lebar aslinya agar terlihat mengalir.
     * @param {HTMLElement} bar - elemen isi progress bar
     */
    isi(bar) {
      if (!bar || bar.dataset.anim) return;
      bar.dataset.anim = '1';
      const target = bar.style.width;
      bar.style.width = '0%';
      requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = target; }));
    },

    /** Mengamati DOM: setiap progress bar baru otomatis dianimasikan. */
    init() {
      if (REDUKSI || !('MutationObserver' in window)) return;
      new MutationObserver((daftar) => {
        daftar.forEach((m) => m.addedNodes.forEach((n) => {
          if (n.nodeType !== 1) return;
          const bar = n.matches('[role="progressbar"]') ? [n] : [];
          n.querySelectorAll('[role="progressbar"]').forEach((b) => bar.push(b));
          bar.forEach((b) => this.isi(b.firstElementChild));
        }));
      }).observe(document.body, { childList: true, subtree: true });
    }
  };

  /* =====================================================================
   * 6. DASBOR — grafik Chart.js (beranda)
   * ===================================================================== */

  /** Kategori stok: [kunci data, label, warna] (sama dengan foodrescue.html). */
  const KAT = [
    ['sayur', 'Sayuran', '#40916C'], ['buah', 'Buah', '#F4A261'], ['protein', 'Protein', '#2D6A4F'],
    ['susu', 'Susu & olahan', '#8ECAE6'], ['karbo', 'Karbohidrat', '#E9C46A'], ['lainnya', 'Lainnya', '#A8BDB1']
  ];
  /** Warna irisan khusus Mode Malam (lebih terang agar tetap ≥3:1 terhadap kartu #16261E). */
  const KAT_GELAP = { sayur: '#52B788', buah: '#F4A261', protein: '#B7E4C7', susu: '#8ECAE6', karbo: '#E9C46A', lainnya: '#A8BDB1' };
  const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  /** Jumlah bulan data nyata di grafik; setelahnya 3 bulan proyeksi. */
  const N_AKTUAL = 5;

  /**
   * Plugin Chart.js: menggambar total item di tengah lubang doughnut.
   * Warna & ukuran font mengikuti tema aktif dan jari-jari lubang (responsif).
   */
  const TeksTengahDoughnut = {
    id: 'nusaTengah',
    afterDatasetsDraw(chart, args, opsi) {
      const meta = chart.getDatasetMeta(0);
      const data = chart.data.datasets[0] ? chart.data.datasets[0].data : [];
      const total = data.reduce((a, b) => a + (Number(b) || 0), 0);
      if (!meta || !meta.data.length || !total) return;
      const p = meta.data[0].getProps(['x', 'y', 'innerRadius'], true);
      if (!p.innerRadius) return;
      const ctx = chart.ctx, fam = Chart.defaults.font.family;
      const lebarMaks = p.innerRadius * 1.55;
      const angka = total.toLocaleString('id-ID');
      let ukAngka = Math.max(20, Math.min(46, p.innerRadius * 0.6));
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '800 ' + ukAngka + 'px ' + fam;
      while (ctx.measureText(angka).width > lebarMaks && ukAngka > 14) { ukAngka -= 2; ctx.font = '800 ' + ukAngka + 'px ' + fam; }
      ctx.fillStyle = opsi.angka;
      ctx.fillText(angka, p.x, p.y - ukAngka * 0.12);
      const ukLabel = Math.max(11, Math.min(15, p.innerRadius * 0.2));
      ctx.font = '600 ' + ukLabel + 'px ' + fam;
      ctx.fillStyle = opsi.label;
      ctx.fillText('Item Pangan', p.x, p.y + ukAngka * 0.62);
      ctx.restore();
    }
  };

  const Dasbor = {
    grafikStok: null,
    grafikHemat: null,

    /** Warna grafik mengikuti tema aktif. */
    warna() {
      const g = Tema.aktif();
      return {
        teks: g ? '#A8BDB1' : '#4B6B5C', grid: g ? 'rgba(230,239,234,.1)' : 'rgba(27,67,50,.08)', kartu: g ? '#16261E' : '#FFFFFF',
        // Kontras tinggi untuk doughnut: legenda & angka tengah (≈14:1 gelap, ≈10:1 terang)
        kuat: g ? '#F1F7F3' : '#1B4332',
        tipBg: g ? '#0B1410' : '#1B4332', tipTeks: g ? '#F1F7F3' : '#FFFFFF', tipGaris: g ? 'rgba(149,213,178,.6)' : 'rgba(27,67,50,1)'
      };
    },

    /** Warna irisan doughnut sesuai tema aktif. */
    warnaIrisan() { return KAT.map((k) => (Tema.aktif() ? KAT_GELAP[k[0]] : k[2])); },

    /** Menggabungkan daftar: "A", "A dan B", "A, B, dan C". */
    gabung(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + (a.length > 2 ? ',' : '') + ' dan ' + a[a.length - 1]; },

    /**
     * Smart Insight: analisis otomatis stok dari data nyata (bukan teks tetap).
     *  Kotak 1 = komposisi (kategori inti kosong / terlalu dominan / seimbang).
     *  Kotak 2 = ketahanan protein & sayuran (berdasar tanggal kedaluwarsa terdekat).
     * @returns {{ton:string, ikon:string, tebal:string, teks:string}[]}
     */
    analisis(stok, perKat) {
      const total = perKat.reduce((a, b) => a + b, 0);
      if (!total) return [{ ton: 'info', ikon: 'info', tebal: 'Belum ada data stok.', teks: 'Tambahkan bahan di Food Rescue untuk melihat analisis otomatis.' }];
      const idx = (k) => KAT.findIndex((x) => x[0] === k);
      const out = [];

      // Kotak 1 - komposisi
      const kosong = ['sayur', 'buah', 'protein', 'karbo'].filter((k) => perKat[idx(k)] === 0).map((k) => KAT[idx(k)][1]);
      let m = 0; perKat.forEach((v, i) => { if (v > perKat[m]) m = i; });
      const bagi = Math.round((perKat[m] / total) * 100);
      if (kosong.length) out.push({ ton: 'warn', ikon: 'chart-pie', tebal: 'Stok ' + this.gabung(kosong) + ' kosong.', teks: 'Lengkapi agar gizi harian seimbang.' });
      else if (bagi >= 50 && total >= 4) out.push({ ton: 'warn', ikon: 'chart-pie', tebal: KAT[m][1] + ' mendominasi (' + bagi + '%).', teks: 'Variasikan dengan kategori lain.' });
      else out.push({ ton: 'ok', ikon: 'chart-pie', tebal: 'Komposisi seimbang.', teks: KAT[m][1] + ' terbanyak (' + bagi + '%).' });

      // Kotak 2 - ketahanan protein & sayuran
      const gizi = stok
        .filter((s) => s && (s.kategori === 'protein' || s.kategori === 'sayur') && s.exp)
        .map((s) => ({ n: String(s.nama || 'Bahan'), sisa: Util.sisaHari(s.exp) }))
        .filter((x) => !isNaN(x.sisa));
      const lewat = gizi.filter((x) => x.sisa < 0).length;
      const segar = gizi.filter((x) => x.sisa >= 0).sort((a, b) => a.sisa - b.sisa);
      const catatLewat = lewat ? ' ' + lewat + ' bahan sudah lewat tanggal.' : '';
      if (segar.length) {
        const t = segar[0];
        if (t.sisa >= 4) out.push({ ton: 'ok', ikon: 'circle-check', tebal: 'Protein & sayuran aman minimal ' + t.sisa + ' hari ke depan.', teks: 'Terdekat: ' + t.n + '.' + catatLewat });
        else out.push({ ton: 'warn', ikon: 'triangle-alert', tebal: t.n + (t.sisa === 0 ? ' kedaluwarsa hari ini.' : t.sisa === 1 ? ' kedaluwarsa besok.' : ' kedaluwarsa dalam ' + t.sisa + ' hari.'), teks: 'Prioritaskan untuk diolah.' + catatLewat });
      } else if (lewat) {
        out.push({ ton: 'bahaya', ikon: 'circle-alert', tebal: 'Protein & sayuran sudah lewat tanggal.', teks: lewat + ' bahan perlu diperiksa sekarang.' });
      }
      return out;
    },

    /** Menampilkan kotak insight (DOM + textContent: nama bahan dari LocalStorage tidak bisa menyisipkan HTML). */
    renderInsight(daftar) {
      const wadah = document.getElementById('insight-stok');
      if (!wadah) return;
      const IKON = {
        'chart-pie': '<path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z"/><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>',
        'circle-check': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
        'triangle-alert': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
        'circle-alert': '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
        'info': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>'
      };
      wadah.textContent = '';
      daftar.forEach((d) => {
        const kotak = document.createElement('div');
        kotak.className = 'na-insight na-insight--' + d.ton;
        const ik = document.createElement('span');
        ik.className = 'na-insight-ikon';
        ik.setAttribute('aria-hidden', 'true');
        ik.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (IKON[d.ikon] || IKON.info) + '</svg>';
        const tk = document.createElement('p');
        const b = document.createElement('strong');
        b.textContent = d.tebal;
        tk.appendChild(b);
        tk.appendChild(document.createTextNode(' ' + d.teks));
        kotak.appendChild(ik);
        kotak.appendChild(tk);
        wadah.appendChild(kotak);
      });
    },

    /** Singkatan angka rupiah untuk sumbu: 15000 menjadi "15rb". */
    singkat(v) { return v >= 1000000 ? (v / 1000000) + 'jt' : v >= 1000 ? (v / 1000) + 'rb' : String(v); },

    /**
     * Membaca LocalStorage lalu menghitung semua angka dasbor.
     * - stokPangan    : bahan di kulkas
     * - riwayatPangan : bahan yang diolah ('selamat') atau dibuang ('terbuang')
     * Proyeksi 3 bulan ke depan = rata-rata bulan yang memiliki data.
     * @returns {object} ringkasan angka dan data bulanan
     */
    ringkas() {
      const stok = Util.arr(Util.ambil('stokPangan', []));
      const riwayat = Util.arr(Util.ambil('riwayatPangan', []));
      // Kategori tak dikenal dihitung sebagai "Lainnya" agar total tengah doughnut = jumlah bahan di kartu
      const perKat = KAT.map(() => 0);
      stok.forEach((s) => { const i = KAT.findIndex((k) => s && k[0] === s.kategori); perKat[i < 0 ? KAT.length - 1 : i]++; });
      const mendesak = stok.filter((s) => s.exp && Util.sisaHari(s.exp) < 7).length;
      const selamat = riwayat.filter((r) => r.hasil === 'selamat');
      const buang = riwayat.filter((r) => r.hasil === 'terbuang');
      const hemat = selamat.reduce((n, r) => n + (Number(r.harga) || 0), 0);
      const total = selamat.length + buang.length;

      // Rekap 5 bulan terakhir
      const sekarang = new Date(), kunci = [], label = [];
      for (let i = N_AKTUAL - 1; i >= 0; i--) {
        const d = new Date(sekarang.getFullYear(), sekarang.getMonth() - i, 1);
        kunci.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
        label.push(BULAN[d.getMonth()]);
      }
      const bHemat = kunci.map(() => 0), bSelamat = kunci.map(() => 0), bBuang = kunci.map(() => 0);
      riwayat.forEach((r) => {
        const i = kunci.indexOf(String(r.tanggal).slice(0, 7));
        if (i < 0) return;
        if (r.hasil === 'selamat') { bHemat[i] += Number(r.harga) || 0; bSelamat[i] += 1; }
        else if (r.hasil === 'terbuang') { bBuang[i] += 1; }
      });

      // Proyeksi: rata-rata dari bulan yang punya data
      const ada = kunci.map((_, i) => bSelamat[i] + bBuang[i] > 0);
      const n = ada.filter(Boolean).length;
      const rata = (a) => (n ? Math.round(a.reduce((s, v, i) => s + (ada[i] ? v : 0), 0) / n) : 0);
      for (let j = 1; j <= 3; j++) {
        const d = new Date(sekarang.getFullYear(), sekarang.getMonth() + j, 1);
        label.push(BULAN[d.getMonth()] + '*');
      }
      const ph = rata(bHemat), ps = rata(bSelamat), pb = rata(bBuang);

      return {
        perKat, totalStok: stok.length, mendesak, hemat, insight: this.analisis(stok, perKat),
        persen: total ? Math.round((selamat.length / total) * 100) : 0,
        adaRiwayat: riwayat.length > 0,
        bulanan: { label, hemat: bHemat.concat([ph, ph, ph]), selamat: bSelamat.concat([ps, ps, ps]), buang: bBuang.concat([pb, pb, pb]) }
      };
    },

    /** Membuat kedua grafik sekali saja (dipanggil saat halaman siap). */
    bangun() {
      const cStok = document.getElementById('grafik-stok');
      const cHemat = document.getElementById('grafik-hemat');
      const w = this.warna();
      Chart.defaults.font.family = '"Plus Jakarta Sans", system-ui, sans-serif';
      if (REDUKSI) Chart.defaults.animation = false;

      if (cStok) {
        const hapusAktif = (c) => { c._legAktif = -1; c.setActiveElements([]); c.update(); };
        this.grafikStok = new Chart(cStok, {
          type: 'doughnut',
          data: { labels: KAT.map((k) => k[1]), datasets: [{ data: [], backgroundColor: this.warnaIrisan(), borderColor: w.kartu, borderWidth: 3, hoverBorderColor: w.kartu, hoverOffset: 12 }] },
          plugins: [TeksTengahDoughnut],
          options: {
            responsive: true, maintainAspectRatio: false, cutout: '68%',
            layout: { padding: 8 },
            plugins: {
              nusaTengah: { angka: w.kuat, label: w.teks },
              legend: {
                position: 'bottom',
                labels: { color: w.kuat, usePointStyle: true, padding: 14, font: { size: 12, weight: '600' } },
                onClick: () => {}, // irisan tidak bisa disembunyikan: total di tengah selalu = total stok
                onHover: (e, item, leg) => { const c = leg.chart; if (c._legAktif === item.index) return; c._legAktif = item.index; c.setActiveElements([{ datasetIndex: 0, index: item.index }]); c.update(); },
                onLeave: (e, item, leg) => hapusAktif(leg.chart)
              },
              tooltip: {
                backgroundColor: w.tipBg, titleColor: w.tipTeks, bodyColor: w.tipTeks, borderColor: w.tipGaris, borderWidth: 1,
                padding: 12, cornerRadius: 10, boxPadding: 6, usePointStyle: true,
                titleFont: { weight: '700', size: 13 }, bodyFont: { size: 13 },
                callbacks: {
                  title: (it) => it[0].label,
                  label: (c) => {
                    const tot = c.dataset.data.reduce((a, b) => a + b, 0);
                    return ' ' + c.parsed + ' item (' + (tot ? Math.round((c.parsed / tot) * 100) : 0) + '%)';
                  }
                }
              }
            }
          }
        });
      }

      if (cHemat) {
        this.grafikHemat = new Chart(cHemat, {
          type: 'bar',
          data: { labels: [], datasets: [
            { type: 'bar', label: 'Uang dihemat (Rp)', data: [], backgroundColor: [], borderRadius: 8, yAxisID: 'y', order: 2 },
            { type: 'line', label: 'Item terselamatkan', data: [], borderColor: '#40916C', backgroundColor: '#40916C', tension: 0.35, yAxisID: 'y1', order: 1, pointRadius: 4, pointHoverRadius: 7,
              segment: { borderDash: (c) => (c.p0DataIndex >= N_AKTUAL - 1 ? [6, 6] : undefined) } },
            { type: 'line', label: 'Item terbuang', data: [], borderColor: '#E76F51', backgroundColor: '#E76F51', tension: 0.35, yAxisID: 'y1', order: 1, pointRadius: 4, pointHoverRadius: 7,
              segment: { borderDash: (c) => (c.p0DataIndex >= N_AKTUAL - 1 ? [6, 6] : undefined) } }
          ] },
          options: {
            responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
            scales: {
              x: { ticks: { color: w.teks }, grid: { display: false } },
              y: { beginAtZero: true, position: 'left', ticks: { color: w.teks, callback: (v) => this.singkat(v) }, grid: { color: w.grid } },
              y1: { beginAtZero: true, position: 'right', ticks: { color: w.teks, precision: 0 }, grid: { drawOnChartArea: false } }
            },
            plugins: {
              legend: { position: 'bottom', labels: { color: w.teks, usePointStyle: true, padding: 14 } },
              tooltip: { callbacks: { label: (c) => ' ' + c.dataset.label + ': ' + (c.dataset.yAxisID === 'y' ? 'Rp ' + Math.round(c.parsed.y).toLocaleString('id-ID') : c.parsed.y) } }
            }
          }
        });
      }
    },

    /**
     * Membaca data terbaru, memperbarui kartu angka, bar, dan kedua grafik
     * lewat chart.update(). Dipanggil otomatis setiap data berubah.
     */
    segarkan() {
      const r = this.ringkas();
      const el = (id) => document.getElementById(id);
      this.renderInsight(r.insight);

      Counter.set(el('dasbor-stok'), r.totalStok);
      Counter.set(el('dasbor-mendesak'), r.mendesak);
      Counter.set(el('dasbor-hemat'), r.hemat);
      Counter.set(el('dasbor-persen'), r.persen);
      const bar = el('bar-persen');
      if (bar) { bar.style.width = r.persen + '%'; bar.parentElement.setAttribute('aria-valuenow', String(r.persen)); }

      if (this.grafikStok) {
        this.grafikStok.data.datasets[0].data = r.perKat;
        this.grafikStok.update();
        const ringkasan = KAT.map((k, i) => r.perKat[i] + ' ' + k[1]).join(', ');
        el('grafik-stok').setAttribute('aria-label', 'Grafik komposisi stok pangan: total ' + r.totalStok + ' item. ' + ringkasan + '.');
        if (el('kosong-stok')) el('kosong-stok').style.display = r.totalStok === 0 ? 'flex' : 'none';
      }
      if (this.grafikHemat) {
        const b = r.bulanan, g = this.grafikHemat;
        g.data.labels = b.label;
        g.data.datasets[0].data = b.hemat;
        g.data.datasets[0].backgroundColor = b.label.map((_, i) => (i < N_AKTUAL ? '#40916C' : 'rgba(244,162,97,.8)'));
        g.data.datasets[1].data = b.selamat;
        g.data.datasets[2].data = b.buang;
        g.update();
        if (el('kosong-hemat')) el('kosong-hemat').style.display = r.adaRiwayat ? 'none' : 'flex';
      }
    },

    /** Menyesuaikan warna teks/garis/tepi grafik saat tema berganti. */
    terapkanTema() {
      const w = this.warna();
      if (this.grafikStok) {
        const ds = this.grafikStok.data.datasets[0], po = this.grafikStok.options.plugins;
        ds.backgroundColor = this.warnaIrisan(); ds.borderColor = w.kartu; ds.hoverBorderColor = w.kartu;
        po.legend.labels.color = w.kuat;
        po.nusaTengah.angka = w.kuat; po.nusaTengah.label = w.teks;
        po.tooltip.backgroundColor = w.tipBg; po.tooltip.titleColor = w.tipTeks; po.tooltip.bodyColor = w.tipTeks; po.tooltip.borderColor = w.tipGaris;
        this.grafikStok.update('none');
      }
      if (this.grafikHemat) {
        const o = this.grafikHemat.options;
        o.scales.x.ticks.color = w.teks; o.scales.y.ticks.color = w.teks; o.scales.y1.ticks.color = w.teks;
        o.scales.y.grid.color = w.grid; o.plugins.legend.labels.color = w.teks;
        this.grafikHemat.update('none');
      }
    },

    /** Menjadwalkan segarkan() (digabung agar beberapa setItem beruntun hanya memicu 1 pembaruan). */
    jadwalkan() { clearTimeout(this._j); this._j = setTimeout(() => this.segarkan(), 60); },

    init() {
      const adaKanvas = document.getElementById('grafik-stok') || document.getElementById('grafik-hemat');
      if (!adaKanvas) return;
      if (typeof Chart === 'undefined') {
        document.querySelectorAll('#grafik-stok, #grafik-hemat').forEach((c) => {
          c.parentElement.insertAdjacentHTML('beforeend', '<p style="padding:1rem;font-size:.875rem">Chart.js gagal dimuat. Periksa koneksi internet.</p>');
        });
        return;
      }
      this.bangun();
      this.segarkan();
      // Perbarui otomatis: perubahan di halaman ini, tab lain, atau saat kembali ke tab
      window.addEventListener('nusapangan:berubah', () => this.jadwalkan());
      window.addEventListener('storage', () => this.jadwalkan());
      window.addEventListener('focus', () => this.jadwalkan());
      window.addEventListener('pageshow', () => this.jadwalkan());
      window.addEventListener('nusapangan:tema', () => this.terapkanTema());
    }
  };

  /* =====================================================================
   * 7. FOTO — unggah gambar, kompres, ubah menjadi Base64 (FileReader)
   * ===================================================================== */

  const Foto = {
    /** Format gambar yang diterima. */
    TIPE: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    /** Batas ukuran berkas asli: 5 MB. */
    MAKS_BERKAS: 5 * 1024 * 1024,
    /** Batas aman total karakter LocalStorage (kuota peramban ±5 juta karakter). */
    KUOTA: 4500000,

    /**
     * Memeriksa apakah string adalah data-URL gambar yang aman ditampilkan.
     * Dipakai sebelum memasang src, sehingga data LocalStorage yang diubah
     * manual tidak bisa menyisipkan konten berbahaya.
     * @param {*} src - nilai yang diperiksa
     * @returns {boolean} true bila aman
     */
    aman(src) {
      return typeof src === 'string' && src.length < 700000 &&
        /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+\/=]+$/.test(src);
    },

    /** Menghitung total karakter yang terpakai di LocalStorage (kunci + nilai). */
    terpakai() {
      let n = 0;
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          n += k.length + (localStorage.getItem(k) || '').length;
        }
      } catch (e) { /* diabaikan */ }
      return n;
    },

    /** @returns {boolean} true bila data baru sepanjang `panjang` karakter masih muat. */
    ruangCukup(panjang) { return this.terpakai() + panjang <= this.KUOTA; },

    /**
     * Membaca berkas menjadi data-URL memakai FileReader.
     * @param {File} file - berkas gambar
     * @returns {Promise<string>} data-URL
     */
    bacaBerkas(file) {
      return new Promise((selesai, gagal) => {
        const pembaca = new FileReader();
        pembaca.onload = () => selesai(String(pembaca.result));
        pembaca.onerror = () => gagal(new Error('Gagal membaca berkas. Coba pilih ulang.'));
        pembaca.readAsDataURL(file);
      });
    },

    /** Memuat data-URL menjadi elemen Image. @returns {Promise<HTMLImageElement>} */
    muat(src) {
      return new Promise((selesai, gagal) => {
        const img = new Image();
        img.onload = () => selesai(img);
        img.onerror = () => gagal(new Error('Berkas ini bukan gambar yang valid.'));
        img.src = src;
      });
    },

    /**
     * Memvalidasi, memperkecil, dan mengubah foto menjadi Base64 (JPEG).
     * Kompresi dilakukan bertahap sampai ukuran di bawah batas, supaya
     * LocalStorage tidak cepat penuh.
     * @param {File} file - berkas dari <input type="file">
     * @param {{maxSisi?:number,kualitas?:number,maxKarakter?:number}} [opsi]
     * @returns {Promise<string>} data-URL JPEG; ditolak (reject) dengan Error berpesan Indonesia
     */
    proses(file, opsi) {
      const o = Object.assign({ maxSisi: 800, kualitas: 0.72, maxKarakter: 300000 }, opsi || {});
      if (!file) return Promise.reject(new Error('Tidak ada berkas dipilih.'));
      if (this.TIPE.indexOf(file.type) < 0) return Promise.reject(new Error('Format tidak didukung. Pilih JPG, PNG, WebP, atau GIF.'));
      if (file.size > this.MAKS_BERKAS) return Promise.reject(new Error('Ukuran foto terlalu besar (maks. 5 MB). Pilih foto lain.'));

      return this.bacaBerkas(file).then((src) => this.muat(src)).then((img) => {
        let sisi = o.maxSisi, kualitas = o.kualitas, hasil = '';
        for (let i = 0; i < 4; i++) {
          const skala = Math.min(1, sisi / Math.max(img.width, img.height));
          const kanvas = document.createElement('canvas');
          kanvas.width = Math.max(1, Math.round(img.width * skala));
          kanvas.height = Math.max(1, Math.round(img.height * skala));
          const ctx = kanvas.getContext('2d');
          ctx.fillStyle = '#fff'; // latar putih agar PNG transparan tidak menjadi hitam
          ctx.fillRect(0, 0, kanvas.width, kanvas.height);
          ctx.drawImage(img, 0, 0, kanvas.width, kanvas.height);
          hasil = kanvas.toDataURL('image/jpeg', kualitas);
          if (hasil.length <= o.maxKarakter) break;
          sisi = Math.round(sisi * 0.8);
          kualitas = Math.max(0.4, kualitas - 0.1);
        }
        if (hasil.length > o.maxKarakter) throw new Error('Foto masih terlalu besar setelah dikompres. Pilih foto yang lebih kecil.');
        if (!this.ruangCukup(hasil.length)) throw new Error('Penyimpanan peramban hampir penuh. Hapus postingan atau foto lama terlebih dahulu.');
        return hasil;
      });
    },

    /**
     * Memasang pengunggah foto + pratinjau pada sebuah form.
     * Elemen HTML yang dibutuhkan diberikan lewat id.
     * @param {object} opsi
     * @param {string} opsi.input - id <input type="file">
     * @param {string} opsi.pratinjau - id kotak pratinjau (disembunyikan bila kosong)
     * @param {string} opsi.gambar - id <img> pratinjau
     * @param {string} opsi.hapus - id tombol "Hapus foto"
     * @param {string} opsi.galat - id elemen pesan status/galat
     * @param {number} [opsi.maxSisi] - sisi terpanjang hasil (px)
     * @param {number} [opsi.kualitas] - kualitas JPEG awal (0-1)
     * @param {number} [opsi.maxKarakter] - batas panjang Base64
     * @returns {{ambil:function():(string|null), atur:function(string|null):void, reset:function():void, sedangProses:function():boolean}}
     */
    pasang(opsi) {
      const el = (id) => document.getElementById(id);
      const input = el(opsi.input), kotak = el(opsi.pratinjau), img = el(opsi.gambar), hapus = el(opsi.hapus), galat = el(opsi.galat);
      const status = { nilai: null, proses: false };

      /** Menampilkan/menyembunyikan pratinjau sesuai nilai saat ini. */
      const tampil = () => {
        if (status.nilai) { img.src = status.nilai; kotak.classList.remove('hidden'); }
        else { img.removeAttribute('src'); kotak.classList.add('hidden'); }
      };
      /** Menulis pesan; `error` true = merah, false = status biasa. */
      const pesan = (teks, error) => {
        galat.textContent = teks || '';
        galat.classList.toggle('hidden', !teks);
        galat.classList.toggle('text-red-700', !!error);
      };

      input.addEventListener('change', () => {
        const file = input.files && input.files[0];
        if (!file) return;
        status.proses = true;
        pesan('Memproses foto…', false);
        Foto.proses(file, opsi)
          .then((data) => { status.nilai = data; tampil(); pesan(''); })
          .catch((err) => pesan(err.message, true))
          .then(() => { status.proses = false; input.value = ''; });
      });
      hapus.addEventListener('click', () => { status.nilai = null; tampil(); pesan(''); });

      const kendali = {
        ambil: () => status.nilai,
        atur: (src) => { status.nilai = Foto.aman(src) ? src : null; tampil(); pesan(''); input.value = ''; },
        reset: () => kendali.atur(null),
        sedangProses: () => status.proses
      };
      return kendali;
    }
  };

  /* =====================================================================
   * 8. AKUN — login simulasi, ganti akun, profil, level kontributor
   * ===================================================================== */

  /** Tingkatan level kontributor berdasarkan poin. */
  const LEVEL = [
    { min: 0, nama: 'Pemula Pangan' },
    { min: 20, nama: 'Penjaga Dapur' },
    { min: 50, nama: 'Pahlawan Anti-Food Waste' },
    { min: 100, nama: 'Petani Kota Andal' },
    { min: 200, nama: 'Pelopor Ketahanan Pangan' }
  ];
  const ICON_USER = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>';

  /**
   * Simulasi autentikasi memakai LocalStorage (tanpa server, tanpa kata sandi).
   * Data: 'akun' = daftar akun, 'akunAktif' = id akun yang sedang masuk.
   * Bentuk akun: { id, nama, domisili, avatar (data-URL | null), dibuat }
   * Setiap perubahan memancarkan event "nusapangan:akun" agar halaman ikut menyesuaikan.
   */
  const Akun = {
    /** Tampilan modal: 'profil' | 'edit' | 'masuk' | 'baru'. */
    tampilan: 'profil',
    /** Pesan pengantar (diisi saat modal dibuka oleh "gerbang" login). */
    pesan: '',
    /** Avatar baru saat edit: undefined = tidak berubah, null = dihapus, string = foto baru. */
    avatarBaru: undefined,
    /** Elemen yang fokus sebelum modal dibuka (dikembalikan saat ditutup). */
    pemicu: null,

    /* ---------- data ---------- */

    /** @returns {Array} semua akun. */
    daftar() { return Util.arr(Util.ambil('akun', [])); },

    /** @returns {object|null} akun yang sedang masuk. */
    aktif() { const id = Util.ambil('akunAktif', null); return this.daftar().find((a) => a.id === id) || null; },

    /** @returns {string} nama akun aktif, atau string kosong. */
    namaAktif() { const a = this.aktif(); return a ? a.nama : ''; },

    /** Menulis ke LocalStorage; @returns {boolean} false bila penyimpanan penuh/diblokir. */
    tulis(kunci, nilai) {
      try { localStorage.setItem(AWALAN + kunci, JSON.stringify(nilai)); return true; } catch (e) { return false; }
    },

    /** Membuat dua akun contoh saat pertama kali dibuka agar fitur ganti akun bisa dicoba. */
    seed() {
      if (Util.ambil('akunSiap', false)) return;
      const t = Date.now();
      this.tulis('akun', [
        { id: 'a-budi', nama: 'Budi Santoso', domisili: 'Jakarta Selatan', avatar: null, dibuat: t },
        { id: 'a-sari', nama: 'Sari Wulandari', domisili: 'Bandung', avatar: null, dibuat: t }
      ]);
      this.tulis('akunSiap', true);
    },

    /** Merapikan teks isian: spasi ganda dihapus. */
    bersih(teks) { return String(teks || '').replace(/\s+/g, ' ').trim(); },

    /**
     * Memvalidasi nama dan domisili.
     * @param {string} nama
     * @param {string} domisili
     * @param {string|null} kecualiId - id akun yang dikecualikan dari cek nama kembar
     * @returns {string} pesan galat, atau '' bila valid
     */
    cek(nama, domisili, kecualiId) {
      if (nama.length < 2 || nama.length > 30) return 'Nama harus 2 sampai 30 karakter.';
      if (domisili.length < 2 || domisili.length > 40) return 'Domisili harus 2 sampai 40 karakter.';
      const kembar = this.daftar().some((a) => a.id !== kecualiId && a.nama.toLowerCase() === nama.toLowerCase());
      return kembar ? 'Nama sudah dipakai akun lain.' : '';
    },

    /**
     * Membuat akun baru lalu langsung masuk.
     * @returns {{akun?:object, galat?:string}}
     */
    buat(nama, domisili) {
      const galat = this.cek(nama, domisili, null);
      if (galat) return { galat: galat };
      const baru = { id: 'a-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), nama: nama, domisili: domisili, avatar: null, dibuat: Date.now() };
      const d = this.daftar(); d.push(baru);
      if (!this.tulis('akun', d)) return { galat: 'Penyimpanan penuh, akun tidak dapat dibuat.' };
      this.tulis('akunAktif', baru.id);
      return { akun: baru };
    },

    /**
     * Memperbarui profil. Bila nama berubah, nama penulis pada postingan dan
     * komentar milik akun ini ikut diselaraskan.
     * @param {string} id - id akun
     * @param {{nama:string,domisili:string,avatar?:(string|null)}} data - avatar undefined = tidak diubah
     * @returns {{akun?:object, galat?:string}}
     */
    perbarui(id, data) {
      const d = this.daftar(), i = d.findIndex((a) => a.id === id);
      if (i < 0) return { galat: 'Akun tidak ditemukan.' };
      const galat = this.cek(data.nama, data.domisili, id);
      if (galat) return { galat: galat };
      const lama = d[i];
      d[i] = Object.assign({}, lama, { nama: data.nama, domisili: data.domisili }, data.avatar !== undefined ? { avatar: data.avatar } : {});
      if (!this.tulis('akun', d)) return { galat: 'Penyimpanan penuh. Pilih foto profil yang lebih kecil.' };
      if (lama.nama !== data.nama) this.selaraskanNama(id, data.nama);
      return { akun: d[i] };
    },

    /** Mengganti nama penulis di semua postingan/komentar milik akun `id`. */
    selaraskanNama(id, nama) {
      const posts = Util.arr(Util.ambil('postingan', []));
      let berubah = false;
      posts.forEach((p) => {
        if (p.penulisId === id) { p.nama = nama; berubah = true; }
        Util.arr(p.komentar).forEach((c) => { if (c.penulisId === id) { c.nama = nama; berubah = true; } });
      });
      if (berubah) this.tulis('postingan', posts);
    },

    /** Menghapus akun (postingan lama tetap ada dengan nama penulisnya). */
    hapusAkun(id) {
      this.tulis('akun', this.daftar().filter((a) => a.id !== id));
      if (Util.ambil('akunAktif', null) === id) this.tulis('akunAktif', null);
    },

    /**
     * Menghitung statistik kontribusi dan poin akun.
     * Donasi/postingan/komentar dihitung per akun; tanaman dan bahan
     * diselamatkan dihitung dari data di perangkat ini.
     * Poin = donasi×10 + postingan×2 + komentar×1 + tanaman×5 + selamat×3
     * @param {object} a - akun
     */
    statistik(a) {
      const posts = Util.arr(Util.ambil('postingan', []));
      const milik = posts.filter((p) => p.penulisId === a.id);
      const donasi = milik.filter((p) => p.kategori === 'donasi').length;
      const komentar = posts.reduce((n, p) => n + Util.arr(p.komentar).filter((c) => c.penulisId === a.id).length, 0);
      const tanaman = Util.arr(Util.ambil('tanamanku', [])).length;
      const selamat = Util.arr(Util.ambil('riwayatPangan', [])).filter((r) => r.hasil === 'selamat').length;
      return { donasi: donasi, postingan: milik.length, komentar: komentar, tanaman: tanaman, selamat: selamat,
        poin: donasi * 10 + milik.length * 2 + komentar + tanaman * 5 + selamat * 3 };
    },

    /**
     * Menentukan level dari poin.
     * @param {number} poin
     * @returns {{no:number,nama:string,berikut:(number|null),persen:number}}
     */
    level(poin) {
      let i = 0;
      LEVEL.forEach((l, idx) => { if (poin >= l.min) i = idx; });
      const berikut = i + 1 < LEVEL.length ? LEVEL[i + 1].min : null;
      const persen = berikut === null ? 100 : Math.round(((poin - LEVEL[i].min) / (berikut - LEVEL[i].min)) * 100);
      return { no: i + 1, nama: LEVEL[i].nama, berikut: berikut, persen: persen };
    },

    /**
     * Gerbang login: mengembalikan akun aktif, atau membuka modal dan
     * mengembalikan null bila belum masuk.
     * @param {string} pesan - alasan yang ditampilkan di modal
     * @returns {object|null}
     */
    pastikanMasuk(pesan) {
      const a = this.aktif();
      if (a) return a;
      this.buka(pesan);
      return null;
    },

    /* ---------- aksi ---------- */

    /** Memancarkan event perubahan akun dan menyegarkan tampilan terkait. */
    umumkan() {
      this.perbaruiTombol();
      if (this.terbuka()) this.render();
      window.dispatchEvent(new CustomEvent('nusapangan:akun'));
    },

    /** Masuk sebagai akun `id`. Bila modal dibuka oleh gerbang login, modal ditutup. */
    masuk(id) {
      const a = this.daftar().find((x) => x.id === id);
      if (!a) return;
      const dariGerbang = !!this.pesan;
      this.tulis('akunAktif', id);
      this.pesan = '';
      this.tampilan = 'profil';
      this.umumkan();
      Util.toast('Masuk sebagai ' + a.nama);
      if (dariGerbang) this.tutup();
    },

    /* ---------- tampilan ---------- */

    /**
     * HTML avatar: foto bila ada, atau lingkaran berinisial dengan warna dari nama.
     * @param {object|null} a - akun
     * @param {number} px - ukuran
     */
    avatarHtml(a, px) {
      const gaya = 'width:' + px + 'px;height:' + px + 'px;border-radius:50%;flex-shrink:0;';
      if (a && Foto.aman(a.avatar)) return '<img src="' + a.avatar + '" alt="Foto ' + Util.esc(a.nama) + '" style="' + gaya + 'object-fit:cover">';
      const nama = a ? a.nama : '?';
      let h = 0;
      for (let i = 0; i < nama.length; i++) h = (h * 31 + nama.charCodeAt(i)) % 360;
      return '<span aria-hidden="true" style="' + gaya + 'display:grid;place-items:center;color:#fff;font-weight:800;font-size:' + Math.round(px * 0.42) + 'px;background:hsl(' + h + ' 45% 36%)">' + Util.esc(nama.trim().charAt(0).toUpperCase()) + '</span>';
    },

    /** Memperbarui tombol navbar dan elemen halaman yang memakai atribut data-akun-*. */
    perbaruiTombol() {
      const a = this.aktif();
      const b = document.getElementById('btn-akun');
      if (b) {
        b.innerHTML = (a ? this.avatarHtml(a, 24) : ICON_USER) + '<span class="nama-akun">' + Util.esc(a ? a.nama.split(' ')[0] : 'Masuk') + '</span>';
        b.setAttribute('aria-label', a ? 'Profil ' + a.nama : 'Masuk atau daftar');
      }
      document.querySelectorAll('[data-akun-sapaan]').forEach((el) => { el.textContent = a ? 'Halo, ' + a.nama : el.dataset.akunSapaan; });
      document.querySelectorAll('[data-akun-label]').forEach((el) => { el.textContent = a ? 'Profil saya' : 'Masuk / Daftar'; });
      document.querySelectorAll('[data-akun-level]').forEach((el) => {
        if (a) { const lv = this.level(this.statistik(a).poin); el.textContent = '🏅 ' + lv.nama + ' · Lv. ' + lv.no; el.style.display = 'inline-block'; }
        else el.style.display = 'none';
      });
    },

    /** Menyisipkan tombol akun ke navbar, di sebelah tombol tema. */
    pasangTombol() {
      const tema = document.getElementById('btn-tema');
      if (!tema || document.getElementById('btn-akun')) return;
      const b = document.createElement('button');
      b.id = 'btn-akun';
      b.type = 'button';
      b.className = 'btn-akun';
      b.setAttribute('data-akun-buka', '');
      tema.parentNode.insertBefore(b, tema);
    },

    /** @returns {boolean} true bila modal sedang terbuka. */
    terbuka() { const m = document.getElementById('modal-akun'); return !!m && m.style.display === 'flex'; },

    /** Membuat kerangka modal sekali saja dan memasang semua event-nya. */
    pastikanModal() {
      if (document.getElementById('modal-akun')) return;
      const m = document.createElement('div');
      m.id = 'modal-akun';
      m.style.cssText = 'position:fixed;inset:0;z-index:1500;display:none;align-items:center;justify-content:center;padding:1rem;background:rgba(0,0,0,.6)';
      m.setAttribute('role', 'dialog');
      m.setAttribute('aria-modal', 'true');
      m.setAttribute('aria-labelledby', 'judul-modal-akun');
      m.innerHTML = '<div id="panel-akun" class="relative bg-white text-tua rounded-3xl w-full max-w-md p-6 shadow-2xl" style="max-height:90vh;overflow-y:auto"></div>';
      document.body.appendChild(m);

      m.addEventListener('mousedown', (e) => { if (e.target === m) this.tutup(); });
      const panel = m.firstChild;
      panel.addEventListener('click', (e) => this.klik(e));
      panel.addEventListener('submit', (e) => {
        e.preventDefault();
        if (e.target.id === 'form-akun-baru') this.kirimBaru();
        else if (e.target.id === 'form-akun-edit') this.kirimEdit();
      });
      panel.addEventListener('change', (e) => { if (e.target.id === 'in-avatar') this.pilihAvatar(e.target); });
      document.addEventListener('keydown', (e) => this.tombolKeyboard(e));
    },

    /** Esc menutup modal; Tab dikunci di dalam modal (aksesibilitas). */
    tombolKeyboard(e) {
      if (!this.terbuka()) return;
      if (e.key === 'Escape') { this.tutup(); return; }
      if (e.key !== 'Tab') return;
      const f = Array.prototype.filter.call(document.getElementById('panel-akun').querySelectorAll('button,input,a[href],select,textarea'), (x) => !x.disabled && x.offsetParent !== null);
      if (!f.length) return;
      const awal = f[0], akhir = f[f.length - 1];
      if (e.shiftKey && document.activeElement === awal) { e.preventDefault(); akhir.focus(); }
      else if (!e.shiftKey && document.activeElement === akhir) { e.preventDefault(); awal.focus(); }
    },

    /**
     * Membuka modal. Tampilan awal: profil bila sudah masuk; daftar akun bila
     * ada akun; formulir akun baru bila belum ada akun sama sekali.
     * @param {string} [pesan] - pesan pengantar (dari gerbang login)
     */
    buka(pesan) {
      this.pesan = pesan || '';
      this.avatarBaru = undefined;
      this.tampilan = this.aktif() ? 'profil' : (this.daftar().length ? 'masuk' : 'baru');
      this.pemicu = document.activeElement;
      this.pastikanModal();
      this.render();
      document.getElementById('modal-akun').style.display = 'flex';
      document.body.style.overflow = 'hidden';
      const f = document.querySelector('#panel-akun input, #panel-akun [data-akun-masuk], #panel-akun [data-akun-aksi]:not([data-akun-aksi="tutup"])');
      if (f) f.focus();
    },

    /** Menutup modal dan mengembalikan fokus. */
    tutup() {
      const m = document.getElementById('modal-akun');
      if (!m) return;
      m.style.display = 'none';
      document.body.style.overflow = '';
      this.pesan = '';
      if (this.pemicu && this.pemicu.focus) this.pemicu.focus();
    },

    /** Kembali dari formulir: ke profil bila sudah masuk, ke daftar akun bila ada, selain itu tutup. */
    kembali() {
      this.pesan = '';
      if (this.aktif()) this.tampilan = 'profil';
      else if (this.daftar().length) this.tampilan = 'masuk';
      else { this.tutup(); return; }
      this.render();
    },

    /** Menangani semua klik di dalam modal lewat atribut data-akun-*. */
    klik(e) {
      const m = e.target.closest('[data-akun-masuk]');
      if (m) { this.masuk(m.dataset.akunMasuk); return; }
      const b = e.target.closest('[data-akun-aksi]');
      if (!b) return;
      const aksi = b.dataset.akunAksi, a = this.aktif();
      if (aksi === 'tutup') this.tutup();
      else if (aksi === 'edit') { this.avatarBaru = undefined; this.tampilan = 'edit'; this.render(); }
      else if (aksi === 'ganti') { this.pesan = ''; this.tampilan = 'masuk'; this.render(); }
      else if (aksi === 'baru') { this.tampilan = 'baru'; this.render(); const i = document.getElementById('in-akun-nama'); if (i) i.focus(); }
      else if (aksi === 'kembali') this.kembali();
      else if (aksi === 'keluar') { this.tulis('akunAktif', null); this.tutup(); this.umumkan(); Util.toast('Anda telah keluar'); }
      else if (aksi === 'hapus' && a && confirm('Hapus akun "' + a.nama + '"? Postingan lama tetap ada.')) {
        this.hapusAkun(a.id); this.tampilan = this.daftar().length ? 'masuk' : 'baru'; this.umumkan(); Util.toast('Akun dihapus');
      }
      else if (aksi === 'hapusAvatar') { this.avatarBaru = null; this.segarkanAvatar(); }
    },

    /** Menampilkan pesan galat di dalam modal. */
    tampilGalat(pesan) {
      const g = document.getElementById('galat-akun');
      if (g) { g.textContent = pesan || ''; g.classList.toggle('hidden', !pesan); }
    },

    /** Memproses formulir akun baru. */
    kirimBaru() {
      const hasil = this.buat(this.bersih(document.getElementById('in-akun-nama').value), this.bersih(document.getElementById('in-akun-domisili').value));
      if (hasil.galat) { this.tampilGalat(hasil.galat); return; }
      const dariGerbang = !!this.pesan;
      this.pesan = '';
      this.tampilan = 'profil';
      this.umumkan();
      Util.toast('Akun dibuat. Selamat datang, ' + hasil.akun.nama + '!');
      if (dariGerbang) this.tutup();
    },

    /** Memproses formulir edit profil. */
    kirimEdit() {
      const a = this.aktif();
      if (!a) return;
      const hasil = this.perbarui(a.id, {
        nama: this.bersih(document.getElementById('in-akun-nama').value),
        domisili: this.bersih(document.getElementById('in-akun-domisili').value),
        avatar: this.avatarBaru
      });
      if (hasil.galat) { this.tampilGalat(hasil.galat); return; }
      this.tampilan = 'profil';
      this.avatarBaru = undefined;
      this.umumkan();
      Util.toast('Profil diperbarui');
    },

    /** Memproses foto profil yang dipilih (dikompres kecil: 256 px). */
    pilihAvatar(input) {
      const file = input.files && input.files[0];
      if (!file) return;
      this.tampilGalat('');
      Foto.proses(file, { maxSisi: 256, kualitas: 0.8, maxKarakter: 60000 })
        .then((d) => { this.avatarBaru = d; this.segarkanAvatar(); })
        .catch((err) => this.tampilGalat(err.message))
        .then(() => { input.value = ''; });
    },

    /** Memperbarui pratinjau avatar pada formulir edit. */
    segarkanAvatar() {
      const a = this.aktif(), kotak = document.getElementById('pratinjau-avatar');
      if (!a || !kotak) return;
      kotak.innerHTML = this.avatarHtml({ nama: a.nama, avatar: this.avatarBaru === undefined ? a.avatar : this.avatarBaru }, 72);
    },

    /** Menggambar isi modal sesuai tampilan aktif. */
    render() {
      const panel = document.getElementById('panel-akun');
      if (!panel) return;
      const a = this.aktif(), t = this.tampilan;
      const tutup = '<button type="button" data-akun-aksi="tutup" class="absolute top-4 right-4 w-9 h-9 rounded-xl grid place-items-center hover:bg-tua/5" aria-label="Tutup">✕</button>';
      let isi;
      if (t === 'profil' && a) isi = this.htmlProfil(a);
      else if (t === 'edit' && a) isi = this.htmlEdit(a);
      else if (t === 'baru') isi = this.htmlBaru();
      else isi = this.htmlMasuk();
      panel.innerHTML = tutup + isi;
    },

    /** HTML tampilan profil: avatar, nama, domisili, level, progres, dan statistik. */
    htmlProfil(a) {
      const s = this.statistik(a), lv = this.level(s.poin);
      const ubin = (n, label) => '<div class="bg-krem rounded-2xl p-3 text-center"><p class="text-2xl font-extrabold">' + n + '</p><p class="text-xs text-tua/60">' + label + '</p></div>';
      return '<div class="text-center">' +
          '<div style="display:flex;justify-content:center">' + this.avatarHtml(a, 88) + '</div>' +
          '<h2 id="judul-modal-akun" class="mt-3 text-xl font-extrabold">' + Util.esc(a.nama) + '</h2>' +
          '<p class="text-sm text-tua/60">📍 ' + Util.esc(a.domisili) + '</p>' +
          '<span class="mt-3 inline-block bg-panen/30 rounded-full px-3 py-1 text-xs font-bold">🏅 ' + lv.nama + ' · Lv. ' + lv.no + '</span>' +
        '</div>' +
        '<div class="mt-4"><div class="h-2.5 rounded-full bg-tua/10 overflow-hidden" role="progressbar" aria-valuenow="' + lv.persen + '" aria-valuemin="0" aria-valuemax="100" aria-label="Progres level"><div class="h-full bg-segar rounded-full" style="width:' + lv.persen + '%"></div></div>' +
          '<p class="mt-1 text-xs text-tua/60">' + s.poin + ' poin · ' + (lv.berikut === null ? 'Level tertinggi tercapai' : (lv.berikut - s.poin) + ' poin lagi menuju Lv. ' + (lv.no + 1)) + '</p></div>' +
        '<div class="mt-4 grid grid-cols-2 gap-3">' + ubin(s.donasi, 'Donasi dibagikan') + ubin(s.tanaman, 'Tanaman ditanam') + ubin(s.selamat, 'Bahan diselamatkan') + ubin(s.postingan + s.komentar, 'Postingan & balasan') + '</div>' +
        '<p class="mt-2 text-xs text-tua/50">Tanaman dan bahan diselamatkan dihitung dari data di perangkat ini.</p>' +
        '<div class="mt-5 flex flex-wrap gap-2">' +
          '<button type="button" data-akun-aksi="edit" class="flex-1 bg-tua text-white text-sm font-bold px-4 py-2 rounded-xl hover:brightness-110">Edit profil</button>' +
          '<button type="button" data-akun-aksi="ganti" class="flex-1 border border-tua/20 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-tua/5">Ganti akun</button>' +
          '<button type="button" data-akun-aksi="keluar" class="border border-tua/20 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-tua/5">Keluar</button>' +
        '</div>' +
        '<button type="button" data-akun-aksi="hapus" class="mt-3 text-xs font-semibold text-red-700 hover:underline">Hapus akun ini</button>';
    },

    /** HTML tampilan masuk / ganti akun: daftar akun yang bisa dipilih. */
    htmlMasuk() {
      const aktif = this.aktif();
      return '<h2 id="judul-modal-akun" class="text-xl font-extrabold pr-10">' + (aktif ? 'Ganti akun' : 'Masuk ke NusaPangan') + '</h2>' +
        (this.pesan ? '<p class="mt-2 text-sm bg-panen/25 rounded-xl px-3 py-2">' + Util.esc(this.pesan) + '</p>'
                    : '<p class="mt-2 text-sm text-tua/60">Pilih akun untuk melanjutkan atau buat akun baru. Akun disimpan di perangkat ini (simulasi, tanpa kata sandi).</p>') +
        '<ul class="mt-4 space-y-2">' + this.daftar().map((a) =>
          '<li><button type="button" data-akun-masuk="' + a.id + '" class="w-full flex items-center gap-3 text-left p-3 rounded-2xl border border-tua/10 hover:bg-tua/5">' +
            this.avatarHtml(a, 40) +
            '<span class="min-w-0 flex-1"><strong class="block truncate">' + Util.esc(a.nama) + '</strong><span class="text-xs text-tua/60">' + Util.esc(a.domisili) + '</span></span>' +
            (aktif && aktif.id === a.id ? '<span class="text-xs font-bold text-segar">Aktif</span>' : '') +
          '</button></li>').join('') + '</ul>' +
        '<div class="mt-4 flex gap-2"><button type="button" data-akun-aksi="baru" class="flex-1 bg-tua text-white text-sm font-bold px-4 py-2 rounded-xl hover:brightness-110">+ Buat akun baru</button>' +
        (aktif ? '<button type="button" data-akun-aksi="kembali" class="border border-tua/20 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-tua/5">Kembali</button>' : '') + '</div>';
    },

    /** HTML formulir pembuatan akun baru. */
    htmlBaru() {
      return '<h2 id="judul-modal-akun" class="text-xl font-extrabold pr-10">Buat akun baru</h2>' +
        (this.pesan ? '<p class="mt-2 text-sm bg-panen/25 rounded-xl px-3 py-2">' + Util.esc(this.pesan) + '</p>' : '') +
        '<form id="form-akun-baru" class="mt-4 space-y-3" novalidate>' +
          '<div><label for="in-akun-nama" class="block text-sm font-semibold mb-1">Nama</label><input id="in-akun-nama" type="text" maxlength="30" placeholder="Contoh: Bu Ratna" class="isian" /></div>' +
          '<div><label for="in-akun-domisili" class="block text-sm font-semibold mb-1">Domisili</label><input id="in-akun-domisili" type="text" maxlength="40" placeholder="Contoh: Bandung" class="isian" /></div>' +
          '<p id="galat-akun" class="text-sm text-red-700 hidden" role="alert"></p>' +
          '<div class="flex gap-2"><button type="submit" class="flex-1 bg-tua text-white text-sm font-bold px-4 py-2 rounded-xl hover:brightness-110">Buat akun & masuk</button>' +
          '<button type="button" data-akun-aksi="kembali" class="border border-tua/20 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-tua/5">Batal</button></div>' +
        '</form>';
    },

    /** HTML formulir edit profil (nama, domisili, foto profil). */
    htmlEdit(a) {
      return '<h2 id="judul-modal-akun" class="text-xl font-extrabold pr-10">Edit profil</h2>' +
        '<form id="form-akun-edit" class="mt-4 space-y-3" novalidate>' +
          '<div class="flex items-center gap-4"><div id="pratinjau-avatar">' + this.avatarHtml(a, 72) + '</div>' +
            '<div class="min-w-0"><label for="in-avatar" class="block text-sm font-semibold mb-1">Foto profil</label>' +
            '<input id="in-avatar" type="file" accept="image/*" class="text-xs w-full" />' +
            '<button type="button" data-akun-aksi="hapusAvatar" class="mt-1 text-xs font-semibold text-red-700 hover:underline">Hapus foto</button></div></div>' +
          '<div><label for="in-akun-nama" class="block text-sm font-semibold mb-1">Nama</label><input id="in-akun-nama" type="text" maxlength="30" value="' + Util.esc(a.nama) + '" class="isian" /></div>' +
          '<div><label for="in-akun-domisili" class="block text-sm font-semibold mb-1">Domisili</label><input id="in-akun-domisili" type="text" maxlength="40" value="' + Util.esc(a.domisili) + '" class="isian" /></div>' +
          '<p id="galat-akun" class="text-sm text-red-700 hidden" role="alert"></p>' +
          '<div class="flex gap-2"><button type="submit" class="flex-1 bg-tua text-white text-sm font-bold px-4 py-2 rounded-xl hover:brightness-110">Simpan perubahan</button>' +
          '<button type="button" data-akun-aksi="kembali" class="border border-tua/20 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-tua/5">Batal</button></div>' +
        '</form>';
    },

    /** Titik masuk modul: data awal, tombol navbar, dan pendengar event. */
    init() {
      this.seed();
      this.pasangTombol();
      this.perbaruiTombol();
      // Elemen apa pun dengan atribut data-akun-buka membuka modal profil/login
      document.addEventListener('click', (e) => { if (e.target.closest('[data-akun-buka]')) this.buka(); });
      window.addEventListener('storage', () => { this.perbaruiTombol(); if (this.terbuka()) this.render(); });
    }
  };

  /* =====================================================================
   * 9. NUSA-AI — Asisten Cerdas Ketahanan Pangan (Floating Chatbot Widget)
   * ---------------------------------------------------------------------
   * Cara kerja singkat:
   *  1. Konteks   : MEMBACA data asli pengguna dari LocalStorage
   *                 (stokPangan, riwayatPangan, tanamanku, gizi, iklim,
   *                 postingan, akun) setiap kali pertanyaan diajukan.
   *  2. Otak      : mencocokkan pertanyaan dengan kata kunci berbobot
   *                 (Smart Knowledge Base) lalu memilih "intent" terbaik.
   *  3. Jawaban   : menyusun jawaban HTML yang menggabungkan pengetahuan
   *                 umum + data pengguna (contoh: menyebut nama bahan di
   *                 kulkas pengguna beserta sisa harinya).
   *  4. Tampilan  : tombol melayang, jendela chat, animasi mengetik,
   *                 Quick Prompts, riwayat percakapan (sessionStorage).
   * Seluruh HTML/CSS widget disuntikkan oleh modul ini, sehingga cukup
   * memuat app.js di setiap halaman (sudah dilakukan di 5 halaman).
   * ===================================================================== */

  /**
   * Bahan di Kulkas Digital (hasil pembacaan `stokPangan` + sisa hari).
   * @typedef {Object} BahanStok
   * @property {string} nama - nama bahan, contoh "Bayam"
   * @property {number|string} jumlah - jumlah bahan
   * @property {string} satuan - satuan, contoh "ikat"
   * @property {string} kategori - sayur | buah | protein | susu | karbo | lainnya
   * @property {number} harga - perkiraan harga (Rp)
   * @property {number} sisa - sisa hari menuju kedaluwarsa (negatif = sudah lewat; 9999 = tanpa tanggal)
   */

  /**
   * Tanaman milik pengguna (hasil pembacaan `tanamanku` + katalog).
   * @typedef {Object} TanamanKu
   * @property {string} nama - nama tanaman
   * @property {Object} kat - entri katalog (metode, lahan, sulit, hari, iklim, tip)
   * @property {string} lokasi - lokasi tanam (boleh kosong)
   * @property {number} usia - umur tanaman (hari)
   * @property {number} persen - progres menuju panen (0-100)
   * @property {number} sisa - hari lagi menuju panen
   * @property {boolean} dipanen - sudah ditandai panen
   * @property {boolean} siap - sudah waktunya panen dan belum dipanen
   */

  /**
   * Ringkasan gizi keluarga hari ini (rumus sama dengan halaman Nutrisi).
   * @typedef {Object} RingkasGizi
   * @property {number} dewasa - jumlah anggota dewasa
   * @property {number} anak - jumlah anak
   * @property {Array<Object>} menu - resep yang dipilih hari ini
   * @property {number} faktor - porsi setara dewasa (dewasa + anak x 0,6)
   * @property {Array<{k:string,label:string,sat:string,asupan:number,target:number,sisa:number,persen:number}>} hasil - 4 zat gizi
   */

  const NusaAi = (function () {

    /* ---------- KONFIGURASI & DATA RUJUKAN ---------- */

    /** Kunci sessionStorage untuk riwayat chat (hilang saat tab ditutup). */
    const KUNCI_SESI = AWALAN + 'nusaai';
    /** Batas hari status stok (sama dengan foodrescue.html & nutrisi.html). */
    const BATAS_MERAH = 3;
    const BATAS_KUNING = 7;
    /** Porsi anak = 0,6 porsi dewasa (sama dengan nutrisi.html). */
    const PORSI_ANAK = 0.6;
    /** Jumlah pesan maksimum yang disimpan di sesi. */
    const MAKS_PESAN = 40;

    /** Target gizi harian per orang (salinan dari nutrisi.html). */
    const TARGET = {
      dewasa: { kal: 2100, prot: 60, serat: 30, vitc: 75 },
      anak: { kal: 1650, prot: 40, serat: 22, vitc: 45 }
    };
    /** Zat gizi yang dihitung. */
    const NUTRISI = [
      { k: 'kal', label: 'Kalori', sat: 'kkal' }, { k: 'prot', label: 'Protein', sat: 'g' },
      { k: 'serat', label: 'Serat', sat: 'g' }, { k: 'vitc', label: 'Vitamin C', sat: 'mg' }
    ];

    /** Quick Prompts untuk juri/pengguna: `i` = id intent yang dipaksa agar jawaban pasti tepat. */
    const PROMPT_CEPAT = [
      { i: 'kulkas', ikon: '🥬', label: 'Cek kulkas', teks: 'Cek bahan kulkas saya yang hampir basi!' },
      { i: 'iklim', ikon: '☀️', label: 'Tanaman panas', teks: 'Rekomendasi tanaman untuk cuaca panas ekstrem?' },
      { i: 'simpan', ikon: '📦', label: 'Simpan sayur', teks: 'Tips menyimpan sayuran agar tahan 2 minggu?' },
      { i: 'gizi', ikon: '🍽️', label: 'Sisa gizi', teks: 'Berapa sisa kebutuhan gizi keluarga saya hari ini?' }
    ];

    /** Kondisi iklim (salinan dari farming.html). */
    const IKLIM = {
      kemarau: { judul: 'Kemarau panjang', info: 'Air terbatas dan tanah cepat kering. Pilih tanaman tahan kering.',
        tips: ['Beri mulsa jerami atau daun kering di permukaan tanah.', 'Siram pagi atau sore, bukan siang hari.', 'Tampung air bekas cucian sayur untuk menyiram.'] },
      hujan: { judul: 'Musim hujan lebat', info: 'Tanah mudah becek dan jamur cepat tumbuh. Utamakan drainase.',
        tips: ['Lubangi dasar polybag dan letakkan di tempat tinggi.', 'Pasang atap plastik sederhana di atas tanaman.', 'Singkirkan daun yang kuning agar jamur tidak menyebar.'] },
      dingin: { judul: 'Dataran tinggi dingin', info: 'Suhu sejuk cocok untuk sayuran daun dan umbi, tetapi pertumbuhan lebih lambat.',
        tips: ['Tanam di tempat yang kena sinar pagi.', 'Lindungi bibit dari embun beku dengan sungkup plastik.', 'Siram secukupnya karena penguapan rendah.'] },
      panas: { judul: 'Perkotaan panas', info: 'Beton memantulkan panas dan lahan sempit. Pakai wadah dan naungan.',
        tips: ['Pasang paranet 50% untuk menahan sinar terik.', 'Susun pot secara vertikal untuk menghemat ruang.', 'Letakkan wadah air di dekat tanaman agar lembap.'] }
    };

    /** Katalog tanaman (salinan dari farming.html). */
    const TANAMAN = [
      { id: 'kangkung', nama: 'Kangkung', metode: 'Hidroponik / Polybag', lahan: 'sempit', sulit: 'mudah', hari: 25, iklim: ['hujan', 'panas'], tip: 'Suka air dan matahari penuh. Panen dengan memotong, batang akan tumbuh lagi.' },
      { id: 'bayam', nama: 'Bayam', metode: 'Polybag', lahan: 'sempit', sulit: 'mudah', hari: 30, iklim: ['hujan', 'panas'], tip: 'Tanam rapat di polybag lebar. Siram pagi dan sore.' },
      { id: 'sawi', nama: 'Sawi Pakcoy', metode: 'Hidroponik', lahan: 'sempit', sulit: 'mudah', hari: 30, iklim: ['dingin', 'hujan'], tip: 'Cocok di sistem sumbu (wick). Ganti larutan nutrisi tiap 2 minggu.' },
      { id: 'selada', nama: 'Selada', metode: 'Hidroponik', lahan: 'sempit', sulit: 'sedang', hari: 35, iklim: ['dingin'], tip: 'Tidak tahan panas terik. Letakkan di tempat teduh terang.' },
      { id: 'daunbawang', nama: 'Daun Bawang', metode: 'Polybag', lahan: 'sempit', sulit: 'mudah', hari: 60, iklim: ['dingin', 'hujan'], tip: 'Bisa ditanam dari sisa akar dapur. Pastikan drainase baik.' },
      { id: 'cabai', nama: 'Cabai Rawit', metode: 'Polybag', lahan: 'sedang', sulit: 'sedang', hari: 90, iklim: ['kemarau', 'panas'], tip: 'Tahan panas. Beri pupuk kompos tiap 2 minggu dan jangan terlalu basah.' },
      { id: 'terong', nama: 'Terong Ungu', metode: 'Polybag', lahan: 'sedang', sulit: 'mudah', hari: 80, iklim: ['panas', 'kemarau'], tip: 'Butuh sinar matahari 6 jam atau lebih. Beri ajir saat berbuah.' },
      { id: 'tomat', nama: 'Tomat Cherry', metode: 'Polybag', lahan: 'sedang', sulit: 'sedang', hari: 75, iklim: ['dingin'], tip: 'Pasang ajir dan buang tunas air supaya buah lebih besar.' },
      { id: 'kacang', nama: 'Kacang Panjang', metode: 'Polybag / Lahan', lahan: 'sedang', sulit: 'mudah', hari: 60, iklim: ['kemarau', 'panas'], tip: 'Merambat, sediakan tiang atau tali. Tanaman ini juga menyuburkan tanah.' },
      { id: 'jahe', nama: 'Jahe', metode: 'Polybag besar', lahan: 'sedang', sulit: 'mudah', hari: 240, iklim: ['hujan'], tip: 'Butuh waktu lama tapi hampir tanpa perawatan. Tanam rimpang bermata tunas.' },
      { id: 'singkong', nama: 'Singkong', metode: 'Lahan tanah', lahan: 'luas', sulit: 'mudah', hari: 240, iklim: ['kemarau'], tip: 'Sangat tahan kering. Sumber karbohidrat cadangan keluarga.' },
      { id: 'ubijalar', nama: 'Ubi Jalar', metode: 'Lahan tanah', lahan: 'luas', sulit: 'mudah', hari: 120, iklim: ['kemarau', 'hujan'], tip: 'Tanam stek batang pada guludan. Daunnya juga bisa dimakan.' },
      { id: 'jagung', nama: 'Jagung Manis', metode: 'Lahan tanah', lahan: 'luas', sulit: 'sedang', hari: 70, iklim: ['kemarau'], tip: 'Tanam berbaris minimal 3 baris agar penyerbukan sempurna.' },
      { id: 'kentang', nama: 'Kentang', metode: 'Lahan / Karung', lahan: 'luas', sulit: 'sulit', hari: 100, iklim: ['dingin'], tip: 'Butuh suhu sejuk. Timbun tanah di pangkal batang agar umbi tidak hijau.' }
    ];

    /** Resep (salinan ringkas dari nutrisi.html; langkah memasak ada di halaman Nutrisi). */
    const RESEP = [
      { id: 'sayurbening', nama: 'Sayur Bening Bayam Jagung', bahan: ['bayam', 'jagung', 'wortel'], kal: 90, prot: 4, serat: 4, vitc: 30, harga: 3500 },
      { id: 'tumiskangkung', nama: 'Tumis Kangkung Bawang', bahan: ['kangkung', 'bawang'], kal: 110, prot: 3, serat: 4, vitc: 35, harga: 3000 },
      { id: 'tempeorek', nama: 'Tempe Orek Kecap', bahan: ['tempe'], kal: 210, prot: 14, serat: 4, vitc: 1, harga: 3500 },
      { id: 'dadarsayur', nama: 'Telur Dadar Sayur', bahan: ['telur', 'wortel', 'bayam', 'daun bawang'], kal: 180, prot: 12, serat: 2, vitc: 8, harga: 4000 },
      { id: 'sopayam', nama: 'Sup Ayam Wortel Kentang', bahan: ['ayam', 'wortel', 'kentang', 'seledri'], kal: 260, prot: 22, serat: 4, vitc: 12, harga: 9000 },
      { id: 'nasigoreng', nama: 'Nasi Goreng Sayur Telur', bahan: ['nasi', 'beras', 'telur', 'wortel', 'sawi'], kal: 420, prot: 14, serat: 3, vitc: 6, harga: 6000 },
      { id: 'smoothie', nama: 'Smoothie Pisang Susu', bahan: ['pisang', 'susu'], kal: 220, prot: 7, serat: 3, vitc: 9, harga: 5000 },
      { id: 'pancake', nama: 'Pancake Pisang Telur', bahan: ['pisang', 'telur', 'susu'], kal: 280, prot: 9, serat: 2, vitc: 5, harga: 4500 },
      { id: 'tumistahu', nama: 'Tumis Tahu Sawi Tomat', bahan: ['tahu', 'sawi', 'tomat'], kal: 190, prot: 13, serat: 3, vitc: 28, harga: 4500 },
      { id: 'ayamsuwir', nama: 'Ayam Suwir Bumbu Kuning', bahan: ['ayam'], kal: 240, prot: 24, serat: 1, vitc: 3, harga: 8500 },
      { id: 'urap', nama: 'Urap Sayur Kelapa', bahan: ['kacang panjang', 'bayam', 'tauge', 'kelapa'], kal: 150, prot: 5, serat: 7, vitc: 22, harga: 3500 },
      { id: 'buburubi', nama: 'Bubur Ubi Jalar Susu', bahan: ['ubi', 'susu'], kal: 230, prot: 6, serat: 5, vitc: 22, harga: 3000 },
      { id: 'sayurasem', nama: 'Sayur Asem', bahan: ['jagung', 'kacang panjang', 'labu', 'tomat'], kal: 100, prot: 3, serat: 6, vitc: 28, harga: 3500 },
      { id: 'gadogado', nama: 'Gado-gado Lengkap', bahan: ['kacang panjang', 'kol', 'tauge', 'tahu', 'tempe', 'telur'], kal: 400, prot: 18, serat: 10, vitc: 30, harga: 8000 },
      { id: 'singkong', nama: 'Singkong Rebus Sambal Tomat', bahan: ['singkong', 'tomat'], kal: 250, prot: 2, serat: 4, vitc: 20, harga: 2500 }
    ];

    /**
     * Tips penyimpanan per jenis bahan. Dicocokkan berurutan dengan nama
     * bahan (huruf kecil); entri pertama yang cocok dipakai.
     */
    const TIPS_SIMPAN = [
      { r: /daun bawang|seledri/, tahan: '1–2 minggu', tip: 'berdirikan dalam gelas berisi sedikit air (seperti buket) di kulkas, atau iris lalu bekukan.' },
      { r: /bayam|kangkung|sawi|selada|pakcoy|caisim|kemangi|kale/, tahan: '5–7 hari', tip: 'jangan dicuci dulu, bungkus kertas dapur kering, simpan di wadah tertutup rak bawah kulkas. Ganti kertas bila lembap.' },
      { r: /wortel|lobak|bit\b|labu/, tahan: '2–4 minggu', tip: 'buang daun/ujungnya, bungkus kertas atau rendam dalam wadah berisi air (ganti tiap 3–4 hari) di kulkas.' },
      { r: /kol|kubis|brokoli/, tahan: '2–3 minggu', tip: 'simpan utuh (jangan diiris), bungkus plastik berlubang di laci sayur.' },
      { r: /terong|timun|mentimun|buncis|kacang panjang|tauge/, tahan: '5–7 hari', tip: 'kantong berlubang di laci sayur; tauge direndam air di wadah tertutup dan diganti tiap hari.' },
      { r: /tomat/, tahan: '1–2 minggu', tip: 'biarkan di suhu ruang sampai matang (tangkai menghadap bawah), pindahkan ke kulkas bila sudah sangat matang.' },
      { r: /cabai|cabe/, tahan: '1–2 minggu', tip: 'simpan kering di wadah beralas tisu. Untuk lebih lama, bekukan utuh dalam wadah kedap.' },
      { r: /bawang/, tahan: '1–2 bulan', tip: 'tempat kering, gelap, dengan sirkulasi udara (jaring/keranjang); jangan dekat kentang.' },
      { r: /kentang|ubi|singkong|talas/, tahan: '3–4 minggu', tip: 'tempat sejuk, gelap, kering; jangan dikulkas dan jangan dekat bawang. Singkong kupas bisa dibekukan.' },
      { r: /pisang/, tahan: '3–7 hari', tip: 'suhu ruang, gantung atau bungkus tangkainya. Yang terlalu matang: kupas lalu bekukan untuk smoothie.' },
      { r: /apel|jeruk|pir|anggur|mangga|pepaya|buah/, tahan: '1–3 minggu', tip: 'simpan di kulkas terpisah dari sayuran (buah matang mengeluarkan gas etilen yang mempercepat sayur layu).' },
      { r: /tempe/, tahan: '3–5 hari', tip: 'kulkas dalam wadah tertutup; untuk lebih lama, kukus sebentar lalu bekukan.' },
      { r: /tahu/, tahan: '3–5 hari', tip: 'rendam dengan air bersih dalam wadah tertutup dan ganti airnya tiap hari.' },
      { r: /telur/, tahan: '3–5 minggu', tip: 'simpan di kulkas dengan sisi lancip ke bawah; jangan dicuci sebelum disimpan.' },
      { r: /ayam|daging|ikan|udang|sapi/, tahan: '1–2 hari (kulkas)', tip: 'bagi per porsi, bekukan dalam wadah kedap (bisa 2–3 bulan). Cairkan di kulkas, jangan di suhu ruang.' },
      { r: /susu|yogurt|keju/, tahan: '2–3 hari setelah dibuka', tip: 'tutup rapat, simpan di bagian dalam kulkas (bukan di pintu).' },
      { r: /beras|tepung|mie|pasta/, tahan: '3–6 bulan', tip: 'wadah kedap udara di tempat kering; tambahkan daun salam untuk mengurangi kutu.' },
      { r: /roti/, tahan: '3–5 hari', tip: 'simpan di suhu ruang tertutup; sisanya bekukan per lembar.' }
    ];

    /* ---------- BANTU: ESCAPE, FORMAT, PEMBENTUK HTML ---------- */

    /** Escape teks untuk disisipkan ke HTML. @param {*} t @returns {string} */
    const e = (t) => Util.esc(String(t == null ? '' : t));
    /** Escape teks untuk nilai atribut HTML (kutip ikut diamankan). @param {*} t @returns {string} */
    const ea = (t) => e(t).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    /** Angka ke format Indonesia: 6800 menjadi "6.800". @param {number} n @returns {string} */
    const fmt = (n) => Math.round(n).toLocaleString('id-ID');
    /** Angka ke rupiah. @param {number} n @returns {string} */
    const rupiah = (n) => 'Rp ' + fmt(n);
    /** Teks sisa hari yang ramah dibaca. @param {number} s @returns {string} */
    const teksSisa = (s) => (s >= 9999 ? 'tanpa tanggal' : s < 0 ? 'lewat ' + Math.abs(s) + ' hari' : s === 0 ? 'kedaluwarsa hari ini' : s + ' hari lagi');
    /** Ikon status berdasarkan sisa hari. @param {number} s @returns {string} */
    const ikonStatus = (s) => (s < 0 ? '🔴' : s < BATAS_MERAH ? '🟠' : s < BATAS_KUNING ? '🟡' : '🟢');
    /** "2 ikat" dari bahan stok. @param {BahanStok} s @returns {string} */
    const jumlahTeks = (s) => e(s.jumlah) + (s.satuan ? ' ' + e(s.satuan) : '');
    /** Menggabungkan nama bahan: "Bayam, Tempe, dan Susu". @param {Array<string>} a @returns {string} */
    const daftarNama = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' dan ' + a[a.length - 1]);

    /** Pembentuk potongan HTML jawaban (semua teks dinamis wajib lewat e()). */
    const H = {
      p: (t) => '<p>' + t + '</p>',
      h: (t) => '<p class="na-h">' + t + '</p>',
      ul: (a) => '<ul>' + a.map((x) => '<li>' + x + '</li>').join('') + '</ul>',
      ol: (a) => '<ol>' + a.map((x) => '<li>' + x + '</li>').join('') + '</ol>',
      note: (t) => '<p class="na-note">' + t + '</p>',
      /** Chip pertanyaan lanjutan: klik = mengirim `teks` sebagai pertanyaan. */
      q: (teks, label) => '<button type="button" class="na-chip" data-na-q="' + ea(teks) + '">' + (label || e(teks)) + '</button>',
      /** Tautan ke halaman lain di NusaPangan. */
      link: (href, teks) => '<a class="na-chip na-link" href="' + href + '">' + teks + ' →</a>',
      chips: (a) => '<div class="na-chips">' + a.join('') + '</div>',
      /** Progress bar mini; `kelas` = '' (hijau) | 'na-kuning' | 'na-merah'. */
      bar: (persen, kelas) => '<div class="na-bar" role="img" aria-label="' + Math.round(persen) + ' persen"><i class="' + (kelas || '') + '" style="width:' + Math.max(0, Math.min(100, persen)) + '%"></i></div>'
    };

    /* ---------- 1. KONTEKS: membaca data asli pengguna ---------- */

    /** Pembaca data LocalStorage. Semua fungsi aman dari data rusak/kosong. */
    const Konteks = {
      /**
       * Membaca Kulkas Digital (kunci `stokPangan`) dan menghitung sisa hari.
       * @returns {Array<BahanStok>} diurutkan dari yang paling dekat kedaluwarsa
       */
      stok() {
        return Util.arr(Util.ambil('stokPangan', [])).filter((s) => s && s.nama).map((s) => {
          const sisa = s.exp ? Util.sisaHari(s.exp) : 9999;
          return { nama: String(s.nama), jumlah: s.jumlah, satuan: s.satuan ? String(s.satuan) : '', kategori: s.kategori, harga: Number(s.harga) || 0, sisa: isNaN(sisa) ? 9999 : sisa };
        }).sort((a, b) => a.sisa - b.sisa);
      },

      /**
       * Mengelompokkan stok menurut status (aturan sama dengan Food Rescue).
       * @param {Array<BahanStok>} stok
       * @returns {{basi:Array,merah:Array,kuning:Array,aman:Array}}
       */
      kelompok(stok) {
        return {
          basi: stok.filter((s) => s.sisa < 0),
          merah: stok.filter((s) => s.sisa >= 0 && s.sisa < BATAS_MERAH),
          kuning: stok.filter((s) => s.sisa >= BATAS_MERAH && s.sisa < BATAS_KUNING),
          aman: stok.filter((s) => s.sisa >= BATAS_KUNING)
        };
      },

      /** @returns {Array<Object>} riwayat bahan diolah ("selamat") / dibuang ("terbuang"). */
      riwayat() { return Util.arr(Util.ambil('riwayatPangan', [])); },

      /**
       * Membaca tanaman pengguna (kunci `tanamanku`) lalu menghitung progres panen.
       * @returns {Array<TanamanKu>}
       */
      tanaman() {
        return Util.arr(Util.ambil('tanamanku', [])).map((t) => {
          const k = TANAMAN.find((x) => t && x.id === t.id);
          if (!k) return null;
          const usia = Math.max(0, -Util.sisaHari(t.tanggal)) || 0;
          return { nama: k.nama, kat: k, lokasi: t.lokasi ? String(t.lokasi) : '', usia: usia, persen: Math.min(100, Math.round(usia / k.hari * 100)),
            sisa: Math.max(0, k.hari - usia), dipanen: !!t.dipanen, siap: !t.dipanen && usia >= k.hari };
        }).filter(Boolean);
      },

      /**
       * Membaca kalkulator gizi (kunci `gizi`) dengan rumus yang sama persis
       * seperti halaman Nutrisi. Menu otomatis kosong bila sudah ganti hari.
       * @returns {RingkasGizi}
       */
      gizi() {
        const s = Util.ambil('gizi', null) || {};
        const batas = (n, a, b) => { n = Math.round(Number(n)); return isNaN(n) ? a : Math.min(b, Math.max(a, n)); };
        const dewasa = batas(s.dewasa === undefined ? 2 : s.dewasa, 1, 10);
        const anak = batas(s.anak === undefined ? 2 : s.anak, 0, 10);
        const ids = s.tanggal === new Date().toLocaleDateString('en-CA') && Array.isArray(s.menu) ? s.menu : [];
        const menu = ids.map((id) => RESEP.find((r) => r.id === id)).filter(Boolean);
        const faktor = dewasa + anak * PORSI_ANAK;
        const hasil = NUTRISI.map((n) => {
          const asupan = menu.reduce((t, r) => t + r[n.k], 0) * faktor;
          const target = dewasa * TARGET.dewasa[n.k] + anak * TARGET.anak[n.k];
          return { k: n.k, label: n.label, sat: n.sat, asupan: asupan, target: target, sisa: Math.max(0, target - asupan), persen: Math.round(asupan / target * 100) };
        });
        return { dewasa: dewasa, anak: anak, menu: menu, faktor: faktor, hasil: hasil };
      },

      /** @returns {string} kunci iklim yang dipilih di Urban Farming ('' bila belum ada). */
      iklim() { const k = Util.ambil('iklim', ''); return IKLIM[k] ? k : ''; },

      /** @returns {Array<Object>} postingan komunitas. */
      postingan() { return Util.arr(Util.ambil('postingan', [])); },

      /** @returns {number} jumlah bahan yang perlu segera diolah (sisa < 3 hari, termasuk yang sudah lewat). */
      jumlahDarurat() { return this.stok().filter((s) => s.sisa < BATAS_MERAH).length; },

      /**
       * Bahan stok yang dipakai sebuah resep (aturan sama dengan Nutrisi).
       * @param {Object} r - resep
       * @param {Array<BahanStok>} aktif - stok yang belum lewat tanggal
       * @returns {Array<BahanStok>}
       */
      cocokResep(r, aktif) {
        return aktif.filter((s) => {
          const n = s.nama.toLowerCase();
          return r.bahan.some((kw) => n.indexOf(kw) >= 0 || (n.length >= 4 && kw.indexOf(n) >= 0));
        });
      },

      /**
       * Resep paling cocok dengan stok; bahan yang hampir kedaluwarsa diberi bobot lebih besar.
       * @param {Array<BahanStok>} stok
       * @param {number} maks - jumlah resep maksimum
       * @returns {Array<{r:Object,c:Array<BahanStok>,skor:number}>}
       */
      saranResep(stok, maks) {
        const aktif = stok.filter((s) => s.sisa >= 0);
        const bobot = (s) => (s.sisa < BATAS_MERAH ? 3 : s.sisa < BATAS_KUNING ? 2 : 1);
        return RESEP.map((r) => { const c = this.cocokResep(r, aktif); return { r: r, c: c, skor: c.reduce((n, s) => n + bobot(s), 0) }; })
          .filter((x) => x.skor > 0).sort((a, b) => b.skor - a.skor).slice(0, maks);
      },

      /**
       * Mencari tips penyimpanan sesuai nama bahan.
       * @param {string} nama
       * @returns {{tahan:string,tip:string}}
       */
      tipSimpan(nama) {
        const n = String(nama).toLowerCase();
        const t = TIPS_SIMPAN.find((x) => x.r.test(n));
        return t || { tahan: 'bervariasi', tip: 'simpan di tempat sejuk, kering, dalam wadah tertutup, dan periksa tiap 2 hari.' };
      }
    };

    /* ---------- 2. JAWABAN: pengetahuan + data pengguna ---------- */

    /** Kumpulan penyusun jawaban. Setiap fungsi menerima konteks `c` dan mengembalikan HTML. */
    const Jawaban = {

      /* ===== Sapaan & bantuan ===== */

      /**
       * Pesan pembuka yang langsung merangkum data pengguna.
       * @returns {string} HTML
       */
      sambutan() {
        const a = Akun.aktif();
        const stok = Konteks.stok(), g = Konteks.kelompok(stok);
        const tan = Konteks.tanaman().filter((t) => !t.dipanen), gz = Konteks.gizi();
        const baris = [];
        if (stok.length) baris.push('📦 <b>' + stok.length + ' bahan</b> di kulkas' + (g.basi.length + g.merah.length ? ' — <b>' + (g.basi.length + g.merah.length) + ' perlu segera diolah</b>' : ' — semua masih aman'));
        if (tan.length) baris.push('🌱 <b>' + tan.length + ' tanaman</b> sedang tumbuh' + (tan.some((t) => t.siap) ? ' — ada yang siap panen!' : ''));
        if (gz.menu.length) baris.push('🍽️ <b>' + gz.menu.length + ' menu</b> sudah dipilih hari ini');
        return H.p((a ? 'Halo, <b>' + e(a.nama.split(' ')[0]) + '</b>! 👋' : 'Halo! 👋') + ' Saya <b>Nusa-Ai</b>, asisten cerdas ketahanan pangan Anda.') +
          H.p('Saya tidak hanya menjawab umum — saya <b>membaca data asli Anda</b> (kulkas, kebun, dan gizi keluarga) lalu menjawab sesuai isinya.') +
          (baris.length ? H.p('Yang baru saya lihat:') + H.ul(baris) : H.p('Belum ada data tersimpan. Tambahkan bahan di <b>Food Rescue</b> atau tanaman di <b>Urban Farming</b>, lalu tanyakan lagi.')) +
          H.p('Coba salah satu pertanyaan ini:') +
          '<div class="na-chips na-kolom">' + PROMPT_CEPAT.map((q) => '<button type="button" class="na-chip" data-na-q="' + ea(q.teks) + '" data-na-i="' + q.i + '">' + q.ikon + ' ' + e(q.teks) + '</button>').join('') + '</div>';
      },

      /** Penjelasan kemampuan Nusa-Ai. */
      bantuan() {
        return H.p('Saya bisa membantu dengan:') + H.ul([
          '🥬 <b>Kulkas</b> — bahan yang hampir basi, resep penyelamat, tips simpan',
          '🌱 <b>Kebun</b> — progres tanaman Anda &amp; rekomendasi sesuai iklim',
          '🍽️ <b>Gizi</b> — sisa kebutuhan gizi keluarga &amp; pencegahan stunting',
          '♻️ <b>Sampah makanan</b> — kompos, eco-enzyme, bokashi',
          '💧 <b>Hidroponik</b> &amp; urban farming untuk pemula',
          '💰 <b>Dampak</b> — uang yang berhasil dihemat &amp; level kontributor'
        ]) + H.chips(PROMPT_CEPAT.map((q) => '<button type="button" class="na-chip" data-na-q="' + ea(q.teks) + '" data-na-i="' + q.i + '">' + q.ikon + ' ' + e(q.label) + '</button>'));
      },

      terimaKasih() { return H.p('Sama-sama! 🌿 Senang bisa membantu. Kalau ada bahan yang mau diselamatkan atau tanaman yang mau dipantau, tanya saja kapan pun.'); },

      /** Jawaban saat tidak ada intent yang cocok. */
      tidakPaham() {
        return H.p('Hmm, saya belum menemukan jawaban pasti untuk itu 🤔. Saya paling kuat di topik pangan, kulkas, kebun, dan gizi. Coba salah satu ini:') +
          H.chips([H.q('Cara membuat eco-enzyme'), H.q('Cara membuat kompos dari sisa dapur'), H.q('Teknik hidroponik untuk pemula'), H.q('Gizi pencegah stunting'), H.q('Masak apa dari kulkas saya?'), H.q('Berapa uang yang sudah saya hemat?')]);
      },

      /* ===== Kulkas ===== */

      /** Cek bahan kulkas yang hampir basi — membaca `stokPangan`. */
      kulkas(c) {
        if (c.disebut.length) return this.bahan(c);
        const stok = c.stok;
        if (!stok.length) {
          return H.p('📭 <b>Kulkas Digital Anda masih kosong</b>, jadi belum ada yang bisa saya periksa.') +
            H.p('Tambahkan bahan beserta tanggal kedaluwarsanya di Food Rescue, lalu tanyakan lagi — saya akan membaca datanya langsung.') + H.chips([H.link('foodrescue.html', 'Buka Food Rescue')]);
        }
        const g = Konteks.kelompok(stok);
        const baris = (s) => '<b>' + e(s.nama) + '</b> (' + jumlahTeks(s) + ') — ' + teksSisa(s.sisa);
        const darurat = g.basi.concat(g.merah);
        let h = H.p('Saya baru saja memeriksa <b>' + stok.length + ' bahan</b> di Kulkas Digital Anda:');
        if (!darurat.length && !g.kuning.length) {
          return h + H.p('✅ <b>Semua aman!</b> Tidak ada bahan yang mendekati kedaluwarsa dalam 7 hari ke depan. Pertahankan kebiasaan baik ini!') +
            H.chips([H.q('Tips menyimpan sayuran agar tahan 2 minggu?'), H.link('foodrescue.html', 'Buka Food Rescue')]);
        }
        if (g.basi.length) h += H.h('🔴 Sudah lewat tanggal') + H.ul(g.basi.map(baris));
        if (g.merah.length) h += H.h('🟠 Segera olah (kurang dari 3 hari)') + H.ul(g.merah.map(baris));
        if (g.kuning.length) h += H.h('🟡 Pantau (3–6 hari)') + H.ul(g.kuning.map(baris));
        if (darurat.length) h += H.p('💸 Nilai yang terancam terbuang: <b>' + rupiah(darurat.reduce((n, s) => n + s.harga, 0)) + '</b>.');

        const resep = Konteks.saranResep(stok, 3).filter((x) => x.c.some((s) => s.sisa < BATAS_KUNING)).slice(0, 2);
        if (resep.length) {
          h += H.h('👩‍🍳 Selamatkan dengan memasak') + H.ul(resep.map((x) => '<b>' + e(x.r.nama) + '</b> — memakai ' + e(daftarNama(x.c.map((s) => s.nama.toLowerCase()))) + ' (' + x.r.kal + ' kkal, ' + x.r.prot + ' g protein)'));
        }
        if (g.basi.length) {
          const organik = g.basi.filter((s) => s.kategori === 'sayur' || s.kategori === 'buah');
          h += H.p('⚠️ <b>Keamanan dulu:</b> periksa bahan yang sudah lewat tanggal. Bila berlendir, berbau, atau berjamur, jangan dimakan.' +
            (organik.length ? ' Sayur/buah yang sudah tidak layak (' + e(daftarNama(organik.map((s) => s.nama.toLowerCase()))) + ') bisa dijadikan kompos atau eco-enzyme.' : '') +
            ' Produk hewani &amp; susu yang lewat tanggal sebaiknya dibuang, bukan dikomposkan biasa.');
        }
        const bisaBagi = g.merah.filter((s) => s.sisa >= 0);
        if (bisaBagi.length) h += H.p('🤝 Tidak sempat memasak? <b>' + e(daftarNama(bisaBagi.map((s) => s.nama))) + '</b> masih layak dan bisa dibagikan lewat kategori Donasi di Komunitas.');
        return h + H.chips([H.q('Masak apa dari kulkas saya?'), H.q('Cara mengolah sampah makanan'), H.link('foodrescue.html', 'Kelola di Food Rescue')]);
      },

      /** Jawaban khusus untuk bahan yang disebut pengguna (mis. "bayam saya gimana?"). */
      bahan(c) {
        let h = '';
        c.disebut.slice(0, 3).forEach((s) => {
          const t = Konteks.tipSimpan(s.nama);
          const r = Konteks.saranResep([s], 2).map((x) => '<b>' + e(x.r.nama) + '</b>');
          h += H.h(ikonStatus(s.sisa) + ' ' + e(s.nama)) +
            H.p('Stok <b>' + jumlahTeks(s) + '</b> · <b>' + teksSisa(s.sisa) + '</b>' + (s.harga ? ' · senilai ' + rupiah(s.harga) : '') + '.');
          if (s.sisa < 0) {
            h += H.p('⚠️ Sudah lewat tanggal: periksa dulu — bila berlendir, berbau, atau berjamur, jangan dimakan. ' +
              (s.kategori === 'sayur' || s.kategori === 'buah' ? 'Jika tidak layak, jadikan kompos atau eco-enzyme.' : 'Produk ini sebaiknya dibuang, bukan dikomposkan biasa.'));
          } else {
            h += H.p('📦 <b>Simpan (±' + e(t.tahan) + '):</b> ' + e(t.tip));
            if (r.length) h += H.p('👩‍🍳 Ide masak: ' + r.join(' atau ') + '.');
          }
        });
        return h + H.chips([H.q('Cek bahan kulkas saya yang hampir basi!'), H.link('foodrescue.html', 'Food Rescue')]);
      },

      /** Rekomendasi masak dari isi kulkas. */
      resep(c) {
        const stok = c.stok;
        const daftar = Konteks.saranResep(stok, 3);
        if (!daftar.length) {
          return H.p(stok.length ? 'Belum ada resep di katalog yang cocok dengan stok Anda saat ini 🤔.' : '📭 Kulkas Digital masih kosong, jadi saya belum bisa menyarankan resep dari isinya.') +
            H.p('Cari inspirasi resep sehat di halaman Nutrisi.') + H.chips([H.link('nutrisi.html', 'Buka Nutrisi')]);
        }
        return H.p('Berdasarkan isi kulkas Anda (bahan yang paling mendesak diprioritaskan), saya sarankan:') +
          H.ul(daftar.map((x) => '<b>' + e(x.r.nama) + '</b><br>Memakai: ' + e(daftarNama(x.c.map((s) => s.nama + ' (' + teksSisa(s.sisa) + ')'))) + '<br>' + x.r.kal + ' kkal · ' + x.r.prot + ' g protein · ± ' + rupiah(x.r.harga) + '/porsi')) +
          H.p('Langkah memasak lengkap ada di halaman Nutrisi; tambahkan ke menu hari ini agar gizinya ikut terhitung.') +
          H.chips([H.link('nutrisi.html', 'Lihat langkah &amp; tambah menu'), H.q('Berapa sisa kebutuhan gizi keluarga saya hari ini?')]);
      },

      /** Tips menyimpan sayuran + personalisasi sesuai isi kulkas. */
      simpan(c) {
        let h = H.p('Jujur ya: tidak semua sayur bisa tahan 2 minggu — tergantung jenisnya.') +
          H.h('🟢 Bisa 2+ minggu') + H.ul(['<b>Wortel, labu, kol/kubis:</b> 2–4 minggu bila disimpan benar.', '<b>Bawang, kentang, ubi:</b> 3–8 minggu di tempat kering, gelap, sejuk.']) +
          H.h('🟡 Hanya 5–10 hari') + H.ul(['<b>Bayam, kangkung, sawi, selada:</b> sayur daun sangat cepat layu. Supaya tahan lama: blansir 1 menit, tiriskan, lalu bekukan (±1–2 bulan).']) +
          H.h('✨ Trik agar lebih awet') + H.ul([
            'Jangan cuci sebelum disimpan — kelembapan memicu busuk. Cuci saat akan dimasak.',
            'Bungkus dengan kertas dapur lalu masukkan wadah tertutup; ganti kertas bila lembap.',
            'Pisahkan buah matang (pisang, apel, tomat) dari sayur — gas etilen mempercepat layu.',
            'Simpan sayur di laci bawah kulkas; suhu kulkas ideal sekitar 4 °C.',
            'Terapkan <b>FIFO</b>: bahan yang lebih lama diletakkan di depan dan dipakai dulu.'
          ]);
        const fokus = c.disebut.length ? c.disebut : c.stok.filter((s) => s.sisa >= 0 && (s.kategori === 'sayur' || s.kategori === 'buah')).slice(0, 4);
        if (fokus.length) {
          h += H.h('📍 Untuk isi kulkas Anda sekarang') + H.ul(fokus.map((s) => {
            const t = Konteks.tipSimpan(s.nama);
            return '<b>' + e(s.nama) + '</b> (' + teksSisa(s.sisa) + ', bisa ±' + e(t.tahan) + '): ' + e(t.tip);
          }));
        }
        return h + H.chips([H.q('Cek bahan kulkas saya yang hampir basi!'), H.q('Cara mengolah sampah makanan')]);
      },

      /* ===== Kebun & iklim ===== */

      /** Status tanaman milik pengguna — membaca `tanamanku`. */
      kebunku() {
        const semua = Konteks.tanaman(), aktif = semua.filter((t) => !t.dipanen);
        if (!semua.length) {
          const k = Konteks.iklim();
          return H.p('🌱 <b>Kebun Anda masih kosong.</b> Belum ada tanaman yang dicatat di Pelacak Tanaman.') +
            H.p(k ? 'Karena Anda memilih kondisi <b>' + e(IKLIM[k].judul) + '</b>, tanaman yang cocok: ' + e(daftarNama(TANAMAN.filter((t) => t.iklim.indexOf(k) >= 0 && t.lahan !== 'luas').slice(0, 4).map((t) => t.nama))) + '.' : 'Mulai dari yang mudah: kangkung (25 hari) atau bayam (30 hari) di polybag.') +
            H.chips([H.link('farming.html', 'Buka Urban Farming'), H.q('Rekomendasi tanaman untuk cuaca panas ekstrem?')]);
        }
        const siap = aktif.filter((t) => t.siap);
        let h = H.p('Saya membaca <b>' + semua.length + ' tanaman</b> di Pelacak Anda: <b>' + aktif.length + '</b> sedang tumbuh' + (siap.length ? ', <b>' + siap.length + ' siap panen 🎉</b>' : '') + ', ' + (semua.length - aktif.length) + ' sudah dipanen.');
        h += H.ul(aktif.slice(0, 6).map((t) => '<b>' + e(t.nama) + '</b>' + (t.lokasi ? ' (' + e(t.lokasi) + ')' : '') + ' — ' + (t.siap ? '<b>siap dipanen!</b>' : t.persen + '% · ' + t.sisa + ' hari lagi') + H.bar(t.persen, t.siap ? '' : 'na-kuning')));
        if (siap.length) h += H.p('✂️ <b>Tips panen ' + e(siap[0].nama) + ':</b> ' + e(siap[0].kat.tip));
        else if (aktif.length) { const t = aktif.slice().sort((a, b) => a.sisa - b.sisa)[0]; h += H.p('⏳ Panen terdekat: <b>' + e(t.nama) + '</b> dalam ' + t.sisa + ' hari. ' + e(t.kat.tip)); }
        const k = Konteks.iklim();
        const rentan = k ? aktif.filter((t) => t.kat.iklim.indexOf(k) < 0) : [];
        if (rentan.length) h += H.p('⚠️ Untuk kondisi <b>' + e(IKLIM[k].judul) + '</b>, perhatikan ekstra: ' + e(daftarNama(rentan.map((t) => t.nama))) + ' kurang ideal di iklim ini.');
        return h + H.chips([H.link('farming.html', 'Buka Pelacak Tanaman'), H.q('Rekomendasi tanaman untuk cuaca panas ekstrem?')]);
      },

      /** Rekomendasi tanaman menurut iklim (dari kata kunci, pilihan tersimpan, atau default panas). */
      iklim(c) {
        const kunci = kunciIklim(c.n) || Konteks.iklim() || 'panas';
        const gabung = kunci === 'panas' ? ['panas', 'kemarau'] : [kunci];
        const info = IKLIM[kunci];
        const urut = { mudah: 0, sedang: 1, sulit: 2 }, lahan = { sempit: 0, sedang: 1, luas: 2 };
        const cocok = TANAMAN.filter((t) => t.iklim.some((i) => gabung.indexOf(i) >= 0))
          .sort((a, b) => urut[a.sulit] - urut[b.sulit] || lahan[a.lahan] - lahan[b.lahan] || a.hari - b.hari);
        let h = H.p('☀️ <b>' + e(info.judul) + '</b> — ' + e(info.info));
        h += H.h('🌿 Tanaman yang paling cocok') + H.ul(cocok.slice(0, 5).map((t) => '<b>' + e(t.nama) + '</b> — ' + e(t.metode.toLowerCase()) + ', lahan ' + t.lahan + ', ±' + t.hari + ' hari, tingkat ' + t.sulit));
        h += H.h('🛡️ Tips adaptasi') + H.ul(info.tips.map(e).concat(kunci === 'panas' ? ['Siram pagi &amp; sore (hindari tengah hari); tanam atau pindah bibit di sore hari agar tidak stres.', 'Gunakan pot/polybag berwarna terang dan beri mulsa agar akar tidak kepanasan.'] : []));
        if (kunci === 'panas') {
          const hindari = TANAMAN.filter((t) => t.iklim.length === 1 && t.iklim[0] === 'dingin').map((t) => t.nama);
          h += H.p('🚫 Kurang cocok di panas terik: <b>' + e(daftarNama(hindari)) + '</b> (butuh suhu sejuk) — bila tetap ingin, beri paranet 50–65% dan naungan siang.');
        }
        const milik = Konteks.tanaman().filter((t) => !t.dipanen);
        if (milik.length) {
          const aman = milik.filter((t) => t.kat.iklim.some((i) => gabung.indexOf(i) >= 0)), rentan = milik.filter((t) => aman.indexOf(t) < 0);
          h += H.h('📍 Di kebun Anda') + H.ul([].concat(
            aman.length ? ['✅ Tahan kondisi ini: <b>' + e(daftarNama(aman.map((t) => t.nama))) + '</b>'] : [],
            rentan.length ? ['⚠️ Perlu perlindungan: <b>' + e(daftarNama(rentan.map((t) => t.nama))) + '</b> — pindahkan ke tempat teduh terang / pasang naungan.'] : []));
        }
        return h + H.chips([H.link('farming.html', 'Buka Urban Farming'), H.q('Teknik hidroponik untuk pemula')]);
      },

      /** Panduan memulai urban farming. */
      pemula() {
        const k = Konteks.iklim();
        return H.p('🌱 <b>Mulai urban farming dari yang mudah:</b>') + H.ol([
          'Pilih tanaman cepat panen: <b>kangkung (±25 hari)</b>, bayam (±30), sawi (±30).',
          'Wadah: polybag/pot 25–30 cm dengan lubang drainase, atau botol bekas untuk hidroponik sumbu.',
          'Media: tanah + kompos (2:1) + sekam. Kompos bisa dibuat dari sisa dapur.',
          'Sinar matahari langsung minimal 4–6 jam; siram pagi/sore agar media lembap, tidak tergenang.',
          'Catat di Pelacak Tanaman agar progres panen terpantau.'
        ]) + (k ? H.p('Kondisi iklim yang Anda pilih: <b>' + e(IKLIM[k].judul) + '</b> — saya bisa sesuaikan rekomendasinya.') : '') +
          H.chips([H.q('Rekomendasi tanaman untuk cuaca panas ekstrem?'), H.q('Teknik hidroponik untuk pemula'), H.link('farming.html', 'Buka Urban Farming')]);
      },

      /** Teknik hidroponik + personalisasi dari tanaman pengguna. */
      hidroponik() {
        const milik = Konteks.tanaman().filter((t) => !t.dipanen && /hidroponik/i.test(t.kat.metode));
        let h = H.p('💧 <b>Hidroponik</b> = menanam tanpa tanah; akar mendapat nutrisi dari air. Cocok untuk lahan sempit dan umumnya lebih hemat air.') +
          H.h('Sistem untuk pemula') + H.ul([
            '<b>Sumbu (wick)</b> — tanpa listrik, murah; cocok untuk pakcoy, selada, kangkung.',
            '<b>Rakit apung (DWC)</b> — tanaman di styrofoam yang mengapung; hasil lebih besar, sebaiknya beraerator.',
            '<b>NFT/DFT</b> — air dialirkan pompa; produktif tetapi butuh listrik dan perawatan.'
          ]) + H.h('Langkah singkat') + H.ol([
            'Semai benih di rockwool/busa selama 7–10 hari.',
            'Pindahkan bibit ke netpot di wadah berisi larutan <b>nutrisi AB Mix</b>.',
            'Jaga <b>pH 5,5–6,5</b>; kepekatan (TDS) sayuran daun umumnya sekitar 600–1.200 ppm — mulai rendah untuk bibit muda.',
            'Beri sinar matahari langsung ±4–6 jam; ganti/tambah larutan tiap 1–2 minggu.',
            'Tutup wadah dari cahaya agar lumut dan nyamuk tidak tumbuh.'
          ]) + H.note('Takaran nutrisi berbeda tiap produk AB Mix — ikuti petunjuk kemasan.');
        h += milik.length ? H.p('📍 Anda sedang menanam <b>' + e(daftarNama(milik.map((t) => t.nama))) + '</b> secara hidroponik. ' + e(milik[0].kat.tip))
          : H.p('📍 Untuk percobaan pertama, coba <b>kangkung</b> (25 hari) atau <b>sawi pakcoy</b> (30 hari) dengan sistem sumbu. Di kota panas, beri paranet karena larutan yang hangat (&gt;30 °C) menghambat akar.');
        return h + H.chips([H.link('farming.html', 'Catat di Urban Farming'), H.q('Rekomendasi tanaman untuk cuaca panas ekstrem?')]);
      },

      /* ===== Sampah makanan ===== */

      /** Gambaran umum mengolah sampah makanan, dipersonalisasi dari bahan yang sudah lewat tanggal. */
      sampah(c) {
        const g = Konteks.kelompok(c.stok);
        const organik = g.basi.filter((s) => s.kategori === 'sayur' || s.kategori === 'buah');
        return H.p('♻️ <b>Sampah makanan bisa jadi sumber daya.</b> Urutan terbaik: <b>cegah → olah → bagikan → kompos</b>.') +
          H.ul([
            '<b>Kompos</b> — sisa sayur/buah + daun kering menjadi pupuk padat (1–3 bulan).',
            '<b>Eco-enzyme</b> — fermentasi kulit buah/sayur + gula + air menjadi cairan serbaguna (±3 bulan).',
            '<b>Bokashi</b> — fermentasi tertutup yang boleh menerima sisa nasi &amp; lauk (±2 minggu).',
            '<b>Maggot BSF</b> — larva lalat tentara hitam yang menghabiskan sisa makanan dengan cepat.'
          ]) +
          (organik.length ? H.p('📍 Di kulkas Anda: <b>' + e(daftarNama(organik.map((s) => s.nama))) + '</b> sudah lewat tanggal — bila tidak layak makan, ini bahan kompos/eco-enzyme yang siap pakai.') : '') +
          H.chips([H.q('Cara membuat kompos dari sisa dapur'), H.q('Cara membuat eco-enzyme')]);
      },

      /** Cara membuat kompos. */
      kompos(c) {
        const g = Konteks.kelompok(c.stok);
        const organik = g.basi.filter((s) => s.kategori === 'sayur' || s.kategori === 'buah');
        const dilarang = g.basi.filter((s) => s.kategori === 'protein' || s.kategori === 'susu');
        return H.p('🪱 <b>Kompos dari sisa dapur</b> — mudah dilakukan di ember berlubang atau komposter:') +
          H.ol([
            '<b>Siapkan wadah</b> berlubang untuk udara dan drainase; alasi dengan daun kering.',
            '<b>Campur bahan hijau &amp; cokelat</b> sekitar 1 : 2–3 (volume). Hijau = sisa sayur/buah, ampas kopi. Cokelat = daun kering, kardus sobek, serbuk gergaji.',
            '<b>Jaga kelembapan</b> seperti spons diperas; aduk 1–2 kali seminggu.',
            '<b>Tunggu 1–3 bulan.</b> Kompos matang berwarna gelap, remah, dan berbau tanah.'
          ]) +
          H.h('Boleh &amp; jangan') + H.ul(['✅ Kulit buah/sayur, ampas kopi &amp; teh, cangkang telur, daun kering.', '❌ Daging, ikan, susu, minyak (bau &amp; mengundang hama) — untuk ini pakai <b>bokashi</b>.', '🔧 Bau amis? Terlalu basah — tambah bahan cokelat. Terlalu kering? Percikkan air.']) +
          (organik.length ? H.p('📍 Siap dikomposkan dari kulkas Anda: <b>' + e(daftarNama(organik.map((s) => s.nama))) + '</b>.') : '') +
          (dilarang.length ? H.p('📍 Jangan dikomposkan biasa: <b>' + e(daftarNama(dilarang.map((s) => s.nama))) + '</b> (produk hewani/susu).') : '') +
          H.p('Hasilnya bisa dipakai sebagai media tanam atau pupuk untuk cabai, terong, dan sayur daun Anda.') +
          H.chips([H.q('Cara membuat eco-enzyme'), H.link('farming.html', 'Urban Farming')]);
      },

      /** Cara membuat eco-enzyme. */
      ecoenzyme(c) {
        const g = Konteks.kelompok(c.stok);
        const organik = g.basi.filter((s) => s.kategori === 'sayur' || s.kategori === 'buah');
        return H.p('🧴 <b>Eco-enzyme</b> — cairan hasil fermentasi sisa buah/sayur. Rumus mudah: <b>1 : 3 : 10</b>.') +
          H.ul(['<b>1</b> bagian gula merah/molase (berat)', '<b>3</b> bagian kulit buah/sayur segar (berat)', '<b>10</b> bagian air bersih (volume)']) +
          H.h('Langkah') + H.ol([
            'Gunakan <b>wadah plastik tebal</b> bertutup (bukan kaca); isi hanya ±75–80% karena ada gas fermentasi.',
            'Larutkan gula di air, masukkan kulit buah/sayur, tutup rapat, beri tanggal.',
            'Selama 2 minggu pertama, <b>buka tutup sebentar</b> tiap hari untuk melepas gas. Aduk bila perlu.',
            'Simpan di tempat teduh ±3 bulan. Siap saat cairan cokelat dengan aroma asam segar.',
            'Saring: cairan dipakai, ampasnya masuk kompos.'
          ]) +
          H.h('Pemakaian') + H.ul(['Pupuk cair: encerkan sangat banyak (±1 : 500) lalu coba di sedikit tanaman dulu.', 'Pembersih lantai/peralatan: ±1 : 10–1 : 20.']) +
          H.note('Jangan masukkan daging, nasi, minyak, atau santan. Eco-enzyme berguna sebagai pembersih ringan &amp; pupuk, tetapi bukan disinfektan.') +
          (organik.length ? H.p('📍 Bahan awal dari kulkas Anda: kulit/sisa <b>' + e(daftarNama(organik.map((s) => s.nama))) + '</b>.') : '') +
          H.chips([H.q('Cara membuat kompos dari sisa dapur'), H.q('Cara mengolah sampah makanan')]);
      },

      /* ===== Gizi ===== */

      /** Sisa kebutuhan gizi keluarga — membaca `gizi` (rumus sama dengan halaman Nutrisi). */
      gizi(c) {
        const g = Konteks.gizi();
        const kel = g.dewasa + ' dewasa' + (g.anak ? ' + ' + g.anak + ' anak' : '');
        const kelas = (x) => (x.persen < 70 ? 'na-kuning' : x.persen <= 120 ? '' : 'na-merah');
        const bar = (x) => '<div class="na-gizi"><div class="na-gizi-t"><span>' + x.label + '</span><span>' + fmt(x.asupan) + ' / ' + fmt(x.target) + ' ' + x.sat + '</span></div>' + H.bar(x.persen, kelas(x)) + '</div>';
        const total = (rs) => g.hasil.map((x) => { const a = rs.reduce((t, r) => t + r[x.k], 0) * g.faktor; return Math.round(a / x.target * 100); });
        let h;

        if (!g.menu.length) {
          h = H.p('🍽️ Keluarga <b>' + kel + '</b> belum memilih menu hari ini, jadi <b>seluruh kebutuhan gizi masih tersisa</b>:') +
            H.ul(g.hasil.map((x) => '<b>' + x.label + ':</b> ' + fmt(x.target) + ' ' + x.sat));
          const dr = Konteks.saranResep(c.stok, 3).map((x) => x.r);
          const usul = (dr.length >= 3 ? dr : dr.concat(['tempeorek', 'urap', 'nasigoreng'].map((id) => RESEP.find((r) => r.id === id)).filter((r) => dr.indexOf(r) < 0)).slice(0, 3));
          const pr = total(usul);
          h += H.h('💡 Usulan menu seimbang') + H.ul(usul.map((r) => '<b>' + e(r.nama) + '</b> (' + r.kal + ' kkal, ' + r.prot + ' g protein)')) +
            H.p('Bila ketiganya dimasak, perkiraan terpenuhi: kalori <b>' + pr[0] + '%</b>, protein <b>' + pr[1] + '%</b>, serat <b>' + pr[2] + '%</b>, vitamin C <b>' + pr[3] + '%</b>.');
        } else {
          h = H.p('🍽️ Untuk keluarga <b>' + kel + '</b>, menu hari ini: <b>' + e(daftarNama(g.menu.map((r) => r.nama))) + '</b>.') + g.hasil.map(bar).join('');
          const kurang = g.hasil.filter((x) => x.persen < 90), lebih = g.hasil.filter((x) => x.persen > 120);
          h += H.h('Sisa kebutuhan') + H.ul(g.hasil.map((x) => (x.sisa > 0 ? '<b>' + x.label + ':</b> kurang ' + fmt(x.sisa) + ' ' + x.sat + ' (baru ' + x.persen + '%)' : '<b>' + x.label + ':</b> tercukupi ✅')));
          if (!kurang.length && !lebih.length) h += H.p('🎉 Gizi harian keluarga sudah <b>seimbang</b>. Mantap!');
          else if (kurang.length) {
            const t = kurang.reduce((a, b) => (a.persen <= b.persen ? a : b));
            const aktif = c.stok.filter((s) => s.sisa >= 0);
            const usul = RESEP.filter((r) => g.menu.indexOf(r) < 0)
              .map((r) => ({ r: r, s: r[t.k] / Math.max.apply(null, RESEP.map((x) => x[t.k])) + 0.4 * Konteks.cocokResep(r, aktif).length }))
              .sort((a, b) => b.s - a.s).slice(0, 2).map((x) => x.r);
            h += H.p('Yang paling tertinggal: <b>' + t.label + '</b>. Coba tambahkan: ' + usul.map((r) => '<b>' + e(r.nama) + '</b> (+' + r[t.k] + ' ' + t.sat + ')').join(' atau ') + '.');
          } else h += H.p('Asupan <b>' + e(daftarNama(lebih.map((x) => x.label.toLowerCase()))) + '</b> melebihi kebutuhan — kurangi satu menu agar porsi pas.');
        }
        return h + H.note('Jumlah anggota &amp; menu dapat diubah di halaman Nutrisi; Nusa-Ai membaca ulang datanya setiap kali Anda bertanya.') +
          H.chips([H.link('nutrisi.html', 'Atur menu di Nutrisi'), H.q('Masak apa dari kulkas saya?')]);
      },

      /** Gizi pencegah stunting + personalisasi dari data keluarga. */
      stunting() {
        const g = Konteks.gizi(), prot = g.hasil.find((x) => x.k === 'prot');
        return H.p('👶 <b>Stunting</b> adalah gagal tumbuh akibat kekurangan gizi kronis dan infeksi berulang, terutama pada <b>1.000 hari pertama kehidupan</b> (sejak hamil sampai anak berusia 2 tahun).') +
          H.h('Kunci pencegahan') + H.ul([
            '🤰 <b>Ibu hamil:</b> makan bergizi, minum tablet tambah darah, periksa kehamilan rutin.',
            '🍼 <b>ASI eksklusif 6 bulan</b>, dilanjutkan sampai 2 tahun bersama MPASI.',
            '🥚 <b>MPASI kaya protein hewani</b> tiap kali makan: telur, ikan, ayam, hati ayam — murah dan padat zat besi &amp; zinc.',
            '🫘 Lengkapi dengan tempe/tahu/kacang-kacangan, sayur hijau, serta buah sumber vitamin C untuk membantu penyerapan zat besi.',
            '⚖️ <b>Timbang &amp; ukur tiap bulan di Posyandu</b>; imunisasi lengkap.',
            '🧼 Cuci tangan, air minum aman, dan sanitasi bersih mencegah diare yang menguras gizi.'
          ]) + H.h('Ide pangan lokal murah') + H.ul(['Telur rebus + bubur ubi jalar', 'Tempe orek halus + sayur bening', 'Ayam suwir bumbu kuning atau ikan lokal']) +
          (g.anak > 0 ? H.p('📍 Keluarga Anda mencatat <b>' + g.anak + ' anak</b>. ' + (g.menu.length ? 'Protein hari ini baru <b>' + prot.persen + '%</b> dari target' + (prot.persen < 90 ? ' — tambahkan lauk seperti Ayam Suwir atau Telur Dadar.' : ' — bagus, pertahankan!') : 'Belum ada menu hari ini; pilih menu berprotein di halaman Nutrisi.')) : '') +
          H.note('Informasi ini bersifat edukasi, bukan pengganti tenaga kesehatan. Bila anak tampak pendek atau berat badan tidak naik, segera konsultasi ke Posyandu/Puskesmas.') +
          H.chips([H.q('Berapa sisa kebutuhan gizi keluarga saya hari ini?'), H.link('nutrisi.html', 'Halaman Nutrisi')]);
      },

      /* ===== Dampak, akun, komunitas ===== */

      /** Dampak penghematan — membaca `riwayatPangan`. */
      hemat() {
        const r = Konteks.riwayat(), s = r.filter((x) => x.hasil === 'selamat'), b = r.filter((x) => x.hasil === 'terbuang');
        if (!r.length) return H.p('📊 Belum ada riwayat bahan yang diolah atau dibuang. Tandai bahan sebagai <b>diolah</b> di Food Rescue, dan saya akan menghitung penghematan Anda.') + H.chips([H.link('foodrescue.html', 'Buka Food Rescue')]);
        const uang = s.reduce((n, x) => n + (Number(x.harga) || 0), 0), rugi = b.reduce((n, x) => n + (Number(x.harga) || 0), 0), persen = Math.round(s.length / r.length * 100);
        return H.p('💰 Dampak Anda sejauh ini:') + H.ul(['✅ <b>' + s.length + ' bahan</b> diselamatkan → hemat <b>' + rupiah(uang) + '</b>', '🗑️ <b>' + b.length + ' bahan</b> terbuang (±' + rupiah(rugi) + ')', '🎯 Tingkat penyelamatan: <b>' + persen + '%</b>' + H.bar(persen, persen < 50 ? 'na-kuning' : '')]) +
          H.p(persen >= 75 ? 'Luar biasa! Anda sudah sangat hemat pangan 🌟' : 'Target berikutnya: olah bahan sebelum menyentuh tanggal merah agar tingkat penyelamatan naik.') +
          H.chips([H.q('Cek bahan kulkas saya yang hampir basi!'), H.link('index.html', 'Lihat dasbor')]);
      },

      /** Level kontributor — memakai modul Akun. */
      akun() {
        const a = Akun.aktif();
        if (!a) return H.p('🔐 Anda belum masuk. Masuk atau daftar (simulasi, tersimpan di perangkat ini) untuk mengumpulkan poin dan level kontributor.') + H.chips(['<button type="button" class="na-chip" data-akun-buka>Masuk / Daftar</button>']);
        const s = Akun.statistik(a), lv = Akun.level(s.poin);
        return H.p('🏅 <b>' + e(a.nama) + '</b> — <b>' + e(lv.nama) + '</b> (Lv. ' + lv.no + ') dengan <b>' + s.poin + ' poin</b>.') + H.bar(lv.persen) +
          H.p(lv.berikut === null ? 'Level tertinggi tercapai! 🎉' : (lv.berikut - s.poin) + ' poin lagi menuju level berikutnya.') +
          H.h('Cara menambah poin') + H.ul(['Donasi pangan = 10 poin', 'Menanam di Pelacak = 5 poin', 'Menyelamatkan bahan = 3 poin', 'Postingan = 2 poin · Komentar = 1 poin']) + H.chips([H.link('komunitas.html', 'Buka Komunitas')]);
      },

      /** Komunitas & donasi — membaca `postingan`. */
      komunitas(c) {
        const p = Konteks.postingan(), donasi = p.filter((x) => x.kategori === 'donasi').length;
        const bisaBagi = c.stok.filter((s) => s.sisa >= 0 && s.sisa < BATAS_MERAH);
        return H.p('🤝 Komunitas saat ini memiliki <b>' + p.length + ' postingan</b>, termasuk <b>' + donasi + ' donasi pangan</b> yang bisa diambil tetangga.') +
          (bisaBagi.length ? H.p('📍 Bahan Anda <b>' + e(daftarNama(bisaBagi.map((s) => s.nama))) + '</b> hampir kedaluwarsa tetapi masih layak — cocok dibagikan lewat kategori Donasi (+10 poin).') : H.p('Punya hasil panen berlebih atau bahan yang tak terpakai? Bagikan lewat kategori Donasi atau Tukar.')) +
          H.chips([H.link('komunitas.html', 'Buka Komunitas')]);
      }
    };

    /* ---------- 3. OTAK: mesin kata kunci berbobot ---------- */

    /**
     * Aturan intent. Tiap kata kunci = [kata, bobot]. Akhiran "*" = awalan kata
     * (mis. "kompos*" cocok dengan "kompos", "komposter").
     * Intent dengan total bobot tertinggi (minimal 3) yang menang.
     */
    const ATURAN = [
      { id: 'kulkas', kw: [['kulkas', 3], ['basi', 3], ['kedaluwarsa', 3], ['kadaluarsa', 3], ['expired', 3], ['exp', 2], ['stok', 2], ['persediaan', 2], ['hampir', 1], ['busuk', 2], ['layu', 1], ['bahan', 1]] },
      { id: 'bahan', kw: [] },
      { id: 'resep', kw: [['resep', 4], ['masak*', 3], ['memasak', 3], ['dimasak', 3], ['masak apa', 4], ['makan apa', 3], ['hidangan', 2]] },
      { id: 'simpan', kw: [['simpan', 3], ['menyimpan', 3], ['penyimpanan', 3], ['awet', 3], ['tahan lama', 3], ['tahan', 1], ['2 minggu', 2], ['segar', 1], ['freezer', 2], ['beku', 2], ['blansir', 2], ['sayuran', 1]] },
      { id: 'kebunku', kw: [['kebun', 3], ['tanamanku', 4], ['tanaman saya', 4], ['tanaman ku', 4], ['panen', 3], ['progres', 2], ['pelacak', 3]] },
      { id: 'iklim', kw: [['tanaman', 1], ['rekomendasi', 2], ['cocok', 2], ['panas', 3], ['ekstrem', 2], ['terik', 3], ['kemarau', 3], ['kering', 2], ['hujan', 3], ['dingin', 3], ['iklim', 3], ['cuaca', 3], ['musim', 2], ['dataran tinggi', 3], ['tahan panas', 3], ['tanam apa', 3], ['menanam apa', 3]] },
      { id: 'gizi', kw: [['gizi', 4], ['nutrisi', 3], ['kalori', 3], ['protein', 2], ['serat', 2], ['vitamin', 2], ['kebutuhan', 2], ['sisa kebutuhan', 3], ['menu hari ini', 3], ['asupan', 3], ['target', 1], ['keluarga', 1]] },
      { id: 'stunting', kw: [['stunting', 6], ['balita', 3], ['mpasi', 4], ['1000 hari', 4], ['anak pendek', 4], ['gizi buruk', 3], ['tumbuh kembang', 3], ['posyandu', 3]] },
      { id: 'kompos', kw: [['kompos*', 4], ['bokashi', 4], ['maggot', 4], ['pupuk organik', 4], ['sampah organik', 4], ['sampah dapur', 4], ['pupuk', 2]] },
      { id: 'ecoenzyme', kw: [['eco enzyme', 5], ['ecoenzyme', 5], ['ekoenzim', 5], ['enzim', 4], ['fermentasi', 3], ['molase', 2], ['kulit jeruk', 2], ['kulit buah', 2]] },
      { id: 'sampah', kw: [['sampah', 3], ['mengolah sampah', 4], ['olah sampah', 4], ['food waste', 3], ['limbah', 3], ['sisa makanan', 3], ['mubazir', 3], ['daur ulang', 2]] },
      { id: 'hidroponik', kw: [['hidroponik', 5], ['hidro', 3], ['ab mix', 4], ['wick', 3], ['sumbu', 3], ['nft', 4], ['dft', 4], ['rakit apung', 4], ['tanpa tanah', 4], ['ppm', 3], ['tds', 3], ['rockwool', 3], ['netpot', 3]] },
      { id: 'pemula', kw: [['pemula', 3], ['mulai', 2], ['lahan sempit', 3], ['polybag', 3], ['urban farming', 3], ['cara menanam', 3], ['cara tanam', 3], ['bibit', 2], ['media tanam', 3], ['balkon', 2]] },
      { id: 'hemat', kw: [['hemat*', 3], ['uang', 2], ['rupiah', 2], ['terselamatkan', 3], ['diselamatkan', 3], ['terbuang', 3], ['dampak', 3], ['riwayat', 3], ['penghematan', 4], ['rekap', 2]] },
      { id: 'akun', kw: [['level', 4], ['poin', 4], ['profil', 2], ['lencana', 2], ['peringkat', 2], ['kontribusi', 3]] },
      { id: 'komunitas', kw: [['komunitas', 3], ['donasi', 3], ['berbagi', 3], ['tetangga', 2], ['bagikan', 3], ['sedekah', 2], ['tukar', 2]] },
      { id: 'bantuan', kw: [['siapa kamu', 4], ['kamu siapa', 4], ['bisa apa', 4], ['bantuan', 3], ['help', 3], ['fitur', 2], ['nusa ai', 3], ['apa itu nusapangan', 4]] },
      { id: 'sapa', kw: [['halo', 3], ['hai', 3], ['hi', 3], ['hello', 3], ['assalamualaikum', 3], ['selamat pagi', 3], ['selamat siang', 3], ['selamat sore', 3], ['selamat malam', 3]] },
      { id: 'terimaKasih', kw: [['terima kasih', 3], ['makasih', 3], ['thanks', 3], ['thank you', 3], ['mantap', 2], ['oke', 1]] }
    ];

    /** Peta id intent ke fungsi Jawaban (intent tanpa fungsi sendiri dialihkan). */
    const PETA = { sapa: 'sambutan', bantuan: 'bantuan', terimaKasih: 'terimaKasih' };

    /**
     * Menormalkan teks: huruf kecil, tanpa aksen/tanda baca, spasi tunggal.
     * @param {string} t
     * @returns {string}
     */
    function normal(t) {
      return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
    }

    /**
     * Apakah kata kunci muncul di teks ternormalisasi? Akhiran "*" = awalan kata.
     * @param {string} n - teks ternormalisasi
     * @param {string} kw - kata kunci
     * @returns {boolean}
     */
    function cocokKata(n, kw) {
      const h = ' ' + n + ' ';
      return kw.slice(-1) === '*' ? h.indexOf(' ' + kw.slice(0, -1)) >= 0 : h.indexOf(' ' + kw + ' ') >= 0;
    }

    /**
     * Menebak kondisi iklim dari kalimat.
     * @param {string} n - teks ternormalisasi
     * @returns {string} 'panas' | 'kemarau' | 'hujan' | 'dingin' | ''
     */
    function kunciIklim(n) {
      if (['panas', 'terik', 'ekstrem', 'gerah'].some((k) => cocokKata(n, k))) return 'panas';
      if (['kemarau', 'kering'].some((k) => cocokKata(n, k))) return 'kemarau';
      if (['hujan', 'becek', 'lembap'].some((k) => cocokKata(n, k))) return 'hujan';
      if (['dingin', 'sejuk', 'dataran tinggi', 'pegunungan'].some((k) => cocokKata(n, k))) return 'dingin';
      return '';
    }

    const Otak = {
      /**
       * Menentukan intent terbaik untuk sebuah kalimat.
       * @param {string} teks - pertanyaan pengguna
       * @returns {{n:string, id:(string|null), skor:number}} id null bila tidak ada yang cukup cocok
       */
      deteksi(teks) {
        const n = normal(teks);
        let terbaik = { id: null, skor: 0 };
        ATURAN.forEach((a) => {
          const skor = a.kw.reduce((t, k) => t + (cocokKata(n, k[0]) ? k[1] : 0), 0);
          if (skor > terbaik.skor) terbaik = { id: a.id, skor: skor };
        });
        return { n: n, id: terbaik.skor >= 3 ? terbaik.id : null, skor: terbaik.skor };
      },

      /**
       * Mencari bahan di kulkas pengguna yang disebut dalam kalimat.
       * @param {string} n - teks ternormalisasi
       * @param {Array<BahanStok>} stok
       * @returns {Array<BahanStok>}
       */
      disebut(n, stok) {
        const h = ' ' + n + ' ';
        return stok.filter((s) => normal(s.nama).split(' ').some((w) => w.length >= 3 && h.indexOf(' ' + w + ' ') >= 0));
      },

      /**
       * Titik masuk "otak": membaca data pengguna lalu menyusun jawaban.
       * @param {string} teks - pertanyaan
       * @param {string} [paksa] - id intent yang dipaksa (dipakai Quick Prompts)
       * @returns {{html:string, intent:string}}
       */
      jawab(teks, paksa) {
        const stok = Konteks.stok(), d = this.deteksi(teks);
        const c = { n: d.n, teks: teks, stok: stok, disebut: this.disebut(d.n, stok) };
        let id = paksa || d.id;
        if (!id && c.disebut.length) id = 'bahan';
        if (paksa) c.disebut = []; // Quick Prompt = pertanyaan umum, jangan dipersempit
        const fn = Jawaban[PETA[id] || id] || Jawaban.tidakPaham;
        return { html: fn.call(Jawaban, c), intent: id || 'tidakPaham' };
      }
    };

    /* ---------- 4. TAMPILAN: CSS, HTML, dan perilaku widget ---------- */

    /** Ikon robot berdaun (dipakai di tombol melayang, header, dan avatar pesan). */
    const IKON_ROBOT = '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 8V6"/><path d="M16 6c0-2.6 2.1-4.3 5.6-4.3 0 3.2-2.3 5.2-5.6 4.3Z" fill="currentColor" fill-opacity=".3"/><rect x="5" y="8" width="22" height="17" rx="6"/><circle cx="12" cy="16" r="1.7" fill="currentColor" stroke="none"/><circle cx="20" cy="16" r="1.7" fill="currentColor" stroke="none"/><path d="M12.5 20.4c1.9 1.3 5.1 1.3 7 0"/><path d="M5 16H3M27 16h2"/></svg>';
    const IKON_KIRIM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7Z"/></svg>';
    const IKON_ULANG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>';
    const IKON_TUTUP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

    /** CSS widget. Semua kelas berawalan "na-" agar tidak bentrok; mendukung mode gelap. */
    const CSS_NUSAAI = `
      .na-root { --na-tua:#1B4332; --na-segar:#40916C; --na-panen:#F4A261; --na-bg:#fff; --na-teks:#1B2B24; --na-redup:#5B7266; --na-garis:rgba(27,67,50,.14); --na-bot:#EEF5F0; --na-chip:#F3F8F5; font-family:"Plus Jakarta Sans",system-ui,sans-serif; }
      html.dark .na-root { --na-bg:#16261E; --na-teks:#E6EFEA; --na-redup:#A8BDB1; --na-garis:rgba(230,239,234,.16); --na-bot:#1F3429; --na-chip:#1F3429; }
      .na-root *, .na-root *::before, .na-root *::after { box-sizing:border-box; }

      /* Tombol melayang */
      .na-fab { position:fixed; right:calc(1.25rem + env(safe-area-inset-right,0px)); bottom:calc(1.25rem + env(safe-area-inset-bottom,0px)); z-index:1300; width:3.75rem; height:3.75rem; border-radius:50%; border:0; cursor:pointer; color:#fff; background:linear-gradient(135deg,#40916C,#1B4332); box-shadow:0 10px 25px -6px rgba(27,67,50,.6); display:grid; place-items:center; animation:na-apung 3.2s ease-in-out infinite, na-denyut 2.6s ease-out infinite; transition:scale .25s cubic-bezier(.2,.8,.2,1); }
      .na-fab:hover { scale:1.08; }
      .na-fab:focus-visible, .na-ikon-btn:focus-visible, .na-chip:focus-visible, .na-kirim:focus-visible { outline:3px solid var(--na-panen); outline-offset:2px; }
      .na-fab svg { width:2rem; height:2rem; grid-area:1/1; transition:transform .35s cubic-bezier(.2,.8,.2,1), opacity .2s; }
      .na-fab svg.na-x { opacity:0; transform:rotate(-90deg) scale(.5); }
      .na-buka .na-fab { animation:none; }
      .na-buka .na-fab svg.na-r { opacity:0; transform:rotate(90deg) scale(.5); }
      .na-buka .na-fab svg.na-x { opacity:1; transform:none; }
      .na-badge { position:absolute; top:-.15rem; right:-.15rem; min-width:1.4rem; height:1.4rem; padding:0 .3rem; border-radius:99px; background:#E76F51; color:#fff; font-size:.72rem; font-weight:800; display:grid; place-items:center; border:2px solid #fff; }
      .na-badge[hidden] { display:none; }

      /* Gelembung ajakan */
      .na-teaser { position:fixed; right:calc(1.25rem + env(safe-area-inset-right,0px)); bottom:calc(5.9rem + env(safe-area-inset-bottom,0px)); z-index:1300; max-width:15.5rem; background:var(--na-bg); color:var(--na-teks); border:1px solid var(--na-garis); border-radius:1rem 1rem .25rem 1rem; padding:.7rem .9rem; font-size:.82rem; font-weight:600; line-height:1.4; box-shadow:0 12px 28px -10px rgba(0,0,0,.35); cursor:pointer; opacity:0; transform:translateY(8px); visibility:hidden; transition:opacity .3s, transform .3s, visibility 0s .3s; }
      .na-teaser.na-tampil { opacity:1; transform:none; visibility:visible; transition-delay:0s; }

      /* Jendela chat */
      .na-panel { position:fixed; right:calc(1.25rem + env(safe-area-inset-right,0px)); bottom:calc(5.9rem + env(safe-area-inset-bottom,0px)); z-index:1300; width:min(24.5rem, calc(100vw - 2.5rem)); height:min(38rem, calc(100vh - 8.5rem)); height:min(38rem, calc(100dvh - 8.5rem)); display:flex; flex-direction:column; background:var(--na-bg); color:var(--na-teks); border:1px solid var(--na-garis); border-radius:1.4rem; overflow:hidden; box-shadow:0 30px 60px -15px rgba(0,0,0,.45); transform-origin:bottom right; opacity:0; transform:translateY(18px) scale(.94); visibility:hidden; pointer-events:none; transition:opacity .28s ease, transform .32s cubic-bezier(.2,.8,.2,1), visibility 0s .32s; }
      .na-buka .na-panel { opacity:1; transform:none; visibility:visible; pointer-events:auto; transition-delay:0s; }
      .na-instan .na-panel, .na-instan .na-fab, .na-instan .na-fab * { transition:none !important; }
      @media (max-width:480px) { .na-panel { right:.75rem; left:.75rem; width:auto; bottom:calc(5.6rem + env(safe-area-inset-bottom,0px)); } }

      .na-head { display:flex; align-items:center; gap:.65rem; padding:.85rem .9rem; color:#fff; background:linear-gradient(135deg,#2D6A4F,#1B4332); }
      .na-av { width:2.2rem; height:2.2rem; flex:none; border-radius:50%; display:grid; place-items:center; background:rgba(255,255,255,.18); color:#fff; }
      .na-av svg { width:1.35rem; height:1.35rem; }
      .na-judul { min-width:0; flex:1; line-height:1.25; }
      .na-judul strong { display:block; font-size:.98rem; font-weight:800; }
      .na-judul span { display:block; font-size:.72rem; opacity:.85; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .na-judul span.na-aktif::before { content:""; display:inline-block; width:.45rem; height:.45rem; margin-right:.35rem; border-radius:50%; background:#F4A261; animation:na-kedip 1s infinite; }
      .na-ikon-btn { width:2rem; height:2rem; flex:none; border:0; border-radius:.6rem; display:grid; place-items:center; color:#fff; background:transparent; cursor:pointer; }
      .na-ikon-btn:hover { background:rgba(255,255,255,.18); }
      .na-ikon-btn svg { width:1.05rem; height:1.05rem; }

      .na-pesan { position:relative; flex:1; overflow-y:auto; padding:1rem .85rem; display:flex; flex-direction:column; gap:.7rem; scroll-behavior:smooth; overscroll-behavior:contain; }
      .na-m { display:flex; gap:.5rem; align-items:flex-start; animation:na-masuk .35s cubic-bezier(.2,.8,.2,1); }
      .na-m.user { flex-direction:row-reverse; }
      .na-m .na-av { width:1.8rem; height:1.8rem; background:var(--na-segar); }
      .na-m .na-av svg { width:1.1rem; height:1.1rem; }
      .na-b { max-width:86%; padding:.65rem .85rem; border-radius:1rem 1rem 1rem .25rem; background:var(--na-bot); font-size:.84rem; line-height:1.5; overflow-wrap:anywhere; }
      .na-m.user .na-b { background:var(--na-tua); color:#fff; border-radius:1rem 1rem .25rem 1rem; }
      html.dark .na-m.user .na-b { background:var(--na-segar); }
      .na-b p { margin:0; } .na-b p + p, .na-b p + ul, .na-b p + ol, .na-b ul + p, .na-b ol + p, .na-b .na-bar + p { margin-top:.5rem; }
      .na-b .na-h { font-weight:800; margin-top:.6rem; }
      .na-b .na-h:first-child { margin-top:0; }
      .na-b ul, .na-b ol { margin:.3rem 0 0; padding-left:1.15rem; } .na-b ul { list-style:disc; } .na-b ol { list-style:decimal; }
      .na-b li { margin:.2rem 0; padding-left:.1rem; }
      .na-b li > .na-bar { margin-top:.3rem; }
      .na-b b, .na-b strong { font-weight:800; }
      .na-note { font-size:.75rem; color:var(--na-redup); background:rgba(244,162,97,.14); border-left:3px solid var(--na-panen); padding:.4rem .55rem; border-radius:.4rem; margin-top:.5rem; }

      .na-chips { display:flex; flex-wrap:wrap; gap:.4rem; margin-top:.6rem; }
      .na-chips.na-kolom { flex-direction:column; align-items:stretch; }
      .na-chip { display:inline-flex; align-items:center; gap:.3rem; padding:.42rem .7rem; font:inherit; font-size:.78rem; font-weight:700; line-height:1.3; text-align:left; color:var(--na-tua); background:var(--na-chip); border:1px solid var(--na-garis); border-radius:99px; cursor:pointer; text-decoration:none; transition:background .15s, transform .15s, border-color .15s; }
      html.dark .na-chip { color:#CFE8DA; }
      .na-chip:hover { background:var(--na-segar); border-color:var(--na-segar); color:#fff; transform:translateY(-1px); }
      .na-kolom .na-chip { border-radius:.9rem; }

      .na-bar { height:.5rem; border-radius:99px; background:var(--na-garis); overflow:hidden; }
      .na-bar > i { display:block; height:100%; border-radius:inherit; background:var(--na-segar); animation:na-isi .9s cubic-bezier(.2,.8,.2,1); }
      .na-bar > i.na-kuning { background:var(--na-panen); } .na-bar > i.na-merah { background:#E76F51; }
      .na-gizi { margin-top:.5rem; } .na-gizi-t { display:flex; justify-content:space-between; gap:.5rem; font-size:.76rem; font-weight:700; margin-bottom:.2rem; }

      .na-ketik .na-b { display:flex; gap:.28rem; align-items:center; padding:.8rem .9rem; }
      .na-titik { width:.45rem; height:.45rem; border-radius:50%; background:var(--na-segar); animation:na-lompat 1.1s infinite ease-in-out; }
      .na-titik:nth-child(2) { animation-delay:.15s; } .na-titik:nth-child(3) { animation-delay:.3s; }

      .na-strip { display:none; gap:.4rem; padding:.55rem .75rem 0; overflow-x:auto; scrollbar-width:thin; }
      .na-mulai .na-strip { display:flex; }
      .na-strip .na-chip { flex:none; white-space:nowrap; }
      .na-form { display:flex; gap:.5rem; padding:.65rem .75rem .35rem; }
      .na-input { flex:1; min-width:0; font:inherit; font-size:.86rem; color:var(--na-teks); background:var(--na-chip); border:1px solid var(--na-garis); border-radius:.85rem; padding:.6rem .85rem; }
      .na-input::placeholder { color:var(--na-redup); }
      .na-input:focus { outline:2px solid var(--na-segar); outline-offset:0; }
      .na-kirim { width:2.55rem; flex:none; border:0; border-radius:.85rem; display:grid; place-items:center; color:#fff; background:var(--na-tua); cursor:pointer; transition:filter .15s, transform .15s; }
      html.dark .na-kirim { background:var(--na-segar); }
      .na-kirim:hover:not(:disabled) { filter:brightness(1.15); } .na-kirim:active:not(:disabled) { transform:scale(.94); }
      .na-kirim:disabled, .na-input:disabled { opacity:.55; cursor:not-allowed; }
      .na-kirim svg { width:1.15rem; height:1.15rem; }
      .na-foot { margin:0; padding:0 .9rem .6rem; font-size:.66rem; text-align:center; color:var(--na-redup); }

      @keyframes na-apung { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-5px); } }
      @keyframes na-denyut { 0% { box-shadow:0 10px 25px -6px rgba(27,67,50,.6), 0 0 0 0 rgba(64,145,108,.5); } 80%,100% { box-shadow:0 10px 25px -6px rgba(27,67,50,.6), 0 0 0 18px rgba(64,145,108,0); } }
      @keyframes na-masuk { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
      @keyframes na-lompat { 0%,60%,100% { transform:translateY(0); opacity:.5; } 30% { transform:translateY(-.35rem); opacity:1; } }
      @keyframes na-kedip { 50% { opacity:.25; } }
      @keyframes na-isi { from { width:0 !important; } }
      @media (prefers-reduced-motion: reduce) { .na-root *, .na-root *::before { animation:none !important; transition-duration:.01ms !important; scroll-behavior:auto !important; } }
      @media print { .na-root { display:none !important; } }
    `;

    /**
     * HTML widget (floating button + jendela chat). Disuntikkan ke akhir <body>.
     * Quick Prompts memakai label singkat tetapi mengirim kalimat lengkap.
     */
    const HTML_NUSAAI =
      '<div id="nusaai" class="na-root">' +
        '<div id="na-teaser" class="na-teaser" role="status">Halo! 🌿 Tanya saya soal <b>kulkas</b>, <b>kebun</b>, dan <b>gizi</b> Anda.</div>' +
        '<section id="na-panel" class="na-panel" role="dialog" aria-modal="false" aria-labelledby="na-nama" aria-hidden="true">' +
          '<header class="na-head">' +
            '<span class="na-av">' + IKON_ROBOT + '</span>' +
            '<div class="na-judul"><strong id="na-nama">Nusa-Ai</strong><span id="na-status" aria-live="polite">Asisten Cerdas Ketahanan Pangan</span></div>' +
            '<button type="button" id="na-reset" class="na-ikon-btn" aria-label="Mulai percakapan baru" title="Percakapan baru">' + IKON_ULANG + '</button>' +
            '<button type="button" id="na-tutup" class="na-ikon-btn" aria-label="Tutup Nusa-Ai" title="Tutup">' + IKON_TUTUP + '</button>' +
          '</header>' +
          '<div id="na-pesan" class="na-pesan" role="log" aria-live="polite" aria-label="Percakapan dengan Nusa-Ai"></div>' +
          '<div id="na-strip" class="na-strip" role="group" aria-label="Pertanyaan cepat">' +
            PROMPT_CEPAT.map((q) => '<button type="button" class="na-chip" data-na-q="' + ea(q.teks) + '" data-na-i="' + q.i + '">' + q.ikon + ' ' + e(q.label) + '</button>').join('') +
          '</div>' +
          '<form id="na-form" class="na-form" autocomplete="off">' +
            '<input id="na-input" class="na-input" type="text" maxlength="200" placeholder="Tanya soal kulkas, kebun, atau gizi…" aria-label="Tulis pertanyaan untuk Nusa-Ai" enterkeyhint="send" />' +
            '<button type="submit" id="na-kirim" class="na-kirim" aria-label="Kirim pertanyaan">' + IKON_KIRIM + '</button>' +
          '</form>' +
          '<p class="na-foot">Menjawab dari data di perangkat Anda · bukan pengganti tenaga kesehatan</p>' +
        '</section>' +
        '<button type="button" id="na-fab" class="na-fab" aria-expanded="false" aria-controls="na-panel" aria-label="Buka Nusa-Ai, asisten cerdas ketahanan pangan">' +
          IKON_ROBOT.replace('<svg ', '<svg class="na-r" ') +
          IKON_TUTUP.replace('<svg ', '<svg class="na-x" ') +
          '<span id="na-badge" class="na-badge" hidden aria-hidden="true">0</span>' +
        '</button>' +
      '</div>';

    /** Perilaku widget: membuka/menutup, mengirim pesan, animasi mengetik, riwayat sesi. */
    const Tampilan = {
      terbuka: false,
      sibuk: false,
      /** Riwayat percakapan: { p: 'bot'|'user', h: string }. Pesan pengguna disimpan sebagai teks biasa. */
      pesan: [],

      /** @param {string} id @returns {HTMLElement|null} */
      $(id) { return document.getElementById(id); },

      /** Memasang CSS + HTML sekali saja dan semua pendengar event. */
      pasang() {
        if (this.$('nusaai')) return;
        const s = document.createElement('style');
        s.id = 'nusaai-gaya';
        s.textContent = CSS_NUSAAI;
        document.head.appendChild(s);
        document.body.insertAdjacentHTML('beforeend', HTML_NUSAAI);

        this.$('na-fab').addEventListener('click', () => (this.terbuka ? this.tutup() : this.buka()));
        this.$('na-tutup').addEventListener('click', () => this.tutup());
        this.$('na-reset').addEventListener('click', () => this.reset());
        this.$('na-teaser').addEventListener('click', () => this.buka());
        this.$('na-form').addEventListener('submit', (ev) => {
          ev.preventDefault();
          const i = this.$('na-input'), t = i.value;
          i.value = '';
          this.tanya(t);
        });
        // Chip pertanyaan (di pesan maupun strip): satu pendengar untuk semuanya
        this.$('na-panel').addEventListener('click', (ev) => {
          const b = ev.target.closest('[data-na-q]');
          if (b) this.tanya(b.getAttribute('data-na-q'), b.getAttribute('data-na-i') || undefined);
        });
        document.addEventListener('keydown', (ev) => {
          if (ev.key === 'Escape' && this.terbuka && !Akun.terbuka()) { this.tutup(); }
        });
        // Lencana kulkas ikut hidup saat data berubah
        ['nusapangan:berubah', 'storage', 'focus', 'pageshow', 'nusapangan:akun'].forEach((nama) => window.addEventListener(nama, () => this.perbaruiLencana()));
      },

      /**
       * Membuka jendela chat. Pertama kali: menampilkan sambutan yang merangkum data pengguna.
       * @param {boolean} [tanpaFokus] - true bila fokus input tidak boleh dipindah
       */
      buka(tanpaFokus) {
        if (this.terbuka) return;
        this.terbuka = true;
        this.$('nusaai').classList.add('na-buka');
        this.$('na-fab').setAttribute('aria-expanded', 'true');
        this.$('na-fab').setAttribute('aria-label', 'Tutup Nusa-Ai');
        this.$('na-panel').setAttribute('aria-hidden', 'false');
        this.$('na-teaser').classList.remove('na-tampil');
        if (!this.pesan.length) this.tambah('bot', Jawaban.sambutan());
        this.simpanSesi();
        this.perbaruiLencana();
        if (!tanpaFokus) setTimeout(() => { const i = this.$('na-input'); if (i && this.terbuka) i.focus({ preventScroll: true }); }, REDUKSI ? 0 : 260);
      },

      /** Menutup jendela chat dan mengembalikan fokus ke tombol melayang. */
      tutup() {
        if (!this.terbuka) return;
        const fokusDiDalam = this.$('na-panel').contains(document.activeElement);
        this.terbuka = false;
        this.$('nusaai').classList.remove('na-buka');
        this.$('na-fab').setAttribute('aria-expanded', 'false');
        this.$('na-fab').setAttribute('aria-label', 'Buka Nusa-Ai, asisten cerdas ketahanan pangan');
        this.$('na-panel').setAttribute('aria-hidden', 'true');
        if (fokusDiDalam) this.$('na-fab').focus({ preventScroll: true });
        this.simpanSesi();
        this.perbaruiLencana();
      },

      /** Menghapus percakapan lalu menampilkan sambutan baru. */
      reset() {
        if (this.timer) { clearTimeout(this.timer); this.timer = null; }
        this.sibuk = false;
        this.aturSibuk(false);
        this.pesan = [];
        this.$('na-pesan').innerHTML = '';
        this.perbaruiStrip();
        this.tambah('bot', Jawaban.sambutan());
        this.simpanSesi();
      },

      /**
       * Menambah satu pesan ke layar dan riwayat.
       * @param {'bot'|'user'} p - pengirim
       * @param {string} h - HTML (bot) atau teks biasa (pengguna)
       * @param {boolean} [dariSesi] - true saat memulihkan riwayat (tidak disimpan ulang / tidak digulir)
       * @returns {HTMLElement} elemen pesan
       */
      tambah(p, h, dariSesi) {
        const el = document.createElement('div');
        el.className = 'na-m ' + (p === 'user' ? 'user' : 'bot');
        el.innerHTML = (p === 'bot' ? '<span class="na-av">' + IKON_ROBOT + '</span>' : '') + '<div class="na-b">' + (p === 'user' ? e(h) : h) + '</div>';
        this.$('na-pesan').appendChild(el);
        if (!dariSesi) {
          this.pesan.push({ p: p, h: h });
          if (this.pesan.length > MAKS_PESAN) this.pesan.shift();
          this.perbaruiStrip();
          this.gulir(el, p === 'bot');
          this.simpanSesi();
        }
        return el;
      },

      /**
       * Menggulir area chat. Jawaban bot yang panjang digulir ke AWAL jawaban
       * (agar langsung terbaca dari atas), pesan pengguna ke bagian bawah.
       * @param {HTMLElement} el
       * @param {boolean} dariAwal
       */
      gulir(el, dariAwal) {
        const box = this.$('na-pesan');
        const atas = dariAwal ? Math.max(0, el.offsetTop - 10) : box.scrollHeight;
        box.scrollTo({ top: atas, behavior: REDUKSI ? 'auto' : 'smooth' });
      },

      /** Menampilkan strip Quick Prompts setelah percakapan dimulai. */
      perbaruiStrip() {
        this.$('nusaai').querySelector('.na-panel').classList.toggle('na-mulai', this.pesan.some((m) => m.p === 'user'));
      },

      /**
       * Mengunci/membuka input saat Nusa-Ai "mengetik".
       * @param {boolean} sibuk
       */
      aturSibuk(sibuk) {
        const st = this.$('na-status');
        this.$('na-input').disabled = sibuk;
        this.$('na-kirim').disabled = sibuk;
        this.$('na-pesan').setAttribute('aria-busy', String(sibuk));
        st.textContent = sibuk ? 'Nusa-Ai sedang mengetik...' : 'Asisten Cerdas Ketahanan Pangan';
        st.classList.toggle('na-aktif', sibuk);
      },

      /**
       * Memproses satu pertanyaan: tampilkan pesan pengguna, animasi mengetik,
       * baca data LocalStorage saat itu juga, lalu tampilkan jawaban.
       * @param {string} teks - pertanyaan
       * @param {string} [paksa] - id intent yang dipaksa (Quick Prompts)
       */
      tanya(teks, paksa) {
        teks = String(teks || '').replace(/\s+/g, ' ').trim().slice(0, 200);
        if (!teks || this.sibuk) return;
        if (!this.terbuka) this.buka(true);
        this.tambah('user', teks);
        this.sibuk = true;
        this.aturSibuk(true);

        const ketik = document.createElement('div');
        ketik.className = 'na-m bot na-ketik';
        ketik.innerHTML = '<span class="na-av">' + IKON_ROBOT + '</span><div class="na-b" aria-hidden="true"><span class="na-titik"></span><span class="na-titik"></span><span class="na-titik"></span></div>';
        this.$('na-pesan').appendChild(ketik);
        this.gulir(ketik, false);

        let html;
        try { html = Otak.jawab(teks, paksa).html; }
        catch (err) { html = H.p('Maaf, saya kesulitan membaca data saat ini 🙏. Coba muat ulang halaman lalu tanyakan lagi.'); }

        // Jeda dibuat sebanding panjang jawaban agar terasa seperti sedang menulis
        const jeda = REDUKSI ? 150 : Math.min(1700, 650 + html.length / 6);
        this.timer = setTimeout(() => {
          this.timer = null;
          ketik.remove();
          this.tambah('bot', html);
          this.sibuk = false;
          this.aturSibuk(false);
          if (this.terbuka) { const i = this.$('na-input'); if (i) i.focus({ preventScroll: true }); }
        }, jeda);
      },

      /** Menyimpan riwayat & status buka ke sessionStorage agar bertahan antar halaman. */
      simpanSesi() {
        try { sessionStorage.setItem(KUNCI_SESI, JSON.stringify({ buka: this.terbuka, pesan: this.pesan })); } catch (err) { /* diabaikan */ }
      },

      /** Memulihkan riwayat dari sessionStorage (dipanggil saat halaman dimuat). */
      pulihkanSesi() {
        let d = null;
        try { d = JSON.parse(sessionStorage.getItem(KUNCI_SESI)); } catch (err) { d = null; }
        if (!d || !Array.isArray(d.pesan)) return;
        this.pesan = d.pesan.filter((m) => m && (m.p === 'bot' || m.p === 'user') && typeof m.h === 'string').slice(-MAKS_PESAN);
        this.pesan.forEach((m) => this.tambah(m.p, m.h, true));
        this.perbaruiStrip();
        if (d.buka) {
          const root = this.$('nusaai');
          root.classList.add('na-instan');
          this.buka(true);
          const box = this.$('na-pesan');
          box.style.scrollBehavior = 'auto';
          box.scrollTop = box.scrollHeight;
          box.style.scrollBehavior = '';
          requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('na-instan')));
        }
      },

      /** Memperbarui lencana merah di tombol melayang = jumlah bahan yang perlu segera diolah. */
      perbaruiLencana() {
        const b = this.$('na-badge'), f = this.$('na-fab');
        if (!b || !f) return;
        const n = Konteks.jumlahDarurat();
        b.hidden = n === 0 || this.terbuka;
        b.textContent = n > 9 ? '9+' : String(n);
        f.setAttribute('aria-label', (this.terbuka ? 'Tutup Nusa-Ai' : 'Buka Nusa-Ai, asisten cerdas ketahanan pangan') + (n && !this.terbuka ? '. ' + n + ' bahan di kulkas perlu segera diolah' : ''));
      },

      /** Gelembung ajakan singkat (sekali per sesi) agar fitur mudah ditemukan. */
      tampilkanAjakan() {
        let sudah = false;
        try { sudah = !!sessionStorage.getItem(KUNCI_SESI + ':ajakan'); } catch (err) { sudah = true; }
        if (sudah || this.terbuka || this.pesan.length) return;
        const t = this.$('na-teaser');
        setTimeout(() => {
          if (this.terbuka) return;
          t.classList.add('na-tampil');
          try { sessionStorage.setItem(KUNCI_SESI + ':ajakan', '1'); } catch (err) { /* diabaikan */ }
          setTimeout(() => t.classList.remove('na-tampil'), 8000);
        }, 2500);
      }
    };

    /* ---------- API PUBLIK ---------- */

    return {
      /** Memasang widget ke halaman (dipanggil otomatis saat DOM siap). */
      init() {
        Tampilan.pasang();
        Tampilan.pulihkanSesi();
        Tampilan.perbaruiLencana();
        Tampilan.tampilkanAjakan();
      },
      /** Membuka jendela chat. */
      buka() { Tampilan.buka(); },
      /** Menutup jendela chat. */
      tutup() { Tampilan.tutup(); },
      /** Mengirim pertanyaan seolah diketik pengguna. @param {string} teks */
      tanya(teks) { Tampilan.tanya(teks); },
      /** Menghapus percakapan. */
      reset() { Tampilan.reset(); },
      /**
       * Menghasilkan jawaban TANPA UI (berguna untuk pengujian/debug di konsol).
       * @param {string} teks - pertanyaan
       * @returns {{html:string, intent:string}}
       * @example NusaPangan.NusaAi.jawab('Cek bahan kulkas saya yang hampir basi!')
       */
      jawab(teks) { return Otak.jawab(teks); },
      /** Pembaca data LocalStorage (untuk debug): stok(), tanaman(), gizi(), dll. */
      Konteks: Konteks
    };
  })();

  /* =====================================================================
   * 10. ANIMASI HERO — animasi teks H1 yang berbeda di tiap halaman
   * ---------------------------------------------------------------------
   * Cara kerja singkat:
   *  1. Mendeteksi halaman dari location.pathname (index / farming /
   *     foodrescue / nutrisi / komunitas).
   *  2. Mengganti isi H1 di `main > section:first-of-type` dengan kerangka
   *     <span> beranimasi. Teks asli dipindah ke aria-label, sehingga
   *     pembaca layar tetap membaca satu kalimat utuh.
   *  3. Badge, paragraf deskripsi, dan tombol CTA diberi Fade-Up Stagger.
   *  4. Semua efek memakai CSS Keyframes murni; JavaScript hanya mengatur
   *     siklus teks yang berganti (rotator & scramble).
   *  5. REDUKSI === true  -> tanpa animasi & tanpa loop (teks langsung final).
   *  6. Zero Layout Shift: frasa yang berganti disusun menumpuk dalam satu
   *     sel grid, jadi ukuran wadah selalu mengikuti frasa terpanjang.
   * Warna dapat diganti lewat variabel CSS --ah-* (lihat bagian :root).
   * ===================================================================== */

  /**
   * @typedef {Object} EfekHero
   * @property {function(HTMLElement):(number|null)} - Fungsi efek per halaman.
   *   Menerima elemen H1, mengembalikan perkiraan detik animasi H1 selesai
   *   (dipakai untuk menjadwalkan deskripsi & CTA), atau null bila teks H1
   *   tidak cocok dengan spesifikasi (H1 dibiarkan apa adanya).
   */

  const AnimasiHero = {

    /** CSS Keyframes & kelas pendukung (disuntikkan sekali ke <head>). */
    css: `
      :root { --ah-aksen:#F4A261; --ah-aman:#52B788; --ah-hati:#F9C74F; --ah-segera:#FF5A4E; --ah-tua:#1B4332; --ah-ease:cubic-bezier(.2,.8,.2,1); --ah-pegas:cubic-bezier(.34,1.56,.64,1); }

      /* Tahan tampilan hero sesaat agar tidak berkedip sebelum animasi mulai */
      html.ah-tahan main > section:first-of-type :is(h1,p,a,button) { visibility:hidden; }

      /* Fade-Up Stagger: badge, deskripsi, CTA. "backwards" = tidak mengunci transform akhir (hover tombol tetap jalan) */
      .ah-naik { animation:ah-naik .85s var(--ah-ease) var(--ah-d,0s) backwards; }
      @keyframes ah-naik { from { opacity:0; transform:translateY(16px); } }

      /* Pembungkus kata generik */
      .ah-kata { display:inline-block; animation:ah-kata .8s var(--ah-ease) var(--ah-d,0s) backwards; }
      @keyframes ah-kata { from { opacity:0; transform:translateY(.5em); } }

      /* 1) BERANDA — Curtain Mask Slide-Up + 3D Word Rotator */
      .ah-mask { display:inline-block; vertical-align:top; overflow:hidden; padding:.05em 0 .16em; margin:-.05em 0 -.16em; }
      .ah-mask-i { display:inline-block; animation:ah-tirai .95s var(--ah-ease) var(--ah-d,0s) backwards; }
      @keyframes ah-tirai { from { transform:translateY(125%); } }
      .ah-rw { display:inline-grid; vertical-align:top; perspective:700px; color:var(--ah-aksen); }
      .ah-rw-f { grid-area:1/1; opacity:0; visibility:hidden; backface-visibility:hidden; transform-origin:50% 50%; text-align:inherit; }
      .ah-rw-masuk { opacity:1; visibility:visible; animation:ah-rw-in .8s var(--ah-ease) var(--ah-d,0s) backwards; }
      .ah-rw-keluar { opacity:0; visibility:visible; animation:ah-rw-out .8s var(--ah-ease) forwards; }
      @keyframes ah-rw-in { from { opacity:0; transform:rotateX(-85deg) translateY(.5em); } }
      @keyframes ah-rw-out { from { opacity:1; transform:none; } to { opacity:0; transform:rotateX(85deg) translateY(-.5em); } }

      /* 2) FARMING — Organic Sprout Pop-Up + Weather Cipher */
      .ah-sprout { display:inline-block; white-space:nowrap; }
      .ah-h { display:inline-block; transform-origin:50% 100%; animation:ah-tumbuh .9s var(--ah-pegas) var(--ah-d,0s) backwards; }
      @keyframes ah-tumbuh { from { opacity:0; transform:scale(.15,.02) translateY(.15em); } }
      .ah-sandi { display:inline-grid; vertical-align:top; position:relative; color:var(--ah-aksen); }
      .ah-hantu { grid-area:1/1; visibility:hidden; }
      .ah-hidup { position:absolute; left:0; top:0; width:100%; }
      .ah-sim { opacity:.6; }

      /* 3) FOOD RESCUE — Marker Sweep + Status Pulse & Countdown Underline */
      .ah-stabilo { padding:0 .12em; margin:0 -.12em; color:var(--ah-tua); background:linear-gradient(var(--ah-aksen),var(--ah-aksen)) no-repeat 0 55% / 100% 86%; -webkit-box-decoration-break:clone; box-decoration-break:clone; animation:ah-sapu .95s var(--ah-ease) .15s backwards; }
      @keyframes ah-sapu { from { background-size:0% 86%; color:inherit; } }
      .ah-hitung { padding-bottom:.1em; background:linear-gradient(currentColor,currentColor) no-repeat 0 100% / 100% .08em; -webkit-box-decoration-break:clone; box-decoration-break:clone; animation:ah-hitung 6.4s linear 1.5s infinite backwards, ah-denyut 1.6s ease-in-out 1.5s infinite backwards; }
      @keyframes ah-hitung {
        0% { color:var(--ah-aman); background-size:100% .08em; }
        30% { color:var(--ah-aman); }
        36%, 62% { color:var(--ah-hati); }
        68% { color:var(--ah-segera); }
        86%, 94% { color:var(--ah-segera); background-size:0% .08em; }
        100% { color:var(--ah-aman); background-size:100% .08em; }
      }
      @keyframes ah-denyut { 0%, 100% { text-shadow:0 0 0 transparent; } 50% { text-shadow:0 0 .4em currentColor; } }

      /* 4) NUTRISI — Typewriter + Backspace Loop (Zero Layout Shift)
         Semua kalimat ditumpuk tak terlihat ("hantu") dalam satu sel grid, sehingga wadah selalu
         setinggi kalimat terpanjang. Teks yang diketik berada di lapisan absolut di atasnya. */
      .ah-mesin { display:grid; position:relative; }
      .ah-mesin-hantu { grid-area:1/1; visibility:hidden; }
      .ah-mesin-hidup { position:absolute; left:0; top:0; width:100%; color:#fff; }
      .ah-kursor { display:inline-block; width:.07em; height:.88em; margin-left:.08em; vertical-align:-.1em; border-radius:1px; background:var(--ah-aksen); animation:ah-kedip 1s steps(1,end) infinite; }
      .ah-kursor.ah-ngetik { animation:none; }
      @keyframes ah-kedip { 0%, 49% { opacity:1; } 50%, 100% { opacity:0; } }

      /* 5) KOMUNITAS — Blur-to-Focus Wave + Golden Shimmer + Center-Out Underline */
      .ah-kabur { display:inline-block; animation:ah-kabur .9s var(--ah-ease) var(--ah-d,0s) backwards; }
      @keyframes ah-kabur { from { opacity:0; filter:blur(10px); transform:translateY(12px); } }
      .ah-kilau { position:relative; display:inline-block; vertical-align:top; color:var(--ah-aksen); }
      .ah-kilau::before { content:""; position:absolute; left:0; right:0; bottom:-.04em; height:.07em; border-radius:99px; background:var(--ah-aksen); transform-origin:50% 50%; animation:ah-tengah .9s var(--ah-ease) 1.4s backwards; }
      .ah-kilau::after { content:attr(data-teks); position:absolute; inset:0; pointer-events:none; color:transparent; background:linear-gradient(105deg,transparent 42%,#FFF4CF 50%,transparent 58%) no-repeat; background-size:250% 100%; -webkit-background-clip:text; background-clip:text; animation:ah-kilau 3.5s ease-in-out 1.7s infinite backwards; }
      @keyframes ah-tengah { from { transform:scaleX(0); } }
      @keyframes ah-kilau { 0% { background-position:100% 0; } 35%, 100% { background-position:0% 0; } }

      /* Aksesibilitas: pengguna meminta gerak dikurangi -> semua animasi mati, teks langsung final */
      .ah-diam *, .ah-diam *::before, .ah-diam *::after { animation:none !important; }
    `,

    /** Nama berkas (tanpa .html) -> kunci efek. Alamat "/" dianggap Beranda. */
    PETA: { '': 'beranda', index: 'beranda', farming: 'farming', foodrescue: 'foodrescue', nutrisi: 'nutrisi', komunitas: 'komunitas' },

    /** Simbol cuaca (U+FE0E memaksa tampilan teks, bukan emoji berwarna) untuk efek Weather Cipher. */
    SIMBOL: ['\u2600\uFE0E', '\u2601\uFE0E', '\u2602\uFE0E', '\u2744\uFE0E', '\u26A1\uFE0E', '\u2248', '~', '*', '\u00B0', '+'],

    /** Daftar fungsi pembersih (timer, rAF, observer) yang dijalankan oleh hentikan(). */
    _henti: [],
    /** True setelah init() berjalan (mencegah dobel). */
    _jalan: false,
    /** False bila hero sedang di luar layar (loop dijeda). */
    _terlihat: true,

    /* ---------- pemasangan ---------- */

    /** Menyuntikkan CSS ke <head> sekali saja. */
    pasangGaya() {
      if (document.getElementById('nusa-animasi-hero')) return;
      const s = document.createElement('style');
      s.id = 'nusa-animasi-hero';
      s.textContent = this.css;
      document.head.appendChild(s);
    },

    /**
     * Menyembunyikan teks hero sesaat (sebelum DOM siap) agar tidak ada
     * kedipan teks asli. Otomatis dilepas oleh init(); ada pengaman 2,5 detik
     * bila skrip gagal. Tidak dipakai saat REDUKSI atau halaman tak dikenal.
     */
    tahan() {
      if (REDUKSI || !this.halaman()) return;
      const root = document.documentElement;
      root.classList.add('ah-tahan');
      setTimeout(() => root.classList.remove('ah-tahan'), 2500);
    },

    /** @returns {string} kunci halaman aktif ('beranda' | 'farming' | ...) atau '' bila tidak dikenal. */
    halaman() {
      const berkas = (location.pathname.split('/').pop() || '').replace(/\.html?$/i, '').toLowerCase();
      return Object.prototype.hasOwnProperty.call(this.PETA, berkas) ? this.PETA[berkas] : '';
    },

    /** Titik masuk: menyiapkan hero, menjalankan efek H1, lalu animasi pendukung. */
    init() {
      const lepas = () => document.documentElement.classList.remove('ah-tahan');
      const kunci = this.halaman();
      const hero = document.querySelector('main > section:first-of-type');
      const h1 = hero && hero.querySelector('h1');
      if (!kunci || !h1 || this._jalan) { lepas(); return; }
      this._jalan = true;
      try {
        if (REDUKSI) hero.classList.add('ah-diam');
        if ('IntersectionObserver' in window) {
          const io = new IntersectionObserver((en) => { this._terlihat = en[0].isIntersecting; });
          io.observe(hero);
          this._henti.push(() => io.disconnect());
        }
        const selesai = this.efek[kunci].call(this, h1);
        this.naikkan(hero, h1, selesai == null ? 0.6 : selesai);
      } catch (err) {
        console.warn('[AnimasiHero] dibatalkan:', err);
      }
      lepas();
    },

    /** Menghentikan semua loop/timer (mis. sebelum init ulang atau saat debugging). */
    hentikan() {
      this._henti.forEach((f) => f());
      this._henti = [];
      this._jalan = false;
    },

    /* ---------- utilitas ---------- */

    /** Merapikan spasi/baris baru. @param {string} t @returns {string} */
    rapi(t) { return String(t == null ? '' : t).replace(/\s+/g, ' ').trim(); },

    /**
     * Memastikan teks H1 sama dengan spesifikasi. Bila berbeda, H1 tidak
     * disentuh (menghindari menimpa teks yang sudah Anda ubah).
     * @param {HTMLElement} h1
     * @param {string} teks - teks lengkap yang diharapkan
     * @returns {boolean}
     */
    cocok(h1, teks) {
      if (this.rapi(h1.innerText || h1.textContent) === teks) return true;
      console.warn('[AnimasiHero] Teks H1 tidak cocok dengan spesifikasi, animasi H1 dilewati:', teks);
      return false;
    },

    /**
     * Mengganti isi H1 dengan kerangka beranimasi. Teks asli dipindah ke
     * aria-label dan kerangka diberi aria-hidden agar pembaca layar tidak
     * membaca huruf/kata yang berganti-ganti.
     * @param {HTMLElement} h1
     * @param {string} html - kerangka (semua teks dinamis sudah lewat Util.esc)
     */
    pasangH1(h1, html) {
      h1.setAttribute('aria-label', this.rapi(h1.innerText || h1.textContent));
      h1.innerHTML = '<span aria-hidden="true">' + html + '</span>';
    },

    /**
     * Membuat rangkaian <span> per kata dengan delay bertahap (--ah-d).
     * @param {string} teks - kalimat, kata dipisah spasi
     * @param {string} kelas - kelas CSS tiap kata
     * @param {number} d0 - delay kata pertama (detik)
     * @param {number} langkah - selisih delay antar kata (detik)
     * @returns {string} HTML
     */
    kata(teks, kelas, d0, langkah) {
      return teks.split(' ').map((k, i) => '<span class="' + kelas + '" style="--ah-d:' + (d0 + i * langkah).toFixed(2) + 's">' + Util.esc(k) + '</span>').join(' ');
    },

    /** setTimeout yang otomatis dibersihkan oleh hentikan(). */
    tunda(fn, ms) {
      const t = setTimeout(fn, ms);
      this._henti.push(() => clearTimeout(t));
    },

    /**
     * Loop berkala yang dijeda saat tab disembunyikan atau hero di luar layar.
     * Tidak berjalan sama sekali bila REDUKSI === true.
     * @param {function():void} fn - dipanggil tiap `ms`
     * @param {number} ms - interval (ms)
     * @param {number} awal - jeda sebelum panggilan pertama (ms)
     */
    ulang(fn, ms, awal) {
      if (REDUKSI) return;
      let t;
      const jalan = () => {
        if (!document.hidden && this._terlihat) fn();
        t = setTimeout(jalan, ms);
      };
      t = setTimeout(jalan, awal);
      this._henti.push(() => clearTimeout(t));
    },

    /**
     * Efek Text Scramble: mengganti teks menjadi simbol cuaca acak, lalu
     * mengunci huruf satu per satu dari kiri ke kanan. Spasi dipertahankan.
     * @param {HTMLElement} el - elemen tujuan (position:absolute, tidak memengaruhi layout)
     * @param {string} target - teks akhir
     */
    acak(el, target) {
      cancelAnimationFrame(el._raf);
      const n = target.length, durasi = 950, mulai = performance.now();
      const kunci = target.split('').map((c, i) => 250 + (i / n) * (durasi - 250) + Math.random() * 120);
      let sim = [], terakhir = -99;
      const langkah = (t) => {
        const w = t - mulai;
        if (w - terakhir >= 50) {
          sim = target.split('').map(() => this.SIMBOL[Math.floor(Math.random() * this.SIMBOL.length)]);
          terakhir = w;
        }
        let html = '', tuntas = true;
        for (let i = 0; i < n; i++) {
          const c = target.charAt(i);
          if (c === ' ') html += ' ';
          else if (w >= kunci[i]) html += Util.esc(c);
          else { tuntas = false; html += '<i class="ah-sim" style="font-style:normal">' + Util.esc(sim[i]) + '</i>'; }
        }
        el.innerHTML = html;
        if (!tuntas) el._raf = requestAnimationFrame(langkah);
      };
      el._raf = requestAnimationFrame(langkah);
    },

    /**
     * Fade-Up Stagger untuk badge (p pertama di atas H1), paragraf deskripsi
     * (p pertama setelah H1), dan seluruh tombol/tautan CTA di hero.
     * @param {HTMLElement} hero - section hero
     * @param {HTMLElement} h1
     * @param {number} selesai - perkiraan detik H1 selesai
     */
    naikkan(hero, h1, selesai) {
      const dalam = (el) => h1.contains(el);
      const sesudah = (el) => !el.contains(h1) && !!(h1.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
      const antri = [];
      const lencana = hero.querySelector('p:first-of-type');
      if (lencana && !dalam(lencana) && !lencana.contains(h1) && !sesudah(lencana)) antri.push([lencana, 0.05]);
      const deskripsi = Array.prototype.find.call(hero.querySelectorAll('p'), (p) => p !== lencana && !dalam(p) && sesudah(p));
      if (deskripsi) antri.push([deskripsi, Math.max(0.3, selesai - 0.3)]);
      Array.prototype.filter.call(hero.querySelectorAll('a[href], button'), (el) => !dalam(el))
        .forEach((el, i) => antri.push([el, selesai + 0.15 + i * 0.12]));
      antri.forEach((a) => {
        const el = a[0];
        el.style.setProperty('--ah-d', a[1].toFixed(2) + 's');
        if (window.getComputedStyle(el).display === 'inline') el.style.display = 'inline-block';
        el.classList.add('ah-naik');
      });
    },

    /* ---------- efek per halaman ---------- */

    /** @type {Object<string, EfekHero>} */
    efek: {

      /**
       * Beranda: Curtain Mask Slide-Up (6 kata) + 3D Word Rotator 4 pilar tiap 3 detik.
       * Ke-4 pilar ditumpuk dalam satu sel grid (Zero Layout Shift).
       */
      beranda(h1) {
        const awal = 'Pangan cukup untuk semua dimulai dari';
        const pilar = ['dapur kita sendiri.', 'kebun balkon rumah.', 'kulkas bebas sampah.', 'komunitas berbagi.'];
        if (!this.cocok(h1, awal + ' ' + pilar[0])) return null;
        const tirai = awal.split(' ').map((k, i) => '<span class="ah-mask"><span class="ah-mask-i" style="--ah-d:' + (0.1 + i * 0.09).toFixed(2) + 's">' + Util.esc(k) + '</span></span>').join(' ');
        const fase = pilar.map((t, i) => '<span class="ah-rw-f' + (i ? '' : ' ah-rw-masuk') + '"' + (i ? '' : ' style="--ah-d:.9s"') + '>' + Util.esc(t) + '</span>').join('');
        this.pasangH1(h1, tirai + ' <span class="ah-rw">' + fase + '</span>');
        const f = h1.querySelectorAll('.ah-rw-f');
        let i = 0;
        this.ulang(() => {
          const lama = f[i];
          i = (i + 1) % f.length;
          const baru = f[i];
          lama.classList.remove('ah-rw-masuk');
          lama.classList.add('ah-rw-keluar');
          baru.classList.remove('ah-rw-keluar');
          baru.style.setProperty('--ah-d', '0s');
          baru.classList.add('ah-rw-masuk');
          setTimeout(() => lama.classList.remove('ah-rw-keluar'), 850);
        }, 3000, 900 + 3000);
        return 1.5;
      },

      /**
       * Urban Farming: Organic Sprout per huruf (transform-origin: bottom, easing pegas)
       * + Weather Cipher (scramble simbol cuaca) tiap 3,2 detik. Lima frasa ditumpuk
       * sebagai "hantu" tak terlihat untuk mengunci ukuran; teks hidup bersifat absolut.
       */
      farming(h1) {
        const awal = 'Tanam pangan sendiri,';
        const cuaca = ['apa pun cuacanya.', 'saat kemarau panjang.', 'saat hujan lebat.', 'di perkotaan panas.', 'di dataran dingin.'];
        if (!this.cocok(h1, awal + ' ' + cuaca[0])) return null;
        let n = 0;
        const tunas = awal.split(' ').map((w) => '<span class="ah-sprout">' + w.split('').map((c) => '<span class="ah-h" style="--ah-d:' + (0.1 + (n++) * 0.03).toFixed(2) + 's">' + Util.esc(c) + '</span>').join('') + '</span>').join(' ');
        const hantu = cuaca.map((t) => '<span class="ah-hantu">' + Util.esc(t) + '</span>').join('');
        this.pasangH1(h1, tunas + ' <span class="ah-sandi">' + hantu + '<span class="ah-hidup"></span></span>');
        const hidup = h1.querySelector('.ah-hidup');
        if (REDUKSI) { hidup.textContent = cuaca[0]; return 0; }
        this._henti.push(() => cancelAnimationFrame(hidup._raf));
        let i = 0;
        this.tunda(() => this.acak(hidup, cuaca[0]), 900);
        this.ulang(() => { i = (i + 1) % cuaca.length; this.acak(hidup, cuaca[i]); }, 3200, 900 + 3200);
        return 1.5;
      },

      /**
       * Food Rescue: Marker Highlight Sweep (#F4A261, kiri ke kanan) + frasa kedua dengan
       * garis bawah hitung mundur (menyusut) dan warna Hijau -> Kuning -> Merah (loop 6,4 dtk).
       */
      foodrescue(h1) {
        const a = 'Selamatkan makanan', b = 'sebelum kedaluwarsa.';
        if (!this.cocok(h1, a + ' ' + b)) return null;
        this.pasangH1(h1, '<span class="ah-stabilo">' + Util.esc(a) + '</span> <span class="ah-hitung">' + this.kata(b, 'ah-kata', 0.6, 0.1) + '</span>');
        return 1.3;
      },

      /**
       * Nutrisi: Typewriter + Backspace Loop dengan kursor "|" berkedip.
       * Siklus: ketik huruf demi huruf -> tahan -> hapus mundur -> kalimat berikutnya (loop).
       * - Zero Layout Shift: seluruh kalimat ditumpuk sebagai "hantu" tak terlihat (lihat CSS .ah-mesin).
       * - aria-label H1 = teks asli di HTML (stabil untuk pembaca layar); kerangka aria-hidden.
       * - REDUKSI: kalimat pertama tampil statis, tanpa kursor, tanpa timer.
       * - Loop dijeda saat tab tersembunyi / hero di luar layar, dan dibersihkan oleh hentikan().
       */
      nutrisi(h1) {
        const kalimat = [
          'Gizi cukup, kantong aman, tidak ada yang terbuang.', // sama dengan teks asli <h1> di nutrisi.html
          'Gizi seimbang untuk keluarga tercinta.',
          'Cegah stunting dengan protein lokal.',
          'Olah bahan sisa kulkas jadi menu sehat.',
          'Hemat budget makan harian.'
        ];
        const T = { mulai: 600, ketik: 65, tahan: 1900, hapus: 32, jeda: 450 }; // milidetik
        const hantu = kalimat.map((t) => '<span class="ah-mesin-hantu">' + Util.esc(t) + '</span>').join('');
        this.pasangH1(h1, '<span class="ah-mesin">' + hantu +
          '<span class="ah-mesin-hidup"><span class="ah-mesin-teks"></span>' + (REDUKSI ? '' : '<span class="ah-kursor"></span>') + '</span></span>');
        const teks = h1.querySelector('.ah-mesin-teks');
        const kursor = h1.querySelector('.ah-kursor');
        if (REDUKSI) { teks.textContent = kalimat[0]; return 0; }

        let k = 0, n = 0, fase = 'ketik', timer;
        const aktif = (b) => { if (kursor) kursor.classList.toggle('ah-ngetik', b); }; // solid saat mengetik/menghapus, berkedip saat diam
        const putar = () => {
          if (document.hidden || !this._terlihat) { timer = setTimeout(putar, 300); return; } // jeda tanpa memajukan state
          const t = kalimat[k];
          let tunggu = T.ketik;
          if (fase === 'ketik') {
            n++; aktif(true);
            teks.textContent = t.slice(0, n);
            if (n >= t.length) { fase = 'tahan'; aktif(false); tunggu = T.tahan; }
            else tunggu = T.ketik + Math.random() * 45; // ritme manusiawi
          } else if (fase === 'tahan') {
            fase = 'hapus'; aktif(true); tunggu = 0;
          } else { // hapus
            n--;
            teks.textContent = t.slice(0, n);
            if (n <= 0) { k = (k + 1) % kalimat.length; fase = 'ketik'; aktif(false); tunggu = T.jeda; }
            else tunggu = T.hapus;
          }
          timer = setTimeout(putar, tunggu);
        };
        timer = setTimeout(putar, T.mulai);
        this._henti.push(() => clearTimeout(timer));
        return 1.2;
      },

      /**
       * Komunitas: Blur-to-Focus Wave per kata (blur 10px + translateY 12px) + frasa akhir
       * dengan Golden Shimmer miring tiap 3,5 detik dan garis bawah center-out.
       */
      komunitas(h1) {
        const a = 'Bertanya, berdiskusi,', b = 'dan tumbuh bersama.';
        if (!this.cocok(h1, a + ' ' + b)) return null;
        const jumlahA = a.split(' ').length;
        this.pasangH1(h1, this.kata(a, 'ah-kabur', 0.1, 0.11) + ' <span class="ah-kilau" data-teks="' + Util.esc(b) + '">' + this.kata(b, 'ah-kabur', 0.1 + jumlahA * 0.11, 0.11) + '</span>');
        return 1.6;
      }
    }
  };

  /* =====================================================================
   * 11. ANIMASI UI — gerak halus di seluruh halaman (tanpa library)
   * ---------------------------------------------------------------------
   * Isi: (1) reveal bertahap saat scroll, (2) cascade pop-in untuk hasil
   * pencarian/filter, (3) micro-interaction tombol, (4) akordeon slide-down,
   * (5) spotlight kursor + ikon melayang, (6) toast pegas + bayangan navbar.
   * Teknik: CSS keyframes (disuntikkan sekali) + IntersectionObserver +
   * MutationObserver + Web Animations API. Tidak mengubah HTML maupun
   * logika halaman: semua dipasang dari luar lewat event capture dan observer.
   * Aksesibilitas: bila REDUKSI true, seluruh animasi dimatikan (hanya
   * bayangan navbar statis yang tetap aktif).
   * ===================================================================== */

  /** Wadah kartu dinamis (isinya digambar ulang oleh JavaScript halaman). */
  const AU_WADAH = '#daftar-stok, div#statistik, div#rekomendasi, #katalog-grid, #daftar-tanam, div#ringkasan, #grid-rekomendasi, #hasil-resep, #feed, #grid-statistik';
  /** Elemen yang dianggap "kartu" (satu unit reveal sendiri). */
  const AU_KARTU = 'article, .kartu-hidup, [data-kartu]';
  /** Kartu yang mendapat efek spotlight kursor: Bento Grid beranda dan kartu statistik. */
  const AU_SPOT = '[class*="md:grid-cols-6"] > article, #grid-statistik > div, div#statistik > div, div#ringkasan > div, .kartu-hidup';
  /** Kontrol pencarian/filter: berinteraksi dengannya memicu cascade pop-in pada hasil. */
  const AU_FILTER = 'input[type="search"], select, .chip, [data-kat], [data-status], .tab-btn, #btn-reset-filter, #btn-reset-cari';
  /**
   * Tombol aksi yang memindahkan kartu: kartu meluncur keluar dulu sebelum aksi asli berjalan.
   * [data-panen] sengaja TIDAK ada di sini: tanaman yang dipanen tetap di daftar (hanya berganti
   * status), jadi ia mendapat perayaan "gk-panen" (lihat AnimasiUI.rayakanPanen), bukan animasi keluar.
   */
  const AU_KELUAR = '[data-aksi="selamat"], [data-aksi="terbuang"]';

  /** CSS bagian navbar (statis, tetap aktif walau REDUKSI true). */
  const AU_CSS_NAV = `
    header.gk-gulir { box-shadow: 0 8px 24px -10px rgba(27,67,50,.4), 0 2px 6px rgba(27,67,50,.08); background-color: rgba(248,249,250,.72); -webkit-backdrop-filter: blur(16px) saturate(1.5); backdrop-filter: blur(16px) saturate(1.5); }
    html.dark header.gk-gulir { background-color: rgba(14,25,20,.7); box-shadow: 0 8px 24px -10px rgba(0,0,0,.7), 0 2px 6px rgba(0,0,0,.3); }
  `;

  /** CSS gerak (hanya dipasang bila REDUKSI false). Awalan kelas: "gk-". */
  const AU_CSS = `
    header.gk-nav { transition: box-shadow .3s ease, background-color .3s ease; }
    /* Section disembunyikan sesaat agar tidak berkedip sebelum JS menyiapkan reveal */
    html.gk-tunda main > section:not(:first-of-type) { opacity: 0; }

    /* 1) Reveal saat scroll: fill-mode "backwards" agar efek hover kartu tidak tertimpa setelah selesai */
    .gk-awal { opacity: 0; }
    .gk-masuk { animation: gk-naik .7s cubic-bezier(.2,.8,.2,1) var(--gk-d, 0ms) backwards; }
    @keyframes gk-naik { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: none; } }

    /* 2) Cascade pop-in untuk kartu hasil saringan */
    .gk-pop { animation: gk-pop .55s cubic-bezier(.2,.9,.3,1.15) var(--gk-d, 0ms) backwards; }
    @keyframes gk-pop { from { opacity: 0; transform: scale(.9) translateY(12px); } to { opacity: 1; transform: none; } }

    /* 3a) Tombol dukung: denyut jantung + cincin */
    .gk-detak { animation: gk-cincin .6s ease-out; }
    .gk-detak :is(svg, [data-lucide]) { transform-origin: 50% 55%; animation: gk-detak .75s cubic-bezier(.3,.7,.4,1); }
    @keyframes gk-detak { 0% { transform: scale(1); } 14% { transform: scale(1.55); } 28% { transform: scale(1.05); } 42% { transform: scale(1.4); } 70%, 100% { transform: scale(1); } }
    @keyframes gk-cincin { 0% { box-shadow: 0 0 0 0 rgba(231,111,81,.5); } 100% { box-shadow: 0 0 0 16px rgba(231,111,81,0); } }
    /* 3b) Kartu meluncur keluar sambil mengecil tingginya agar daftar di bawahnya naik halus */
    .gk-keluar { overflow: hidden; pointer-events: none; animation: gk-keluar .42s cubic-bezier(.4,0,.6,1) forwards; }
    @keyframes gk-keluar {
      0% { opacity: 1; transform: none; max-height: var(--gk-h, 400px); }
      55% { opacity: 0; transform: translateX(56px) scale(.97); max-height: var(--gk-h, 400px); }
      100% { opacity: 0; transform: translateX(56px) scale(.97); max-height: 0; margin-top: 0; padding-top: 0; padding-bottom: 0; border-width: 0; } }
    /* 3b-2) Perayaan panen: kartu berdenyut dengan kilau oranye panen (#F4A261) lalu hijau segar (#40916C); kartu tetap di daftar */
    .gk-panen { animation: gk-panen 1.15s cubic-bezier(.2,.8,.2,1); }
    @keyframes gk-panen {
      0%   { transform: scale(1);     box-shadow: 0 0 0 0 rgba(244,162,97,.7); }
      20%  { transform: scale(1.035); box-shadow: 0 0 0 6px rgba(244,162,97,.55), 0 0 34px 8px rgba(244,162,97,.4); }
      45%  { transform: scale(.992);  box-shadow: 0 0 0 14px rgba(64,145,108,.28), 0 0 26px 4px rgba(64,145,108,.35); }
      70%  { transform: scale(1.008); box-shadow: 0 0 0 22px rgba(64,145,108,.1); }
      100% { transform: none;         box-shadow: 0 0 0 28px rgba(64,145,108,0); } }
    /* 3c) Ikon jam beker di banner prioritas bergetar seperti lonceng */
    #prioritas :is([data-lucide="alarm-clock"], .lucide-alarm-clock) { transform-origin: 50% 8%; animation: gk-lonceng 3.2s ease-in-out infinite; }
    @keyframes gk-lonceng { 0%, 28%, 100% { transform: none; } 3% { transform: rotate(-16deg); } 6% { transform: rotate(14deg); } 9% { transform: rotate(-11deg); } 12% { transform: rotate(8deg); } 15% { transform: rotate(-5deg); } 18% { transform: rotate(3deg); } 21% { transform: rotate(-1deg); } }

    /* 5) Spotlight kursor + ikon melayang (hanya perangkat dengan kursor) */
    @media (hover: hover) {
      .gk-spot { position: relative; isolation: isolate; --gk-glow: rgba(64,145,108,.2); }
      .gk-spot.bg-tua, .gk-spot.bg-segar { --gk-glow: rgba(255,255,255,.22); }
      .gk-spot.bg-panen { --gk-glow: rgba(255,255,255,.4); }
      html.dark .gk-spot.bg-white { --gk-glow: rgba(149,213,178,.16); }
      .gk-spot::before { content: ''; position: absolute; inset: 0; border-radius: inherit; z-index: -1; pointer-events: none; opacity: 0; transition: opacity .3s;
        background: radial-gradient(320px circle at var(--sx, 50%) var(--sy, 50%), var(--gk-glow), transparent 65%); }
      .gk-spot:hover::before { opacity: 1; }
      .gk-spot:hover :is(svg, [data-lucide]):not(button *) { animation: gk-melayang 1.8s ease-in-out infinite; }
    }
    @keyframes gk-melayang { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-5px) rotate(-6deg); } }

    /* 6) Toast meluncur naik dengan efek pegas (translate -50% sama dengan posisi tengah milik toast) */
    .gk-toast { animation: gk-toast .7s ease-out; }
    @keyframes gk-toast {
      0% { opacity: 0; transform: translate(-50%, 160%) scale(.92); }
      45% { opacity: 1; transform: translate(-50%, -14%) scale(1.03); }
      65% { transform: translate(-50%, 6%) scale(.99); }
      82% { transform: translate(-50%, -3%); }
      100% { opacity: 1; transform: translate(-50%, 0) scale(1); } }

    @media (prefers-reduced-motion: reduce) { .gk-awal { opacity: 1; } html.gk-tunda main > section:not(:first-of-type) { opacity: 1; } }
  `;

  /**
   * Modul gerak UI. Satu objek, beberapa kelompok metode (lihat komentar bagian).
   * Dipasang dengan AnimasiUI.init() di dalam siap(...); CSS dipasang segera (siapkan).
   */
  const AnimasiUI = {
    /** IntersectionObserver untuk reveal. */
    io: null,
    /** Batas waktu (performance.now) sampai hasil render dianggap akibat pencarian/filter (cascade penuh). */
    sampaiCascade: 0,
    /** Penjadwal rAF untuk spotlight. */
    _raf: 0,

    /** Memasang CSS dan menyembunyikan section sementara; dipanggil segera saat modul dimuat. */
    siapkan() {
      const s = document.createElement('style');
      s.id = 'nusa-gaya-ui';
      s.textContent = AU_CSS_NAV + (REDUKSI ? '' : AU_CSS);
      document.head.appendChild(s);
      if (!REDUKSI && 'IntersectionObserver' in window) {
        document.documentElement.classList.add('gk-tunda');
        setTimeout(() => document.documentElement.classList.remove('gk-tunda'), 2500); // pengaman bila init() gagal
      }
    },

    /* ---------- 1) REVEAL SAAT SCROLL ---------- */

    /**
     * Mengumpulkan unit reveal di dalam sebuah node: kartu menjadi unit sendiri,
     * wadah yang berisi kartu ditelusuri lebih dalam, selain itu menjadi satu blok.
     * Wadah dinamis (AU_WADAH) dilewati karena ditangani MutationObserver.
     * @param {Element} node - induk yang ditelusuri
     * @param {Element[]} hasil - larik penampung
     */
    kumpulkan(node, hasil) {
      Array.prototype.forEach.call(node.children, (c) => {
        if (/^(SCRIPT|STYLE|TEMPLATE)$/.test(c.tagName) || c.matches(AU_WADAH) || c.id === 'toast') return;
        if (c.matches(AU_KARTU)) hasil.push(c);
        else if (c.querySelector(AU_KARTU + ', ' + AU_WADAH)) this.kumpulkan(c, hasil);
        else hasil.push(c);
      });
    },

    /**
     * Menyembunyikan sebuah unit sampai masuk layar.
     * @param {Element} el - unit
     * @param {?{wadah:Element,kunci:string}} info - asal unit bila berasal dari wadah dinamis
     */
    awal(el, info) {
      el.classList.add('gk-awal');
      if (info) el._gk = info;
      this.io.observe(el);
    },

    /**
     * Callback IntersectionObserver: unit yang masuk layar pada saat bersamaan
     * muncul berurutan menurut urutan dokumen, jeda 80 ms per unit (maks. 8 langkah).
     * @param {IntersectionObserverEntry[]} entri
     */
    tampilkan(entri) {
      const terlihat = entri.filter((e) => e.isIntersecting).map((e) => e.target)
        .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
      terlihat.forEach((el, i) => {
        this.io.unobserve(el);
        el.style.setProperty('--gk-d', Math.min(i, 8) * 80 + 'ms');
        el.classList.remove('gk-awal');
        el.classList.add('gk-masuk');
        const g = el._gk;
        if (g) { g.wadah._pernah = true; if (g.wadah._ada && g.wadah._ada.get(g.kunci) === 'tunggu') g.wadah._ada.set(g.kunci, 'tampil'); }
      });
    },

    /** Menyiapkan reveal untuk seluruh section utama (kecuali hero, yang dikelola AnimasiHero). */
    pasangReveal() {
      this.io = new IntersectionObserver((e) => this.tampilkan(e), { rootMargin: '0px 0px -6% 0px', threshold: 0 });
      const hasil = [];
      document.querySelectorAll('main > section:not(:first-of-type)').forEach((s) => this.kumpulkan(s, hasil));
      hasil.forEach((el) => this.awal(el, null));
    },

    /* ---------- 2) CASCADE POP-IN UNTUK KARTU DINAMIS ---------- */

    /**
     * Identitas sebuah kartu agar kartu yang datanya sama tidak dianimasikan ulang
     * saat daftar digambar ulang (mis. saat tab difokuskan atau satu kartu diperbarui).
     * @param {Element} el - kartu
     * @returns {string} kunci
     */
    kunci(el) {
      if (el.dataset.post) return 'p:' + el.dataset.post;
      const t = el.querySelector('[data-uid],[data-panen],[data-tanam],[data-menu],[data-hapus]');
      if (t) return 'k:' + (t.dataset.uid || t.dataset.panen || t.dataset.tanam || t.dataset.menu || t.dataset.hapus);
      return 't:' + el.textContent.replace(/\s+/g, ' ').trim().slice(0, 120);
    },

    /**
     * Memberi animasi pop-in (scale-up + fade) dengan jeda bergelombang.
     * @param {Element} el - kartu
     * @param {number} n - urutan dalam gelombang (jeda 45 ms per kartu, maks. 14 langkah)
     */
    pop(el, n) {
      el.style.setProperty('--gk-d', Math.min(n, 14) * 45 + 'ms');
      el.classList.add('gk-pop');
    },

    /**
     * Menentukan nasib tiap kartu setelah wadah digambar ulang:
     *  - render pertama            → reveal saat scroll (IntersectionObserver)
     *  - akibat pencarian/filter   → semua kartu cascade pop-in
     *  - kartu baru                → pop-in
     *  - kartu hasil panen         → langsung tampil + kilau perayaan (gk-panen)
     *  - kartu yang sama persis    → langsung tampil (tanpa kedip)
     * @param {Element} wadah - wadah kartu
     */
    tangani(wadah) {
      const lama = wadah._ada || new Map(), baru = new Map();
      const cascade = performance.now() < this.sampaiCascade;
      const spot = wadah.matches('#grid-statistik, div#statistik, div#ringkasan');
      let n = 0;
      Array.prototype.forEach.call(wadah.children, (el) => {
        const k = this.kunci(el);
        if (el.dataset.gk) { baru.set(k, lama.get(k) || 'tampil'); return; } // elemen lama yang tidak dibuat ulang
        el.dataset.gk = '1';
        if (spot) el.classList.add('gk-spot');
        const sebelum = lama.get(k);
        if (wadah._panen === k) { // kartu hasil panen digambar ulang: tampil langsung + kilau perayaan (tanpa pop-in/kedip)
          wadah._panen = null; this.kilau(el); baru.set(k, 'tampil'); wadah._pernah = true; return;
        }
        if (cascade || (sebelum === undefined && wadah._pernah)) { this.pop(el, n++); baru.set(k, 'tampil'); wadah._pernah = true; }
        else if (sebelum === 'tampil') baru.set(k, 'tampil');
        else { this.awal(el, { wadah: wadah, kunci: k }); baru.set(k, 'tunggu'); }
      });
      wadah._ada = baru;
    },

    /** Memantau semua wadah kartu dinamis dan menandai interaksi pencarian/filter. */
    pantauWadah() {
      const obs = new MutationObserver((daftar) => new Set(daftar.map((m) => m.target)).forEach((w) => this.tangani(w)));
      document.querySelectorAll(AU_WADAH).forEach((w) => {
        w._ada = new Map(); w._pernah = false;
        obs.observe(w, { childList: true });
        if (w.children.length) this.tangani(w);
      });
      // Pencarian/filter: beri jendela 600 ms agar render berikutnya dianimasikan penuh (cascade)
      const tanda = (e) => { if (e.target.closest && e.target.closest(AU_FILTER)) this.sampaiCascade = performance.now() + 600; };
      ['input', 'change', 'click'].forEach((t) => document.addEventListener(t, tanda, true));
    },

    /* ---------- 3) MICRO-INTERACTION ---------- */

    /**
     * Memicu animasi denyut pada tombol Dukung setelah halaman memperbarui tombolnya.
     * @param {Element} tombol - tombol yang diklik
     */
    detak(tombol) {
      const art = tombol.closest('[data-post]');
      if (!art) return;
      const id = art.dataset.post;
      requestAnimationFrame(() => {
        const b = document.querySelector('[data-post="' + CSS.escape(id) + '"] [data-slot="like"] button');
        if (!b) return;
        b.classList.remove('gk-detak');
        void b.offsetWidth; // paksa reflow agar animasi bisa diulang
        b.classList.add('gk-detak');
      });
    },

    /**
     * Mencari ulang tombol aksi bila kartu sempat digambar ulang saat animasi berlangsung.
     * @param {Element} b - tombol asal
     * @returns {?Element}
     */
    cariUlang(b) {
      if (b.dataset.uid && b.dataset.aksi) return document.querySelector('[data-aksi="' + CSS.escape(b.dataset.aksi) + '"][data-uid="' + CSS.escape(b.dataset.uid) + '"]');
      return null;
    },

    /**
     * Menahan klik asli ("Sudah diolah", "Terbuang"), meluncurkan
     * kartu keluar, lalu mengulang klik asli sehingga logika halaman berjalan utuh.
     * @param {MouseEvent} e - event klik (fase capture)
     * @param {Element} b - tombol aksi
     */
    geserKeluar(e, b) {
      if (b._lolos) return; // klik ulang buatan kita: biarkan lewat ke handler halaman
      const kartu = b.closest('article');
      if (!kartu) return;
      e.stopImmediatePropagation();
      e.preventDefault();
      if (kartu.classList.contains('gk-keluar')) return; // klik ganda diabaikan
      kartu.style.setProperty('--gk-h', kartu.offsetHeight + 'px');
      kartu.classList.add('gk-keluar');
      setTimeout(() => {
        const tujuan = b.isConnected ? b : this.cariUlang(b);
        if (!tujuan) { kartu.classList.remove('gk-keluar'); return; }
        tujuan._lolos = true; tujuan.click(); tujuan._lolos = false;
      }, 430);
    },

    /**
     * Micro-interaction perayaan panen. Klik "Tandai dipanen" TIDAK ditahan (kartu tidak
     * keluar dari daftar); kartu hanya berkilau. Karena halaman menggambar ulang daftar,
     * identitas kartu dicatat di wadah dan kilau dipasang ke kartu BARU di tangani().
     * @param {Element} b - tombol [data-panen]
     */
    rayakanPanen(b) {
      const kartu = b.closest('article');
      if (!kartu) return;
      const wadah = kartu.parentElement, k = this.kunci(kartu);
      if (wadah) {
        wadah._panen = k;
        setTimeout(() => { if (wadah._panen === k) wadah._panen = null; }, 1500); // bersihkan bila tidak digambar ulang
      }
      this.kilau(kartu); // bila kartu yang sama tetap dipakai, efek langsung terlihat
    },

    /**
     * Memutar animasi kilau panen pada sebuah kartu (dapat diulang).
     * @param {Element} el - kartu
     */
    kilau(el) {
      el.classList.remove('gk-panen');
      void el.offsetWidth; // paksa reflow agar animasi bisa diulang
      el.classList.add('gk-panen');
      setTimeout(() => el.classList.remove('gk-panen'), 1300);
    },

    /* ---------- 4) AKORDEON SLIDE-DOWN ---------- */

    /**
     * Menganimasikan tinggi sebuah elemen (Web Animations API) lalu memanggil `selesai`.
     * @param {Element} el - elemen
     * @param {number} dari - tinggi awal (px)
     * @param {number} ke - tinggi akhir (px)
     * @param {?function} selesai - dipanggil saat animasi selesai
     * @param {boolean} buka - true = slide-down + fade-in, false = slide-up + fade-out
     */
    animasiTinggi(el, dari, ke, selesai, buka) {
      el.style.overflow = 'hidden';
      const a = el.animate(
        [{ height: dari + 'px', opacity: buka ? 0 : 1, transform: buka ? 'translateY(-8px)' : 'none' },
         { height: ke + 'px', opacity: buka ? 1 : 0, transform: buka ? 'none' : 'translateY(-8px)' }],
        { duration: buka ? 340 : 280, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
      a.onfinish = () => { if (selesai) selesai(); a.cancel(); el.style.overflow = ''; };
    },

    /**
     * Panel komentar forum: dibuka dengan slide-down setelah handler asli menampilkannya,
     * ditutup dengan slide-up sebelum handler asli menyembunyikannya.
     * @param {MouseEvent} e - event klik (fase capture)
     * @param {Element} b - tombol komentar
     */
    akordeonPanel(e, b) {
      if (b._lolos || !Element.prototype.animate) return;
      const art = b.closest('[data-post]'), panel = art && art.querySelector('[data-panel]');
      if (!panel) return;
      if (panel.classList.contains('hidden')) { requestAnimationFrame(() => this.animasiTinggi(panel, 0, panel.scrollHeight, null, true)); return; }
      e.stopImmediatePropagation();
      e.preventDefault();
      if (panel._tutup) return;
      panel._tutup = true;
      this.animasiTinggi(panel, panel.getBoundingClientRect().height, 0, () => {
        panel._tutup = false;
        const tb = b.isConnected ? b : document.querySelector('[data-post="' + CSS.escape(art.dataset.post) + '"] [data-aksi="toggle"]');
        if (tb) { tb._lolos = true; tb.click(); tb._lolos = false; }
      }, false);
    },

    /**
     * Elemen <details> (cara membuat resep): buka/tutup dengan slide mulus.
     * @param {MouseEvent} e - event klik pada <summary> (fase capture)
     * @param {Element} s - elemen <summary>
     */
    akordeonDetails(e, s) {
      const d = s.closest('details');
      if (!d || !Element.prototype.animate) return;
      e.preventDefault(); // kita yang mengatur buka/tutup
      if (d._sibuk) return;
      d._sibuk = true;
      const awal = d.getBoundingClientRect().height, isi = Array.prototype.filter.call(d.children, (c) => c !== s);
      const opsi = { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' };
      d.style.overflow = 'hidden';
      if (!d.open) {
        d.open = true;
        const akhir = d.getBoundingClientRect().height;
        isi.forEach((c) => c.animate([{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }], Object.assign({ fill: 'backwards' }, opsi)));
        const a = d.animate([{ height: awal + 'px' }, { height: akhir + 'px' }], opsi);
        a.onfinish = a.oncancel = () => { d.style.overflow = ''; d._sibuk = false; };
      } else {
        const akhir = s.getBoundingClientRect().height;
        const fade = isi.map((c) => c.animate([{ opacity: 1 }, { opacity: 0 }], Object.assign({ fill: 'forwards' }, opsi)));
        const a = d.animate([{ height: awal + 'px' }, { height: akhir + 'px' }], Object.assign({ fill: 'forwards' }, opsi));
        a.onfinish = () => { d.open = false; a.cancel(); fade.forEach((f) => f.cancel()); d.style.overflow = ''; d._sibuk = false; };
      }
    },

    /** Satu pendengar klik (fase capture) yang membagi tugas ke micro-interaction di atas. */
    pasangKlik() {
      document.addEventListener('click', (e) => {
        const t = e.target;
        if (!t.closest) return;
        const like = t.closest('[data-aksi="like"]');
        if (like) { this.detak(like); return; }
        const panen = t.closest('[data-panen]');
        if (panen) { this.rayakanPanen(panen); return; } // klik asli tetap berjalan (tidak ditahan)
        const keluar = t.closest(AU_KELUAR);
        if (keluar) { this.geserKeluar(e, keluar); return; }
        const toggle = t.closest('[data-aksi="toggle"]');
        if (toggle) { this.akordeonPanel(e, toggle); return; }
        const ringkas = t.closest('main details > summary');
        if (ringkas) this.akordeonDetails(e, ringkas);
      }, true);
    },

    /* ---------- 5) SPOTLIGHT KURSOR ---------- */

    /** Menandai kartu spotlight yang sudah ada dan melacak posisi kursor di atasnya. */
    pasangSpotlight() {
      document.querySelectorAll(AU_SPOT).forEach((el) => el.classList.add('gk-spot'));
      document.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch' || this._raf) return;
        const t = e.target.closest && e.target.closest('.gk-spot');
        if (!t) return;
        this._raf = requestAnimationFrame(() => {
          this._raf = 0;
          const r = t.getBoundingClientRect();
          t.style.setProperty('--sx', e.clientX - r.left + 'px');
          t.style.setProperty('--sy', e.clientY - r.top + 'px');
        });
      }, { passive: true });
    },

    /* ---------- 6) TOAST PEGAS & NAVBAR ---------- */

    /**
     * Memantau elemen toast (#toast milik halaman dan #toast-nusa milik app.js):
     * setiap kali tampil atau berganti pesan, animasi pegas diputar ulang.
     */
    pantauToast() {
      const pasang = (el) => {
        if (!el || el._gkToast) return;
        el._gkToast = true;
        const obs = new MutationObserver(() => {
          if (getComputedStyle(el).display === 'none') return;
          el.classList.remove('gk-toast');
          void el.offsetWidth;
          el.classList.add('gk-toast');
          obs.takeRecords(); // abaikan perubahan kelas yang kita buat sendiri
        });
        obs.observe(el, { attributes: true, attributeFilter: ['class', 'style'], childList: true, characterData: true, subtree: true });
      };
      pasang(document.getElementById('toast'));
      pasang(document.getElementById('toast-nusa'));
      // #toast-nusa dibuat belakangan oleh app.js saat toast pertama dipanggil
      new MutationObserver(() => pasang(document.getElementById('toast-nusa'))).observe(document.body, { childList: true });
    },

    /** Navbar: bayangan lembut + latar transparan ber-blur hanya setelah halaman di-scroll. */
    pasangNavbar() {
      const h = document.querySelector('header');
      if (!h) return;
      h.classList.add('gk-nav');
      let menunggu = false;
      const ubah = () => h.classList.toggle('gk-gulir', window.scrollY > 8);
      window.addEventListener('scroll', () => {
        if (menunggu) return;
        menunggu = true;
        requestAnimationFrame(() => { menunggu = false; ubah(); });
      }, { passive: true });
      ubah();
    },

    /**
     * Titik masuk (dipanggil dari siap(...)). Bila REDUKSI true atau browser tidak
     * mendukung IntersectionObserver, hanya navbar statis yang dipasang.
     */
    init() {
      try {
        this.pasangNavbar();
        if (REDUKSI || !('IntersectionObserver' in window)) return;
        this.pasangReveal();
        this.pantauWadah();
        this.pasangKlik();
        this.pasangSpotlight();
        this.pantauToast();
      } finally {
        document.documentElement.classList.remove('gk-tunda');
      }
    }
  };
  AnimasiUI.siapkan(); // dijalankan segera: pasang CSS + sembunyikan section sementara

  /* =====================================================================
   * TITIK MASUK
   * ===================================================================== */

  /** Menjalankan fungsi setelah DOM siap (langsung bila sudah siap). */
  function siap(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  // Dijalankan segera agar tema gelap langsung terpasang tanpa berkedip
  Gaya.pasang();
  AnimasiHero.pasangGaya();
  AnimasiHero.tahan();
  Kait.pasang();
  Tema.awal();
  try { DataAwal.isi(); } catch (err) { console.warn('[DataAwal] seeding dilewati:', err); } // sebelum Dasbor.init() & NusaAi.init()

  siap(function () {
    AnimasiHero.init();
    AnimasiUI.init();
    Tema.pasangTombol();
    Akun.init();
    AnimasiBar.init();
    Dasbor.init();
    NusaAi.init();
  });

  /** Objek publik untuk debugging / pemakaian dari halaman lain. */
  window.NusaPangan = {
    Tema: Tema, Counter: Counter, Dasbor: Dasbor, Foto: Foto, Akun: Akun, NusaAi: NusaAi, AnimasiHero: AnimasiHero, AnimasiUI: AnimasiUI,
    DataAwal: DataAwal,
    /** Toast terpusat untuk semua halaman: NusaPangan.toast('Pesan'). */
    toast: function (pesan) { Util.toast(pesan); }
  };
})();
