/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LanguageCode = "tet" | "id" | "en" | "pt";

export interface TranslationDictionary {
  appName: string;
  appSlogan: string;
  searchPlaceholder: string;
  sellBtn: string;
  activeListings: string;
  verifiedSellers: string;
  newProperties: string;
  newJobs: string;
  smoothDelivery: string;
  askRaniaTitle: string;
  storyTitle: string;
  categoriesTitle: string;
  madeInTimor: string;
  communityTitle: string;
  jastipTitle: string;
  crossBorderTitle: string;
  walletTitle: string;
  dailyStreakTitle: string;
  streakDays: string;
  streakDesc: string;
  topMerchantsTitle: string;
  bctlTitle: string;
  bctlDesc: string;
  complianceBadge: string;
  footerAbout: string;
  footerAboutText: string;
  footerHelp: string;
  footerHelp1: string;
  footerHelp2: string;
  footerHelp3: string;
  footerRania: string;
  footerRania1: string;
  footerRania2: string;
  footerRania3: string;
  footerSupport: string;
  footerSupportText: string;
  footerCopyright: string;
  codNotice: string;
  all: string;
  property: string;
  vehicle: string;
  job: string;
  local: string;
  tech: string;
  food: string;
  jastip: string;
  other: string;
  walletBalanceLabel: string;
  walletPointsLabel: string;
  viewDetails: string;
  askPrice: string;
  promote: string;
  ready: string;
  soldCount: string;
  careerPageTitle: string;
  careerPageDesc: string;
  backHome: string;
  dpOk: string;
  groupBuyTitle: string;
  registeredNotice: string;
  sponsoredTag: string;
  notificationTitle: string;
  noNotifications: string;
  alertLocker: string;
  adTitle: string;
  adText: string;
  learnMore: string;
  myAdsBtnAndPage: string;
  adsManagement: string;
  viewLiveShopping: string;
  liveHostText: string;
  unmuteToListen: string;
  listenLiveComment: string;
}

export const TRANSLATIONS: Record<LanguageCode, TranslationDictionary> = {
  tet: {
    appName: "SANIMAR MARKET",
    appSlogan: "Super-App Mikrofinansas nian iha Timor-Leste",
    searchPlaceholder: "Buka motór, tais, kafé, uma no serbisu iha Timor...",
    sellBtn: "+ Fa'an Iha Ne'e",
    activeListings: "Listing Ativu",
    verifiedSellers: "Vendedor Verifikadu",
    newProperties: "Uma Foun Semana Ne'e",
    newJobs: "Vaga Serbisu Foun",
    smoothDelivery: "Dili, Ermera, Baucau, Kupang",
    askRaniaTitle: "Husu Rania AI feto-host",
    storyTitle: "Istória hosi Loron Ne'e (Haree ho Hetan)",
    categoriesTitle: "Buka tuir Kategoria Produtu",
    madeInTimor: "Halo iha Timor-Leste (Lokál)",
    communityTitle: "Lapak Komunidade & Notísia Sanimar",
    jastipTitle: "Jastip via Transportes / Autokaru Kupang",
    crossBorderTitle: "Importasaun hosi Indonézia & Xina",
    walletTitle: "Karteira Sanimar & Gamifikasaun",
    dailyStreakTitle: "Ó-nia Loron Vizita Konsekutivu",
    streakDays: "Vizita ona Loron 15!",
    streakDesc: "Kontinuak tama loron-loron iha Sanimar no simu +20 Pontu bónus gratuitidade hosi Rania AI.",
    topMerchantsTitle: "Vendedor Sira ne'ebé Di'ak Liu",
    bctlTitle: "Sertifikasaun ho Supervizaun BCTL",
    bctlDesc: "Negósiu hotu-hotu ho kooperasaun Beli Bareng no Layaway hetan supervizaun hosi Banku Sentrál Timor-Leste atu garante seguransa.",
    complianceBadge: "Padrasaun 100% OK",
    footerAbout: "Sanimar Market nian",
    footerAboutText: "Aplikasaun merkadu boot liu iha Timor-Leste, liga de'it vendedor e komprador iha Dili, Ermera, Liquica, Baucau no Kupang ho laran-metin.",
    footerHelp: "Ajuda & Regulamentu",
    footerHelp1: "Kondisaun fa'an ho seguru",
    footerHelp2: "Gia ba CODs iha Timor Plaza",
    footerHelp3: "Seguransa Karteira Elektronika",
    footerRania: "Rania Serbisu & Layaway",
    footerRania1: "Análiza Vaga Serbisu AI",
    footerRania2: "Cicilan Layaway ho 20% de'it",
    footerRania3: "Estatus Rejistu Legál BCTL",
    footerSupport: "Komunidade nia Lian",
    footerSupportText: "PT Sanimar Solusi Teknologi Dili, Timor-Leste nian haksolok rona ó. Suporte lalais iha WhatsApp: +670 7700 1234.",
    footerCopyright: "Sanimar Solusi Teknologi. Ativu no laran-metin atu ajuda dezenvolvimentu iha Timor-Leste!",
    codNotice: "Avizu COD: Atensaun ba imajen no sena foun!",
    all: "Hotu-hotu",
    property: "Uma & Rai",
    vehicle: "Automovel",
    job: "Serbisu",
    local: "Produtu Lokál",
    tech: "Eletróniku",
    food: "Hahán Sembako",
    jastip: "Jastip Travel",
    other: "Seluk-seluk",
    walletBalanceLabel: "SALDU IMPLEMENTADU",
    walletPointsLabel: "LEDR SESSUN nian",
    viewDetails: "Haree Detalla",
    askPrice: "Husu Presu",
    promote: "Promove",
    ready: "Prontu",
    soldCount: "ona",
    careerPageTitle: "Pájina Vaga Serbisu Rania Serbisu",
    careerPageDesc: "Ai análiza no fó foku ba preokupasaun oportunidade iha Timor-Leste laran 10 Segundu",
    backHome: "Fila ba Beranda Market",
    dpOk: "DP 20% OK",
    groupBuyTitle: "Beli Bareng (Group Buy 5 Pesoas)",
    registeredNotice: "Konfirmadu hosi Rania AI ✓",
    sponsoredTag: "Patrosiniadu",
    notificationTitle: "Notifikasaun",
    noNotifications: "La iha notifikasaun foun.",
    alertLocker: "Notifikasaun foun: Iha diskusaun foun kona-ba tais Ermera furak!",
    adTitle: "PUBLICIDADE GOOGLE ADSENSE AUTU-SISTEMA",
    adText: "Hari'i o-nia negosiu ho rania, uza banner sirkulasaun boot",
    learnMore: "Haree barak liutan",
    myAdsBtnAndPage: "Ha'u nia Anúnsiu",
    adsManagement: "Dasbor Serbisu Gasta Osan",
    viewLiveShopping: "Rania Live Stream 24h",
    liveHostText: "Halo Maun/Mana, ne'e mak foti tursimu tais ho kafé hosi Ermera no Gleno!",
    unmuteToListen: "Unmute hodi rona Rania",
    listenLiveComment: "Komentáriu Live hosi Kliente"
  },
  id: {
    appName: "SANIMAR MARKET",
    appSlogan: "Super-App Mikrofinansial Kelas Dunia di Timor-Leste",
    searchPlaceholder: "Cari motor bekas, tais asli, kopi Ermera, lowongan kerja...",
    sellBtn: "+ Jual Barang",
    activeListings: "Iklan Aktif",
    verifiedSellers: "Penjual Terverifikasi",
    newProperties: "Properti Baru Pekan Ini",
    newJobs: "Lowongan Kerja Baru",
    smoothDelivery: "Dili, Ermera, Baucau, Kupang",
    askRaniaTitle: "Tanya Host Rania AI (Asisten Virtual)",
    storyTitle: "Kisah Hari Ini (Tonton & Klaim Hadiah)",
    categoriesTitle: "Telusuri Berdasarkan Kategori",
    madeInTimor: "Produk Lokal Timor-Leste",
    communityTitle: "Kabar Lapak & Komunitas Sanimar",
    jastipTitle: "Jastip via Bus Travel Kupang-Dili",
    crossBorderTitle: "Impor Lintas Batas (Indonesia & China)",
    walletTitle: "Dompet Sanimar & Gamifikasi",
    dailyStreakTitle: "Kunjungan Harian Beruntun Anda",
    streakDays: "Sudah checkin 15 Hari!",
    streakDesc: "Lanjutkan kunjungan harian Sanimar & dapatkan +$0.50 bonus saldo kejutan tiap hari.",
    topMerchantsTitle: "Leaderboard Penjual Terbaik",
    bctlTitle: "Garansi & Regulasi BCTL Sentral",
    bctlDesc: "Setiap transaksi beli bareng dan program cicilan (Layaway) diawasi penuh oleh Bank Sentral Timor Plaza pencegahan fraud.",
    complianceBadge: "Peluang Legal 100% OK",
    footerAbout: "Sanimar Market",
    footerAboutText: "Platform e-commerce terbesar di Timor-Leste, menghubungkan Dili, Ermera, Liquica, Baucau dan Kupang tepercaya tanpa perantara serakah.",
    footerHelp: "Bantuan & Layanan",
    footerHelp1: "Syarat & Ketentuan Jual Beli",
    footerHelp2: "Panduan Kas COD di Timor Plaza",
    footerHelp3: "Keamanan Saldo Finansial",
    footerRania: "Program Karir & Layaway",
    footerRania1: "Automasi Karir Rania AI",
    footerRania2: "Skema Cicilan Layaway 20%",
    footerRania3: "Sertifikasi Resmi BCTL",
    footerSupport: "Sapaan Komunitas",
    footerSupportText: "PT Sanimar Solusi Teknologi Dili, Timor-Leste. Untuk dukungan lekas harian, hubungi via WhatsApp Asli: +670 7700 1234.",
    footerCopyright: "PT Sanimar Solusi Teknologi. Dagang Pintar, Maju Bersama Timor Leste!",
    codNotice: "Pemberitahuan COD: Pastikan cek barang dengan teliti sebelum serah terima uang!",
    all: "Semua Kategori",
    property: "Rumah & Tanah",
    vehicle: "Otomotif",
    job: "Pekerjaan",
    local: "Produk Lokal",
    tech: "Elektronik",
    food: "Bahan Pangan",
    jastip: "Jastip Travel",
    other: "Lainnya",
    walletBalanceLabel: "SALDO UTAMA",
    walletPointsLabel: "BONUS BELANJA",
    viewDetails: "Detail Dagangan",
    askPrice: "Tanya Harga",
    promote: "Promosikan",
    ready: "Ready",
    soldCount: "Terjual",
    careerPageTitle: "Halaman Karir Rania Kerja",
    careerPageDesc: "Pencocokan Lowongan AI 10 Detik Paling Akurat di Seluruh Kabupaten Timor-Leste",
    backHome: "Beranda Utama",
    dpOk: "DP 20% OK",
    groupBuyTitle: "Beli Bareng Harga Grosir (Grup 5 Orang)",
    registeredNotice: "Verifikasi Rania AI ✓",
    sponsoredTag: "Sponsored",
    notificationTitle: "Notifikasi",
    noNotifications: "Tidak ada notifikasi baru.",
    alertLocker: "Kabar baru: Negosiasi penawaran Tais Ermera Anda disetujui penjual!",
    adTitle: "SISTEM IKLAN OTOMATIS GOOGLE ADSENSE",
    adText: "Pasang iklan bisnis Anda secara mandiri untuk menggaet 100k+ pembaca harian Dili.",
    learnMore: "Selengkapnya",
    myAdsBtnAndPage: "Iklankuf",
    adsManagement: "Dasbor Monitor AdBoost Mandiri",
    viewLiveShopping: "Sanimar Live TV Rania Host",
    liveHostText: "Halo kaka! Hari ini Rania merekomendasikan Tais tenun motif Ermera asli dan Kopi Arabika Gleno segar!",
    unmuteToListen: "Aktifkan Audio Rania",
    listenLiveComment: "Komentar Komunitas Secara Live"
  },
  en: {
    appName: "SANIMAR MARKET",
    appSlogan: "World-Class Microfinance Super-App in Timor-Leste",
    searchPlaceholder: "Search used motors, genuine tais, Ermera coffee, local jobs...",
    sellBtn: "+ Post Ad Free",
    activeListings: "Active Listing",
    verifiedSellers: "Verified Sellers",
    newProperties: "New Houses & Land",
    newJobs: "Fresh Careers Opportunity",
    smoothDelivery: "Dili, Ermera, Baucau, Kupang",
    askRaniaTitle: "Ask Rania AI Virtual Assistant",
    storyTitle: "Today's Highlights (Watch & Claim Coins)",
    categoriesTitle: "Browse by Top Categories",
    madeInTimor: "Timor-Leste Premium Craft",
    communityTitle: "Sanimar Market Community Feed",
    jastipTitle: "Intercity Delivery via Bus Travel Kupang-Dili",
    crossBorderTitle: "Import Logistic Service (Indonesia & China)",
    walletTitle: "Sanimar Digital Wallet & Gamification",
    dailyStreakTitle: "Your Attendance Active Streaks",
    streakDays: "Checked-in 15 Days!",
    streakDesc: "Keep visiting Sanimar every day and claim +$0.50 cash balance courtesy of Rania AI.",
    topMerchantsTitle: "Best Performing Merchants",
    bctlTitle: "Central Bank (BCTL) Regulated",
    bctlDesc: "All transaction schemes including Group Buy and 20% Layaway options are supervised under Central Bank rules to prevent malicious activity.",
    complianceBadge: "100% Certified",
    footerAbout: "Sanimar Marketplace",
    footerAboutText: "The largest digital trading marketplace in Timor-Leste, connecting Dili, Ermera, Liquica, Baucau & Kupang borders with real-time trust.",
    footerHelp: "Help & Standards",
    footerHelp1: "Trading Terms & Protocols",
    footerHelp2: "Safety guidelines for COD inside Timor Plaza",
    footerHelp3: "Secured Wallet Balance protection",
    footerRania: "Careers & Layaway Program",
    footerRania1: "Rania AI Automated Career Match",
    footerRania2: "Flexible 20% Downpayment Layaway",
    footerRania3: "Official BCTL Registration License",
    footerSupport: "Community Support",
    footerSupportText: "PT Sanimar Solusi Teknologi Dili, Timor-Leste. For immediate friendly assistance, contact us via WhatsApp: +670 7700 1234.",
    footerCopyright: "PT Sanimar Solusi Teknologi. Smart Trade, Grow Together with Timor-Leste!",
    codNotice: "COD Warning: Inspect all physical goods thoroughly before exchanging hands with cash!",
    all: "All categories",
    property: "Houses & Lands",
    vehicle: "Vehicles & Motors",
    job: "Career Jobs",
    local: "Local Products",
    tech: "Electronics",
    food: "Food & Groceries",
    jastip: "Travel Cargo Jastip",
    other: "Other services",
    walletBalanceLabel: "BALANCE WALLET",
    walletPointsLabel: "SHOPPING REWARDS",
    viewDetails: "View Details",
    askPrice: "Ask Price",
    promote: "Boost Reach",
    ready: "Ready Stock",
    soldCount: "sold",
    careerPageTitle: "Rania Career Placement Bureau",
    careerPageDesc: "Find matching job listings around all municipalities in 10 seconds flat",
    backHome: "Back to Home Feed",
    dpOk: "20% DP Support",
    groupBuyTitle: "Cooperative Wholesale (5-Member Group Buy)",
    registeredNotice: "Verified by Rania AI ✓",
    sponsoredTag: "Sponsored",
    notificationTitle: "Notifications",
    noNotifications: "No new notifications found.",
    alertLocker: "Notification: Your purchase offer for Ermera Tais has been accepted by the merchant!",
    adTitle: "GOOGLE WEB ADSENSE AUTO ADVERTS",
    adText: "Advertise your business on the main feed to reach over 100k+ Dili readers daily.",
    learnMore: "Learn More",
    myAdsBtnAndPage: "Broaden Ads",
    adsManagement: "Self-Serve AdBoost Dashboard",
    viewLiveShopping: "Rania AI Live Stream 24h",
    liveHostText: "Hello there! Rania highly recommends the artisan woven Tais or the fresh Gleno Arabica beans for you today!",
    unmuteToListen: "Unmute to listen to Rania",
    listenLiveComment: "Live Community Chatbox"
  },
  pt: {
    appName: "MERCADO SANIMAR",
    appSlogan: "O Super-App Financeiro de Classe Mundial em Timor-Leste",
    searchPlaceholder: "Procure motas, tais originais, café Ermera, vagas de trabalho...",
    sellBtn: "+ Publicar Grátis",
    activeListings: "Anúncio Ativo",
    verifiedSellers: "Vendedores Verificados",
    newProperties: "Casas e Terrenos Novos",
    newJobs: "Novas Oportunidades Profissionais",
    smoothDelivery: "Dili, Ermera, Baucau, Kupang",
    askRaniaTitle: "Pergunte à Rania AI (Assistente Virtual)",
    storyTitle: "Destaques do Dia (Assista e Ganhe Moedas)",
    categoriesTitle: "Explorar Categorias Principais",
    madeInTimor: "Artesanato Nobre de Timor-Leste",
    communityTitle: "Feed da Comunidade do Mercado Sanimar",
    jastipTitle: "Entregas Rápidas via Rodoviária Kupang-Dili",
    crossBorderTitle: "Importação Segura da Indonésia e China",
    walletTitle: "Carteira Digital Sanimar e Gamificação",
    dailyStreakTitle: "O seu Histórico de Visitas Diárias",
    streakDays: "Check-in feito de 15 dias!",
    streakDesc: "Visite o Sanimar todos os dias para acumular mais +20 pontos de recompensa com a ajuda da Rania AI.",
    topMerchantsTitle: "Líderes de Vendas Locais",
    bctlTitle: "Regulado pelo BCTL (Banco Central)",
    bctlDesc: "Cada transação cooperativa e o sistema de prestações (Layaway) são monitorizados sob as regras do Banco Central de Timor-Leste.",
    complianceBadge: "Padrão 100% Legal",
    footerAbout: "Mercado Digital Sanimar",
    footerAboutText: "A maior plataforma de comércio eletrónico em Timor-Leste, unindo compradores e produtores em Dili, Ermera, Liquiça, Baucau e Kupang com absoluta confiança.",
    footerHelp: "Ajuda e Regulamentos",
    footerHelp1: "Regras Gerais de Transação",
    footerHelp2: "Guia para trocas dinâmicas em Timor Plaza",
    footerHelp3: "Segurança de fundos eletrónicos",
    footerRania: "Agência de Empregos e Layaway",
    footerRania1: "Triagem Vocacional Automática AI",
    footerRania2: "Pagamento com entrada flexível de 20%",
    footerRania3: "Estatuto de Conformidade do BCTL",
    footerSupport: "Contacto da Comunidade",
    footerSupportText: "PT Sanimar Solusi Teknologi Dili, Timor-Leste. Para assistência imediata e atenciosa, contacte-nos via WhatsApp: +670 7700 1234.",
    footerCopyright: "PT Sanimar Solusi Teknologi. Comércio Seguro, Unidos Pelo Progresso de Timor-Leste!",
    codNotice: "Aviso de Envios à Cobrança: Verifique as encomendas com cuidado antes de entregar o dinheiro!",
    all: "Todas as categorias",
    property: "Casas & Terrenos",
    vehicle: "Veículos & Motas",
    job: "Vagas de Emprego",
    local: "Produtos Locais",
    tech: "Eletrónicos",
    food: "Alimentos & Arroz",
    jastip: "Jastip de Autobus",
    other: "Outros serviços",
    walletBalanceLabel: "SALDO CERTIFICADO",
    walletPointsLabel: "CRÉDITO ADICIONAL",
    viewDetails: "Ver Detalhes",
    askPrice: "Perguntar Preço",
    promote: "Promover Alcance",
    ready: "Em Stock",
    soldCount: "vendidos",
    careerPageTitle: "Gabinete de Oportunidades Empregos Rania",
    careerPageDesc: "Encontre carreiras compatíveis em todos os municípios em menos de 10 segundos",
    backHome: "Voltar ao Início",
    dpOk: "Entrada de 20% Permitida",
    groupBuyTitle: "Compra Conjunta Cooperativa (Grup de 5)",
    registeredNotice: "Certificado pela Rania AI ✓",
    sponsoredTag: "Patrocinado",
    notificationTitle: "Notificações",
    noNotifications: "Nenhuma notificação encontrada de momento.",
    alertLocker: "Notificação: A sua proposta para Tais de Ermera foi aprovada pelo produtor!",
    adTitle: "SISTEMA SEGURO GOOGLE ADSENSE AUTO",
    adText: "Promova as suas vendas no nosso feed oficial para alcançar mais de 100 mil leitores em Dili.",
    learnMore: "Saber Mais",
    myAdsBtnAndPage: "Meus Anúncios",
    adsManagement: "Painel de Configuração Autônoma de Campanhas",
    viewLiveShopping: "Transmissão Rania Live TV",
    liveHostText: "Olá amigo! Hoje a Rania recomenda o mais autêntico Tais feito à mão ou as deliciosas sementes biológicas de Ermera!",
    unmuteToListen: "Ativar Som do Vídeo",
    listenLiveComment: "Painel de Chat da Comunidade em Direto"
  }
};
