/**
 * Centralized resident-facing copy in Bahasa Indonesia (guidelines §1.5, §3).
 * Antislop compliant: No em dashes, natural wording, clear civic clarity.
 */
export const copy = {
  village: {
    name: 'Pemerintah Desa Cibenda',
    subdistrict: 'Kecamatan Parigi, Kabupaten Pangandaran',
    kioskTitle: 'Papan Informasi Publik',
  },
  status: {
    cardTitle: 'Kesiapsiagaan',
    staleNotice: (time: string) => `Terakhir diperbarui ${time}, data mungkin tidak terkini`,
    unknown: 'Status tidak dapat dipastikan',
    safe: 'Aman',
    waspada: 'Waspada',
    siaga: 'Siaga',
    awas: 'Awas',
    dataNotCurrent: 'Data tidak terkini',
    noActiveAlert: 'Tidak ada peringatan aktif',
  },
  awas: {
    title: 'STATUS AWAS',
    subtitle: 'Segera evakuasi mandiri ke titik kumpul terdekat dan ikuti petunjuk petugas.',
    evacTitle: 'Titik Kumpul Evakuasi',
    noEvacNotice: 'Ikuti arahan petugas desa',
    contactTitle: 'Kontak Darurat',
    updatedAtLabel: 'Waktu pembaruan:',
  },
  weather: {
    cardTitle: 'Prakiraan Cuaca',
    today: 'Hari Ini',
    tomorrow: 'Besok',
    dayAfter: 'Lusa',
    maxTemp: (temp: number) => `Maks ${Math.round(temp).toString()}°C`,
    rainProb: (prob: number) => `Peluang hujan ${prob.toString()}%`,
    staleOrUnavailable: 'Belum ada informasi terbaru',
  },
  quakePangandaran: {
    cardTitle: 'Gempa Pangandaran',
    noImpact: 'Tidak ada gempa terkini yang berdampak ke Pangandaran',
    olderThan24h: 'Lebih dari 24 jam lalu',
    unavailable: 'Belum ada informasi gempa',
    distance: (km: number) => `${km.toString()} km dari Cibenda`,
    depth: (d: string) => `Kedalaman ${d}`,
  },
  quakeList: {
    cardTitle: 'Gempa Jabar & Indonesia',
    empty: 'Belum ada data gempa',
    unavailable: 'Belum ada informasi gempa',
    tagJabar: 'Jabar',
    tagIndonesia: 'Indonesia',
    pageIndicator: (current: number, total: number) =>
      `Hal ${current.toString()} dari ${total.toString()}`,
  },
  population: {
    cardTitle: 'Penduduk Desa',
    unregistered: 'Data kependudukan sedang dimutakhirkan',
    unavailable: 'Data kependudukan belum tersedia',
    asOf: (date: string) => `Data per ${date}`,
    totalCitizens: 'Total Jiwa',
    households: 'Kepala Keluarga (KK)',
    male: 'Laki-laki',
    female: 'Perempuan',
  },
  profile: {
    cardTitle: 'Profil Warga',
    pyramidTitle: 'Piramida Penduduk per Usia',
    occupationTitle: 'Mata Pencaharian Utama',
    hamletTitle: 'Sebaran Wilayah per Dusun',
    unregistered: 'Data profil warga sedang dimutakhirkan',
    unavailable: 'Data profil belum tersedia',
    suppressed: '<10',
    otherSummary: (others: string, nonWorking: string, unfilled: string) =>
      `+ ${others} lainnya · ${nonWorking} belum bekerja/pelajar/IRT · ${unfilled} belum diisi`,
    unassignedHamlet: 'Wilayah lain / belum tercatat',
  },
  letters: {
    cardTitle: 'Layanan Surat Desa',
    unavailable: 'Data layanan surat belum tersedia',
    kpiSubmitted: 'Diajukan',
    kpiCompleted: 'Selesai diproses',
    kpiInProcess: 'Sedang diproses',
    trendTitle: 'Tren 12 Minggu Terakhir',
    topTypesTitle: 'Jenis Surat Terbanyak',
    legendSubmitted: 'Diajukan',
    legendCompleted: 'Selesai',
  },
  cimart: {
    cardTitle: 'Etalase CiMart',
    unavailable: 'Belanja produk warga Cibenda di CiMart',
    phase0Title: 'CiMart Segera Hadir',
    phase0Description: 'Marketplace lokal Desa Cibenda untuk produk warga dan wisatawan.',
    phase0Cta:
      'Punya usaha di Cibenda? Daftar lewat Surat Keterangan Usaha (SKU) dari Kantor Desa.',
    phase1CtaTitle: 'Kembangkan Usaha Anda',
    phase1CtaText:
      'Daftarkan produk UMKM Anda ke CiMart melalui Kantor Desa Cibenda untuk promosi lobi dan online.',
    defaultCategory: 'Produk Warga',
    noPhoto: 'Foto belum tersedia',
  },
  recovery: {
    restoringTitle: 'Layar sedang dipulihkan',
    restoringDescription:
      'Sistem sedang memulihkan koneksi data. Halaman akan dimuat ulang otomatis.',
  },
  mobile: {
    title: 'Lobby Desa Cibenda',
    placeholder: 'Halaman informasi desa sedang disiapkan.',
  },
  common: {
    loading: 'Memuat…',
    offline: 'Offline',
    perHour: (time: string) => `per ${time}`,
    scanQrLabel: 'Pindai untuk membuka di HP',
  },
} as const;
