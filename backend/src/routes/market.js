// SANIMAR Market 2.0 — Marketplace Routes

import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/rbac.js';
import { MOCK_LISTINGS, FEATURED_BANNERS, STATS } from '../controllers/marketController.js';

const router = Router();

// Timor Local — kategori prioritas sesuai arsitektur
router.get('/timor-local', authenticate, (req, res) => {
  const items = [
    ...(MOCK_LISTINGS.property || []),
    ...(MOCK_LISTINGS.vehicles || []),
    ...(MOCK_LISTINGS.jobs || [])
  ].slice(0, 20);
  res.json({ ok: true, category: 'timor-local', results: items, total: items.length });
});

// Search marketplace across all categories
router.get('/search', authenticate, (req, res) => {
  const { q, category, location, minPrice, maxPrice } = req.query;
  const results = [];

  if (!q && !category && !location) {
    return res.json({ 
      ok: true, 
      query: {},
      results: [],
      total: 0,
      message: 'Provide q, category, or location to search'
    });
  }

  const searchTerm = (q || '').toLowerCase();

  // Search across all categories
  Object.entries(MOCK_LISTINGS).forEach(([cat, items]) => {
    if (category && category !== cat) return;
    
    items.forEach(item => {
      const matchesSearch = !searchTerm || 
        item.title?.toLowerCase().includes(searchTerm) ||
        item.category?.toLowerCase().includes(searchTerm) ||
        item.location?.toLowerCase().includes(searchTerm) ||
        item.seller?.toLowerCase().includes(searchTerm) ||
        item.name?.toLowerCase().includes(searchTerm);
      
      const matchesLocation = !location || 
        item.location?.toLowerCase().includes(location.toLowerCase());
      
      if (matchesSearch && matchesLocation) {
        results.push({ ...item, category: cat });
      }
    });
  });

  res.json({ ok: true, query: { q, category, location }, results: results.slice(0, 50), total: results.length });
});

// Get featured banners
router.get('/banners', (req, res) => {
  res.json({ ok: true, banners: FEATURED_BANNERS });
});

// Get marketplace stats
router.get('/stats', (req, res) => {
  res.json({ ok: true, stats: STATS });
});

// Categories list
router.get('/categories', (req, res) => {
  const categories = [
    { id: 'products', name: 'Products', icon: '📱', count: MOCK_LISTINGS.products.length, subcategories: ['Electronics', 'Fashion', 'Beauty', 'Home'] },
    { id: 'services', name: 'Services', icon: '🔧', count: MOCK_LISTINGS.services.length, subcategories: ['IT', 'Photography', 'Legal', 'Transport', 'Repairs'] },
    { id: 'property', name: 'Property', icon: '🏠', count: MOCK_LISTINGS.property.length, subcategories: ['Houses', 'Apartments', 'Commercial', 'Land'] },
    { id: 'vehicles', name: 'Vehicles', icon: '🚗', count: MOCK_LISTINGS.vehicles.length, subcategories: ['Cars', 'Motorcycles', 'Trucks', 'Boats'] },
    { id: 'jobs', name: 'Jobs', icon: '💼', count: MOCK_LISTINGS.jobs.length, subcategories: ['IT', 'Hospitality', 'Construction', 'Medical', 'Freelance'] },
    { id: 'tourism', name: 'Tourism', icon: '🏝️', count: MOCK_LISTINGS.tourism.length, subcategories: ['Beaches', 'Diving', 'Adventure', 'Culture', 'Fishing'] },
    { id: 'events', name: 'Events', icon: '🎉', count: MOCK_LISTINGS.events.length, subcategories: ['Concert', 'Festival', 'Sports', 'Seminar'] },
    { id: 'businesses', name: 'Business Directory', icon: '🏢', count: MOCK_LISTINGS.businesses.length, subcategories: ['Hotels', 'Restaurants', 'Rental', 'Healthcare', 'Schools', 'Banks'] }
  ];
  res.json({ ok: true, categories });
});

// Generic get by category
router.get('/:category', authenticate, (req, res) => {
  const { category } = req.params;
  const { location, minPrice, maxPrice } = req.query;
  
  let items = MOCK_LISTINGS[category];
  if (!items) {
    return res.status(404).json({ ok: false, error: 'Category not found' });
  }

  let filtered = [...items];
  
  if (location) {
    filtered = filtered.filter(item => 
      item.location?.toLowerCase().includes(location.toLowerCase())
    );
  }

  if (minPrice) {
    filtered = filtered.filter(item => (item.price || item.salary) >= Number(minPrice));
  }
  
  if (maxPrice) {
    filtered = filtered.filter(item => (item.price || item.salary) <= Number(maxPrice));
  }

  res.json({ ok: true, category, results: filtered, total: filtered.length });
});

// Get single item
router.get('/item/:id', authenticate, (req, res) => {
  const { id } = req.params;
  
  for (const [cat, items] of Object.entries(MOCK_LISTINGS)) {
    const item = items.find(i => i.id === id);
    if (item) {
      return res.json({ ok: true, category: cat, item });
    }
  }
  
  res.status(404).json({ ok: false, error: 'Item not found' });
});

// Post new listing (requires market.post permission)
router.post('/list', authenticate, requirePermission('market.post'), (req, res) => {
  const { category, data } = req.body;
  
  if (!category || !data) {
    return res.status(400).json({ ok: false, error: 'category and data required' });
  }
  
  if (!MOCK_LISTINGS[category]) {
    return res.status(400).json({ ok: false, error: 'Invalid category' });
  }
  
  const newItem = {
    id: `${category.substring(0,3).toUpperCase()}-${Date.now()}`,
    ...data,
    seller: req.user?.email || 'Anonymous',
    verified: false,
    views: 0,
    sales: 0,
    createdAt: new Date().toISOString().split('T')[0]
  };
  
  MOCK_LISTINGS[category].unshift(newItem);
  
  res.json({ ok: true, listing: newItem, message: 'Listing created successfully' });
});

// Mark as sold (requires market.sell)
router.post('/item/:id/sold', authenticate, requirePermission('market.sell'), (req, res) => {
  const { id } = req.params;
  
  for (const [cat, items] of Object.entries(MOCK_LISTINGS)) {
    const item = items.find(i => i.id === id);
    if (item) {
      item.sold = true;
      item.soldAt = new Date().toISOString();
      return res.json({ ok: true, message: 'Item marked as sold' });
    }
  }
  
  res.status(404).json({ ok: false, error: 'Item not found' });
});

// Business directory specific
router.get('/businesses/nearby', authenticate, (req, res) => {
  const { lat, lon, radius = 10 } = req.query;
  
  const results = MOCK_LISTINGS.businesses.map(b => ({
    ...b,
    distance: (Math.random() * 20).toFixed(1)
  }));
  
  res.json({ ok: true, businesses: results });
});

// Products / Services listings
router.get('/products', (req, res) => {
  const items = MOCK_LISTINGS.products || [];
  res.json({ ok: true, category: 'products', results: items, total: items.length });
});

// AI-assisted market search
router.post('/ai-search', (req, res) => {
  const { query, category } = req.body || {};
  const q = String(query || '').toLowerCase();
  let pool = [];
  if (category && MOCK_LISTINGS[category]) {
    pool = MOCK_LISTINGS[category];
  } else {
    pool = Object.values(MOCK_LISTINGS).flat();
  }
  const results = pool.filter(item => {
    const hay = `${item.title} ${item.category || item.name || ''} ${item.location} ${item.description || item.sellerName || ''}`.toLowerCase();
    return !q || hay.includes(q);
  }).slice(0, 20);
  res.json({ ok: true, query, category, results: results || [], total: results.length });
});

router.get('/services', (req, res) => {
  const items = MOCK_LISTINGS.services || [];
  res.json({ ok: true, category: 'services', results: items, total: items.length });
});

// Indonesia Export
router.get('/indonesia-export', (req, res) => {
  const items = MOCK_LISTINGS.indonesia_export || [];
  res.json({ ok: true, category: 'indonesia_export', results: items, total: items.length });
});

// Made in Timor-Leste
router.get('/made-in-timor', (req, res) => {
  const items = MOCK_LISTINGS.made_in_timor || [];
  res.json({ ok: true, category: 'made_in_timor', results: items, total: items.length });
});

// Cargo partners
router.get('/cargo-partners', (req, res) => {
  const items = MOCK_LISTINGS.cargo_partners || [];
  res.json({ ok: true, category: 'cargo_partners', results: items, total: items.length });
});

// Verified sellers
router.get('/verified-sellers', (req, res) => {
  const items = MOCK_LISTINGS.verified_sellers || [];
  res.json({ ok: true, category: 'verified_sellers', results: items, total: items.length });
});

// Tourism specific
router.get('/tourism/featured', (req, res) => {
  const featured = MOCK_LISTINGS.tourism
    .filter(t => t.badge === 'top' || t.badge === 'featured')
    .slice(0, 10);
    
  res.json({ ok: true, featured });
});

// Events calendar
router.get('/events/calendar', (req, res) => {
  const { month, year } = req.query;
  
  const events = MOCK_LISTINGS.events.map(e => ({
    id: e.id,
    title: e.title,
    date: e.date,
    category: e.category,
    location: e.location,
    price: e.price
  }));
  
  res.json({ ok: true, events });
});

export default router;