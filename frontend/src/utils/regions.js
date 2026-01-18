// src/utils/regions.js
// Data wilayah kerja: Sulawesi Utara, Gorontalo, Sulawesi Tengah, Maluku Utara
// Sumber: https://github.com/ibnux/daerah-indonesia (per Januari 2026)

export const provinces = [
  { id: "71", name: "Sulawesi Utara" },
  { id: "75", name: "Gorontalo" },
  { id: "72", name: "Sulawesi Tengah" },
  { id: "82", name: "Maluku Utara" }
];

export const regencies = {
  // 🔹 Sulawesi Utara (ID: 71)
  "71": [
    { id: "71.01", name: "Kab. Bolaang Mongondow", type: "kabupaten" },
    { id: "71.02", name: "Kab. Minahasa", type: "kabupaten" },
    { id: "71.03", name: "Kab. Kepulauan Sangihe", type: "kabupaten" },
    { id: "71.04", name: "Kab. Kepulauan Talaud", type: "kabupaten" },
    { id: "71.05", name: "Kab. Minahasa Selatan", type: "kabupaten" },
    { id: "71.06", name: "Kab. Minahasa Utara", type: "kabupaten" },
    { id: "71.07", name: "Kab. Bolaang Mongondow Utara", type: "kabupaten" },
    { id: "71.08", name: "Kab. Kepulauan Siau Tagulandang Biaro", type: "kabupaten" },
    { id: "71.09", name: "Kab. Minahasa Tenggara", type: "kabupaten" },
    { id: "71.10", name: "Kab. Bolaang Mongondow Timur", type: "kabupaten" },
    { id: "71.11", name: "Kab. Bolaang Mongondow Selatan", type: "kabupaten" },
    { id: "71.71", name: "Kota Manado", type: "kota" },
    { id: "71.72", name: "Kota Bitung", type: "kota" },
    { id: "71.73", name: "Kota Tomohon", type: "kota" },
    { id: "71.74", name: "Kota Kotamobagu", type: "kota" }
  ],

  // 🔹 Gorontalo (ID: 75)
  "75": [
    { id: "75.01", name: "Kab. Boalemo", type: "kabupaten" },
    { id: "75.02", name: "Kab. Gorontalo", type: "kabupaten" },
    { id: "75.03", name: "Kab. Pohuwato", type: "kabupaten" },
    { id: "75.04", name: "Kab. Bone Bolango", type: "kabupaten" },
    { id: "75.05", name: "Kab. Gorontalo Utara", type: "kabupaten" },
    { id: "75.71", name: "Kota Gorontalo", type: "kota" }
  ],

  // 🔹 Sulawesi Tengah (ID: 72)
  "72": [
    { id: "72.01", name: "Kab. Banggai", type: "kabupaten" },
    { id: "72.02", name: "Kab. Poso", type: "kabupaten" },
    { id: "72.03", name: "Kab. Donggala", type: "kabupaten" },
    { id: "72.04", name: "Kab. Toli-Toli", type: "kabupaten" },
    { id: "72.05", name: "Kab. Buol", type: "kabupaten" },
    { id: "72.06", name: "Kab. Morowali", type: "kabupaten" },
    { id: "72.07", name: "Kab. Banggai Kepulauan", type: "kabupaten" },
    { id: "72.08", name: "Kab. Parigi Moutong", type: "kabupaten" },
    { id: "72.09", name: "Kab. Tojo Una-Una", type: "kabupaten" },
    { id: "72.10", name: "Kab. Sigi", type: "kabupaten" },
    { id: "72.11", name: "Kab. Banggai Laut", type: "kabupaten" },
    { id: "72.12", name: "Kab. Morowali Utara", type: "kabupaten" },
    { id: "72.71", name: "Kota Palu", type: "kota" }
  ],

  // 🔹 Maluku Utara (ID: 82)
  "82": [
    { id: "82.01", name: "Kab. Halmahera Barat", type: "kabupaten" },
    { id: "82.02", name: "Kab. Halmahera Tengah", type: "kabupaten" },
    { id: "82.03", name: "Kab. Halmahera Utara", type: "kabupaten" },
    { id: "82.04", name: "Kab. Halmahera Selatan", type: "kabupaten" },
    { id: "82.05", name: "Kab. Kepulauan Sula", type: "kabupaten" },
    { id: "82.06", name: "Kab. Halmahera Timur", type: "kabupaten" },
    { id: "82.07", name: "Kab. Pulau Morotai", type: "kabupaten" },
    { id: "82.08", name: "Kab. Pulau Taliabu", type: "kabupaten" },
    { id: "82.71", name: "Kota Ternate", type: "kota" },
    { id: "82.72", name: "Kota Tidore Kepulauan", type: "kota" }
  ]
};