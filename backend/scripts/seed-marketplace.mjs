import { MOCK_LISTINGS } from '../src/controllers/marketController.js';

const ADDITIONAL_LISTINGS = {
  products: [
    { id: 'PRD-004', title: 'Samsung Galaxy S24', category: 'Electronics', price: 850, seller: 'Tech Market Dili', location: 'Dili', image: '📱', verified: true, rating: 4.7, sales: 23 },
    { id: 'PRD-005', title: 'Nike Air Max 2024', category: 'Fashion', price: 180, seller: 'Fashion TL', location: 'Dili', image: '👟', verified: true, rating: 4.6, sales: 45 },
    { id: 'PRD-006', title: 'MacBook Air M3', category: 'Electronics', price: 1800, seller: 'Tech Dili', location: 'Dili', image: '💻', verified: true, rating: 4.9, sales: 8 },
  ],
  services: [
    { id: 'SRV-004', title: 'UI/UX Design', category: 'IT', price: 800, seller: 'Design Studio', location: 'Dili', image: '🎨', verified: true, rating: 4.8, sales: 34 },
    { id: 'SRV-005', title: 'AC Repair Service', category: 'Repairs', price: 25, seller: 'Fix It TL', location: 'Dili', image: '🔧', verified: true, rating: 4.5, sales: 120 },
  ],
  jobs: [
    { id: 'JOB-004', title: 'Marketing Manager', category: 'Marketing', salary: 1500, currency: 'USD', period: 'month', company: 'Startup Dili', location: 'Dili', type: 'Full-time', verified: true, applicants: 15 },
    { id: 'JOB-005', title: 'Tukang Kayu', category: 'Construction', salary: 20, currency: 'USD', period: 'day', company: 'Build Timor', location: 'Baucau', type: 'Contract', verified: false, applicants: 8 },
  ],
  property: [
    { id: 'PRO-004', title: 'Land for Sale - Comoro', type: 'Land', price: 15000, currency: 'USD', location: 'Dili', area: 500, verified: true, views: 234 },
  ],
  vehicles: [
    { id: 'VEH-004', title: 'Yamaha NMAX 2023', type: 'Motorcycle', price: 1800, currency: 'USD', location: 'Dili', mileage: 8000, verified: true, views: 567 },
  ]
};

console.log('Seeding marketplace with additional listings...\n');

let totalAdded = 0;

for (const [category, items] of Object.entries(ADDITIONAL_LISTINGS)) {
  if (MOCK_LISTINGS[category]) {
    MOCK_LISTINGS[category].push(...items);
    totalAdded += items.length;
    console.log(`✓ ${category}: +${items.length} listings`);
  }
}

console.log(`\nTotal listings added: ${totalAdded}`);
console.log('\nCurrent marketplace stats:');
console.log('- Products:', MOCK_LISTINGS.products.length);
console.log('- Services:', MOCK_LISTINGS.services.length);
console.log('- Jobs:', MOCK_LISTINGS.jobs.length);
console.log('- Property:', MOCK_LISTINGS.property.length);
console.log('- Vehicles:', MOCK_LISTINGS.vehicles.length);
console.log('\nSeed complete!');