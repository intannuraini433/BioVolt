// ---------- Pengaturan ----------
const daftarDevice = [
  { id: 1, nama: "DEVICE 1", ket: "Generator Biogas", min: 11.5, max: 13.0, energi: 0 },
  { id: 2, nama: "DEVICE 2", ket: "Baterai",          min: 11.0, max: 12.8, energi: 0 },
  { id: 3, nama: "DEVICE 3", ket: "Beban / Output",   min: 11.8, max: 13.2, energi: 0 },
];

const SKALA_MIN = 10;   // ujung kiri gauge (Volt)
const SKALA_MAX = 14;   // ujung kanan gauge (Volt)
const PANJANG_BUSUR = 251.3;
const NAMA_BULAN = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const bulanIni = new Date().getMonth();   // 0 = Januari
const grafik = {};                        // menyimpan grafik tiap device

function acak(min, max) {
  return Math.random() * (max - min) + min;
}
function tampilkan(id, nilai) {
  document.getElementById(id).textContent = nilai;
}

// ---------- Membuat panel device ----------
function buatDevice() {
  const wadah = document.getElementById("daftar-device");

  daftarDevice.forEach(d => {
    wadah.insertAdjacentHTML("beforeend", `
      <div class="device">
        <div class="device-header">
          <span>${d.nama}<small>${d.ket}</small></span>
          <span>⋮</span>
        </div>

        <div class="device-body">

          <div class="device-gauge">
            <p class="sub">Voltage</p>
            <svg viewBox="0 0 200 115" class="gauge">
              <defs>
                <linearGradient id="grad-${d.id}" gradientUnits="userSpaceOnUse" x1="20" y1="0" x2="180" y2="0">
                  <stop offset="0%" stop-color="#bfe8d0"/>
                  <stop offset="100%" stop-color="#1f9d63"/>
                </linearGradient>
              </defs>
              <path class="gauge-bg" d="M 20 100 A 80 80 0 0 1 180 100"/>
              <path class="gauge-isi" id="isi-${d.id}" d="M 20 100 A 80 80 0 0 1 180 100" stroke="url(#grad-${d.id})"/>
              <line class="jarum" id="jarum-${d.id}" x1="100" y1="100" x2="100" y2="32"/>
              <circle class="gauge-pusat" cx="100" cy="100" r="7"/>
            </svg>
            <p class="gauge-nilai"><span id="v-${d.id}">0</span> V</p>
          </div>

          <div class="device-daya">
            <p class="sub">Daya</p>
            <p class="daya-nilai"><span id="p-${d.id}">0</span> <small>W</small></p>
            <div class="daya-info">
              <span id="waktu-${d.id}">--:--:--</span>
              <span>⚡ <b id="e-${d.id}">0.0000</b> kWh</span>
            </div>
            <div class="daya-mini">
              <span>Arus <b id="a-${d.id}">0</b> A</span>
              <span>Suhu <b id="s-${d.id}">0</b> °C</span>
            </div>
          </div>

          <div class="device-chart">
            <div class="kanvas"><canvas id="grafik-${d.id}"></canvas></div>
          </div>

        </div>
      </div>
    `);

    buatGrafik(d);
  });
}

// ---------- Membuat grafik ----------
function buatGrafik(d) {
  // Data tahun lalu: 12 bulan penuh (simulasi tetap)
  const tahunLalu = NAMA_BULAN.map(() => acak(d.min + 0.2, d.max - 0.2));
  // Data tahun ini: hanya sampai bulan ini, sisanya kosong (null)
  const tahunIni = NAMA_BULAN.map((_, i) =>
    i <= bulanIni ? acak(d.min + 0.2, d.max - 0.2) : null
  );

  grafik[d.id] = new Chart(document.getElementById(`grafik-${d.id}`), {
    type: "line",
    data: {
      labels: NAMA_BULAN,
      datasets: [
        {
          label: "Tahun lalu",
          data: tahunLalu,
          fill: true,
          backgroundColor: "rgba(31, 157, 99, 0.18)",
          borderWidth: 0,
          pointRadius: 0,
          tension: 0.4,
        },
        {
          label: "Tahun ini",
          data: tahunIni,
          borderColor: "#1f9d63",
          borderWidth: 2,
          pointRadius: ctx => (ctx.dataIndex === bulanIni ? 4 : 0),
          pointBackgroundColor: "#1f9d63",
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          align: "end",
          labels: { boxWidth: 12, font: { size: 11 } },
        },
      },
      scales: {
        y: { min: SKALA_MIN, max: SKALA_MAX, ticks: { font: { size: 11 } } },
        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      },
    },
  });
}

// ---------- Memperbarui data simulasi ----------
function perbaruiData() {
  let suhuTertinggi = 0;
let jumlahV = 0, jumlahA = 0, jumlahP = 0, jumlahE = 0;

  daftarDevice.forEach(d => {
    const v    = acak(d.min, d.max);   // Volt
    const a    = acak(0.8, 2.2);       // Ampere
    const p    = v * a;                // Watt
    const suhu = acak(30, 44);         // Celsius

    d.energi += (p / 1000) * (2 / 3600);   // kWh bertambah tiap 2 detik
   if (suhu > suhuTertinggi) suhuTertinggi = suhu;
jumlahV += v;
jumlahA += a;
jumlahP += p;
jumlahE += d.energi;
    // Gauge: hitung posisi 0 (kiri) sampai 1 (kanan)
    const persen = Math.min(1, Math.max(0, (v - SKALA_MIN) / (SKALA_MAX - SKALA_MIN)));
    document.getElementById(`isi-${d.id}`).style.strokeDashoffset = PANJANG_BUSUR * (1 - persen);
    document.getElementById(`jarum-${d.id}`).style.transform = `rotate(${-90 + persen * 180}deg)`;

    tampilkan(`v-${d.id}`, v.toFixed(1));
    tampilkan(`p-${d.id}`, p.toFixed(1));
    tampilkan(`a-${d.id}`, a.toFixed(2));
    tampilkan(`s-${d.id}`, suhu.toFixed(1));
    tampilkan(`e-${d.id}`, d.energi.toFixed(4));
    tampilkan(`waktu-${d.id}`, new Date().toLocaleTimeString("id-ID"));

    // Titik terakhir grafik "Tahun ini" ikut bergerak
    grafik[d.id].data.datasets[1].data[bulanIni] = v;
    grafik[d.id].update();
  });
perbaruiListrik(jumlahV / daftarDevice.length, jumlahA, jumlahP, jumlahE);
catatRiwayat(jumlahV / daftarDevice.length, jumlahA, jumlahP, jumlahE, suhuTertinggi);
  if (suhuTertinggi > 43) {
    kirimNotif("suhu-device", "peringatan", "Suhu perangkat tinggi",
      `Suhu tertinggi ${suhuTertinggi.toFixed(1)} °C. Periksa pendinginan.`);
  }
// Status sistem: waspada kalau ada suhu di atas 40 °C
  const bar = document.getElementById("status-bar");
  if (suhuTertinggi > 40) {
    bar.classList.add("waspada");
    tampilkan("status-teks", "Waspada: Suhu Tinggi");
  } else {
    bar.classList.remove("waspada");
    tampilkan("status-teks", "Sistem Normal");
  }
}
// ---------- Monitoring Listrik ----------
const MAKS_TITIK = 20;      // jumlah titik yang tampil di grafik
const TARIF = 1500;         // Rp per kWh (angka contoh, bisa kamu ubah)
let grafikListrik;

function buatGrafikListrik() {
  grafikListrik = new Chart(document.getElementById("grafik-listrik"), {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Tegangan (V)",
          data: [],
          borderColor: "#1f9d63",
          backgroundColor: "rgba(31, 157, 99, 0.12)",
          fill: true,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4,
          yAxisID: "y",
        },
        {
          label: "Daya (W)",
          data: [],
          borderColor: "#f1b800",
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { position: "top", align: "end" } },
      scales: {
        y:  { position: "left",  title: { display: true, text: "Volt" } },
        y1: { position: "right", title: { display: true, text: "Watt" }, grid: { drawOnChartArea: false } },
        x:  { grid: { display: false }, ticks: { maxTicksLimit: 6 } },
      },
    },
  });
}

function perbaruiListrik(rataV, totalA, totalP, totalE) {
  // Kartu ringkasan
  tampilkan("lt-tegangan", rataV.toFixed(1));
  tampilkan("lt-arus", totalA.toFixed(2));
  tampilkan("lt-daya", totalP.toFixed(1));
  tampilkan("lt-energi", totalE.toFixed(4));

  // Estimasi: daya saat ini dianggap tetap
  const kwhPerHari  = (totalP / 1000) * 24;
  const kwhPerBulan = kwhPerHari * 30;
  tampilkan("lt-hari", kwhPerHari.toFixed(2));
  tampilkan("lt-bulan", kwhPerBulan.toFixed(1));
  tampilkan("lt-biaya", Math.round(kwhPerBulan * TARIF).toLocaleString("id-ID"));

  // Grafik: tambah titik baru, buang yang paling lama
  const data = grafikListrik.data;
  data.labels.push(new Date().toLocaleTimeString("id-ID"));
  data.datasets[0].data.push(rataV);
  data.datasets[1].data.push(totalP);
  if (data.labels.length > MAKS_TITIK) {
    data.labels.shift();
    data.datasets[0].data.shift();
    data.datasets[1].data.shift();
  }
  grafikListrik.update();
}
// ---------- Biodigester & Gas ----------
let grafikBiogas;
let levelGas = 40;   // level awal tangki (%)

function buatGrafikBiogas() {
  grafikBiogas = new Chart(document.getElementById("grafik-biogas"), {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Suhu (°C)",
          data: [],
          borderColor: "#e67e22",
          backgroundColor: "rgba(230, 126, 34, 0.12)",
          fill: true,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4,
          yAxisID: "y",
        },
        {
          label: "Tekanan (kPa)",
          data: [],
          borderColor: "#1f9d63",
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { position: "top", align: "end" } },
      scales: {
        y:  { position: "left",  min: 25, max: 45, title: { display: true, text: "°C" } },
        y1: { position: "right", min: 0,  max: 4,  title: { display: true, text: "kPa" }, grid: { drawOnChartArea: false } },
        x:  { grid: { display: false }, ticks: { maxTicksLimit: 6 } },
      },
    },
  });
}

// Mengatur lampu sensor: ok = true (hijau), false (oranye)
function aturLampu(id, ok) {
  document.getElementById(id).classList.toggle("perhatian", !ok);
}

function perbaruiBiogas() {
  const suhu    = acak(31, 39);     // °C
  const tekanan = acak(1.2, 2.8);   // kPa
  const metana  = acak(54, 66);     // %

  // Level gas naik turun pelan-pelan, dijaga antara 5 sampai 100
  levelGas = Math.min(100, Math.max(5, levelGas + acak(-1.5, 2.5)));

  // Kartu
  tampilkan("bg-suhu", suhu.toFixed(1));
  tampilkan("bg-tekanan", tekanan.toFixed(2));
  tampilkan("bg-metana", metana.toFixed(1));
  tampilkan("bg-level", levelGas.toFixed(0));

  // Bar level tangki
  document.getElementById("bar-level").style.width = levelGas + "%";

  // Nilai di daftar sensor
  tampilkan("sv-suhu", suhu.toFixed(1) + " °C");
  tampilkan("sv-tekanan", tekanan.toFixed(2) + " kPa");
  tampilkan("sv-metana", metana.toFixed(1) + " %");
  tampilkan("sv-level", levelGas.toFixed(0) + " %");

  // Aturan batas (angka contoh, bisa kamu ubah)
  const suhuOk    = suhu >= 32 && suhu <= 38;
  const tekananOk = tekanan <= 2.6;
  const metanaOk  = metana >= 55;
  const levelOk   = levelGas < 90;

  aturLampu("lampu-suhu", suhuOk);
  aturLampu("lampu-tekanan", tekananOk);
  aturLampu("lampu-metana", metanaOk);
  aturLampu("lampu-level", levelOk);

  // Status keseluruhan
  const bar = document.getElementById("status-biogas");
  let pesan = "Biodigester Normal";
  if (!suhuOk)    pesan = "Perhatian: Suhu di luar rentang ideal";
  else if (!tekananOk) pesan = "Perhatian: Tekanan gas tinggi";
  else if (!metanaOk)  pesan = "Perhatian: Kadar metana rendah";
  else if (!levelOk)   pesan = "Perhatian: Tangki gas hampir penuh";

  bar.classList.toggle("waspada", pesan !== "Biodigester Normal");
  tampilkan("status-biogas-teks", pesan);

  // Notifikasi masalah biodigester
  if (!suhuOk)    kirimNotif("suhu-bio", "peringatan", "Suhu digester di luar rentang",
                    `Suhu ${suhu.toFixed(1)} °C (ideal 32-38 °C).`);
  if (!tekananOk) kirimNotif("tekanan", "peringatan", "Tekanan gas tinggi",
                    `Tekanan ${tekanan.toFixed(2)} kPa (batas 2.6 kPa).`);
  if (!metanaOk)  kirimNotif("metana", "peringatan", "Kadar metana rendah",
                    `Metana ${metana.toFixed(1)} % (minimal 55 %).`);
  if (!levelOk)   kirimNotif("level", "peringatan", "Tangki gas hampir penuh",
                    `Level gas ${levelGas.toFixed(0)} %.`);

  perbaruiKebocoran();
  // Grafik: tambah titik baru, buang yang paling lama
  const data = grafikBiogas.data;
  data.labels.push(new Date().toLocaleTimeString("id-ID"));
  data.datasets[0].data.push(suhu);
  data.datasets[1].data.push(tekanan);
  if (data.labels.length > 20) {
    data.labels.shift();
    data.datasets[0].data.shift();
    data.datasets[1].data.shift();
  }
  grafikBiogas.update();
}
// ---------- Perangkat IoT ----------

// Lama sesi demo: dihitung sejak halaman dibuka
const waktuMulai = Date.now();

function perbaruiSesi() {
  const detik = Math.floor((Date.now() - waktuMulai) / 1000);
  const jam   = String(Math.floor(detik / 3600)).padStart(2, "0");
  const menit = String(Math.floor((detik % 3600) / 60)).padStart(2, "0");
  const dtk   = String(detik % 60).padStart(2, "0");
  tampilkan("iot-sesi", `${jam}:${menit}:${dtk}`);
}

// ---------- Riwayat Data ----------
const riwayat = [];            // daftar catatan (yang terbaru di depan)
const MAKS_RIWAYAT = 30;       // simpan maksimal 30 baris
let hitungRiwayat = 0;
let nomorRiwayat = 0;

function catatRiwayat(v, a, p, e, suhu) {
  hitungRiwayat++;
  if (hitungRiwayat % 3 !== 1) return;   // catat tiap 3 kali update (6 detik)

  nomorRiwayat++;
  riwayat.unshift({
    no: nomorRiwayat,
    waktu: new Date().toLocaleTimeString("id-ID"),
    v, a, p, e, suhu,
    status: suhu > 40 ? "Waspada" : "Normal",
  });
  if (riwayat.length > MAKS_RIWAYAT) riwayat.pop();

  tampilkanRiwayat();
}

function tampilkanRiwayat() {
  const isi = document.getElementById("tabel-riwayat");

  if (riwayat.length === 0) {
    isi.innerHTML = `<tr><td colspan="8" class="kosong">Belum ada data.</td></tr>`;
  } else {
    isi.innerHTML = riwayat.map(r => `
      <tr>
        <td>${r.no}</td>
        <td>${r.waktu}</td>
        <td>${r.v.toFixed(1)}</td>
        <td>${r.a.toFixed(2)}</td>
        <td>${r.p.toFixed(1)}</td>
        <td>${r.e.toFixed(4)}</td>
        <td>${r.suhu.toFixed(1)}</td>
        <td><span class="lencana ${r.status === "Normal" ? "hijau" : "oranye"}">${r.status}</span></td>
      </tr>
    `).join("");
  }

  tampilkan("rw-jumlah", riwayat.length);
}

// Tombol hapus
document.getElementById("tombol-hapus").addEventListener("click", function () {
  riwayat.length = 0;
  tampilkanRiwayat();
});

// Tombol unduh CSV
document.getElementById("tombol-unduh").addEventListener("click", function () {
  if (riwayat.length === 0) {
    alert("Belum ada data untuk diunduh.");
    return;
  }
  const baris = ["No,Waktu,Tegangan (V),Arus (A),Daya (W),Energi (kWh),Suhu Maks (C),Status"];
  riwayat.forEach(r => {
    baris.push([r.no, r.waktu, r.v.toFixed(1), r.a.toFixed(2), r.p.toFixed(1),
                r.e.toFixed(4), r.suhu.toFixed(1), r.status].join(","));
  });

  const berkas = new Blob([baris.join("\n")], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(berkas);
  link.download = "riwayat-biovolt.csv";
  link.click();
  URL.revokeObjectURL(link.href);
});

tampilkanRiwayat();
// Penyebab dan saran penanganan untuk tiap jenis masalah
// (isi contoh, sesuaikan dengan alat yang sebenarnya)
const PANDUAN = {
  "bocor": {
    halaman: "biogas",
    penyebab: [
      "Sambungan pipa atau selang gas longgar",
      "Katup atau regulator bocor",
      "Membran digester atau tangki gas robek",
    ],
    saran: [
      "Jauhkan api, rokok, dan sumber percikan listrik",
      "Buka ventilasi dan jangan menyalakan saklar listrik di area itu",
      "Periksa sambungan pipa dengan air sabun (gelembung = bocor)",
    ],
  },
  "bocor-waspada": {
    halaman: "biogas",
    penyebab: [
      "Kebocoran kecil di sambungan pipa",
      "Gas keluar saat pengisian atau pembuangan",
    ],
    saran: [
      "Periksa sambungan dan katup di sekitar digester",
      "Pantau terus kadar gas, naikkan ventilasi",
    ],
  },
  "suhu-bio": {
    halaman: "biogas",
    penyebab: [
      "Suhu lingkungan terlalu panas atau dingin",
      "Isi digester terlalu sedikit atau terlalu banyak",
      "Sensor suhu rusak atau bergeser",
    ],
    saran: [
      "Cek lokasi dan naungan digester",
      "Cek volume isian bahan organik",
      "Bandingkan dengan termometer manual",
    ],
  },
  "tekanan": {
    halaman: "biogas",
    penyebab: [
      "Gas menumpuk karena tidak dipakai",
      "Pipa keluaran gas tersumbat",
      "Produksi gas meningkat",
    ],
    saran: [
      "Pakai atau salurkan gas yang tersimpan",
      "Periksa pipa keluaran dari sumbatan atau air kondensasi",
      "Cek katup pengaman tekanan",
    ],
  },
  "metana": {
    halaman: "biogas",
    penyebab: [
      "Fermentasi belum stabil (isi masih baru)",
      "Komposisi bahan kurang ideal",
      "Keasaman (pH) digester tidak seimbang",
    ],
    saran: [
      "Beri waktu fermentasi, jangan menambah bahan berlebihan",
      "Atur campuran bahan organik dan air",
      "Cek pH isi digester",
    ],
  },
  "level": {
    halaman: "biogas",
    penyebab: [
      "Produksi gas lebih banyak dari pemakaian",
      "Tangki hampir penuh",
    ],
    saran: [
      "Gunakan gas atau kurangi isi tangki",
      "Siapkan penyaluran gas berlebih dengan aman",
    ],
  },
  "suhu-device": {
    halaman: "dashboard",
    penyebab: [
      "Kipas pendingin mati atau terhalang",
      "Beban listrik terlalu besar",
      "Sirkulasi udara di sekitar perangkat buruk",
    ],
    saran: [
      "Periksa dan nyalakan kipas pendingin",
      "Kurangi beban listrik",
      "Beri ruang udara di sekitar perangkat",
    ],
  },
  "pulih": {
    halaman: "biogas",
    penyebab: ["Kadar gas sudah turun ke batas aman"],
    saran: ["Tetap periksa sambungan pipa untuk memastikan sumber masalahnya"],
  },
};

const NAMA_HALAMAN = {
  dashboard: "Dashboard",
  listrik: "Monitoring Listrik",
  biogas: "Biodigester & Gas",
};
// ---------- Notifikasi & Deteksi Kebocoran ----------
const COOLDOWN = 60000;          // satu jenis notifikasi maksimal sekali per 60 detik
const waktuNotif = {};           // mencatat kapan tiap jenis terakhir dikirim
const daftarNotif = [];
const IKON_NOTIF = { bahaya: "🚨", peringatan: "⚠️", info: "✅" };

let belumDibaca = 0;
let simulasiBocor = false;
let kadarBocor = 120;            // ppm, kondisi awal aman
let alarmDitutup = false;
let sedangBocor = false;
let audioCtx = null;

// Suara alarm perlu izin klik dari browser, jadi disiapkan saat klik pertama
document.addEventListener("click", function () {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch (e) {}
}, { once: true });

function bunyiAlarm() {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "square";
    osc.frequency.value = 880;
    gain.gain.value = 0.06;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
  } catch (e) {}
}

// Fungsi utama: kirim satu notifikasi
// jenis: "bahaya" | "peringatan" | "info"
function kirimNotif(kunci, jenis, judul, pesan) {
  const sekarang = Date.now();
  if (waktuNotif[kunci] && sekarang - waktuNotif[kunci] < COOLDOWN) return;
  waktuNotif[kunci] = sekarang;

  daftarNotif.unshift({
    kunci, jenis, judul, pesan,
    waktu: new Date().toLocaleTimeString("id-ID"),
  });
  if (daftarNotif.length > 50) daftarNotif.pop();
  belumDibaca++;

  gambarNotif();
  munculToast(jenis, judul, pesan);
}

let filterAktif = "semua";

function gambarNotif() {
  // ----- Dropdown lonceng -----
  const wadah = document.getElementById("daftar-notif");
  if (daftarNotif.length === 0) {
    wadah.innerHTML = `<p class="notif-kosong">Belum ada notifikasi.</p>`;
  } else {
    wadah.innerHTML = daftarNotif.slice(0, 8).map(n => `
      <div class="notif-item ${n.jenis}">
        <span class="notif-ikon">${IKON_NOTIF[n.jenis]}</span>
        <div>
          <p class="notif-judul">${n.judul}</p>
          <p class="notif-pesan">${n.pesan}</p>
          <small>${n.waktu}</small>
        </div>
      </div>
    `).join("");
  }

  const badge = document.getElementById("badge-notif");
  badge.textContent = belumDibaca;
  badge.style.display = belumDibaca > 0 ? "flex" : "none";

  // ----- Angka di menu sidebar -----
  const jumlahBahaya = daftarNotif.filter(n => n.jenis === "bahaya").length;
  const jumlahMasalah = daftarNotif.filter(n => n.jenis !== "info").length;
  const menuBadge = document.getElementById("menu-badge");
  menuBadge.textContent = jumlahMasalah;
  menuBadge.classList.toggle("tampil", jumlahMasalah > 0);
  menuBadge.classList.toggle("bahaya", sedangBocor);

  // ----- Ringkasan jumlah di halaman Notifikasi -----
  tampilkan("nr-bahaya", jumlahBahaya);
  tampilkan("nr-peringatan", daftarNotif.filter(n => n.jenis === "peringatan").length);
  tampilkan("nr-info", daftarNotif.filter(n => n.jenis === "info").length);

  // ----- Daftar lengkap (dengan filter) -----
  const tampilDaftar = daftarNotif.filter(n => filterAktif === "semua" || n.jenis === filterAktif);
  const isi = document.getElementById("halaman-daftar-notif");

  if (tampilDaftar.length === 0) {
    isi.innerHTML = `<p class="notif-kosong">Tidak ada notifikasi untuk filter ini.</p>`;
    return;
  }

  isi.innerHTML = tampilDaftar.map(n => {
    const p = PANDUAN[n.kunci];
    const detail = p ? `
      <div class="nk-detail">
        <div class="nk-kotak"><b>KEMUNGKINAN PENYEBAB</b><ul>${p.penyebab.map(x => `<li>${x}</li>`).join("")}</ul></div>
        <div class="nk-kotak"><b>YANG BISA DILAKUKAN</b><ul>${p.saran.map(x => `<li>${x}</li>`).join("")}</ul></div>
      </div>
      <button class="nk-lompat" data-ke="${p.halaman}">Buka halaman ${NAMA_HALAMAN[p.halaman]} →</button>
    ` : "";

    return `
      <div class="nk ${n.jenis}">
        <div class="nk-atas">
          <span>${IKON_NOTIF[n.jenis]}</span>
          <span class="nk-judul">${n.judul}</span>
          <small>${n.waktu}</small>
        </div>
        <p class="nk-pesan">${n.pesan}</p>
        ${detail}
      </div>
    `;
  }).join("");
}

function munculToast(jenis, judul, pesan) {
  const toast = document.createElement("div");
  toast.className = "toast " + jenis;
  toast.innerHTML = `<span>${IKON_NOTIF[jenis]}</span><div><b>${judul}</b><p>${pesan}</p></div>`;
  document.getElementById("toast-wadah").appendChild(toast);

  const lama = jenis === "bahaya" ? 8000 : 5000;
  setTimeout(() => {
    toast.classList.add("keluar");
    setTimeout(() => toast.remove(), 400);
  }, lama);
}

// Deteksi kebocoran (data simulasi)
function perbaruiKebocoran() {
  // Kalau simulasi aktif, kadar gas naik cepat. Kalau tidak, kembali normal.
  const target = simulasiBocor ? acak(1500, 2500) : acak(60, 250);
  kadarBocor += (target - kadarBocor) * 0.5;
  const ppm = Math.round(kadarBocor);

  tampilkan("kb-ppm", ppm);

  let status = "Aman", kelas = "hijau";
  if (kadarBocor >= 1000)     { status = "BAHAYA";  kelas = "merah"; }
  else if (kadarBocor >= 500) { status = "Waspada"; kelas = "oranye"; }

  const lencana = document.getElementById("kb-status");
  lencana.textContent = status;
  lencana.className = "lencana " + kelas;

  const alarm = document.getElementById("alarm");

  if (kadarBocor >= 1000) {
    sedangBocor = true;
    tampilkan("alarm-ppm", ppm);
    kirimNotif("bocor", "bahaya", "Terdeteksi kebocoran gas!",
      `Kadar gas ${ppm} ppm. Jauhkan api dan periksa sambungan pipa.`);
    if (!alarmDitutup) {
      alarm.classList.add("tampil");
      bunyiAlarm();
    }
  } else if (kadarBocor >= 500) {
    kirimNotif("bocor-waspada", "peringatan", "Kadar gas di atas normal",
      `Kadar gas ${ppm} ppm. Periksa area sekitar digester.`);
  } else {
    alarm.classList.remove("tampil");
    alarmDitutup = false;
    if (sedangBocor) {
      sedangBocor = false;
      kirimNotif("pulih", "info", "Kadar gas kembali normal", `Kadar gas ${ppm} ppm.`);
    }
  }
}

// ----- Tombol-tombol -----
document.getElementById("tombol-bocor").addEventListener("click", function () {
  simulasiBocor = true;
  alarmDitutup = false;
});
document.getElementById("tombol-normal").addEventListener("click", function () {
  simulasiBocor = false;
});
document.getElementById("alarm-tutup").addEventListener("click", function () {
  alarmDitutup = true;
  document.getElementById("alarm").classList.remove("tampil");
});

// Lonceng: buka/tutup daftar, angka baru kembali ke 0
const panelNotif = document.getElementById("panel-notif");
document.getElementById("tombol-lonceng").addEventListener("click", function (e) {
  e.stopPropagation();
  panelNotif.classList.toggle("buka");
  belumDibaca = 0;
  gambarNotif();
});
document.addEventListener("click", function (e) {
  if (!panelNotif.contains(e.target)) panelNotif.classList.remove("buka");
});
document.getElementById("bersihkan-notif").addEventListener("click", function () {
  daftarNotif.length = 0;
  belumDibaca = 0;
  gambarNotif();
});

gambarNotif();
// ---------- Jalankan ----------
buatDevice();
buatGrafikListrik();
buatGrafikBiogas();
perbaruiData();
perbaruiBiogas();
perbaruiSesi();
setInterval(perbaruiData, 2000);
setInterval(perbaruiBiogas, 2000);
setInterval(perbaruiSesi, 1000);

// ---------- Menu berpindah halaman ----------
const semuaMenu = document.querySelectorAll(".menu");
const semuaHalaman = document.querySelectorAll(".halaman");

function bukaHalaman(tujuan) {
  semuaMenu.forEach(m => m.classList.toggle("aktif", m.dataset.page === tujuan));
  semuaHalaman.forEach(h => h.classList.toggle("aktif", h.id === tujuan));
  Object.values(grafik).forEach(g => g.resize());
  if (grafikListrik) grafikListrik.resize();
  if (grafikBiogas) grafikBiogas.resize();
  window.scrollTo(0, 0);
}

semuaMenu.forEach(menu => {
  menu.addEventListener("click", function (e) {
    e.preventDefault();                      // cegah link meloncat ke atas

    const tujuan = this.dataset.page;        // contoh: "listrik"

    // 1. Hapus tanda aktif dari semua menu dan halaman
    semuaMenu.forEach(m => m.classList.remove("aktif"));
    semuaHalaman.forEach(h => h.classList.remove("aktif"));

    // 2. Pasang tanda aktif ke menu dan halaman yang dipilih
    this.classList.add("aktif");
    document.getElementById(tujuan).classList.add("aktif");

    // 3. Grafik perlu dihitung ulang ukurannya setelah halaman muncul
    Object.values(grafik).forEach(g => g.resize());
if (grafikListrik) grafikListrik.resize();
if (grafikBiogas) grafikBiogas.resize();
  });
});
// ---------- Tombol menu Notifikasi ----------

// Filter
document.querySelectorAll("#filter-notif .chip").forEach(chip => {
  chip.addEventListener("click", function () {
    document.querySelectorAll("#filter-notif .chip").forEach(c => c.classList.remove("aktif"));
    this.classList.add("aktif");
    filterAktif = this.dataset.filter;
    gambarNotif();
  });
});

// Hapus semua
document.getElementById("hapus-semua-notif").addEventListener("click", function () {
  daftarNotif.length = 0;
  belumDibaca = 0;
  gambarNotif();
});

// "Lihat semua" di dropdown lonceng
document.getElementById("lihat-semua-notif").addEventListener("click", function () {
  document.getElementById("panel-notif").classList.remove("buka");
  bukaHalaman("notifikasi");
});

// Tombol "Buka halaman ..." di kartu notifikasi
document.getElementById("halaman-daftar-notif").addEventListener("click", function (e) {
  const tujuan = e.target.dataset.ke;
  if (tujuan) bukaHalaman(tujuan);
});

// Klik banner alarm merah: langsung buka menu Notifikasi
document.getElementById("alarm").addEventListener("click", function (e) {
  if (e.target.id === "alarm-tutup") return;
  bukaHalaman("notifikasi");
});