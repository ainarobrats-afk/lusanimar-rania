// ============================================================================
// RANIA V3.0 — Function Call Handler
// Visa KB lengkap + Google Search grounding + flight via API only
// ============================================================================

import { saveUserMemory, handleBikinIklan, handleCariHargaPasaran } from "../tools";

interface FunctionCallResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

interface Env {
  WORKER_HUNTER_URL: string;
  WORKER_VALIDATOR_URL: string;
  WORKER_CASHIER_URL: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_KEY?: string;
  GOOGLE_API_KEY?: string;
  GOOGLE_CX?: string;
  HUNTER?: { fetch: (req: Request) => Promise<Response> };
  VALIDATOR?: { fetch: (req: Request) => Promise<Response> };
  CASHIER?: { fetch: (req: Request) => Promise<Response> };
}

export async function executeFunction(
  name: string,
  args: Record<string, unknown>,
  env: Env
): Promise<FunctionCallResult> {
  switch (name) {
    case "search_flights":
      return callWorkerOrBinding(
        env.HUNTER,
        `${env.WORKER_HUNTER_URL}/api/search`,
        {
          origin: args.origin,
          destination: args.destination,
          departureDate: args.departure_date,
          returnDate: args.return_date,
          passengers: args.passengers || 1,
        }
      );
    case "validate_passport":
      return callWorkerOrBinding(env.VALIDATOR, `${env.WORKER_VALIDATOR_URL}/api/validate`, {
        imageUrl: args.image_url, travelDate: args.travel_date,
      });
    case "start_booking":
      return callWorkerOrBinding(env.CASHIER, `${env.WORKER_CASHIER_URL}/api/checkout`, {
        flightId: args.flight_id, passengerName: args.passenger_name,
        passportNumber: args.passport_number, email: args.email,
        phone: args.phone, paymentMethod: args.payment_method,
      });
    case "check_booking_status":
      return { success: true, data: { bookingId: args.booking_id, status: "SEARCHING" } };
    case "get_weather":
      return getWeather(args.city as string, env);
    case "get_visa_info":
      return getVisaInfo(
        args.destination as string,
        args.nationality as string,
        (args.visa_type as string) || ""
      );
    case "web_search":
      return webSearch(args.query as string, env);
    case "simpan_memory_user":
      return handleSimpanMemory(args, env);
    case "bikin_iklan":
      return handleBikinIklan({
        nama_barang: args.nama_barang as string, kondisi: args.kondisi as string,
        harga: args.harga as number, deskripsi: args.deskripsi as string,
        kategori: args.kategori as string,
      });
    case "cari_harga_pasaran":
      return handleCariHargaPasaran({
        nama_barang: args.nama_barang as string, kategori: args.kategori as string,
        lokasi: args.lokasi as string,
      });
    default:
      return { success: false, error: `Unknown function: ${name}` };
  }
}

// ─── Worker Binding Helper ────────────────────────────────────────────────────
async function callWorkerOrBinding(
  binding: { fetch: (req: Request) => Promise<Response> } | undefined,
  httpUrl: string,
  body: Record<string, unknown>
): Promise<FunctionCallResult> {
  const bodyStr = JSON.stringify(body);
  const headers = { "Content-Type": "application/json" };
  try {
    let response: Response;
    if (binding) {
      response = await binding.fetch(new Request(httpUrl, { method: "POST", headers, body: bodyStr }));
    } else {
      response = await fetch(httpUrl, { method: "POST", headers, body: bodyStr });
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: `Worker call failed: ${error instanceof Error ? error.message : "unknown"}` };
  }
}

async function handleSimpanMemory(args: Record<string, unknown>, env: Env): Promise<FunctionCallResult> {
  const result = await saveUserMemory(args as Parameters<typeof saveUserMemory>[0], env);
  return { success: result.success, data: { saved: result.success, user_id: args.user_id }, error: result.error };
}

// ─── Google Search Grounding (cuaca real-time, wisata, info aktual) ──────────
async function webSearch(query: string, env: Env): Promise<FunctionCallResult> {
  // Blokir query tentang flight/tiket — harus via API
  const flightKeywords = /tiket|flight|penerbangan|aviaun|harga voo|book.*flight|airfare/i;
  if (flightKeywords.test(query)) {
    return {
      success: false,
      error: "BLOCKED: Flight/ticket queries must use search_flights API, not web search.",
    };
  }

  if (!env.GOOGLE_API_KEY || !env.GOOGLE_CX) {
    return {
      success: true,
      data: {
        results: [],
        note: "Google Search not configured. Set GOOGLE_API_KEY and GOOGLE_CX secrets.",
        query,
      },
    };
  }

  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${env.GOOGLE_API_KEY}&cx=${env.GOOGLE_CX}&q=${encodeURIComponent(query)}&num=5`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Google API ${res.status}`);
    const data = await res.json() as {
      items?: Array<{ title: string; snippet: string; link: string }>;
    };
    const items = (data.items || []).map(i => ({
      title: i.title,
      snippet: i.snippet,
      url: i.link,
    }));
    return { success: true, data: { results: items, query, source: "google_search" } };
  } catch (error) {
    return { success: false, error: `Web search failed: ${error instanceof Error ? error.message : "unknown"}` };
  }
}

// ─── Weather (dengan Google Search fallback) ──────────────────────────────────
async function getWeather(city: string, env: Env): Promise<FunctionCallResult> {
  const weatherDB: Record<string, { temp: number; condition: string; humidity: number; season: string }> = {
    "DIL":  { temp: 28, condition: "Tropis, hangat dan lembap", humidity: 78, season: "Musim panas (Apr-Nov) / Musim hujan (Des-Mar)" },
    "DPS":  { temp: 30, condition: "Cerah berawan", humidity: 72, season: "Musim kering (Apr-Sep) / Musim hujan (Okt-Mar)" },
    "CGK":  { temp: 32, condition: "Panas, kadang hujan", humidity: 80, season: "Musim kering (Jun-Sep) / Musim hujan (Okt-Mei)" },
    "SIN":  { temp: 31, condition: "Hangat, hujan singkat", humidity: 84, season: "Hujan sepanjang tahun, paling basah Nov-Jan" },
    "KUL":  { temp: 30, condition: "Hangat dan lembap", humidity: 82, season: "Hujan Apr-Okt di barat, Okt-Feb di timur" },
    "SYD":  { temp: 22, condition: "Sejuk, cerah", humidity: 55, season: "Musim panas Des-Feb / Musim dingin Jun-Agu" },
    "MEL":  { temp: 18, condition: "Berubah-ubah", humidity: 60, season: "Musim panas Des-Feb / Musim dingin Jun-Agu" },
    "DRW":  { temp: 33, condition: "Sangat panas", humidity: 60, season: "Musim basah Nov-Apr / Musim kering Mei-Okt" },
    "PER":  { temp: 25, condition: "Hangat, cerah", humidity: 45, season: "Panas Des-Mar / Sejuk Jun-Agu" },
    "NRT":  { temp: 15, condition: "Sejuk, bervariasi", humidity: 65, season: "Musim semi Mar-Mei; panas Jun-Agu; gugur Sep-Nov; dingin Des-Feb" },
    "ICN":  { temp: 12, condition: "Sejuk", humidity: 60, season: "Panas Jun-Agu (sangat panas); dingin Des-Feb (sangat dingin)" },
    "HKG":  { temp: 26, condition: "Hangat dan lembap", humidity: 78, season: "Hangat-panas Mar-Sep; sejuk Okt-Feb; topan Jun-Sep" },
    "BKK":  { temp: 34, condition: "Panas", humidity: 75, season: "Musim panas Nov-Feb; hujan Jun-Okt; sangat panas Mar-Mei" },
    "LHR":  { temp: 14, condition: "Berawan, kadang hujan", humidity: 72, season: "Terbaik Jun-Agu (musim panas)" },
    "CDG":  { temp: 13, condition: "Berawan, hujan ringan", humidity: 75, season: "Musim panas Jun-Agu; musim dingin Des-Feb" },
    "DXB":  { temp: 38, condition: "Sangat panas dan kering", humidity: 50, season: "Terbaik Okt-Apr; sangat panas Mei-Sep" },
    "JFK":  { temp: 15, condition: "Bervariasi", humidity: 65, season: "Musim panas Jun-Agu; musim dingin Des-Feb (bisa salju)" },
  };

  // Cari berdasarkan nama kota atau kode IATA
  const cityAliases: Record<string, string> = {
    "dili": "DIL", "bali": "DPS", "denpasar": "DPS", "jakarta": "CGK",
    "singapore": "SIN", "singapura": "SIN", "singapore changi": "SIN",
    "kuala lumpur": "KUL", "kl": "KUL", "sydney": "SYD", "melbourne": "MEL",
    "darwin": "DRW", "perth": "PER", "tokyo": "NRT", "tokyo narita": "NRT",
    "seoul": "ICN", "hong kong": "HKG", "bangkok": "BKK", "london": "LHR",
    "paris": "CDG", "dubai": "DXB", "new york": "JFK",
  };

  const code = cityAliases[city.toLowerCase()] || city.toUpperCase();
  const data = weatherDB[code];

  if (data) {
    return {
      success: true,
      data: {
        city: city, code,
        temperature: `${data.temp}°C`,
        condition: data.condition,
        humidity: `${data.humidity}%`,
        season: data.season,
        source: "rania_kb",
      },
    };
  }

  // Kota tidak ada di KB → cari via Google Search
  const searchResult = await webSearch(`weather and climate in ${city} for travelers`, env);
  if (searchResult.success && (searchResult.data as { results?: unknown[] })?.results?.length) {
    return {
      success: true,
      data: {
        city, code,
        note: "Data dari Google Search — real-time",
        searchResults: (searchResult.data as { results: unknown[] }).results.slice(0, 3),
        source: "google_search",
      },
    };
  }

  return {
    success: true,
    data: { city, temperature: "27-32°C", condition: "Tropis, cek cuaca lokal", humidity: "70%", source: "estimate" },
  };
}

// ─── VISA KNOWLEDGE BASE LENGKAP ─────────────────────────────────────────────

interface VisaEntry {
  tourist: string;
  work: string;
  study: string;
  notes?: string;
}

// Semua info: perspektif dari pemegang paspor Timor-Leste
const VISA_KB: Record<string, VisaEntry> = {
  // ── Asia Tenggara ──────────────────────────────────────────────────────────
  indonesia: {
    tourist: "Bebas visa 30 hari untuk pemegang paspor Timor-Leste. Bisa diperpanjang di kantor imigrasi. Bandara masuk: Ngurah Rai (Bali), Soekarno-Hatta (Jakarta), dll.",
    work: "Wajib Visa Kerja (KITAS/ITAS). Proses: sponsor perusahaan Indonesia mengajukan ke Kemnaker → RPTKA → Visa Kerja (B211 atau B312). Dokumen: kontrak kerja, ijazah, paspor valid 18 bulan. Proses ±30 hari. Biaya: USD 100-200.",
    study: "Visa Pelajar (C317 atau B211 pendidikan). Sponsor universitas/sekolah di Indonesia. Dokumen: surat penerimaan kampus, bukti keuangan, paspor. Perpanjang tiap semester.",
    notes: "Imigrasi Indonesia: imigrasi.go.id",
  },
  singapore: {
    tourist: "Pemegang paspor Timor-Leste wajib mengajukan Visa Turis (Short-Term Visit Pass). Apply online di ICA (ica.gov.sg) atau melalui agen perjalanan. Biaya: SGD 30. Proses: 3-5 hari kerja. Maksimal tinggal: 30 hari.",
    work: "Employment Pass (EP) untuk profesional bergaji ≥SGD 5,000/bln. Work Permit untuk pekerja semi-terampil. Sponsor: perusahaan Singapura. Dokumen: kontrak kerja, ijazah, paspor. Apply via MyMOM Portal. Proses: 3-8 minggu.",
    study: "Student Pass wajib untuk kursus >30 hari. Apply via SOLAR (ICA). Sponsor: institusi pendidikan Singapura. Biaya: SGD 30. Dokumen: surat penerimaan, bukti keuangan.",
    notes: "ICA Singapore: ica.gov.sg | MOM: mom.gov.sg",
  },
  malaysia: {
    tourist: "Bebas visa 30 hari untuk pemegang paspor Timor-Leste (perlu konfirmasi terkini). Bandara masuk: KLIA, KL Sentral. Perpanjangan di Imigresen Malaysia.",
    work: "Employment Pass (kategori I, II, III). Sponsor perusahaan Malaysia. Apply via eVISA Malaysia (evisa.imi.gov.my). Dokumen: kontrak kerja, ijazah, biometric. Proses: 2-4 minggu.",
    study: "Student Pass. Sponsor institusi Malaysia. Dokumen: offer letter, bukti keuangan. Apply via imigresen.gov.my.",
    notes: "Imigresen Malaysia: imi.gov.my",
  },
  philippines: {
    tourist: "Bebas visa 30 hari (perlu konfirmasi). Perpanjangan via Bureau of Immigration (bi.gov.ph). Biaya perpanjang: PHP 3.010.",
    work: "Alien Employment Permit (AEP) dari DOLE Philippines + Alien Certificate of Registration (ACR I-Card). Proses: 15-30 hari. Sponsor perusahaan Filipina.",
    study: "Student Visa (9F). Sponsor universitas. Dokumen: LOA, bukti keuangan. Apply di Kedutaan Filipina.",
    notes: "Bureau of Immigration: bi.gov.ph",
  },
  thailand: {
    tourist: "Bebas visa 30 hari (30 hari via darat). Bisa perpanjang 30 hari di kantor imigrasi lokal. Biaya perpanjang: THB 1.900.",
    work: "Non-Immigrant B Visa + Work Permit dari Department of Employment. Sponsor perusahaan Thailand. Dokumen: kontrak kerja, ijazah, medical cert. Proses: 2-4 minggu.",
    study: "Non-Immigrant ED Visa. Sponsor institusi pendidikan. Dokumen: LOA, bukti keuangan. Perpanjang tiap semester.",
    notes: "Thai Immigration: immigration.go.th",
  },
  vietnam: {
    tourist: "E-Visa online (evisa.xuatnhapcanh.gov.vn): USD 25, valid 90 hari, single atau multiple entry. Proses: 3 hari kerja.",
    work: "Work Permit dari Ministry of Labour. Sponsor perusahaan Vietnam. Dokumen: kontrak, ijazah, criminal record. Proses: 15-30 hari.",
    study: "Student Visa via kedutaan Vietnam. Sponsor institusi. Dokumen: LOA, bukti keuangan.",
    notes: "Vietnam E-Visa: evisa.xuatnhapcanh.gov.vn",
  },

  // ── Asia Timur ─────────────────────────────────────────────────────────────
  japan: {
    tourist: "Wajib Visa Turis (Temporary Visitor). Apply di Kedutaan Jepang di Dili atau Jakarta. Biaya: gratis (resiprositas). Dokumen: formulir, paspor, foto, rekening bank 3 bulan, itinerary. Proses: 5-7 hari kerja. Maksimal: 15 hari (bisa extend 90 hari).",
    work: "Visa Kerja Jepang (Engineer, Specialist in Humanities, dll). Proses: Certificate of Eligibility (COE) dari sponsor Jepang → apply di kedutaan. Dokumen: COE, kontrak, ijazah. Proses total: 1-3 bulan.",
    study: "Student Visa (Ryugaku). COE dari sekolah/universitas Jepang → apply kedutaan. Dokumen: COE, bukti keuangan, LOA. Durasi: sesuai program studi.",
    notes: "Kedutaan Jepang: mofa.go.jp/j_info/visit/visa",
  },
  "south korea": {
    tourist: "Wajib Visa Turis (C-3). Apply di Kedutaan Korea. Biaya: USD 40. Dokumen: formulir, paspor, foto, rekening bank, itinerary, bukti akomodasi. Proses: 5-7 hari.",
    work: "E-7 (Profesional), E-9 (Non-profesi), E-6 (Seni/hiburan). Sponsor perusahaan Korea. Dokumen: kontrak, ijazah, criminal record. Proses: 4-8 minggu.",
    study: "D-2 (Mahasiswa), D-4 (Kursus bahasa). Sponsor institusi Korea. Dokumen: LOA, bukti keuangan. Proses: 2-3 minggu.",
    notes: "HiKorea: hikorea.go.kr",
  },
  china: {
    tourist: "Wajib Visa China (L Visa). Apply di Kedutaan China. Biaya: USD 30-140. Dokumen: formulir, paspor, foto, itinerary, bukti hotel & keuangan. Proses: 4-7 hari kerja. Catatan: sebagian besar negara transit 144 jam visa-free.",
    work: "Z Visa (Work Visa). Sponsor perusahaan China. Dokumen: Invitation Letter + Notification Letter, ijazah, criminal record. Proses: 15-20 hari.",
    study: "X1 (>180 hari) atau X2 (<180 hari) Student Visa. Sponsor universitas. Dokumen: LOA (JW201/JW202), bukti keuangan.",
    notes: "China Visa: visaforchina.cn",
  },
  taiwan: {
    tourist: "Bebas visa 14 hari atau apply Visitor Visa. E-Visa tersedia. Perpanjang di Biro Imigrasi. Biaya e-visa: TWD 500.",
    work: "Resident Visa untuk bekerja. Sponsor perusahaan Taiwan. Dokumen: kontrak, ijazah, ARC (Alien Resident Certificate). Proses: 2-4 minggu.",
    study: "Resident Visa (student). Sponsor universitas. Dokumen: LOA, bukti keuangan.",
    notes: "Taiwan BOCA: boca.gov.tw",
  },

  // ── Pasifik ────────────────────────────────────────────────────────────────
  australia: {
    tourist: "Wajib eVisitor (Subclass 651) atau Visitor Visa (600). Apply online: immi.homeaffairs.gov.au. Biaya: AUD 0 (651, untuk paspor tertentu) atau AUD 145 (600). Dokumen: paspor, bukti keuangan, surat sponsor/itinerary. Proses: 1-4 minggu.",
    work: "Temporary Skill Shortage (TSS, Subclass 482): sponsor perusahaan Australia + Labour Market Test. Skills Assessment diperlukan untuk profesi tertentu. Biaya: AUD 1.265-2.645. Atau Working Holiday (462) untuk usia 18-30 tahun: AUD 635.",
    study: "Student Visa (Subclass 500). CRICOS-registered institution. Biaya: AUD 650. Dokumen: CoE (Confirmation of Enrolment), Genuine Temporary Entrant (GTE) statement, bukti keuangan (AUD 21.041/tahun). Proses: 4-6 minggu.",
    notes: "Australia Home Affairs: homeaffairs.gov.au",
  },
  "new zealand": {
    tourist: "Wajib Visitor Visa. Apply online: immigration.govt.nz. Biaya: NZD 211. Dokumen: paspor, bukti keuangan, itinerary, bukti akomodasi. Proses: 20+ hari.",
    work: "Work Visa berbagai kategori: Accredited Employer Work Visa (AEWV), Working Holiday (18-30 tahun). Sponsor perusahaan NZ. Biaya: NZD 750.",
    study: "Student Visa. Biaya: NZD 375. Dokumen: offer of place, bukti keuangan.",
    notes: "NZ Immigration: immigration.govt.nz",
  },
  "papua new guinea": {
    tourist: "Visa on Arrival tersedia di Port Moresby (POM). Biaya: PGK 100. Maksimal 60 hari. Dokumen: paspor, bukti keuangan, tiket pulang.",
    work: "Work Permit dari Department of Labour. Sponsor perusahaan PNG. Dokumen: kontrak kerja, medical cert.",
    study: "Student Visa via kedutaan PNG.",
    notes: "PNG Immigration: immigration.gov.pg",
  },

  // ── Eropa ──────────────────────────────────────────────────────────────────
  portugal: {
    tourist: "Wajib Visa Schengen (tipe C) karena Timor-Leste bukan negara Schengen. Apply di Kedutaan Portugal. Biaya: EUR 80. Dokumen: formulir, paspor (valid 3 bln setelah perjalanan), asuransi perjalanan min EUR 30.000, bukti akomodasi, bukti keuangan (EUR 75/hari), itinerary. Proses: 15 hari kerja. Durasi: max 90 hari dalam 180 hari.",
    work: "Work Visa Portugal (Visto de Trabalho). Jenis: A (subordinate), B (independent). Sponsor perusahaan Portugal. Dokumen: kontrak kerja, ijazah, criminal record, medical cert. Proses: 2-3 bulan. Biaya: EUR 90.",
    study: "Student Visa (Visto de Estudante). Sponsor universitas Portugal. Dokumen: LOA, bukti keuangan (EUR 760/bulan), asuransi kesehatan. Proses: 30-60 hari. Biaya: EUR 90.",
    notes: "Portal Consulares Portugal: portaldascomunidades.mne.gov.pt | SEF (imigrasi): sef.pt",
  },
  "united kingdom": {
    tourist: "Standard Visitor Visa. Biaya: GBP 115. Apply online: gov.uk/standard-visitor-visa. Dokumen: paspor, bukti keuangan, itinerary, bukti akomodasi, surat sponsor (jika ada). Proses: 15 hari kerja (non-prioritas). Durasi: max 6 bulan.",
    work: "Skilled Worker Visa. Sponsor berlisensi (Certificate of Sponsorship/CoS). Gaji min: GBP 26.200/tahun. Biaya: GBP 719-1.423 + Immigration Health Surcharge (GBP 1.035/tahun). Dokumen: CoS, bukti gaji, ijazah Bahasa Inggris, bukti keuangan.",
    study: "Student Visa (Inggris). Sponsor: institusi berlisensi (CAS number). Biaya: GBP 490. Dokumen: CAS, bukti keuangan (GBP 1.334/bulan London; GBP 1.023/bulan luar London), bukti Bahasa Inggris (IELTS min 5.5). Proses: 3 minggu.",
    notes: "UK Visas & Immigration: gov.uk/browse/visas-immigration",
  },
  germany: {
    tourist: "Visa Schengen (tipe C). Apply di Kedutaan Jerman. Biaya: EUR 80. Dokumen: formulir, paspor, asuransi perjalanan, bukti keuangan, itinerary, bukti akomodasi. Proses: 15 hari kerja.",
    work: "Visa Kerja Jerman: Skilled Workers Act (Fachkräfteeinwanderungsgesetz). Jenis: Employment Visa, Job Seeker Visa (6 bulan). Dokumen: kontrak/tawaran kerja, ijazah yang diakui di Jerman (anabin.kmk.org), bukti kemampuan Bahasa Jerman. Biaya: EUR 75.",
    study: "Visa Pelajar Jerman. Biaya: EUR 75. Dokumen: LOA, bukti keuangan (EUR 934/bulan di blocked account), bukti Bahasa Jerman/Inggris. Proses: 6-12 minggu.",
    notes: "Kedutaan Jerman: germany.info | Make it in Germany: make-it-in-germany.com",
  },
  netherlands: {
    tourist: "Visa Schengen (tipe C). Biaya: EUR 80. Apply Kedutaan Belanda. Dokumen: formulir, paspor, asuransi, bukti keuangan, itinerary.",
    work: "Work Permit + MVV (Machtiging tot Voorlopig Verblijf). Sponsor perusahaan Belanda (GVVA - Gecombineerde Vergunning voor Verblijf en Arbeid). Proses: 3-5 bulan. Biaya: EUR 188.",
    study: "MVV untuk studi >90 hari. Sponsor universitas Belanda. Biaya: EUR 188. Dokumen: LOA, bukti keuangan (EUR 900/bulan).",
    notes: "IND Netherlands: ind.nl",
  },
  schengen: {
    tourist: "Visa Schengen berlaku untuk 26 negara: Jerman, Prancis, Belanda, Belgia, Austria, Swiss, Italia, Spanyol, Portugal, Yunani, Denmark, Swedia, Norwegia, Finlandia, Cekia, Hongaria, Polandia, Slovakia, Slovenia, Estonia, Latvia, Lithuania, Malta, Luksemburg, Liechtenstein, Islandia. Biaya: EUR 80 (dewasa), EUR 40 (anak 6-12 tahun), gratis (<6 tahun). Proses: 15 hari kerja. Durasi: max 90 hari dalam 180 hari.",
    work: "Setiap negara Schengen punya aturan Work Permit masing-masing. Apply di kedutaan negara tujuan kerja.",
    study: "Apply di kedutaan negara tempat studi. Setiap negara punya persyaratan berbeda.",
    notes: "Apply visa Schengen di kedutaan negara yang akan dikunjungi paling lama, atau titik masuk pertama.",
  },

  // ── Amerika ────────────────────────────────────────────────────────────────
  "united states": {
    tourist: "Wajib Visa B-1/B-2. Apply: ds160.state.gov (formulir DS-160) + jadwal wawancara di Kedutaan AS. Biaya: USD 185. Dokumen: paspor, foto, bukti keuangan kuat, bukti tidak berniat imigrasi, bukti properti/pekerjaan di TL. Proses: beragam. Wawancara: wajib.",
    work: "H-1B (Specialty Occupation, lottery system — sangat kompetitif), L-1 (intracompany transfer), O-1 (extraordinary ability). Sponsor perusahaan AS. Proses: 3-6 bulan. Biaya: USD 460-1.710.",
    study: "F-1 Student Visa. Biaya: USD 160 + SEVIS fee USD 350. Dokumen: I-20 dari universitas, bukti keuangan full (biaya hidup + uang kuliah), wawancara di kedutaan. Proses: 3-5 minggu setelah I-20.",
    notes: "US Visas: travel.state.gov",
  },
  canada: {
    tourist: "Wajib Visitor Visa (Temporary Resident Visa). Apply online: canada.ca. Biaya: CAD 100. Dokumen: paspor, foto, bukti keuangan, itinerary, surat undangan (jika ada). Proses: beragam (2-8 minggu). Atau eTA (CAD 7) jika terbang transit.",
    work: "Work Permit: LMIA-based (employer dapat Labour Market Impact Assessment) atau LMIA-exempt (IEC, intra-company). Biaya: CAD 155. International Experience Canada (IEC/Working Holiday) untuk usia 18-35 tahun.",
    study: "Study Permit. Biaya: CAD 150. Dokumen: LOA dari designated learning institution (DLI), bukti keuangan (CAD 10.000/tahun + biaya kuliah), wawancara mungkin diperlukan.",
    notes: "IRCC Canada: canada.ca/immigration",
  },
  brazil: {
    tourist: "E-Visa Brasil (e-visas.com.br). Biaya: USD 80. Proses: 5-7 hari kerja. Durasi: 90 hari. Atau Visa Turis via Konsulat Brasil.",
    work: "Work Visa (VITEM-V). Sponsor perusahaan Brasil. Dokumen: kontrak kerja, ijazah, autenticidade no Brasil (notarisasi). Proses: 2-3 bulan.",
    study: "Student Visa (VITEM-IV). Sponsor institusi Brasil. Dokumen: LOA, bukti keuangan.",
    notes: "Itamaraty Brasil: gov.br/mre",
  },

  // ── Timur Tengah ───────────────────────────────────────────────────────────
  "uae": {
    tourist: "Visa on Arrival 30 hari (gratis) atau 96 jam Transit Visa. Juga tersedia e-Visa via ICP (icp.gov.ae). Biaya: AED 100-350. Bisa diperpanjang. Bandara: Dubai (DXB), Abu Dhabi (AUH), Sharjah (SHJ).",
    work: "Employment Visa. Sponsor: perusahaan UAE (melalui free zone atau mainland). Dokumen: kontrak kerja, ijazah yang diattestasi, medical fit, Emirates ID. Proses: 2-4 minggu. Biaya: AED 500-3.000.",
    study: "Student Visa. Sponsor institusi UAE (GEMS, universitas). Dokumen: LOA, bukti keuangan, medical fit.",
    notes: "ICA UAE: icp.gov.ae | MOHRE: mohre.gov.ae",
  },
  dubai: {
    tourist: "Sama dengan UAE. Visa on Arrival 30 hari atau e-Visa online. Dubai adalah emirat, bukan negara terpisah.",
    work: "Sama dengan UAE — Work Permit via MOHRE. Dubai free zones: DIFC, Dubai Internet City, JAFZA, dll punya visa sistem sendiri.",
    study: "Sama dengan UAE. Universitas besar di Dubai: BITS Pilani, Heriot-Watt, Murdoch.",
    notes: "Dubai: dubai.ae | GDRFAD: gdrfad.gov.ae",
  },
  "saudi arabia": {
    tourist: "e-Visa Saudi (visitsaudi.com). Biaya: SAR 300 + asuransi. Proses: 5 menit online. Durasi: 90 hari per kunjungan, multi-entry 1 tahun. Wanita tidak perlu wali (sejak 2019).",
    work: "Work Visa + Iqama (residency permit). Sponsor perusahaan Saudi (Kafala system). Dokumen: kontrak kerja, ijazah yang diattestasi oleh MOFA Saudi, medical test. Proses: 1-2 bulan.",
    study: "Student Visa. Beasiswa King Abdullah (jika tersedia). Sponsor universitas Saudi.",
    notes: "Saudi Visa: visa.mofa.gov.sa | Absher: absher.sa",
  },

  // ── Asia Selatan ───────────────────────────────────────────────────────────
  india: {
    tourist: "e-Visa India (indianvisaonline.gov.in). Biaya: USD 25-80. Proses: 72 jam. Durasi: 30/60/90 hari. Jenis: e-Tourist, e-Business, e-Medical.",
    work: "Employment Visa. Sponsor perusahaan India. Wajib gaji min USD 25.000/tahun. Dokumen: kontrak kerja, ijazah, IT Return perusahaan. Proses: 4-8 minggu.",
    study: "Student Visa (x visa). Sponsor universitas India terakreditasi. Dokumen: LOA, bukti keuangan. Proses: 15-30 hari.",
    notes: "India e-Visa: indianvisaonline.gov.in",
  },
};

// ─── Alias negara (multi-bahasa) ─────────────────────────────────────────────
const COUNTRY_ALIASES: Record<string, string> = {
  // Indonesian
  "jepang": "japan", "jepun": "japan", "japen": "japan",
  "korea selatan": "south korea", "korea": "south korea", "korsel": "south korea",
  "tiongkok": "china", "cina": "china", "rrc": "china",
  "inggris": "united kingdom", "uk": "united kingdom", "britania": "united kingdom",
  "jerman": "germany",
  "belanda": "netherlands",
  "perancis": "france",
  "prancis": "france",
  "Amerika": "united states", "as": "united states", "usa": "united states",
  "Amerika serikat": "united states",
  "kanada": "canada",
  "australia": "australia",
  "selandia baru": "new zealand",
  "arab saudi": "saudi arabia", "arab": "saudi arabia", "ksa": "saudi arabia",
  "emirat": "uae", "uni emirat": "uae", "uni emirat arab": "uae",
  "india": "india",
  "brasil": "brazil",
  // Tetun
  "inglateira": "united kingdom",
  "alemania": "germany",
  "holanda": "netherlands",
  "australia": "australia",
  "zelanda foun": "new zealand",
  // Portuguese
  "reino unido": "united kingdom",
  "estados unidos": "united states",
  "japão": "japan", "japao": "japan",
  "coreia do sul": "south korea",
  "emirados árabes": "uae",
  "arábia saudita": "saudi arabia",
  "nova zelândia": "new zealand",
};

// ─── getVisaInfo — deteksi cerdas tipe visa ───────────────────────────────────
async function getVisaInfo(
  destination: string,
  nationality: string,
  visaType: string
): Promise<FunctionCallResult> {

  // Normalize negara tujuan
  const raw   = destination.toLowerCase().trim();
  const key   = COUNTRY_ALIASES[raw] || raw;
  const entry = VISA_KB[key];

  // Deteksi tipe visa dari visaType parameter atau keyword dalam destination string
  type VisaKind = "tourist" | "work" | "study" | "all";
  let kind: VisaKind = "all";

  const vt = (visaType || "").toLowerCase();
  const dest = destination.toLowerCase();

  // Word-boundary safe detection
  if (/\b(work|kerja|trabalhador|trabalho|emploi|employment)\b/i.test(vt + " " + dest)) {
    kind = "work";
  } else if (/\b(study|studi|belajar|kuliah|pelajar|estudante|school|universitas)\b/i.test(vt + " " + dest)) {
    kind = "study";
  } else if (/\b(tourist|turis|liburan|wisata|turismo|vacances|holiday|visit)\b/i.test(vt + " " + dest)) {
    kind = "tourist";
  }

  if (!entry) {
    // Negara tidak ada di KB → Google Search fallback
    // (injected ke prompt sebagai note — parser akan minta webSearch)
    return {
      success: true,
      data: {
        destination,
        nationality: nationality || "Timor-Leste",
        visaType: kind,
        source: "not_in_kb",
        note: `Negara "${destination}" belum ada di Knowledge Base RANIA. Gunakan web_search untuk info terkini, atau konfirmasi di kedutaan resmi.`,
        searchSuggestion: `visa ${destination} for Timor-Leste passport ${kind === "all" ? "" : kind + " visa"} requirements 2024`,
      },
    };
  }

  // Build response berdasarkan tipe
  let visaData: Record<string, string> = {};

  if (kind === "tourist") {
    visaData = {
      type: "Visa Turis / Tourist Visa",
      info: entry.tourist,
    };
  } else if (kind === "work") {
    visaData = {
      type: "Visa Kerja / Work Visa",
      info: entry.work,
    };
  } else if (kind === "study") {
    visaData = {
      type: "Visa Pelajar / Student Visa",
      info: entry.study,
    };
  } else {
    // Tampil semua 3 tipe
    visaData = {
      tourist: entry.tourist,
      work:    entry.work,
      study:   entry.study,
    };
  }

  return {
    success: true,
    data: {
      destination,
      nationality: nationality || "Timor-Leste",
      visaType: kind,
      ...visaData,
      notes: entry.notes || "",
      disclaimer: "Informasi ini bersifat panduan umum. Selalu konfirmasi persyaratan terkini di kedutaan atau website resmi negara tujuan sebelum berangkat.",
      source: "rania_visa_kb",
    },
  };
}
