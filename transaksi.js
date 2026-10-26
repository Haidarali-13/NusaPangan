/**
 * ============================================================
 * NusaPangan-Market — transaksi.js
 * ------------------------------------------------------------
 * Gabungan 3 modul bersama (urutan penting, jangan ditukar):
 *   1) DATA & UTILITAS  (dulu market-core.js)
 *        KATEGORI, PRODUK, METODE, Simpan (LocalStorage), Rp, toast, ikon, dll.
 *   2) TRANSAKSI & AKUN (dulu akun-transaksi.js)
 *        Transaksi (seed, filter, kartu), AksiTrx (invoice, ulasan, menu titik tiga),
 *        AkunSidebar (profil, NusaPay + Top Up, voucher, akordeon).
 *   3) LONCENG NOTIFIKASI (dulu notif.js)
 *        NotifNav: badge, popup 2 tab, "Lihat Semua" & 4 ikon status -> transaksi.html
 *
 * Dipakai oleh transaksi.html dan market.html.
 * Urutan muat:  app.js (di <head>) -> transaksi.js -> (app2.js, khusus market.html)
 * ============================================================
 */
'use strict';

/* =====================================================================
 * 1) DATA & UTILITAS BERSAMA (dulu market-core.js)
 * ===================================================================== */

/* =====================================================================
 * DATA
 * ===================================================================== */

/** Label kategori (kunci dipakai oleh PRODUK.kat). Urutan = urutan chip filter. */
const KATEGORI = {
  sayur: 'Sayur Segar & Hidroponik',
  buah: 'Buah Lokal',
  protein: 'Protein & Lauk Sehat',
  karbo: 'Beras & Karbohidrat',
  benih: 'Biji-bijian & Benih Unggul',
  'alat-tani': 'Alat Tani & Berkebun',
  'alat-hidro': 'Alat Hidroponik',
  'bahan-hidro': 'Bahan & Nutrisi Hidroponik',
  paket: 'Paket Hemat Pangan & Kebun'
};

/** Keterangan masa panen per kategori (dipakai pada panel traceability). */
const INFO_PANEN = {
  sayur: 'Dipanen pagi hari dan dikirim dalam 24 jam',
  buah: 'Dipetik matang pohon dan dikirim dalam 1 sampai 2 hari',
  protein: 'Diproduksi harian dan dikirim segar dalam 24 jam',
  karbo: 'Dikemas dari stok panen terbaru',
  benih: 'Dikemas dari hasil seleksi penangkar terbaru dan sudah diuji daya tumbuhnya',
  'alat-tani': 'Barang tahan lama yang diperiksa dan dikemas dari stok perajin mitra',
  'alat-hidro': 'Perlengkapan diuji dan dikemas dari stok mitra hidroponik',
  'bahan-hidro': 'Dikemas tersegel dari stok produksi terbaru',
  paket: 'Dikemas koperasi dari stok panen dan perlengkapan terbaru'
};

/** Stok acuan penuh bagi progress bar; di bawah STOK_TIPIS = menipis (oranye), di bawah STOK_KRITIS = kritis (merah). */
const STOK_REF = 50, STOK_TIPIS = 10, STOK_KRITIS = 5;

/** Nilai donasi pangan (Rp) pada keranjang: aksi pay-it-forward untuk Food Rescue. */
const DONASI = 2000;

/** Metode pembayaran simulasi. */
const METODE = {
  qris: { nama: 'QRIS', ikon: 'qr-code', info: 'Scan dengan e-wallet atau m-banking apa pun' },
  transfer: { nama: 'Transfer Bank', ikon: 'landmark', info: 'Transfer ke virtual account sesuai bank pilihan' },
  cod: { nama: 'Bayar di Tempat (COD)', ikon: 'banknote', info: 'Bayar tunai kepada kurir saat pesanan tiba' }
};
const BANK = ['BCA', 'Mandiri', 'BNI', 'BRI', 'BSI'];

/**
 * Katalog produk (data simulasi).
 * @typedef {Object} Produk
 * @property {string} id            - id unik
 * @property {string} nama          - nama produk
 * @property {string} kat           - kunci KATEGORI
 * @property {string} asal          - petani / lokasi
 * @property {string} sat           - satuan jual
 * @property {number} harga         - harga NusaPangan (Rp)
 * @property {number} pasar         - harga pasaran rata-rata (Rp), untuk coretan
 * @property {number} stok          - jumlah tersedia (0 = habis)
 * @property {string} ikon          - emoji ilustrasi (dipakai bila foto tidak ada)
 * @property {string} desk          - deskripsi mendalam (Quick View)
 * @property {string|string[]} tips - tips mengolah; larik = langkah memasak berurutan
 * @property {number} km            - jarak kebun ke hub NusaPangan (km), untuk traceability
 * @property {string} cerita        - komitmen petani / rantai pasok pendek
 * @property {string} [isi]         - isi paket, dipisah ", " (kategori paket & resep)
 * @property {{porsi:number, menit:number}} [resep] - khusus Paket Resep Siap Masak
 * @property {string} [foto]        - jalur gambar opsional, mis. 'img/bayam.jpg'
 * @type {Produk[]}
 */
const PRODUK = [

  { id: 'kangkung', nama: 'Kangkung Hidroponik', kat: 'sayur', asal: 'Kebun Warga RW 05, Depok', sat: 'ikat', harga: 3000, pasar: 5000, stok: 40, ikon: '🥬',
    foto: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80',
    desk: 'Kangkung hidroponik tumbuh di air bernutrisi tanpa tanah, sehingga batangnya renyah, bersih, dan minim pestisida.',
    tips: 'Tumis dengan api besar 2 sampai 3 menit agar tetap renyah. Simpan di kulkas dengan akar terbungkus tisu lembap.',
    km: 12, cerita: 'Dikelola ibu-ibu PKK yang menampung air hujan untuk menyiram kebun.' },
  { id: 'bayam', nama: 'Bayam Hijau', kat: 'sayur', asal: 'Poktan Sumber Rejeki, Magelang', sat: 'ikat', harga: 3000, pasar: 5000, stok: 35, ikon: '🌿',
    foto: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    desk: 'Bayam hijau muda yang kaya zat besi, folat, dan vitamin A. Daunnya lembut sehingga cepat matang.',
    tips: 'Rebus cukup 1 menit untuk sayur bening agar warna dan gizinya terjaga. Jangan dimasak ulang.',
    km: 35, cerita: 'Kelompok tani menanam bergilir untuk menjaga kesuburan tanah.' },
  { id: 'selada', nama: 'Selada Hidroponik', kat: 'sayur', asal: 'Kebun Atap Warga, Jakarta Timur', sat: '250 g', harga: 8000, pasar: 12000, stok: 18, ikon: '🥗',
    foto: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&w=600&q=80',
    desk: 'Selada keriting hidroponik yang renyah dan siap santap, ditanam di atap gedung warga.',
    tips: 'Rendam air dingin 10 menit agar makin renyah. Padukan dengan telur rebus, tomat, dan perasan jeruk.',
    km: 14, cerita: 'Air nutrisi di kebun atap didaur ulang sehingga hemat air.' },
  { id: 'tomat', nama: 'Tomat Merah', kat: 'sayur', asal: 'Kelompok Tani Lembang, Bandung Barat', sat: 'kg', harga: 14000, pasar: 22000, stok: 8, ikon: '🍅',
    foto: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
    desk: 'Tomat merah matang di pohon dengan rasa asam manis seimbang dan kandungan likopen yang tinggi.',
    tips: 'Simpan di suhu ruang sampai matang penuh. Tumis bersama bawang untuk sambal tanpa pengawet.',
    km: 120, cerita: 'Petani Lembang menjual langsung ke hub sehingga tidak melewati tengkulak.' },
  { id: 'wortel', nama: 'Wortel Berastagi', kat: 'sayur', asal: 'Tani Mandiri, Karo', sat: 'kg', harga: 12000, pasar: 18000, stok: 25, ikon: '🥕',
    foto: 'https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=600&q=80',
    desk: 'Wortel Berastagi yang manis dan padat, sumber beta-karoten untuk kesehatan mata dan daya tahan tubuh.',
    tips: 'Kukus 8 sampai 10 menit dan tambahkan sedikit minyak agar beta-karoten lebih mudah diserap.',
    km: 70, cerita: 'Dipanen manual oleh petani keluarga di lereng Karo tanpa perantara berantai.' },

  { id: 'pisang', nama: 'Pisang Kepok', kat: 'buah', asal: 'Kebun Pak Slamet, Lumajang', sat: 'sisir', harga: 12000, pasar: 18000, stok: 22, ikon: '🍌',
    foto: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80',
    desk: 'Pisang kepok tua matang pohon. Cocok digoreng, direbus, atau dikukus sebagai camilan mengenyangkan.',
    tips: 'Kukus lalu taburi parutan kelapa. Simpan terpisah dari buah lain agar tidak cepat matang.',
    km: 45, cerita: 'Kebun keluarga yang menjual langsung, tanpa gudang perantara.' },
  { id: 'jeruk', nama: 'Jeruk Siam', kat: 'buah', asal: 'Poktan Tirta Buah, Pontianak', sat: 'kg', harga: 14000, pasar: 22000, stok: 30, ikon: '🍊',
    foto: 'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=600&q=80',
    desk: 'Jeruk siam manis segar yang kaya vitamin C untuk menjaga daya tahan tubuh keluarga.',
    tips: 'Peras segar tanpa gula tambahan. Kulitnya bisa diparut sebagai pengharum kue.',
    km: 60, cerita: 'Poktan mengutamakan pupuk organik dari limbah ternak warga.' },
  { id: 'semangka', nama: 'Semangka Merah', kat: 'buah', asal: 'Tani Pesisir, Kediri', sat: 'kg', harga: 6000, pasar: 9000, stok: 9, ikon: '🍉',
    foto: 'https://images.unsplash.com/photo-1563114773-84221bd62daa?auto=format&fit=crop&w=600&q=80',
    desk: 'Semangka merah berkadar air tinggi, menyegarkan, dan rendah kalori.',
    tips: 'Dinginkan 2 jam sebelum disajikan. Kulit putihnya bisa ditumis atau dijadikan acar.',
    km: 55, cerita: 'Dipanen saat matang optimal dan diangkut pagi hari agar tidak layu.' },
  { id: 'mangga', nama: 'Mangga Harum Manis', kat: 'buah', asal: 'Kebun Mangga Probolinggo', sat: 'kg', harga: 18000, pasar: 28000, stok: 0, ikon: '🥭',
    foto: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80',
    desk: 'Mangga harum manis berdaging tebal dan legit. Sedang menunggu panen berikutnya.',
    tips: 'Pilih mangga yang kulitnya mulai kekuningan dan beraroma wangi. Simpan di suhu ruang.',
    km: 40, cerita: 'Petani memanen bertahap agar buah selalu dipetik pada tingkat kematangan terbaik.' },

  { id: 'telur', nama: 'Telur Ayam Ras', kat: 'protein', asal: 'Peternak Mitra, Blitar', sat: '10 butir', harga: 21000, pasar: 26000, stok: 50, ikon: '🥚',
    foto: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80',
    desk: 'Telur ayam ras dari peternakan mitra dengan pakan terkontrol. Sumber protein lengkap dengan harga bersahabat.',
    tips: 'Rebus 9 sampai 10 menit untuk kuning matang sempurna. Simpan di bagian tengah kulkas, bukan di pintu.',
    km: 25, cerita: 'Peternak mitra mengantar telur dua kali seminggu langsung ke hub.' },
  { id: 'tempe', nama: 'Tempe Segar', kat: 'protein', asal: 'Kampung Tempe Sanan, Malang', sat: 'papan', harga: 5000, pasar: 7000, stok: 30, ikon: '🫘',
    foto: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
    desk: 'Tempe hasil fermentasi kedelai segar yang tinggi protein nabati dan serat.',
    tips: 'Kukus 5 menit sebelum digoreng agar tidak menyerap banyak minyak.',
    km: 20, cerita: 'Dibuat perajin kampung tempe secara turun-temurun, difermentasi alami.' },
  { id: 'tahu', nama: 'Tahu Putih', kat: 'protein', asal: 'Sentra Tahu Sumedang', sat: '10 potong', harga: 8000, pasar: 12000, stok: 28, ikon: '🧊',
    foto: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80',
    desk: 'Tahu putih padat dan lembut, protein nabati rendah lemak untuk menu harian.',
    tips: 'Rendam air garam 10 menit agar lebih awet dan gurih. Enak ditumis, dipepes, atau dimasukkan ke sup.',
    km: 30, cerita: 'Perajin tahu memakai kedelai lokal dan mengolah ampasnya menjadi pakan ternak.' },

  { id: 'beras', nama: 'Beras Medium Lokal', kat: 'karbo', asal: 'Gapoktan Karawang', sat: '5 kg', harga: 58000, pasar: 68000, stok: 60, ikon: '🍚',
    foto: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
    desk: 'Beras medium pulen untuk makan harian keluarga, dibeli langsung dari gabungan kelompok tani.',
    tips: 'Cuci cukup 2 kali agar vitamin tidak banyak hilang. Campur sedikit beras merah untuk menambah serat.',
    km: 35, cerita: 'Gapoktan menggiling dan mengemas sendiri sehingga petani menikmati nilai tambah.' },
  { id: 'jagung', nama: 'Jagung Manis', kat: 'karbo', asal: 'Poktan Subur, Bantul', sat: '3 tongkol', harga: 9000, pasar: 15000, stok: 24, ikon: '🌽',
    foto: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80',
    desk: 'Jagung manis kuning yang manis alami dan tinggi serat.',
    tips: 'Rebus bersama kelobotnya agar manis terjaga. Pipil untuk sup atau perkedel.',
    km: 22, cerita: 'Poktan menanam jagung secara bergilir dengan kacang tanah untuk menyuburkan tanah.' },
  { id: 'kentang', nama: 'Kentang Dieng', kat: 'karbo', asal: 'Tani Dieng, Wonosobo', sat: 'kg', harga: 16000, pasar: 24000, stok: 15, ikon: '🥔',
    foto: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80',
    desk: 'Kentang Dieng bertekstur padat, cocok untuk sop, balado, dan perkedel.',
    tips: 'Jangan simpan di kulkas. Simpan di tempat gelap dan sejuk agar tidak bertunas.',
    km: 18, cerita: 'Dipanen petani dataran tinggi yang menerapkan terasering untuk mencegah longsor.' },

  /* ---------- Biji-bijian & Benih Unggul ---------- */
  { id: 'benih-kangkung', nama: 'Benih Kangkung Unggul', kat: 'benih', asal: 'Penangkar Benih Tani Subur, Bogor', sat: 'sachet 10 g', harga: 8000, pasar: 12000, stok: 45, ikon: '🌱',
    foto: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=600&q=80',
    desk: 'Benih kangkung unggul berdaya tumbuh tinggi, cocok untuk polybag, talang air, maupun hidroponik. Siap panen sekitar 25 sampai 30 hari setelah tanam.',
    tips: ['Rendam benih 3 jam dalam air hangat kuku agar cepat berkecambah.', 'Tebar rapat di media tanam lembap, tutup tipis, dan siram pagi serta sore.', 'Panen dengan memotong 3 cm di atas pangkal agar tunas baru tumbuh kembali.'],
    km: 28, cerita: 'Penangkar di Bogor menyeleksi benih dari tanaman terbaik setiap musim dan menguji daya tumbuhnya sebelum dikemas.' },
  { id: 'benih-cabai', nama: 'Benih Cabai Rawit Tahan Cuaca', kat: 'benih', asal: 'Penangkar Tani Makmur, Magelang', sat: 'sachet 5 g', harga: 12000, pasar: 18000, stok: 30, ikon: '🌶️',
    foto: 'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?auto=format&fit=crop&w=600&q=80',
    desk: 'Cabai rawit tahan hujan dan panas yang cocok ditanam di pot maupun polybag di pekarangan. Berbuah lebat dan bisa dipanen berkali-kali.',
    tips: ['Semai dulu di tray selama 3 sampai 4 minggu hingga punya 4 helai daun.', 'Pindahkan ke polybag berisi campuran tanah dan kompos, taruh di tempat yang kena matahari 6 jam sehari.', 'Siram secukupnya dan beri pupuk kompos tiap 2 minggu agar buah lebat.'],
    km: 40, cerita: 'Dikembangkan petani Magelang yang menanam cabai di lereng gunung dengan cuaca yang berubah-ubah, lalu menyimpan benih dari tanaman paling kuat.' },
  { id: 'benih-pakcoy-selada', nama: 'Benih Pakcoy & Selada Hidroponik', kat: 'benih', asal: 'Kebun Atap Warga, Jakarta Timur', sat: 'set 2 sachet', harga: 10000, pasar: 15000, stok: 36, ikon: '🥬',
    foto: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&w=600&q=80',
    isi: 'Benih pakcoy 1 sachet, Benih selada keriting 1 sachet',
    desk: 'Dua benih sayur daun favorit hidroponik dalam satu set. Cepat tumbuh dan cocok untuk sistem wick, NFT, maupun DFT.',
    tips: ['Semai di rockwool yang sudah dibasahi, 1 sampai 2 benih per lubang.', 'Simpan di tempat teduh 3 sampai 5 hari hingga berkecambah, lalu pindah ke tempat terang.', 'Pindahkan ke netpot setelah punya 2 sampai 3 daun dan mulai beri nutrisi AB Mix.'],
    km: 14, cerita: 'Kebun atap warga menguji sendiri setiap benih sebelum dijual, sehingga hanya varietas yang tumbuh seragam yang dikemas.' },
  { id: 'benih-kacang', nama: 'Biji Kacang Hijau & Kedelai Lokal', kat: 'benih', asal: 'Gapoktan Pangan Lestari, Grobogan', sat: '500 g', harga: 15000, pasar: 22000, stok: 22, ikon: '🫘',
    foto: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=600&q=80',
    isi: 'Kacang hijau 250 g, Kedelai lokal 250 g',
    desk: 'Biji kacang hijau dan kedelai lokal yang bisa ditanam di lahan sempit, dijadikan tauge, atau dimasak sebagai sumber protein nabati.',
    tips: 'Untuk tauge, rendam 8 jam, tiriskan di wadah berlubang, lalu siram 2 kali sehari dan simpan di tempat gelap selama 3 sampai 4 hari. Untuk tanam, taruh 2 biji per lubang sedalam 2 cm.',
    km: 60, cerita: 'Gapoktan Grobogan menanam kacang-kacangan secara bergilir dengan padi untuk menjaga kesuburan tanah.' },

  /* ---------- Alat Tani & Berkebun ---------- */
  { id: 'alat-sekop', nama: 'Sekop Taman Baja Anti-Karat', kat: 'alat-tani', asal: 'Pandai Besi Tani Jaya, Klaten', sat: 'buah', harga: 22000, pasar: 32000, stok: 18, ikon: '⛏️',
    foto: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=600&q=80',
    desk: 'Sekop taman berbahan baja berlapis anti-karat dengan gagang yang nyaman digenggam. Cocok untuk menggali, memindahkan bibit, dan mengisi media tanam.',
    tips: 'Bersihkan dari tanah sehabis dipakai, keringkan, lalu oles sedikit minyak agar tetap awet. Simpan di tempat kering.',
    km: 85, cerita: 'Dibuat pandai besi Klaten yang menempa baja bekas per bilah secara manual dan menjaminnya tidak mudah bengkok.' },
  { id: 'alat-gunting', nama: 'Gunting Pangkas Dahan & Panen', kat: 'alat-tani', asal: 'Perajin Alat Tani Batu, Malang', sat: 'buah', harga: 35000, pasar: 52000, stok: 9, ikon: '✂️',
    foto: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=600&q=80',
    desk: 'Gunting pangkas bermata tajam dengan pegas dan pengunci pengaman. Mudah memotong dahan kecil, tangkai buah, dan sayur panen tanpa merusak batang.',
    tips: 'Potong miring di atas ruas daun agar air tidak menggenang. Lap mata gunting dengan alkohol saat berpindah tanaman agar penyakit tidak menular.',
    km: 95, cerita: 'Perajin Batu mengasah mata gunting satu per satu dan memberi garansi tajam untuk pemakaian rumahan.' },
  { id: 'alat-polybag', nama: 'Polybag Tebal Set 25 Lembar', kat: 'alat-tani', asal: 'UMKM Plastik Daur Ulang, Bekasi', sat: 'set 25 lembar', harga: 15000, pasar: 22000, stok: 40, ikon: '🪴',
    foto: 'https://images.unsplash.com/photo-1592419044706-39796d40f98c?auto=format&fit=crop&w=600&q=80',
    desk: 'Polybag hitam tebal berukuran 35 x 35 cm dengan lubang drainase. Kuat dipakai berulang untuk cabai, tomat, terong, dan sayur lain di pekarangan.',
    tips: 'Isi dengan campuran tanah, kompos, dan sekam dengan perbandingan 1:1:1. Sisakan ruang 3 cm dari bibir polybag agar air siraman tidak tumpah.',
    km: 30, cerita: 'UMKM Bekasi mengolah limbah plastik industri menjadi polybag tebal yang bisa dipakai berkali-kali.' },
  { id: 'alat-gembor', nama: 'Gembor / Alat Siram Tanaman 5L', kat: 'alat-tani', asal: 'Koperasi Perajin Plastik, Tangerang', sat: 'buah', harga: 28000, pasar: 40000, stok: 14, ikon: '🪣',
    foto: 'https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?auto=format&fit=crop&w=600&q=80',
    desk: 'Gembor 5 liter dengan kepala siram halus yang bisa dilepas. Air mengalir lembut sehingga tidak merusak bibit dan tanah tidak tergerus.',
    tips: 'Siram pagi atau sore, arahkan ke pangkal tanaman, bukan ke daun. Lepas kepala siram untuk menuang nutrisi atau air kompos.',
    km: 35, cerita: 'Dikerjakan koperasi perajin Tangerang yang membagi hasil penjualan kepada anggota secara merata.' },

  /* ---------- Alat Hidroponik ---------- */
  { id: 'hidro-wick', nama: 'Starter Kit Hidroponik Sistem Wick 9 Lubang', kat: 'alat-hidro', asal: 'Kebun Atap Warga, Jakarta Timur', sat: 'kit', harga: 65000, pasar: 95000, stok: 11, ikon: '🪴',
    foto: 'https://images.unsplash.com/photo-1558449028-b53a39d100fc?auto=format&fit=crop&w=600&q=80',
    isi: 'Bak kontainer 9 lubang, Netpot 9 pcs, Sumbu kain flanel 9 lembar, Panduan tanam',
    desk: 'Kit hidroponik paling sederhana untuk pemula: tanpa listrik dan tanpa pompa. Nutrisi naik ke akar lewat sumbu kain flanel, cukup untuk sayur daun di teras.',
    tips: ['Isi bak dengan air nutrisi sampai menyentuh dasar netpot.', 'Pasang bibit di netpot yang berisi rockwool dan sumbu flanel yang menjulur ke air.', 'Cek volume air tiap 3 hari dan ganti larutan nutrisi setiap 2 minggu.'],
    km: 14, cerita: 'Dirakit relawan kebun atap yang mengajarkan hidroponik gratis kepada warga sekitar.' },
  { id: 'hidro-tds', nama: 'TDS & EC Meter Digital Pengukur Nutrisi', kat: 'alat-hidro', asal: 'Mitra Teknologi Tani, Bandung', sat: 'unit', harga: 45000, pasar: 70000, stok: 8, ikon: '📟',
    foto: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=600&q=80',
    desk: 'Alat ukur digital untuk mengetahui kepekatan larutan nutrisi dalam ppm. Membantu Anda memberi nutrisi tepat agar sayur tidak kekurangan maupun kelebihan.',
    tips: 'Kalibrasi dengan larutan standar tiap bulan. Bilas ujung sensor dengan air bersih setelah dipakai. Untuk sayur daun, sasaran umumnya 800 sampai 1.200 ppm.',
    km: 130, cerita: 'Mitra teknologi tani di Bandung merakit dan menguji alat ini agar akurat untuk kebun rumahan.' },
  { id: 'hidro-netpot', nama: 'Netpot Hidroponik Kuat Isi 50 pcs + Kain Flanel', kat: 'alat-hidro', asal: 'UMKM Hidroponik Depok', sat: 'set', harga: 18000, pasar: 27000, stok: 33, ikon: '🧺',
    foto: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&w=600&q=80',
    isi: 'Netpot 50 pcs, Kain flanel 1 lembar',
    desk: 'Netpot berbahan plastik tebal yang kuat menahan rockwool dan akar yang berkembang. Dilengkapi kain flanel untuk sumbu pada sistem wick.',
    tips: 'Gunting flanel menjadi pita 1 x 10 cm, selipkan di dasar netpot sebelum diisi rockwool. Cuci dan keringkan netpot setelah panen agar bisa dipakai lagi.',
    km: 12, cerita: 'UMKM Depok mengemas netpot dalam jumlah besar agar harga per butir tetap ramah untuk pemula.' },
  { id: 'hidro-dft', nama: 'Modul Pipa DFT Balkon Mini', kat: 'alat-hidro', asal: 'Bengkel Hidroponik Warga, Bogor', sat: 'modul', harga: 145000, pasar: 210000, stok: 6, ikon: '🚰',
    foto: 'https://images.unsplash.com/photo-1558449028-b53a39d100fc?auto=format&fit=crop&w=600&q=80',
    isi: 'Pipa PVC 3 jalur 30 lubang, Rangka besi ringan, Pompa air mini, Bak nutrisi 20 L, Netpot 30 pcs',
    desk: 'Modul pipa sistem DFT (Deep Flow Technique) untuk balkon sempit. Air nutrisi dialirkan terus menerus sehingga sayur tumbuh lebih cepat dan seragam.',
    tips: ['Susun rangka di tempat datar yang terkena matahari minimal 5 jam.', 'Isi bak dengan 20 liter air nutrisi, pasang pompa, dan cek tidak ada kebocoran sambungan pipa.', 'Alirkan air 15 menit nyala dan 15 menit mati agar akar mendapat oksigen.'],
    km: 25, cerita: 'Dirakit bengkel warga Bogor yang memakai pipa dan rangka sisa produksi sehingga limbah berkurang.' },

  /* ---------- Bahan & Nutrisi Hidroponik ---------- */
  { id: 'bahan-abmix', nama: 'Nutrisi Hidroponik AB Mix Sayur Daun 500ml', kat: 'bahan-hidro', asal: 'Racikan Nutrisi Tani Makmur, Lembang', sat: 'set A+B 500 ml', harga: 24000, pasar: 35000, stok: 28, ikon: '🧪',
    foto: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80',
    isi: 'Nutrisi A 500 ml, Nutrisi B 500 ml',
    desk: 'Nutrisi AB Mix yang diracik khusus untuk sayur daun seperti kangkung, pakcoy, dan selada. Satu set bisa menghasilkan puluhan liter larutan nutrisi.',
    tips: ['Siapkan dua wadah terpisah, jangan campur A dan B dalam bentuk pekat.', 'Ambil 5 ml A dan 5 ml B untuk tiap 1 liter air, aduk rata di dalam bak.', 'Ukur dengan TDS meter dan sesuaikan hingga 800 sampai 1.200 ppm.'],
    km: 95, cerita: 'Diracik petani Lembang yang bertahun-tahun menanam sayur daun hidroponik dan menakar nutrisi sesuai pengalaman mereka.' },
  { id: 'bahan-rockwool', nama: 'Media Tanam Rockwool Cultilene 1 Slab', kat: 'bahan-hidro', asal: 'Distributor Hidroponik, Cikarang', sat: 'slab', harga: 26000, pasar: 38000, stok: 20, ikon: '🧱',
    foto: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&w=600&q=80',
    desk: 'Satu slab rockwool bermutu yang bisa dipotong kotak-kotak kecil untuk semai. Menahan air dan udara dengan seimbang sehingga akar cepat tumbuh.',
    tips: 'Rendam dalam air ber-pH 5,5 sampai 6 selama 1 jam sebelum dipakai agar netral. Potong kubus 2,5 cm dan lubangi bagian atasnya sedalam 1 cm untuk benih.',
    km: 45, cerita: 'Distributor Cikarang menyimpan stok rockwool di gudang kering agar tidak lembap sebelum sampai ke tangan Anda.' },
  { id: 'bahan-hydroton', nama: 'Hydroton Lempung Bakar 1 Kg', kat: 'bahan-hidro', asal: 'Perajin Lempung Bakar, Plered Purwakarta', sat: 'kg', harga: 16000, pasar: 24000, stok: 25, ikon: '🟤',
    foto: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=600&q=80',
    desk: 'Butiran lempung bakar ringan yang berpori. Dipakai sebagai media tanam hidroponik yang bisa dicuci dan dipakai ulang berkali-kali.',
    tips: 'Cuci bersih sampai air bilasan jernih, lalu rendam semalam sebelum dipakai. Setelah panen, rebus 10 menit atau jemur agar steril dan siap dipakai lagi.',
    km: 85, cerita: 'Dibakar perajin gerabah Plered dari lempung lokal sehingga limbah tungku mereka punya nilai baru.' },
  { id: 'bahan-cocopeat', nama: 'Cocopeat & Sekam Bakar Steril 2 Kg', kat: 'bahan-hidro', asal: 'Sentra Sabut Kelapa, Cianjur', sat: '2 kg', harga: 14000, pasar: 21000, stok: 38, ikon: '🥥',
    foto: 'https://images.unsplash.com/photo-1592419044706-39796d40f98c?auto=format&fit=crop&w=600&q=80',
    isi: 'Cocopeat 1 kg, Sekam bakar 1 kg',
    desk: 'Campuran cocopeat dan sekam bakar steril yang gembur, menyimpan air, dan bebas hama. Cocok untuk semai, polybag, maupun hidroponik substrat.',
    tips: 'Basahi cocopeat dengan air bersih sampai mengembang, peras ringan, lalu campur sekam bakar 1:1. Kocok sebelum dimasukkan ke polybag agar gembur.',
    km: 70, cerita: 'Sabut kelapa dan sekam yang biasanya dibuang diolah warga Cianjur menjadi media tanam steril.' },

  /* ---------- Paket Hemat Pangan & Kebun ---------- */
  { id: 'paket-sembako', nama: 'Paket Hemat Keluarga', kat: 'paket', asal: 'Koperasi Warga NusaPangan', sat: 'paket', harga: 99000, pasar: 130000, stok: 12, ikon: '🧺',
    foto: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    isi: 'Beras 5 kg, minyak goreng 1 L, gula 1 kg, telur 10 butir',
    desk: 'Paket kebutuhan pokok keluarga yang dikemas koperasi warga. Lebih murah daripada membeli eceran.',
    tips: 'Simpan beras dan gula dalam wadah tertutup rapat. Bagi telur untuk menu mingguan.',
    km: 20, cerita: 'Koperasi membeli langsung dari gapoktan dan membagi keuntungan kepada anggota.' },
  { id: 'paket-sayur', nama: 'Paket Sayur Sepekan', kat: 'paket', asal: 'Kebun Warga RW 05, Depok', sat: 'paket', harga: 44000, pasar: 69000, stok: 10, ikon: '🥦',
    foto: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    isi: 'Kangkung 2 ikat, bayam 2 ikat, sawi 500 g, tomat 1 kg, wortel 1 kg',
    desk: 'Lima jenis sayur untuk menu sepekan dengan warna dan gizi yang beragam.',
    tips: 'Masak sayur berdaun lebih dulu dalam 1 sampai 2 hari. Wortel dan tomat lebih tahan lama.',
    km: 12, cerita: 'Dikumpulkan dari beberapa kebun warga sehingga hasil panennya bergilir.' },
  { id: 'paket-protein', nama: 'Paket Protein Sehat', kat: 'paket', asal: 'Peternak & Perajin Lokal', sat: 'paket', harga: 69000, pasar: 97000, stok: 7, ikon: '🍳',
    foto: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80',
    isi: 'Telur 10 butir, tempe 2 papan, tahu 10 potong, lele 1 kg, kacang hijau 500 g',
    desk: 'Kombinasi protein hewani dan nabati untuk memenuhi kebutuhan gizi keluarga selama beberapa hari.',
    tips: 'Gunakan lele dan telur lebih dulu. Tempe dan tahu bisa dikukus lalu disimpan di kulkas.',
    km: 25, cerita: 'Perajin dan peternak mitra menyetor langsung ke hub koperasi.' },

  { id: 'paket-kebun-pemula', nama: 'Paket Berkebun Balkon Pemula', kat: 'paket', asal: 'Koperasi Warga NusaPangan', sat: 'paket', harga: 49000, pasar: 72000, stok: 13, ikon: '🪴',
    foto: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=600&q=80',
    isi: 'Polybag 10 pcs, Media Tanam 2 Kg, 3 Benih Sayur, Sekop Mini',
    desk: 'Semua perlengkapan dasar untuk mulai berkebun di balkon atau teras. Cukup tambah air dan sinar matahari, panen pertama dalam hitungan minggu.',
    tips: ['Isi polybag dengan media tanam hingga 3 cm dari bibir.', 'Tanam benih sedalam 1 cm, tutup tipis, dan siram dengan lembut.', 'Taruh di tempat yang terkena sinar matahari 5 sampai 6 jam dan siram pagi serta sore.'],
    km: 20, cerita: 'Koperasi warga merakit paket ini setelah banyak anggota baru bertanya harus mulai dari mana.' },
  { id: 'paket-hidro-komplit', nama: 'Paket Borongan Hidroponik Siap Tanam', kat: 'paket', asal: 'Kebun Atap Warga, Jakarta Timur', sat: 'paket', harga: 95000, pasar: 135000, stok: 8, ikon: '💧',
    foto: 'https://images.unsplash.com/photo-1558449028-b53a39d100fc?auto=format&fit=crop&w=600&q=80',
    isi: 'Bak Modul Wick, Rockwool, Netpot, Nutrisi AB Mix, 2 Benih',
    desk: 'Paket lengkap hidroponik siap tanam: modul wick, media semai, nutrisi, dan benih sayur daun. Tidak perlu belanja satu per satu, langsung bisa tanam di hari pembelian.',
    tips: ['Rendam rockwool, lalu semai benih di dalamnya dan simpan di tempat teduh 3 sampai 5 hari.', 'Racik nutrisi AB Mix sesuai petunjuk dan isi bak modul.', 'Pindahkan bibit ke netpot, pasang di modul, dan cek air tiap 3 hari. Panen sekitar 30 hari.'],
    km: 14, cerita: 'Dirakit relawan kebun atap yang ingin warga kota bisa menanam sayur sendiri tanpa pengalaman.' }
];

/* =====================================================================
 * UTILITAS
 * ===================================================================== */

/** Pintasan getElementById. @param {string} id @returns {HTMLElement|null} */
const $ = (id) => document.getElementById(id);

/** True bila pengguna meminta animasi dikurangi. */
const REDUKSI = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Format rupiah. @param {number} n @returns {string} mis. "Rp 3.000" */
const Rp = (n) => 'Rp ' + Math.round(Number(n) || 0).toLocaleString('id-ID');

/** Mencari produk berdasarkan id. @param {string} id @returns {Produk|undefined} */
const cariProduk = (id) => PRODUK.find((p) => p.id === id);

/** Persentase hemat dibanding harga pasar. @param {Produk} p @returns {number} */
const persenHemat = (p) => Math.round((1 - p.harga / p.pasar) * 100);

/** Pembungkus LocalStorage aman (kunci berawalan "nusapangan:", sama dengan halaman lain). */
const Simpan = {
  awalan: 'nusapangan:',
  /** @param {string} k @param {*} cadangan @returns {*} nilai tersimpan atau cadangan bila kosong/rusak */
  ambil(k, cadangan) { try { const m = localStorage.getItem(this.awalan + k); return m === null ? cadangan : JSON.parse(m); } catch (e) { return cadangan; } },
  /** @param {string} k @param {*} v @returns {boolean} false bila penyimpanan penuh/diblokir */
  simpan(k, v) { try { localStorage.setItem(this.awalan + k, JSON.stringify(v)); return true; } catch (e) { return false; } }
};

/** Mengamankan teks dari penyisipan HTML (aman juga untuk nilai atribut). @param {*} t @returns {string} */
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Toast terpusat milik app.js; cadangan memakai #toast halaman. @param {string} pesan */
function toast(pesan) {
  if (window.NusaPangan && typeof window.NusaPangan.toast === 'function') { window.NusaPangan.toast(pesan); return; }
  const el = $('toast'); el.textContent = pesan; el.classList.remove('hidden');
  clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.add('hidden'), 2500);
}

/** Membuat ulang ikon Lucide bila pustaka tersedia. */
const ikon = () => { if (window.lucide) window.lucide.createIcons(); };

/** Pembangkit angka acak deterministik (mulberry32) dari teks benih. @param {string} seed @returns {function(): number} */
function acak(seed) {
  let a = 0;
  for (let i = 0; i < seed.length; i++) a = (Math.imul(31, a) + seed.charCodeAt(i)) | 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** Menutup <dialog> dengan animasi singkat (langsung bila gerak dikurangi). @param {HTMLDialogElement} d */
function tutupDialog(d) {
  if (!d.open) return;
  if (REDUKSI) { d.close(); return; }
  d.classList.add('menutup');
  setTimeout(() => { d.close(); d.classList.remove('menutup'); }, 180);
}

/** Menggambar kode QR simulasi (SVG) yang tetap sama untuk benih yang sama. @param {string} seed @returns {string} */
function kodeQr(seed) {
  const n = 25, r = acak(seed);
  const pola = (x, y) => { // pola penanda sudut; null = sel data acak
    for (const [ox, oy] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
      const dx = x - ox, dy = y - oy;
      if (dx >= -1 && dx <= 7 && dy >= -1 && dy <= 7) return dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6 && (dx % 6 === 0 || dy % 6 === 0 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4));
    }
    return null;
  };
  let d = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const f = pola(x, y); if (f === null ? r() > 0.5 : f) d += `M${x} ${y}h1v1h-1z`; }
  return `<svg viewBox="-2 -2 ${n + 4} ${n + 4}" class="w-40 h-40" role="img" aria-label="Kode QRIS simulasi" shape-rendering="crispEdges"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/><path d="${d}" fill="#111"/></svg>`;
}

/** Hujan konfeti singkat di dalam wadah (dilewati bila gerak dikurangi). @param {HTMLElement} wadah */
function konfeti(wadah) {
  if (REDUKSI || !wadah.animate) return;
  const warna = ['#F4A261', '#40916C', '#1B4332', '#95D5B2'];
  for (let i = 0; i < 24; i++) {
    const c = document.createElement('i');
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = `position:absolute;top:0;left:50%;width:8px;height:12px;border-radius:2px;pointer-events:none;background:${warna[i % 4]}`;
    wadah.appendChild(c);
    c.animate([
      { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
      { transform: `translate(${(Math.random() - 0.5) * 320}px, ${240 + Math.random() * 120}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
    ], { duration: 1300 + Math.random() * 900, delay: Math.random() * 250, easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'forwards' }).onfinish = () => c.remove();
  }
}

/** @returns {Object[]} pesanan tersimpan di "nusapangan:riwayatBelanja" (data rusak disaring) */
function dataRiwayat() {
  const d = Simpan.ambil('riwayatBelanja', []);
  return Array.isArray(d) ? d.filter((x) => x && typeof x === 'object' && Array.isArray(x.item)) : [];
}

/* =====================================================================
 * 2) DAFTAR TRANSAKSI, AKSI KARTU & SIDEBAR AKUN (dulu akun-transaksi.js)
 * ===================================================================== */

/* =====================================================================
 * DAFTAR TRANSAKSI (auto-seed, pencarian multi-parameter, kartu transaksi)
 * Sumber data: LocalStorage "nusapangan:riwayatBelanja" (sama dengan Riwayat & Checkout).
 * Status tersimpan di properti `status` tiap pesanan; pesanan lama tanpa status dianggap "selesai".
 * ===================================================================== */

/** Status transaksi: label dan ikon Lucide (warna badge: kelas .mk-badge-* di <style>). */
const STATUS_TRX = {
  berlangsung: { label: 'Berlangsung', ikon: 'truck' },
  selesai: { label: 'Selesai', ikon: 'circle-check' },
  dibatalkan: { label: 'Dibatalkan', ikon: 'circle-x' }
};

/** Tahap pesanan berlangsung (4 ikon status di popup notifikasi). Pesanan selesai = "sampai". */
const TAHAP_TRX = {
  konfirmasi: { label: 'Menunggu Konfirmasi', ikon: 'hourglass', info: 'menunggu konfirmasi dari penjual.' },
  diproses: { label: 'Pesanan Diproses', ikon: 'package', info: 'sedang disiapkan oleh petani.' },
  dikirim: { label: 'Sedang Dikirim', ikon: 'truck', info: 'sedang dalam perjalanan ke alamat Anda.' },
  sampai: { label: 'Sampai Tujuan', ikon: 'package-check', info: 'sudah sampai di tujuan.' }
};

/**
 * Definisi 3 transaksi contoh (DATA SIMULASI). Tanggal dihitung relatif terhadap waktu buka
 * pertama (jam/hari lalu), harga diambil dari katalog PRODUK agar selalu konsisten.
 * Format item: [idProduk, qty].
 */
const SEED_TRANSAKSI = [
  { jam: 3, status: 'berlangsung', tahap: 'diproses', metode: 'qris', kota: 'Depok', donasi: true, item: [['paket-sayur', 1], ['kangkung', 2]] },
  { hari: 1, status: 'berlangsung', tahap: 'dikirim', metode: 'transfer', kota: 'Jakarta Selatan', donasi: true, item: [['kentang', 2], ['tempe', 1]] },
  { hari: 19, status: 'selesai', metode: 'cod', kota: 'Depok', donasi: false, item: [['tempe', 2], ['jagung', 1]] }
];

const Transaksi = {
  /** Kondisi filter aktif. `dari`/`sampai` berformat YYYY-MM-DD (nilai input date). */
  filter: { kata: '', kat: 'semua', dari: '', sampai: '', status: 'semua', tahap: 'semua' },
  /** Penunda (debounce) kolom pencarian. */
  timer: null,

  /* ------------------------------ DATA ------------------------------ */

  /**
   * Membuat satu pesanan dari definisi seed. Bentuk datanya sama dengan hasil checkout (selesai()).
   * @param {Object} d definisi dari SEED_TRANSAKSI
   * @returns {?Object} pesanan, atau null bila produk tidak ada di katalog
   */
  bangun(d) {
    const ts = Date.now() - (d.jam || 0) * 3600000 - (d.hari || 0) * 86400000;
    const item = d.item.map(([id, qty]) => { const p = cariProduk(id); return p ? { id, nama: p.nama, sat: p.sat, qty, harga: p.harga, pasar: p.pasar } : null; }).filter(Boolean);
    if (!item.length) return null;
    const belanja = item.reduce((a, i) => a + i.harga * i.qty, 0), pasar = item.reduce((a, i) => a + i.pasar * i.qty, 0);
    const donasi = d.donasi ? DONASI : 0;
    return {
      id: 'NPM-' + ts.toString(36).toUpperCase(), tgl: new Date(ts).toISOString(),
      item: item.map(({ id, nama, sat, qty, harga }) => ({ id, nama, sat, qty, harga })),
      belanja, donasi, bayar: belanja + donasi, pasar, hemat: pasar - belanja,
      metode: d.metode, kota: d.kota, status: d.status, tahap: d.tahap
    };
  },

  /** Mengisi 3 transaksi contoh sekali saja pada kunjungan pertama (tidak muncul lagi setelah riwayat dihapus). */
  seed() {
    if (Simpan.ambil('seedTransaksi', false) === true) return;
    if (!dataRiwayat().length && !Simpan.simpan('riwayatBelanja', SEED_TRANSAKSI.map((d) => this.bangun(d)).filter(Boolean))) return;
    Simpan.simpan('seedTransaksi', true);
  },

  /** @returns {Object[]} seluruh pesanan, terbaru di atas (item yang rusak disaring) */
  semua() {
    return dataRiwayat()
      .map((x) => Object.assign({}, x, { item: x.item.filter((i) => i && typeof i === 'object') }))
      .sort((a, b) => new Date(b.tgl) - new Date(a.tgl));
  },

  /** @param {Object} x pesanan @returns {string} kunci STATUS_TRX (pesanan lama tanpa status = selesai) */
  status(x) { return Object.keys(STATUS_TRX).includes(x.status) ? x.status : 'selesai'; },

  /** @param {Object} x pesanan @returns {?string} kunci TAHAP_TRX; null bila dibatalkan */
  tahap(x) {
    const s = this.status(x);
    if (s === 'dibatalkan') return null;
    if (s === 'selesai') return 'sampai';
    return TAHAP_TRX[x.tahap] && x.tahap !== 'sampai' ? x.tahap : 'konfirmasi';
  },

  /** @param {Object} x pesanan @returns {string[]} nama kelompok tani/asal unik dari katalog */
  asal(x) {
    const nama = [];
    x.item.forEach((i) => { const p = cariProduk(i.id); if (p && !nama.includes(p.asal)) nama.push(p.asal); });
    return nama;
  },

  /** @param {Object} x pesanan @returns {string} label kelompok tani untuk kartu */
  kelompok(x) {
    const n = this.asal(x);
    if (!n.length) return 'NusaPangan Market';
    return n.length > 1 ? `${n[0]} +${n.length - 1} kelompok tani lain` : n[0];
  },

  /**
   * Rincian harga pesanan; menghitung ulang bila ada field kosong (data lama).
   * @param {Object} x pesanan
   * @returns {{belanja:number, pasar:number, donasi:number, bayar:number, hemat:number}}
   */
  hitung(x) {
    const qty = (i) => Number(i.qty) || 0;
    const belanja = Number(x.belanja) || x.item.reduce((a, i) => a + (Number(i.harga) || 0) * qty(i), 0);
    const pasar = Number(x.pasar) || x.item.reduce((a, i) => { const p = cariProduk(i.id); return a + (p ? p.pasar : Number(i.harga) || 0) * qty(i); }, 0);
    const donasi = Number(x.donasi) || 0;
    return { belanja, pasar, donasi, bayar: Number(x.bayar) || belanja + donasi, hemat: Number(x.hemat) || Math.max(0, pasar - belanja) };
  },

  /** @param {Date} d @returns {string} tanggal lokal YYYY-MM-DD (cocok dengan nilai input date) */
  tglLokal(d) {
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  },

  /* ------------------------------ FILTER ------------------------------ */

  /** @param {Object} x pesanan @returns {string} teks gabungan huruf kecil yang dicari pencarian */
  gudang(x) {
    const kat = x.item.map((i) => { const p = cariProduk(i.id); return p ? KATEGORI[p.kat] : ''; });
    return [x.id, x.kota, METODE[x.metode] ? METODE[x.metode].nama : '', STATUS_TRX[this.status(x)].label]
      .concat(this.asal(x), kat, x.item.map((i) => i.nama)).join(' ').toLowerCase();
  },

  /**
   * Apakah pesanan lolos pencarian (semua kata harus cocok), kategori, dan rentang tanggal.
   * Status dicek terpisah agar jumlah di tiap chip tetap akurat.
   * @param {Object} x pesanan @returns {boolean}
   */
  lolos(x) {
    const f = this.filter;
    if (f.kat !== 'semua' && !x.item.some((i) => { const p = cariProduk(i.id); return p && p.kat === f.kat; })) return false;
    if (f.dari || f.sampai) {
      const d = new Date(x.tgl);
      if (isNaN(d)) return false;
      const t = this.tglLokal(d);
      if ((f.dari && t < f.dari) || (f.sampai && t > f.sampai)) return false;
    }
    const kata = f.kata.trim().toLowerCase();
    if (kata) { const g = this.gudang(x); if (!kata.split(/\s+/).every((k) => g.includes(k))) return false; }
    return true;
  },

  /** Mengembalikan seluruh filter ke kondisi awal. */
  reset() {
    this.filter = { kata: '', kat: 'semua', dari: '', sampai: '', status: 'semua', tahap: 'semua' };
    $('trx-cari').value = ''; $('trx-kategori').value = 'semua'; $('trx-dari').value = ''; $('trx-sampai').value = '';
    $('trx-dari').max = $('trx-sampai').max = this.tglLokal(new Date()); $('trx-sampai').min = '';
    this.render();
  },

  /* ------------------------------ TAMPILAN ------------------------------ */

  /** Baris produk di dalam kartu: thumbnail (foto bila ada, jika tidak emoji), nama, qty × harga, subtotal. @param {Object} i item @returns {string} */
  baris(i) {
    const p = cariProduk(i.id), qty = Number(i.qty) || 0, harga = Number(i.harga) || (p ? p.harga : 0);
    const foto = p && p.foto ? `<img src="${esc(p.foto)}" alt="" loading="lazy" />` : '';
    return `<div class="flex items-center gap-3">
      <span class="mk-thumb" aria-hidden="true">${esc(p ? p.ikon : '🛒')}${foto}</span>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-bold leading-snug">${esc(i.nama || (p ? p.nama : 'Produk'))}</p>
        <p class="mt-0.5 text-xs mk-muted">${qty} × ${Rp(harga)} / ${esc(i.sat || (p ? p.sat : 'unit'))}</p>
      </div>
      <p class="shrink-0 text-sm font-bold">${Rp(harga * qty)}</p>
    </div>`;
  },

  /** Kartu transaksi standar marketplace. @param {Object} x pesanan @returns {string} HTML <li> */
  kartu(x) {
    const st = this.status(x), S = STATUS_TRX[st], h = this.hitung(x), d = new Date(x.tgl), id = esc(x.id || '-');
    const tanggal = isNaN(d) ? '' : `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    const [utama, ...lain] = x.item;
    const batal = st === 'dibatalkan';
    const donasi = h.donasi > 0 ? `<div class="flex justify-between gap-3"><dt class="mk-muted">💚 Donasi Pangan</dt><dd class="font-semibold">${Rp(h.donasi)}</dd></div>` : '';
    const sudahUlas = AksiTrx.ulasan(x.id);
    const aksi = `<button type="button" data-aksi="detail" data-id="${id}" class="mk-btn-garis" aria-haspopup="dialog">Lihat Detail Transaksi</button>`
      + (st === 'dibatalkan' ? '' : `<button type="button" data-aksi="ulas" data-id="${id}" class="mk-btn-garis disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent" aria-haspopup="dialog" ${st === 'selesai' ? '' : 'disabled title="Ulasan dibuka setelah pesanan sampai"'}>${sudahUlas ? '★ Ubah Ulasan' : 'Ulas'}</button>`)
      + (st === 'berlangsung' ? `<button type="button" data-aksi="batal" data-id="${id}" class="mk-btn-garis">Batalkan</button><button type="button" data-aksi="diterima" data-id="${id}" class="mk-btn-garis">Pesanan Diterima</button>` : '')
      + `<button type="button" data-aksi="beli-lagi" data-id="${id}" class="mk-btn-utama">Beli Lagi</button>`
      + `<button type="button" data-aksi="menu" data-id="${id}" class="mk-btn-garis !px-2.5" aria-haspopup="menu" aria-expanded="false" aria-label="Aksi lainnya untuk invoice ${id}"><i data-lucide="more-horizontal" class="w-4 h-4"></i></button>`;
    return `<li class="mk-card overflow-hidden" data-trx="${id}" tabindex="-1">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b mk-garis px-4 py-3 text-sm">
        <span class="inline-flex items-center gap-1.5 font-bold"><i data-lucide="shopping-bag" class="w-4 h-4 mk-aksen"></i> Belanja</span>
        <time class="mk-muted" datetime="${isNaN(d) ? '' : esc(d.toISOString())}">${esc(tanggal)}</time>
        <span class="mk-badge mk-badge-${st}"><i data-lucide="${S.ikon}" class="w-3.5 h-3.5"></i>${st === 'berlangsung' ? TAHAP_TRX[this.tahap(x)].label : S.label}</span>
        <span class="text-xs mk-muted sm:ml-auto">Invoice <b class="font-mono font-semibold">${id}</b></span>
      </div>
      <div class="space-y-3 px-4 py-3">
        <p class="inline-flex items-center gap-1.5 text-sm font-bold"><i data-lucide="sprout" class="w-4 h-4 mk-aksen"></i>${esc(this.kelompok(x))}</p>
        ${utama ? this.baris(utama) : ''}
        ${lain.length ? `<details><summary class="mk-ringkas inline-flex items-center gap-1 text-sm font-semibold mk-aksen">Lihat ${lain.length} produk lainnya <i data-lucide="chevron-down" class="w-4 h-4 mk-chev"></i></summary><div class="mt-3 space-y-3">${lain.map((i) => this.baris(i)).join('')}</div></details>` : ''}
      </div>
      <div class="mk-sub grid gap-4 border-t mk-garis px-4 py-3 sm:grid-cols-2">
        <dl class="space-y-1 text-sm">
          <div class="flex justify-between gap-3"><dt class="mk-muted">Subtotal produk</dt><dd class="font-semibold">${Rp(h.belanja)}</dd></div>
          ${donasi}
          <div class="flex justify-between gap-3"><dt class="mk-muted">Harga pasaran</dt><dd class="mk-muted"><s>${Rp(h.pasar)}</s></dd></div>
        </dl>
        <div class="sm:text-right">
          <p class="text-xs mk-muted">Total Belanja</p>
          <p class="text-xl font-extrabold ${batal ? 'line-through mk-muted' : ''}">${Rp(h.bayar)}</p>
          ${batal ? '<p class="mt-1 text-xs mk-muted">Pesanan dibatalkan, tidak ada penghematan tercatat.</p>'
            : `<p class="mt-1 inline-flex items-center gap-1.5 rounded-full bg-segar/15 px-2.5 py-1 text-xs font-bold mk-aksen"><i data-lucide="piggy-bank" class="w-3.5 h-3.5"></i>Total Penghematan ${Rp(h.hemat)}</p>`}
        </div>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-3 border-t mk-garis px-4 py-3">
        <p class="inline-flex items-center gap-1.5 text-xs mk-muted"><i data-lucide="map-pin" class="w-3.5 h-3.5"></i>${x.kota ? `Dikirim ke ${esc(x.kota)}` : 'Pengiriman komunitas'}${METODE[x.metode] ? ` · ${esc(METODE[x.metode].nama)}` : ''}</p>
        <div class="flex flex-wrap gap-2">${aksi}</div>
      </div>
    </li>`;
  },

  /** Menyaring data, memperbarui chip/jumlah, lalu menggambar kartu atau state kosong. */
  render() {
    const f = this.filter, semua = this.semua();
    const rentangSalah = !!(f.dari && f.sampai && f.dari > f.sampai);
    const lolos = rentangSalah ? [] : semua.filter((x) => this.lolos(x));
    const hit = { semua: lolos.length, berlangsung: 0, selesai: 0, dibatalkan: 0 };
    lolos.forEach((x) => { hit[this.status(x)]++; });
    const tampil = lolos.filter((x) => (f.status === 'semua' || this.status(x) === f.status) && (!f.tahap || f.tahap === 'semua' || this.tahap(x) === f.tahap));

    document.querySelectorAll('#trx-filter-status [data-status]').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.status === f.status));
      b.querySelector('[data-n]').textContent = hit[b.dataset.status];
    });
    $('trx-jumlah').textContent = semua.length ? `Menampilkan ${tampil.length} dari ${semua.length} transaksi` : 'Belum ada transaksi.';
    $('trx-list').innerHTML = tampil.map((x) => this.kartu(x)).join('');

    const kosong = !tampil.length, adaData = semua.length > 0;
    $('trx-kosong').classList.toggle('hidden', !kosong);
    $('trx-kosong-belanja').classList.toggle('hidden', adaData);
    $('trx-kosong-reset').classList.toggle('hidden', !adaData);
    if (kosong) {
      $('trx-kosong-judul').textContent = !adaData ? 'Belum ada transaksi' : rentangSalah ? 'Rentang tanggal tidak valid' : 'Transaksi tidak ditemukan';
      $('trx-kosong-teks').textContent = !adaData ? 'Pesanan Anda akan muncul di sini setelah Anda menyelesaikan checkout.'
        : rentangSalah ? 'Tanggal awal melewati tanggal akhir. Perbaiki rentang tanggal atau reset filter.'
        : 'Coba ubah kata kunci, kategori, tanggal, atau status, lalu cari lagi.';
    }
    this.indikatorTahap(); this.sinkronUrl();
    if (window.NotifNav) window.NotifNav.segarkan(); // badge lonceng & popup
    ikon();
  },

  /** Menampilkan/menyembunyikan penanda "Menyaring tahap" (hanya bila elemennya ada di halaman). */
  indikatorTahap() {
    const el = $('trx-tahap-aktif'); if (!el) return;
    const t = this.filter.tahap, aktif = t && t !== 'semua' && TAHAP_TRX[t];
    el.classList.toggle('hidden', !aktif);
    if (aktif) $('trx-tahap-label').textContent = TAHAP_TRX[t].label;
  },

  /** Bila true (transaksi.html), saringan status & tahap dicerminkan ke URL (?tahap=&status=). */
  urlSinkron: false,
  sinkronUrl() {
    if (!this.urlSinkron || !window.history || !history.replaceState) return;
    try {
      const u = new URL(location.href), f = this.filter;
      u.searchParams.delete('invoice');
      if (f.tahap && f.tahap !== 'semua') u.searchParams.set('tahap', f.tahap); else u.searchParams.delete('tahap');
      if (f.status && f.status !== 'semua') u.searchParams.set('status', f.status); else u.searchParams.delete('status');
      history.replaceState(null, '', u);
    } catch (e) { /* file:// atau URL tidak bisa diubah: abaikan */ }
  },

  /**
   * Menerapkan saringan dari lonceng/tautan tanpa memuat ulang: reset filter, saring per tahap, gulir & fokus.
   * @param {string} [tahap] kunci TAHAP_TRX; kosong = semua @param {string} [invoice] kartu yang difokuskan
   */
  terapkanDariTautan(tahap, invoice) {
    this.reset();
    if (tahap && TAHAP_TRX[tahap]) { this.filter.tahap = tahap; this.render(); }
    const area = $('area-transaksi');
    if (area) area.scrollIntoView({ behavior: REDUKSI ? 'auto' : 'smooth', block: 'start' });
    const kartu = invoice ? $('trx-list').querySelector(`[data-trx="${CSS.escape(invoice)}"]`) : null;
    (kartu || $('judul-transaksi')).focus({ preventScroll: true });
  },

  /** Menampilkan skeleton sesaat (state loading), lalu menggambar daftar. */
  muat() {
    const daftar = $('trx-daftar');
    daftar.setAttribute('aria-busy', 'true');
    $('trx-skeleton').classList.remove('hidden'); $('trx-list').classList.add('hidden'); $('trx-kosong').classList.add('hidden');
    setTimeout(() => {
      $('trx-skeleton').classList.add('hidden'); $('trx-list').classList.remove('hidden');
      daftar.setAttribute('aria-busy', 'false');
      this.render();
      if (typeof this.sesudahMuat === 'function') { const f = this.sesudahMuat; this.sesudahMuat = null; f(); }
    }, REDUKSI ? 0 : 450);
  },

  /* ------------------------------ AKSI KARTU ------------------------------ */

  /**
   * Mengubah status satu pesanan lalu menyegarkan daftar & ringkasan riwayat.
   * @param {string} id nomor invoice @param {string} status kunci STATUS_TRX
   */
  ubahStatus(id, status) {
    const r = dataRiwayat().map((o) => (o.id === id ? Object.assign({}, o, { status }) : o));
    if (!Simpan.simpan('riwayatBelanja', r)) { toast('Gagal menyimpan: penyimpanan perangkat penuh'); return; }
    this.render(); if (typeof Riwayat !== 'undefined') Riwayat.render();
    const el = $('trx-list').querySelector(`[data-trx="${CSS.escape(id)}"]`);
    (el || $('judul-transaksi')).focus({ preventScroll: true });
  },

  /**
   * Memasukkan seluruh produk pesanan ke keranjang (dibatasi stok).
   * Di market.html memakai objek Keranjang; di halaman lain langsung menulis LocalStorage lalu membuka market.html#keranjang.
   * @param {Object} x pesanan
   */
  beliLagi(x) {
    const diMarket = typeof Keranjang !== 'undefined';
    let wadah = {}, pilih = {}; // wadah: id -> qty, pilih: id -> true/false (centang di keranjang)
    if (diMarket) { wadah = Keranjang.item; pilih = Keranjang.pilih; }
    else (Array.isArray(Simpan.ambil('keranjang', [])) ? Simpan.ambil('keranjang', []) : []).forEach((k) => { const p = k && cariProduk(k.id), q = Math.floor(Number(k && k.qty)); if (p && p.stok > 0 && q > 0) { wadah[p.id] = Math.min(q, p.stok); pilih[p.id] = !(k && k.pilih === false); } });
    let n = 0; const lewat = [];
    x.item.forEach((i) => {
      const p = cariProduk(i.id);
      if (!p || p.stok < 1) { lewat.push(i.nama || 'Produk'); return; }
      wadah[p.id] = Math.min((wadah[p.id] || 0) + (Math.floor(Number(i.qty)) || 1), p.stok); pilih[p.id] = true; n++;
    });
    if (!n) { toast('Produk pesanan ini sedang tidak tersedia'); return; }
    const info = `✓ ${n} produk dari ${x.id} masuk keranjang${lewat.length ? `. ${lewat.length} produk dilewati (stok habis)` : ''}`;
    if (diMarket) { Keranjang.simpan(); Keranjang.segarkan(); Umpan.badge(); toast(info); return; }
    if (!Simpan.simpan('keranjang', Object.keys(wadah).map((id) => ({ id, qty: wadah[id], pilih: pilih[id] !== false })))) { toast('Gagal menyimpan: penyimpanan perangkat penuh'); return; }
    toast(info + '. Membuka keranjang…');
    if (typeof window.perbaruiBadgeKeranjang === 'function') window.perbaruiBadgeKeranjang();
    setTimeout(() => { location.href = 'market.html#keranjang'; }, REDUKSI ? 0 : 900);
  },

  /** Menangani klik tombol aksi pada kartu (delegasi). @param {MouseEvent} e */
  aksi(e) {
    const b = e.target.closest('[data-aksi]');
    if (!b) return;
    const x = this.semua().find((o) => o.id === b.dataset.id);
    if (!x) return;
    const a = b.dataset.aksi;
    if (a === 'detail') { try { AksiTrx.invoice(x, b); } catch (err) { console.error(err); toast('Rincian transaksi gagal dimuat. Coba muat ulang halaman'); } }
    else if (a === 'ulas') { try { AksiTrx.formUlas(x, b); } catch (err) { console.error(err); toast('Form ulasan gagal dimuat'); } }
    else if (a === 'menu') AksiTrx.menu(x, b);
    else if (a === 'beli-lagi') this.beliLagi(x);
    else if (a === 'diterima') { this.ubahStatus(x.id, 'selesai'); toast('Terima kasih! Pesanan ditandai selesai'); }
    else if (a === 'batal' && confirm(`Batalkan pesanan ${x.id}?`)) { this.ubahStatus(x.id, 'dibatalkan'); toast('Pesanan dibatalkan'); }
  },

  /** Mengisi data contoh, membuat opsi kategori, memasang seluruh event filter, lalu memuat daftar. */
  init() {
    this.seed();
    $('trx-kategori').insertAdjacentHTML('beforeend', Object.keys(KATEGORI).map((k) => `<option value="${k}">${esc(KATEGORI[k])}</option>`).join(''));
    const hariIni = this.tglLokal(new Date());
    $('trx-dari').max = hariIni; $('trx-sampai').max = hariIni;

    $('trx-cari').addEventListener('input', (e) => {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => { this.filter.kata = e.target.value; this.render(); }, 180);
    });
    $('trx-kategori').addEventListener('change', (e) => { this.filter.kat = e.target.value; this.render(); });
    $('trx-dari').addEventListener('change', (e) => { this.filter.dari = e.target.value; $('trx-sampai').min = e.target.value; this.render(); });
    $('trx-sampai').addEventListener('change', (e) => { this.filter.sampai = e.target.value; $('trx-dari').max = e.target.value || hariIni; this.render(); });
    $('trx-filter-status').addEventListener('click', (e) => {
      const b = e.target.closest('[data-status]');
      if (b) { this.filter.status = b.dataset.status; this.render(); }
    });
    $('trx-reset').addEventListener('click', () => this.reset());
    const hapusTahap = $('trx-tahap-hapus');
    if (hapusTahap) hapusTahap.addEventListener('click', () => { this.filter.tahap = 'semua'; this.render(); });
    $('trx-kosong-reset').addEventListener('click', () => this.reset());
    $('trx-list').addEventListener('click', (e) => this.aksi(e));
    // Foto produk yang gagal dimuat dibuang agar emoji cadangan tetap terlihat (event error tidak menggelembung).
    $('trx-list').addEventListener('error', (e) => { if (e.target.tagName === 'IMG') e.target.remove(); }, true);

    this.muat();
  }
};

/* =====================================================================
 * AKSI KARTU TRANSAKSI: invoice, ulasan, menu titik tiga (Kulkas Food Rescue, Nusa-Ai)
 * LocalStorage: "nusapangan:ulasan" (ulasan) & "nusapangan:stokPangan" (dibaca foodrescue.html)
 * ===================================================================== */

/** Perkiraan daya simpan (hari) per kategori, untuk tanggal kedaluwarsa di Kulkas Food Rescue. */
const UMUR_SIMPAN = { sayur: 4, buah: 5, protein: 4, karbo: 30, benih: 180, 'alat-tani': 730, 'alat-hidro': 730, 'bahan-hidro': 365, paket: 14 };

const AksiTrx = {
  /** Tombol pemicu dialog/menu yang sedang aktif (fokus dikembalikan saat ditutup). */
  pemicu: null,
  /** Pesanan yang sedang dibuka pada menu titik tiga atau form ulasan. */
  aktif: null,

  /** @param {string} id invoice @returns {?Object} ulasan tersimpan {tgl, item:{idProduk:{bintang,teks}}} */
  ulasan(id) { const u = Simpan.ambil('ulasan', {}); return u && typeof u === 'object' && u[id] ? u[id] : null; },

  /** Membuka dialog dan mengingat pemicunya. @param {HTMLDialogElement} d @param {?HTMLElement} pemicu */
  buka(d, pemicu) { this.pemicu = pemicu; this.tutupMenu(false); if (!d.open) d.showModal(); },

  /* ---------------------------- 1. INVOICE ---------------------------- */

  /** Modal rincian invoice. @param {Object} x pesanan @param {HTMLElement} pemicu */
  invoice(x, pemicu) {
    const st = Transaksi.status(x), S = STATUS_TRX[st], h = Transaksi.hitung(x), d = new Date(x.tgl);
    const tgl = isNaN(d) ? '-' : `${d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}, ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    const br = (k, v, kelas = '') => `<div class="flex justify-between gap-3 ${kelas}"><dt class="mk-muted">${k}</dt><dd class="font-semibold text-right">${v}</dd></div>`;
    const modal = $('modal-invoice'), isi = $('isi-invoice');
    isi.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-sm">Nomor Invoice<br><b class="font-mono text-base">${esc(x.id)}</b></p>
        <span class="mk-badge mk-badge-${st}"><i data-lucide="${S.ikon}" class="w-3.5 h-3.5"></i>${S.label}</span>
      </div>
      <dl class="mt-4 space-y-1.5 text-sm">
        ${br('Tanggal', esc(tgl))}
        ${br('Penjual', esc(Transaksi.kelompok(x)))}
        ${br('Dikirim ke', esc(x.kota || 'Pengiriman komunitas'))}
        ${br('Metode bayar', esc(METODE[x.metode] ? METODE[x.metode].nama : '-'))}
      </dl>
      <h3 class="mt-5 font-bold text-sm">Produk dibeli (${x.item.length})</h3>
      <div class="mt-3 space-y-3 border-y mk-garis py-4">${x.item.map((i) => Transaksi.baris(i)).join('')}</div>
      <dl class="mt-4 space-y-1.5 text-sm">
        ${br('Subtotal produk', Rp(h.belanja))}
        ${h.donasi > 0 ? br('💚 Donasi Pangan', Rp(h.donasi)) : ''}
        ${br('Harga pasaran', `<s class="mk-muted">${Rp(h.pasar)}</s>`)}
        ${st === 'dibatalkan' ? '' : br('Total Penghematan', `<span class="mk-aksen">${Rp(h.hemat)}</span>`)}
        <div class="flex justify-between gap-3 border-t mk-garis pt-3 text-lg font-extrabold"><dt>Total Bayar</dt><dd>${Rp(h.bayar)}</dd></div>
      </dl>
      <p class="mt-4 text-xs mk-muted">Data transaksi adalah simulasi untuk demo.</p>
      <div class="invoice-aksi flex justify-end"><button type="button" data-tutup class="mk-btn-utama">Tutup</button></div>`;

    // Scroll mandiri: #isi-invoice menjadi kolom flex yang bisa digulir sendiri (tinggi dibatasi agar tidak melewati layar),
    // sedangkan tombol "Tutup" menempel (sticky) di dasar area gulir sehingga selalu terlihat dan rapi.
    Object.assign(isi.style, {
      display: 'flex', flexDirection: 'column', minHeight: '0',
      maxHeight: 'min(40rem, calc(100vh - 8rem))',
      overflowY: 'auto', overflowX: 'hidden',
      overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch'
    });
    if (window.CSS && CSS.supports && CSS.supports('max-height', 'min(40rem, calc(100dvh - 8rem))')) isi.style.maxHeight = 'min(40rem, calc(100dvh - 8rem))';
    const aksi = isi.querySelector('.invoice-aksi');
    if (aksi) Object.assign(aksi.style, {
      position: 'sticky', bottom: '0', marginTop: 'auto', paddingTop: '0.75rem', paddingBottom: '0.25rem',
      background: 'var(--mk-surface)', borderTop: '1px solid var(--mk-border)', zIndex: '1', flexShrink: '0'
    });
    // Kalau ada anak lain, jangan biarkan menyusut saat kolom flex penuh
    [...isi.children].forEach((el) => { if (el !== aksi) el.style.flexShrink = '0'; });
    // Jarak antara konten dan garis tombol
    const terakhir = aksi && aksi.previousElementSibling; if (terakhir) terakhir.style.marginBottom = '1rem';

    isi.scrollTop = 0;
    ikon();
    this.buka(modal, pemicu);
  },

  /* ---------------------------- 2. ULASAN ---------------------------- */

  /** Modal rating bintang 1-5 + ulasan per produk. @param {Object} x pesanan @param {HTMLElement} pemicu */
  formUlas(x, pemicu) {
    this.aktif = x;
    const lama = this.ulasan(x.id), prev = (lama && lama.item) || {};
    $('form-ulas').innerHTML = `
      <p class="text-sm mk-muted">Invoice <b class="font-mono">${esc(x.id)}</b>. Bagikan pengalaman Anda agar petani dan pembeli lain terbantu.</p>
      ${x.item.map((i, n) => {
        const p = cariProduk(i.id), v = prev[i.id] || {}, nilai = Number(v.bintang) || 0;
        return `<fieldset class="space-y-2" data-produk="${esc(i.id)}">
          <legend class="flex items-center gap-2 text-sm font-bold"><span aria-hidden="true" class="mk-thumb !w-9 !h-9 !text-xl">${esc(p ? p.ikon : '🛒')}</span>${esc(i.nama || (p ? p.nama : 'Produk'))}</legend>
          <div class="bintang" role="radiogroup" aria-label="Rating ${esc(i.nama || 'produk')}">
            ${[1, 2, 3, 4, 5].map((k) => `<input type="radio" id="r-${n}-${k}" name="r-${n}" value="${k}" ${k === nilai ? 'checked' : ''} /><label for="r-${n}-${k}" class="${k <= nilai ? 'on' : ''}" title="${k} bintang"><span aria-hidden="true">★</span><span class="sr-only">${k} bintang</span></label>`).join('')}
          </div>
          <label for="t-${n}" class="sr-only">Ulasan ${esc(i.nama || 'produk')}</label>
          <textarea id="t-${n}" name="t-${n}" rows="2" maxlength="500" class="mk-input" placeholder="Bagaimana kesegaran, rasa, dan kemasannya? (opsional)">${esc(v.teks || '')}</textarea>
        </fieldset>`;
      }).join('')}
      <p id="e-ulas" class="hidden text-sm font-semibold text-red-700" role="alert"></p>
      <div class="flex justify-end gap-2">
        <button type="button" data-tutup class="mk-btn-garis">Batal</button>
        <button type="submit" class="mk-btn-utama">Kirim Ulasan</button>
      </div>`;
    this.buka($('modal-ulas'), pemicu);
  },

  /** Memvalidasi & menyimpan ulasan (minimal satu produk diberi bintang). @param {HTMLFormElement} f */
  kirimUlas(f) {
    const x = this.aktif; if (!x) return;
    const hasil = {}; let n = 0;
    x.item.forEach((i, k) => {
      const r = f.querySelector(`input[name="r-${k}"]:checked`);
      if (r) { hasil[i.id] = { bintang: Number(r.value), teks: f.elements[`t-${k}`].value.trim().slice(0, 500) }; n++; }
    });
    const g = $('e-ulas');
    if (!n) { g.textContent = 'Pilih minimal satu rating bintang (1 sampai 5) sebelum mengirim.'; g.classList.remove('hidden'); return; }
    const u = Simpan.ambil('ulasan', {}); const semua = u && typeof u === 'object' ? u : {};
    semua[x.id] = { tgl: new Date().toISOString(), item: hasil };
    if (!Simpan.simpan('ulasan', semua)) { g.textContent = 'Gagal menyimpan: penyimpanan perangkat penuh.'; g.classList.remove('hidden'); return; }
    this.pemicu = null; tutupDialog($('modal-ulas'));
    setTimeout(() => { Transaksi.render(); const el = $('trx-list').querySelector(`[data-trx="${CSS.escape(x.id)}"]`); if (el) el.focus({ preventScroll: true }); toast(`Terima kasih! ${n} ulasan produk tersimpan`); }, REDUKSI ? 0 : 200);
  },

  /* ---------------------------- 3. MENU TITIK TIGA ---------------------------- */

  /** Membuka/menutup menu di bawah tombol ⋯ (fixed, jadi tidak terpotong kartu). @param {Object} x @param {HTMLElement} tombol */
  menu(x, tombol) {
    const m = $('trx-menu');
    if (!m.classList.contains('hidden') && this.pemicu === tombol) { this.tutupMenu(true); return; }
    this.tutupMenu(false);
    this.aktif = x; this.pemicu = tombol;
    m.classList.remove('hidden'); tombol.setAttribute('aria-expanded', 'true');
    const r = tombol.getBoundingClientRect(), w = m.offsetWidth, t = m.offsetHeight;
    m.style.left = Math.max(8, Math.min(r.right - w, innerWidth - w - 8)) + 'px';
    m.style.top = (r.bottom + t + 12 > innerHeight && r.top > t + 12 ? r.top - t - 6 : r.bottom + 6) + 'px';
    m.querySelector('[role="menuitem"]').focus();
  },

  /** Menutup menu. @param {boolean} [balikFokus] kembalikan fokus ke tombol ⋯ */
  tutupMenu(balikFokus) {
    const m = $('trx-menu'); if (m.classList.contains('hidden')) return;
    m.classList.add('hidden');
    document.querySelectorAll('[data-aksi="menu"][aria-expanded="true"]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
    if (balikFokus && this.pemicu && this.pemicu.isConnected) this.pemicu.focus();
  },

  /** Mengirim semua bahan transaksi ke "nusapangan:stokPangan" (daftar stok Kulkas di foodrescue.html). @param {Object} x */
  kulkas(x) {
    if (window.NusaPangan && window.NusaPangan.DataAwal) window.NusaPangan.DataAwal.isi();
    const d = Simpan.ambil('stokPangan', []), arr = Array.isArray(d) ? d : [];
    // Peta kategori Market -> kategori Food Rescue yang valid di foodrescue.html
    const petaKat = { sayur: 'sayur', buah: 'buah', protein: 'protein', karbo: 'karbo', paket: 'sayur', benih: 'lainnya', 'alat-tani': 'lainnya', 'alat-hidro': 'lainnya', 'bahan-hidro': 'lainnya' };
    const kini = new Date(); let baru = 0, ada = 0;
    x.item.forEach((i, idx) => {
      const idUnik = `mk-${x.id}-${i.id}`;
      if (arr.some((e) => e && (e.idKirim === idUnik || e.id === idUnik))) { ada++; return; }
      const p = cariProduk(i.id), exp = new Date(kini);
      exp.setDate(exp.getDate() + ((p && UMUR_SIMPAN[p.kat]) || 5));
      arr.push({
        uid: Date.now() + idx,
        idKirim: idUnik,
        nama: i.nama || (p ? p.nama : 'Bahan'),
        jumlah: Number(i.qty) || 1,
        satuan: i.sat || (p ? p.sat : 'pcs'),
        kategori: petaKat[p && p.kat] || 'lainnya',
        exp: exp.toLocaleDateString('en-CA'),
        harga: (Number(i.harga) || (p ? p.harga : 10000)) * (Number(i.qty) || 1)
      });
      baru++;
    });
    if (!baru) { toast(ada ? 'Bahan transaksi ini sudah ada di Kulkas Food Rescue' : 'Tidak ada bahan untuk dimasukkan'); return; }
    if (!Simpan.simpan('stokPangan', arr)) { toast('Gagal menyimpan: penyimpanan perangkat penuh'); return; }
    toast(`✓ ${baru} bahan masuk Kulkas Food Rescue${ada ? ` (${ada} sudah ada)` : ''}`);
  },

  /** Meneruskan pertanyaan ke Nusa-Ai (API app.js dicoba defensif); cadangan: salin pertanyaan. @param {Object} x */
  tanyaAi(x) {
    const teks = `Saya baru membeli ${x.item.map((i) => `${i.nama} ×${Number(i.qty) || 1}`).join(', ')}. Bagaimana cara menyimpan dan mengolahnya agar hemat dan tidak ada yang terbuang?`;
    Simpan.simpan('pertanyaanAi', { teks, invoice: x.id, tgl: new Date().toISOString() });
    const N = window.NusaPangan || {}, A = N.Ai || N.AI || N.NusaAi || N.Asisten || N.Chat;
    if (A) for (const k of ['tanya', 'kirim', 'ask', 'buka', 'open']) {
      if (typeof A[k] === 'function') { try { A[k](teks); return; } catch (e) { /* coba nama berikutnya */ } }
    }
    const el = document.querySelector('[data-nusa-ai], #btn-nusa-ai, #btn-ai, #nusa-ai-toggle');
    const salin = () => toast('Pertanyaan disalin. Tempel di Nusa-Ai untuk mulai bertanya');
    if (el) { el.click(); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(teks).then(salin, () => toast('Nusa-Ai belum aktif di halaman ini')); else toast('Nusa-Ai belum aktif di halaman ini');
  },

  /* ---------------------------- EVENT ---------------------------- */

  init() {
    ['modal-invoice', 'modal-ulas'].forEach((id) => {
      const d = $(id);
      d.addEventListener('cancel', (e) => { e.preventDefault(); tutupDialog(d); });
      d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-tutup]')) tutupDialog(d); });
      d.addEventListener('close', () => {
        const a = this.pemicu; this.pemicu = null;
        if (a && a.isConnected) a.focus({ preventScroll: true });
        else if (this.aktif) { const el = $('trx-list').querySelector(`[data-trx="${CSS.escape(this.aktif.id)}"]`); if (el) el.focus({ preventScroll: true }); }
      });
    });
    const f = $('form-ulas');
    f.addEventListener('submit', (e) => { e.preventDefault(); this.kirimUlas(f); });
    f.addEventListener('change', (e) => { // isi bintang sampai nilai terpilih
      if (e.target.type !== 'radio') return;
      const v = Number(e.target.value);
      e.target.closest('.bintang').querySelectorAll('label').forEach((l, i) => l.classList.toggle('on', i < v));
      $('e-ulas').classList.add('hidden');
    });
    // Klik label bintang: paksa radio ter-check lalu picu 'change' agar kelas .on menyala
    f.addEventListener('click', (e) => {
      const l = e.target.closest('.bintang label');
      if (!l) return;
      const r = (l.htmlFor && $(l.htmlFor)) || l.previousElementSibling;
      if (!r || r.type !== 'radio') return;
      e.preventDefault(); // cegah klik ganda bawaan label
      r.checked = true;
      r.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const m = $('trx-menu');
    m.addEventListener('click', (e) => {
      const b = e.target.closest('[data-menu-aksi]'); if (!b || !this.aktif) return;
      const x = this.aktif; this.tutupMenu(true);
      if (b.dataset.menuAksi === 'kulkas') this.kulkas(x); else this.tanyaAi(x);
    });
    m.addEventListener('keydown', (e) => { // navigasi panah + Esc
      const it = [...m.querySelectorAll('[role="menuitem"]')], i = it.indexOf(document.activeElement);
      if (e.key === 'Escape') { e.preventDefault(); this.tutupMenu(true); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); it[(i + 1) % it.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); it[(i - 1 + it.length) % it.length].focus(); }
      else if (e.key === 'Tab') this.tutupMenu(false);
    });
    document.addEventListener('click', (e) => { if (!m.classList.contains('hidden') && !m.contains(e.target) && !e.target.closest('[data-aksi="menu"]')) this.tutupMenu(false); });
    window.addEventListener('resize', () => this.tutupMenu(false));
    window.addEventListener('scroll', () => this.tutupMenu(false), true);
  }
};

/* =====================================================================
 * SIDEBAR AKUN (Profil, NusaPay Pangan, Voucher Subsidi, Akordeon)
 * ===================================================================== */

/** Nama tampil tiap item menu (dipakai toast untuk fitur yang belum tersedia). */
const NAMA_MENU = {
  plus: 'NusaPangan PLUS', 'isi-saldo': 'Top Up', mutasi: 'Mutasi NusaPay',
  chat: 'Chat', diskusi: 'Diskusi Produk', ulasan: 'Ulasan', bantuan: 'Pesan Bantuan',
  menunggu: 'Menunggu Pembayaran', transaksi: 'Daftar Transaksi',
  wishlist: 'Wishlist', alamat: 'Daftar Alamat', pengaturan: 'Pengaturan Akun'
};

/** Voucher Subsidi (DATA SIMULASI untuk demo). */
const VOUCHER_SUBSIDI = [
  { kode: 'PANGANHEMAT', judul: 'Diskon Rp 5.000', syarat: 'Min. belanja Rp 50.000', berlaku: 'Sampai 31 Des 2026' },
  { kode: 'ONGKIRKOMUNITAS', judul: 'Gratis ongkir kurir komunitas', syarat: 'Tanpa minimum belanja', berlaku: 'Sampai 30 Nov 2026' },
  { kode: 'SAYURLOKAL10', judul: 'Subsidi 10% sayur lokal', syarat: 'Khusus kategori sayur', berlaku: 'Sampai 15 Des 2026' }
];

/** Saldo awal simulasi NusaPay Pangan (Rp) bila belum ada data tersimpan. */
const SALDO_AWAL = 150000;

/** Nominal sekali Top Up simulasi (Rp). */
const TOPUP = 50000;

const AkunSidebar = {
  /** Profil kosong (belum masuk). Dipakai sebagai fallback bila NusaPangan.Akun.aktif() mengembalikan null. */
  KOSONG: { nama: 'Tamu NusaPangan', email: '', foto: '', level: '', masuk: false },

  /**
   * Membaca profil LANGSUNG dari window.NusaPangan.Akun.aktif() (app.js) - satu-satunya sumber data,
   * sehingga sidebar selalu sama persis dengan akun yang aktif di navbar. Tidak ada pembacaan elemen HTML
   * dan tidak ada tebakan kunci LocalStorage.
   * @returns {{nama: string, email: string, foto: string, level: string, masuk: boolean}}
   */
  ambil() {
    const A = window.NusaPangan && window.NusaPangan.Akun;
    let d = null;
    try { d = A && typeof A.aktif === 'function' ? A.aktif() : null; } catch (e) { d = null; }
    if (typeof d === 'string') d = { nama: d }; // jaga-jaga bila aktif() hanya mengembalikan nama
    if (!d || typeof d !== 'object') return Object.assign({}, this.KOSONG);

    // Hanya teks/angka yang diterima; objek seperti level = { nama: 'Tunas' } diambil nama-nya.
    const teks = (v) => {
      if (v && typeof v === 'object' && typeof v.nama === 'string') v = v.nama;
      return typeof v === 'string' || typeof v === 'number' ? String(v).trim() : '';
    };
    const pilih = (...k) => { for (const n of k) { const t = teks(d[n]); if (t) return t; } return ''; };

    const nama = pilih('nama', 'name', 'username');
    if (!nama) return Object.assign({}, this.KOSONG);

    // Level: pakai field level bila ada; bila tidak, hitung dari Akun.level(poin) milik app.js.
    let level = pilih('level', 'peran', 'tipe');
    if (!level && typeof A.level === 'function' && d.poin !== undefined) {
      try { level = teks(A.level(d.poin)); } catch (e) { /* abaikan */ }
    }
    return { nama, email: pilih('email', 'surel'), foto: pilih('foto', 'avatar', 'gambar'), level, masuk: true };
  },

  /** Menggambar kartu profil (hanya textContent/DOM API, aman dari injeksi HTML). */
  renderProfil() {
    const a = this.ambil();
    const inisial = a.masuk ? a.nama.split(/\s+/).slice(0, 2).map((s) => s[0]).join('').toUpperCase() : 'N';
    const av = $('akun-avatar');
    av.replaceChildren();
    if (a.foto) {
      const img = new Image();
      img.alt = ''; img.className = 'w-full h-full object-cover'; img.src = a.foto;
      img.onerror = () => av.replaceChildren(document.createTextNode(inisial));
      av.append(img);
    } else av.textContent = inisial;
    $('akun-nama').textContent = a.masuk ? a.nama : 'Tamu NusaPangan';
    $('akun-info').textContent = a.masuk ? (a.email || 'Akun terdaftar') : 'Masuk untuk melihat transaksi Anda';
    $('akun-level').textContent = a.level || 'Member Keluarga';
    $('akun-masuk').classList.toggle('hidden', a.masuk);
  },

  /** Menggambar saldo NusaPay Pangan (bisa disembunyikan, pilihan disimpan di perangkat). */
  renderSaldo() {
    const s = Simpan.ambil('nusapay', { saldo: SALDO_AWAL, sembunyi: false });
    const sembunyi = !!s.sembunyi, t = $('saldo-toggle');
    $('saldo-nominal').textContent = sembunyi ? 'Rp ••••••' : Rp(s.saldo);
    t.setAttribute('aria-pressed', String(sembunyi));
    t.setAttribute('aria-label', sembunyi ? 'Tampilkan saldo' : 'Sembunyikan saldo');
    t.innerHTML = `<i data-lucide="${sembunyi ? 'eye-off' : 'eye'}" class="w-4 h-4"></i>`;
    ikon();
  },

  /** Menggambar daftar Voucher Subsidi. */
  renderVoucher() {
    $('voucher-jumlah').textContent = VOUCHER_SUBSIDI.length;
    $('voucher-daftar').innerHTML = VOUCHER_SUBSIDI.length ? VOUCHER_SUBSIDI.map((v) => `
      <li class="mk-tiket p-3">
        <p class="text-sm font-extrabold leading-snug">${esc(v.judul)}</p>
        <p class="mt-0.5 text-xs mk-muted">${esc(v.syarat)}</p>
        <div class="mt-2 flex items-center justify-between gap-2">
          <span class="text-[11px] mk-muted">${esc(v.berlaku)}</span>
          <button type="button" data-voucher="${esc(v.kode)}" class="inline-flex items-center gap-1 text-xs font-bold bg-tua text-white rounded-lg px-2.5 py-1 hover:brightness-110">
            <i data-lucide="copy" class="w-3 h-3"></i> Salin
          </button>
        </div>
      </li>`).join('') : '<li class="text-sm mk-muted">Belum ada voucher tersedia.</li>';
  },

  /**
   * Membuka/menutup satu panel akordeon. `inert` mencegah fokus keyboard masuk ke panel tertutup.
   * @param {HTMLElement} tombol @param {boolean} buka
   */
  atur(tombol, buka) {
    const panel = $(tombol.getAttribute('aria-controls'));
    tombol.setAttribute('aria-expanded', String(buka));
    panel.dataset.buka = String(buka);
    panel.firstElementChild.inert = !buka;
  },

  /** Menangani klik item menu: Daftar Transaksi menggulir ke area kanan, lainnya menampilkan toast. */
  klikMenu(item) {
    const kunci = item.dataset.menu;
    if (kunci === 'isi-saldo') { // Top Up simulasi: menambah saldo NusaPay di perangkat ini
      const s = Simpan.ambil('nusapay', { saldo: SALDO_AWAL, sembunyi: false });
      if (!Simpan.simpan('nusapay', { saldo: (Number(s.saldo) || 0) + TOPUP, sembunyi: !!s.sembunyi })) { toast('Gagal menyimpan: penyimpanan perangkat penuh'); return; }
      this.renderSaldo(); toast(`Top Up ${Rp(TOPUP)} berhasil (simulasi)`);
      return;
    }
    if (item.classList.contains('mk-item')) { // hanya item menu yang berganti tanda "halaman aktif"
      document.querySelectorAll('.mk-item[data-menu]').forEach((b) => b.removeAttribute('aria-current'));
      item.setAttribute('aria-current', 'true');
    }
    if (kunci === 'transaksi') {
      $('area-transaksi').scrollIntoView({ behavior: REDUKSI ? 'auto' : 'smooth', block: 'start' });
      $('judul-transaksi').focus({ preventScroll: true });
      return;
    }
    if (kunci === 'wishlist') { // arahkan ke katalog Market yang difilter wishlist
      const w = Simpan.ambil('wishlist', []);
      const n = Array.isArray(w) ? w.length : (w && typeof w === 'object' ? Object.keys(w).length : 0);
      toast(n ? `Wishlist kamu berisi ${n} produk` : 'Wishlist kamu masih kosong');
      location.href = 'market.html?filter=wishlist#katalog';
      return;
    }
    toast(`${NAMA_MENU[kunci] || 'Fitur ini'} segera hadir`);
  },

  /** Memasang seluruh event sidebar (satu delegasi klik) dan menggambar ulang konten dinamis. */
  init() {
    document.querySelectorAll('[data-acc]').forEach((b) => {
      this.atur(b, b.getAttribute('aria-expanded') === 'true');
      b.addEventListener('click', () => this.atur(b, b.getAttribute('aria-expanded') !== 'true'));
    });

    document.querySelector('aside[aria-label="Akun saya"]').addEventListener('click', (e) => {
      const m = e.target.closest('[data-menu]');
      if (m) return this.klikMenu(m);
      const v = e.target.closest('[data-voucher]');
      if (v) {
        const kode = v.dataset.voucher;
        const ok = () => toast(`Kode ${kode} disalin`);
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(kode).then(ok, ok); else ok();
        return;
      }
      if (e.target.closest('#saldo-toggle')) {
        const s = Simpan.ambil('nusapay', { saldo: SALDO_AWAL, sembunyi: false });
        Simpan.simpan('nusapay', { saldo: s.saldo, sembunyi: !s.sembunyi });
        this.renderSaldo();
        return;
      }
      if (e.target.closest('#akun-masuk')) {
        const A = window.NusaPangan && window.NusaPangan.Akun;
        if (A && typeof A.buka === 'function') A.buka(); else toast('Silakan masuk melalui menu akun di navbar');
      }
    });

    // Sinkron real-time: setiap perubahan akun (masuk/keluar/ubah profil) menggambar ulang nama, level, dan avatar.
    let t; // debounce agar beberapa sinyal beruntun hanya memicu satu render
    const sinkron = () => { clearTimeout(t); t = setTimeout(() => this.renderProfil(), 50); };
    window.addEventListener('nusapangan:akun', sinkron);   // event dari app.js saat akun berubah
    document.addEventListener('nusapangan:akun', sinkron); // bila event dikirim ke document tanpa bubbling
    window.addEventListener('storage', sinkron);           // perubahan dari tab/halaman lain
    window.addEventListener('focus', sinkron);             // jaring pengaman saat kembali ke tab ini
    window.addEventListener('pageshow', sinkron);          // kembali lewat tombol back (bfcache)

    this.renderProfil(); this.renderSaldo(); this.renderVoucher(); ikon();
  }
};

/* =====================================================================
 * 3) LONCENG NOTIFIKASI NAVBAR (dulu notif.js)
 * ===================================================================== */

(function () {
  'use strict';

  const AWAL = 'nusapangan:';
  const HALAMAN = 'transaksi.html';

  /** Tahap pesanan (urutan = urutan ikon shortcut). Pesanan selesai = "sampai". */
  const TAHAP = {
    konfirmasi: { label: 'Menunggu Konfirmasi', ikon: 'hourglass', info: 'menunggu konfirmasi dari penjual.' },
    diproses: { label: 'Pesanan Diproses', ikon: 'package', info: 'sedang disiapkan oleh petani.' },
    dikirim: { label: 'Sedang Dikirim', ikon: 'truck', info: 'sedang dalam perjalanan ke alamat Anda.' },
    sampai: { label: 'Sampai Tujuan', ikon: 'package-check', info: 'sudah sampai di tujuan.' }
  };

  /** Notifikasi tab "Update" (DATA SIMULASI). */
  const UPDATE = [
    { id: 'upd-voucher', ikon: 'ticket', judul: 'Voucher Subsidi tersedia', teks: 'Cek voucher di dashboard akun untuk potongan belanja pangan.', waktu: 'Hari ini' },
    { id: 'upd-panen', ikon: 'sprout', judul: 'Stok sayur segar diperbarui', teks: 'Panen terbaru dari kebun warga sudah masuk katalog.', waktu: 'Kemarin' },
    { id: 'upd-donasi', ikon: 'heart-handshake', judul: 'Terima kasih atas donasi pangan', teks: 'Donasi Anda dicatat untuk aksi Food Rescue.', waktu: '3 hari lalu' }
  ];

  const $ = (id) => document.getElementById(id);
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const REDUKSI = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const info = (pesan) => { try { if (typeof toast === 'function') toast(pesan); } catch (e) { /* toast tidak tersedia */ } };

  function baca(k, cadangan) { try { const m = localStorage.getItem(AWAL + k); return m === null ? cadangan : JSON.parse(m); } catch (e) { return cadangan; } }
  function tulis(k, v) { try { localStorage.setItem(AWAL + k, JSON.stringify(v)); return true; } catch (e) { return false; } }

  /** Milidetik aman dari tanggal apa pun (tanggal rusak = 0, tidak merusak urutan). */
  const ms = (t) => { const n = new Date(t).getTime(); return isNaN(n) ? 0 : n; };

  /** @returns {Object[]} pesanan valid (punya id & item), terbaru di atas */
  function pesanan() {
    const d = baca('riwayatBelanja', []);
    return (Array.isArray(d) ? d : [])
      .filter((x) => x && typeof x === 'object' && x.id != null && Array.isArray(x.item))
      .sort((a, b) => ms(b.tgl) - ms(a.tgl));
  }
  /** Pesanan lama tanpa status dianggap selesai (sama dengan Transaksi.status). */
  const status = (x) => (['berlangsung', 'selesai', 'dibatalkan'].includes(x.status) ? x.status : 'selesai');
  /** @returns {?string} kunci TAHAP; null bila dibatalkan */
  function tahap(x) {
    const s = status(x);
    if (s === 'dibatalkan') return null;
    if (s === 'selesai') return 'sampai';
    return TAHAP[x.tahap] && x.tahap !== 'sampai' ? x.tahap : 'konfirmasi';
  }

  /**
   * Daftar notifikasi transaksi: SEMUA pesanan yang bukan "dibatalkan" (berlangsung + selesai/sampai),
   * terbaru di atas. ID unik per pesanan per tahap, jadi pindah tahap = notifikasi baru (belum dibaca).
   * @returns {{id:string, invoice:string, tahap:string, tgl:*}[]}
   */
  function daftarNotif() {
    return pesanan().filter((x) => tahap(x)).map((x) => ({ id: `trx:${x.id}:${tahap(x)}`, invoice: String(x.id), tahap: tahap(x), tgl: x.tgl }));
  }

  function waktu(tgl) {
    const m = Math.round((Date.now() - ms(tgl)) / 60000);
    if (!ms(tgl) || isNaN(m)) return '';
    if (m < 1) return 'Baru saja';
    if (m < 60) return `${m} menit lalu`;
    if (m < 1440) return `${Math.floor(m / 60)} jam lalu`;
    return `${Math.floor(m / 1440)} hari lalu`;
  }

  const dibaca = () => { const d = baca('notifDibaca', []); return Array.isArray(d) ? d : []; };
  /**
   * Mencatat ID notifikasi ke LocalStorage "nusapangan:notifDibaca" SEKARANG JUGA, lalu menyegarkan badge.
   * @param {string[]} ids @param {boolean} [tunda] true untuk klik pada <a>: gambar ulang ditunda setelah klik selesai,
   *   sebab mengganti innerHTML saat klik membuat tautan lepas dari DOM sehingga navigasinya batal.
   */
  function tandai(ids, tunda) {
    const s = new Set(dibaca());
    ids.filter(Boolean).forEach((i) => s.add(String(i)));
    tulis('notifDibaca', Array.from(s).slice(-500)); // disimpan sinkron
    if (tunda) setTimeout(() => { if (window.NotifNav) window.NotifNav.segarkan(); }, 0);
    else if (window.NotifNav) window.NotifNav.segarkan();
  }
  /** ID notifikasi transaksi pada satu tahap ('' = semua tahap, termasuk "sampai"). */
  const idTahap = (t) => daftarNotif().filter((x) => !t || x.tahap === t).map((x) => x.id);
  const href = (t) => HALAMAN + (t ? `?tahap=${encodeURIComponent(t)}` : '');

  /* Real-time: setiap Simpan.simpan('riwayatBelanja', ...) yang berhasil (checkout, ubah status, seed)
   * otomatis menyegarkan badge & popup lonceng. Dipasang sekali; event "storage" hanya untuk tab lain. */
  if (typeof Simpan !== 'undefined' && Simpan && typeof Simpan.simpan === 'function' && !Simpan.__notifTerpasang) {
    const asli = Simpan.simpan.bind(Simpan);
    Simpan.simpan = function (k, v) {
      const ok = asli(k, v);
      if (ok && k === 'riwayatBelanja' && window.NotifNav) window.NotifNav.segarkan();
      return ok;
    };
    Simpan.__notifTerpasang = true;
  }

  const NotifNav = {
    TAHAP,
    pin: false,   // true = dibuka lewat klik/keyboard, tidak menutup saat kursor keluar
    timer: null,
    n: 0,         // jumlah belum dibaca terakhir (animasi badge)
    siap: false,
    hover: window.matchMedia('(hover: hover) and (pointer: fine)').matches,

    /** Menggambar ulang badge, tab, dan isi popup dari data terbaru. Aman dipanggil kapan saja. */
    segarkan() {
      const bd = $('badge-notif'), p1 = $('panel-notif-transaksi'), p2 = $('panel-notif-update'), btn = $('btn-notif');
      if (!bd || !p1 || !p2) return;
      const b = dibaca(), notif = daftarNotif();
      const belum = (id) => !b.includes(id);

      const hit = { konfirmasi: 0, diproses: 0, dikirim: 0, sampai: 0 };   // belum dibaca per tahap
      notif.forEach((x) => { if (belum(x.id)) hit[x.tahap]++; });
      const baruTrx = notif.filter((x) => belum(x.id)).length;
      const baruUpd = UPDATE.filter((x) => belum(x.id)).length;
      const jumlah = baruTrx + baruUpd;                                    // badge lonceng = trx + update

      bd.textContent = jumlah > 9 ? '9+' : String(jumlah);
      bd.classList.toggle('scale-0', jumlah === 0); bd.classList.toggle('scale-100', jumlah > 0);
      bd.setAttribute('aria-hidden', String(jumlah === 0));
      if (btn) btn.setAttribute('aria-label', jumlah ? `Buka notifikasi, ${jumlah} belum dibaca` : 'Buka notifikasi');
      if (jumlah > this.n && !REDUKSI) { bd.classList.remove('badge-pantul'); void bd.offsetWidth; bd.classList.add('badge-pantul'); }
      this.n = jumlah;
      [['transaksi', baruTrx], ['update', baruUpd]].forEach(([k, v]) => {
        const el = document.querySelector(`[data-n-tab="${k}"]`);
        if (el) { el.textContent = v; el.classList.toggle('hidden', !v); }
      });

      const titik = '<span class="mt-1.5 w-2.5 h-2.5 shrink-0 rounded-full bg-red-600" aria-label="Belum dibaca"></span>';
      const ikonTahap = Object.keys(TAHAP).map((k) => `
        <li><a href="${href(k)}" data-notif-link data-tahap="${k}" aria-label="${TAHAP[k].label}${hit[k] ? `, ${hit[k]} belum dibaca` : ''}" class="flex flex-col items-center gap-1.5 rounded-xl p-1.5 hover:bg-segar/10">
          <span class="relative w-12 h-12 rounded-full bg-segar text-white grid place-items-center shadow-sm">
            <i data-lucide="${TAHAP[k].ikon}" class="w-5 h-5"></i>
            ${hit[k] ? `<span class="absolute -top-1 -right-1 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-panen text-tua text-[10px] font-extrabold grid place-items-center ring-2 ring-[var(--mk-surface)]" aria-hidden="true">${hit[k]}</span>` : ''}
          </span>
          <span class="text-[11px] font-semibold leading-tight text-center" aria-hidden="true">${TAHAP[k].label}</span>
        </a></li>`).join('');

      const terbaru = notif.length ? notif.slice(0, 5).map((x) => {
        const T = TAHAP[x.tahap];
        return `<li><a href="${HALAMAN}?tahap=${encodeURIComponent(x.tahap)}&amp;invoice=${encodeURIComponent(x.invoice)}" data-notif-link data-notif-item="${esc(x.id)}" data-tahap="${x.tahap}" data-invoice="${esc(x.invoice)}" class="flex items-start gap-3 rounded-xl p-2.5 hover:bg-segar/10">
          <span class="w-9 h-9 shrink-0 rounded-full bg-segar text-white grid place-items-center"><i data-lucide="${T.ikon}" class="w-4 h-4"></i></span>
          <span class="min-w-0 flex-1"><span class="block text-sm font-bold leading-snug">${T.label}</span>
            <span class="block text-xs mk-muted leading-relaxed">Invoice ${esc(x.invoice)} ${T.info}</span>
            <span class="block mt-0.5 text-[11px] mk-muted">${esc(waktu(x.tgl))}</span></span>
          ${belum(x.id) ? titik : ''}
        </a></li>`;
      }).join('') : '<li class="py-6 text-center text-sm mk-muted">Belum ada pesanan.</li>';

      const fokus = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.notifItem : null;
      p1.innerHTML = `
        <div class="flex items-center justify-between gap-3">
          <h3 class="text-sm font-extrabold">Status Pesanan</h3>
          <a href="${HALAMAN}" data-notif-link data-tahap="" class="text-sm font-bold mk-aksen hover:underline">Lihat Semua</a>
        </div>
        <ul class="mt-2 grid grid-cols-4 gap-1">${ikonTahap}</ul>
        <h3 class="mt-4 text-sm font-extrabold">Terbaru</h3>
        <ul class="mt-1 space-y-0.5">${terbaru}</ul>`;
      p2.innerHTML = `<ul class="space-y-0.5">${UPDATE.map((u) => `
        <li><button type="button" data-notif-item="${u.id}" class="w-full flex items-start gap-3 rounded-xl p-2.5 text-left hover:bg-segar/10">
          <span class="w-9 h-9 shrink-0 rounded-full bg-panen/25 text-panen grid place-items-center"><i data-lucide="${u.ikon}" class="w-4 h-4"></i></span>
          <span class="min-w-0 flex-1"><span class="block text-sm font-bold leading-snug">${esc(u.judul)}</span>
            <span class="block text-xs mk-muted leading-relaxed">${esc(u.teks)}</span>
            <span class="block mt-0.5 text-[11px] mk-muted">${esc(u.waktu)}</span></span>
          ${belum(u.id) ? titik : ''}
        </button></li>`).join('')}</ul>`;

      if (window.lucide) window.lucide.createIcons();
      const pop = $('popup-notif');
      if (fokus && pop) { const el = pop.querySelector(`[data-notif-item="${CSS.escape(fokus)}"]`); if (el) el.focus(); }
    },

    terbuka() { return !$('popup-notif').classList.contains('hidden'); },

    /** @param {boolean} pin true bila dibuka lewat klik/keyboard */
    buka(pin) {
      clearTimeout(this.timer);
      if (pin) this.pin = true;
      $('popup-notif').classList.remove('hidden');
      $('btn-notif').setAttribute('aria-expanded', 'true');
    },

    /** @param {boolean} [kembaliFokus] kembalikan fokus ke lonceng (untuk Esc) */
    tutup(kembaliFokus) {
      clearTimeout(this.timer); this.pin = false;
      $('popup-notif').classList.add('hidden');
      $('btn-notif').setAttribute('aria-expanded', 'false');
      if (kembaliFokus) $('btn-notif').focus();
    },

    /** @param {string} nama 'transaksi' | 'update' @param {boolean} [fokus] */
    pilihTab(nama, fokus) {
      ['transaksi', 'update'].forEach((k) => {
        const aktif = k === nama, tab = $('tab-notif-' + k);
        tab.setAttribute('aria-selected', String(aktif)); tab.tabIndex = aktif ? 0 : -1;
        $('panel-notif-' + k).hidden = !aktif;
        if (aktif && fokus) tab.focus();
      });
    },

    init() {
      const wrap = $('wrap-notif'), btn = $('btn-notif'), pop = $('popup-notif');
      if (this.siap || !wrap || !btn || !pop) return;
      this.siap = true;

      // Lonceng tepat di sebelah keranjang (keranjang mungkin sudah dipindah ke grup tombol app.js)
      const k = $('btn-keranjang');
      if (k && k.parentNode && k.nextSibling !== wrap) k.parentNode.insertBefore(wrap, k.nextSibling);

      btn.addEventListener('click', () => {
        if (!this.terbuka()) this.buka(true);
        else if (!this.pin) this.pin = true;   // dibuka lewat hover lalu diklik: kunci terbuka
        else this.tutup(false);
      });
      if (this.hover) {
        wrap.addEventListener('mouseenter', () => { clearTimeout(this.timer); if (!this.terbuka()) this.timer = setTimeout(() => this.buka(false), 80); });
        wrap.addEventListener('mouseleave', () => { clearTimeout(this.timer); if (!this.pin) this.timer = setTimeout(() => this.tutup(false), 200); });
      }
      document.addEventListener('click', (e) => { if (this.terbuka() && !wrap.contains(e.target)) this.tutup(false); });
      document.addEventListener('focusin', (e) => { if (this.terbuka() && !wrap.contains(e.target)) this.tutup(false); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.terbuka()) this.tutup(true); });

      document.querySelectorAll('[data-notif-tab]').forEach((t) => t.addEventListener('click', () => this.pilihTab(t.dataset.notifTab)));
      pop.querySelector('[role="tablist"]').addEventListener('keydown', (e) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
        e.preventDefault();
        this.pilihTab(e.key === 'ArrowLeft' || e.key === 'Home' ? 'transaksi' : 'update', true);
      });

      pop.addEventListener('click', (e) => {
        // (a) Tautan: item "Terbaru", 4 ikon status, "Lihat Semua" -> tandai dulu, baru pindah ke transaksi.html
        const a = e.target.closest('a[data-notif-link]');
        if (a) {
          const t = a.dataset.tahap || '';
          // item "Terbaru" = 1 ID; ikon status = semua ID pada tahap itu; "Lihat Semua" (tahap kosong) = semua notifikasi transaksi
          const ids = a.dataset.notifItem ? [a.dataset.notifItem] : idTahap(t);
          tandai(ids, true); // tercatat seketika; gambar ulang ditunda agar navigasi tautan tidak batal
          const ev = new CustomEvent('np:transaksi', { cancelable: true, detail: { tahap: t, invoice: a.dataset.invoice || '' } });
          if (!document.dispatchEvent(ev)) { e.preventDefault(); this.tutup(false); } // halaman menangani sendiri
          return;
        }
        // (b) Tab Update: tandai item, segarkan, toast singkat
        const item = e.target.closest('button[data-notif-item]');
        if (item) {
          const u = UPDATE.find((x) => x.id === item.dataset.notifItem);
          tandai([item.dataset.notifItem]);   // sudah memanggil NotifNav.segarkan()
          if (u) info(u.judul);
        }
      });

      const semua = $('notif-baca-semua');
      if (semua) semua.addEventListener('click', () => {
        tandai(daftarNotif().map((x) => x.id).concat(UPDATE.map((u) => u.id))); // semua tahap (termasuk "sampai") + semua Update; memanggil segarkan()
        info('Semua notifikasi ditandai sudah dibaca');
      });
      window.addEventListener('storage', () => this.segarkan()); // sinkron antar tab

      if (typeof Transaksi !== 'undefined' && typeof Transaksi.seed === 'function') Transaksi.seed(); // data contoh (sekali)
      this.segarkan();
    }
  };

  window.NotifNav = NotifNav;
  // Ditunda satu putaran agar berjalan SETELAH init halaman (navbar memindah keranjang, data contoh terisi).
  const mulai = () => setTimeout(() => NotifNav.init(), 0);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mulai); else mulai();
})();
