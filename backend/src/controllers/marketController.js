// SANIMAR Market 2.0 — Marketplace Controller

const MOCK_LISTINGS = {
  products: [
    { id: 'PRD-001', title: 'iPhone 15 Pro Max', category: 'Electronics', price: 900, currency: 'USD', seller: 'Tech Dili', location: 'Dili', image: '📱', verified: true, rating: 4.8, sales: 45, views: 1200, createdAt: '2026-06-20', badge: 'hot', origin: 'local' },
    { id: 'PRD-002', title: 'Sony Alpha Camera', category: 'Electronics', price: 1200, currency: 'USD', seller: 'Photo Pro', location: 'Dili', image: '📸', verified: true, rating: 4.9, sales: 12, views: 890, createdAt: '2026-06-19', badge: 'featured', origin: 'local' },
    { id: 'PRD-003', title: 'Toyota Hilux 2022', category: 'Vehicles', price: 18000, currency: 'USD', seller: 'Auto Timor', location: 'Dili', image: '🚗', verified: true, rating: 4.7, sales: 8, views: 2100, createdAt: '2026-06-18', badge: 'top', origin: 'local' },
    { id: 'PRD-004', title: 'House For Rent - City Center', category: 'Property', price: 500, currency: 'USD', period: 'month', seller: 'Property TL', location: 'Dili', image: '🏠', verified: true, rating: 4.5, sales: 3, views: 560, createdAt: '2026-06-17', badge: null, origin: 'local' },
    { id: 'PRD-005', title: 'MacBook Pro 16"', category: 'Electronics', price: 2500, currency: 'USD', seller: 'Tech Dili', location: 'Dili', image: '💻', verified: true, rating: 5.0, sales: 15, views: 980, createdAt: '2026-06-16', badge: 'hot', origin: 'local' },
  ],
  services: [
    { id: 'SRV-001', title: 'Web Development', category: 'IT', price: 1200, currency: 'USD', seller: 'Dev Studio TL', location: 'Dili', image: '💻', verified: true, rating: 4.9, sales: 28, views: 1450, createdAt: '2026-06-20', badge: 'verified' },
    { id: 'SRV-002', title: 'Photography Session', category: 'Photography', price: 150, currency: 'USD', seller: 'Photo Pro', location: 'Dili', image: '📸', verified: true, rating: 4.8, sales: 67, views: 2300, createdAt: '2026-06-19', badge: 'top' },
    { id: 'SRV-003', title: 'Visa Processing', category: 'Legal', price: 200, currency: 'USD', seller: 'Visa Express', location: 'Dili', image: '📄', verified: true, rating: 4.7, sales: 156, views: 3400, createdAt: '2026-06-18', badge: 'hot' },
    { id: 'SRV-004', title: 'Car Rental - Daily', category: 'Transport', price: 50, currency: 'USD', period: 'day', seller: 'Rent Car TL', location: 'Dili', image: '🚗', verified: true, rating: 4.6, sales: 89, views: 1200, createdAt: '2026-06-17', badge: null },
  ],
  jobs: [
    { id: 'JOB-001', title: 'Frontend Developer', category: 'IT', salary: 1200, currency: 'USD', period: 'month', company: 'Tech Startup TL', location: 'Dili', type: 'Full-time', verified: true, applicants: 23, createdAt: '2026-06-20', badge: 'hot' },
    { id: 'JOB-002', title: 'Hotel Receptionist', category: 'Hospitality', salary: 400, currency: 'USD', period: 'month', company: 'Hotel Timor', location: 'Dili', type: 'Full-time', verified: true, applicants: 45, createdAt: '2026-06-19', badge: null },
    { id: 'JOB-003', title: 'Construction Worker', category: 'Construction', salary: 15, currency: 'USD', period: 'day', company: 'Build East Timor', location: 'Baucau', type: 'Contract', verified: false, applicants: 12, createdAt: '2026-06-18', badge: null },
  ],
  property: [
    { id: 'PRO-001', title: 'Modern House - Dili Center', type: 'House', price: 45000, currency: 'USD', location: 'Dili', bedrooms: 3, bathrooms: 2, area: 150, verified: true, views: 890, createdAt: '2026-06-20', badge: 'featured' },
    { id: 'PRO-002', title: 'Apartment - Near Beach', type: 'Apartment', price: 200, currency: 'USD', period: 'month', location: 'Dili', bedrooms: 2, bathrooms: 1, area: 80, verified: true, views: 1200, createdAt: '2026-06-19', badge: null },
    { id: 'PRO-003', title: 'Commercial Space', type: 'Commercial', price: 800, currency: 'USD', period: 'month', location: 'Dili', area: 200, verified: true, views: 450, createdAt: '2026-06-18', badge: null },
  ],
  vehicles: [
    { id: 'VEH-001', title: 'Toyota Hilux 2022', type: 'Car', price: 18000, currency: 'USD', location: 'Dili', mileage: 12000, verified: true, views: 2100, createdAt: '2026-06-20', badge: 'hot' },
    { id: 'VEH-002', title: 'Honda Beat 2023', type: 'Motorcycle', price: 1200, currency: 'USD', location: 'Dili', mileage: 5000, verified: true, views: 890, createdAt: '2026-06-19', badge: null },
    { id: 'VEH-003', title: 'Isuzu Truck', type: 'Truck', price: 25000, currency: 'USD', location: 'Kupang', mileage: 45000, verified: false, views: 340, createdAt: '2026-06-18', badge: null },
  ],
  tourism: [
    { id: 'TOU-001', title: 'Atauro Island Diving Tour', category: 'Diving', price: 80, currency: 'USD', duration: '1 day', location: 'Atauro', rating: 4.9, reviews: 234, verified: true, bookings: 567, createdAt: '2026-06-20', badge: 'top' },
    { id: 'TOU-002', title: 'Dili City Tour', category: 'Culture', price: 25, currency: 'USD', duration: '3 hours', location: 'Dili', rating: 4.7, reviews: 189, verified: true, bookings: 890, createdAt: '2026-06-19', badge: 'hot' },
    { id: 'TOU-003', title: 'Mt. Ramelau Trek', category: 'Adventure', price: 150, currency: 'USD', duration: '2 days', location: 'Ainaro', rating: 4.8, reviews: 145, verified: true, bookings: 234, createdAt: '2026-06-18', badge: 'featured' },
    { id: 'TOU-004', title: 'Jaco Island Excursion', category: 'Beach', price: 60, currency: 'USD', duration: '1 day', location: 'Jaco', rating: 4.9, reviews: 312, verified: true, bookings: 678, createdAt: '2026-06-17', badge: 'top' },
  ],
  events: [
    { id: 'EVT-001', title: 'Timor-Leste Tourism Expo 2026', category: 'Festival', date: '2026-07-15', location: 'Dili Convention Center', price: 25, currency: 'USD', verified: true, attendees: 1500, createdAt: '2026-06-20', badge: 'hot' },
    { id: 'EVT-002', title: 'Dili International Film Festival', category: 'Cultural', date: '2026-08-20', location: 'Dili', price: 10, currency: 'USD', verified: true, attendees: 800, createdAt: '2026-06-19', badge: null },
  ],
  businesses: [
    { id: 'BUS-001', name: 'Hotel Timor', category: 'Hotels', rating: 4.5, reviews: 234, location: 'Dili', phone: '+670 1234 5678', verified: true, badge: 'top', hours: '24/7', origin: 'local' },
    { id: 'BUS-002', name: 'Café Delta', category: 'Restaurants', rating: 4.7, reviews: 189, location: 'Dili', phone: '+670 2345 6789', verified: true, badge: null, hours: '07:00-22:00', origin: 'local' },
    { id: 'BUS-003', name: 'Car Rental Express', category: 'Rental', rating: 4.3, reviews: 145, location: 'Dili', phone: '+670 3456 7890', verified: true, badge: null, hours: '08:00-18:00', origin: 'local' },
    { id: 'BUS-004', name: 'Dili Medical Center', category: 'Healthcare', rating: 4.6, reviews: 312, location: 'Dili', phone: '+670 4567 8901', verified: true, badge: 'verified', hours: '24/7', origin: 'local' }
  ],
  indonesia_export: [
    { id: 'IDN-001', title: 'Kemeja Batik Premium', category: 'Fashion', price: 120000, currency: 'IDR', seller: 'Batika Surabaya', location: 'Surabaya', image: '👕', verified: true, rating: 4.8, sales: 230, views: 4500, createdAt: '2026-06-20', badge: 'hot', ready: 'Kupang' },
    { id: 'IDN-002', title: 'Samsung Galaxy S23', category: 'Elektronik', price: 8500000, currency: 'IDR', seller: 'Tech Indo', location: 'Jakarta', image: '📱', verified: true, rating: 4.7, sales: 120, views: 6700, createdAt: '2026-06-19', badge: 'featured', ready: 'Dili' },
    { id: 'IDN-003', title: 'Sparepart Yamaha NMAX', category: 'Sparepart', price: 350000, currency: 'IDR', seller: 'Auto Parts Kupang', location: 'Kupang', image: '⚙️', verified: true, rating: 4.6, sales: 310, views: 2100, createdAt: '2026-06-18', badge: 'top', ready: 'Kupang' },
    { id: 'IDN-004', title: 'Sofa Minimalis', category: 'Furniture', price: 2500000, currency: 'IDR', seller: 'Furniture NTT', location: 'Kupang', image: '🪑', verified: false, rating: 4.4, sales: 45, views: 980, createdAt: '2026-06-17', badge: null, ready: 'Kupang' },
    { id: 'IDN-005', title: 'Lipstik Matte', category: 'Kosmetik', price: 85000, currency: 'IDR', seller: 'Beauty Indo', location: 'Surabaya', image: '💄', verified: true, rating: 4.9, sales: 540, views: 3200, createdAt: '2026-06-16', badge: 'hot', ready: 'Dili' },
    { id: 'IDN-006', title: 'Semen Portland 50kg', category: 'Material Bangunan', price: 75000, currency: 'IDR', seller: 'Toko Bangunan NTT', location: 'Kupang', image: '🧱', verified: true, rating: 4.5, sales: 890, views: 1500, createdAt: '2026-06-15', badge: null, ready: 'Kupang' }
  ],
  made_in_timor: [
    { id: 'TLS-001', title: 'Tais Maubisse', category: 'Kerajinan', price: 25, currency: 'USD', seller: 'Maria Weaving', location: 'Maubisse', image: '🧵', verified: true, rating: 4.9, sales: 156, views: 2300, createdAt: '2026-06-20', badge: 'top' },
    { id: 'TLS-002', title: 'Kopi Timor Arabika', category: 'Makanan', price: 10, currency: 'USD', seller: 'Kopi Ermera', location: 'Ermera', image: '☕', verified: true, rating: 4.8, sales: 420, views: 5600, createdAt: '2026-06-19', badge: 'hot' },
    { id: 'TLS-003', title: 'Madu Hutan Timor', category: 'Makanan', price: 8, currency: 'USD', seller: 'Madu Ori', location: 'Manatuto', image: '🍯', verified: true, rating: 4.7, sales: 230, views: 1800, createdAt: '2026-06-18', badge: 'featured' },
    { id: 'TLS-004', title: 'Oleh-oleh Kayu', category: 'Souvenir', price: 15, currency: 'USD', seller: 'Craft Dili', location: 'Dili', image: '🎨', verified: false, rating: 4.5, sales: 67, views: 890, createdAt: '2026-06-17', badge: null }
  ],
  cargo_partners: [
    { id: 'CAR-001', name: 'Lorosae Express', type: 'Cargo', rating: 4.8, total_deliveries: 520, rate_per_kg: 15000, warehouse: 'Kupang', routes: ['Kupang -> Dili', 'Kupang -> Baucau'], eta: '1-2 hari' },
    { id: 'CAR-002', name: 'Timor Travel Cargo', type: 'Travel Courier', rating: 4.6, total_deliveries: 340, rate_per_kg: 18000, warehouse: 'Kupang', routes: ['Kupang -> Dili', 'Kupang -> Oecusse'], eta: '1 hari' },
    { id: 'CAR-003', name: 'Leste Cargo', type: 'Cargo', rating: 4.7, total_deliveries: 410, rate_per_kg: 16000, warehouse: 'Kupang', routes: ['Kupang -> Dili'], eta: '2 hari' }
  ],
  verified_sellers: [
    { id: 'VER-001', name: 'Tech Dili', badge: 'verified', category: 'Electronics', rating: 4.8, sales: 320, joined: '2026-01-15' },
    { id: 'VER-002', name: 'Property TL', badge: 'verified', category: 'Property', rating: 4.5, sales: 85, joined: '2026-02-20' },
    { id: 'VER-003', name: 'Kopi Ermera', badge: 'verified', category: 'Food', rating: 4.8, sales: 420, joined: '2026-03-10' }
  ]
};

const FEATURED_BANNERS = [
  { id: 1, title: 'Flash Sale Bali 3D2N', subtitle: 'Up to 50% off', image: '🏝️', color: '#ff4444', link: '/market/tourism/bali' },
  { id: 2, title: 'Singapore Weekend', subtitle: 'From $299', image: '🇸🇬', color: '#ff8833', link: '/market/travel/singapore' },
  { id: 3, title: 'Darwin Special', subtitle: 'Daily flights from DIL', image: '🦘', color: '#00dd88', link: '/market/travel/darwin' },
  { id: 4, title: 'Timor Tourism Expo', subtitle: 'July 15, 2026', image: '🎉', color: '#aa66ff', link: '/market/events/expo' },
  { id: 5, title: 'Hotel 50% Off', subtitle: 'Limited time', image: '🏨', color: '#4488ff', link: '/market/hotels' },
];

const STATS = {
  totalListings: 50000,
  totalListingsDisplay: 12450,
  totalUsers: 10000,
  totalBusinesses: 2000,
  travelPartners: 500,
  hotels: 1400,
  countries: 73,
  activeToday: 847,
  soldThisWeek: 123,
  newThisWeek: 456
};

export {
  MOCK_LISTINGS,
  FEATURED_BANNERS,
  STATS
};