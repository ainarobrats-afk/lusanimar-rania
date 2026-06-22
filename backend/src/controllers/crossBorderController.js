// SANIMAR Cross-Border Trade Engine V2.0
// Controller: checkout, shipping, escrow

export class CrossBorderController {
  constructor() {
    this.partners = [
      { id: 'SP-001', name: 'Lorosae Express', type: 'cargo', rating: 4.8, total_deliveries: 520, rate_per_kg: 15000, warehouse_kupang_address: 'Kupang, NTT' },
      { id: 'SP-002', name: 'Timor Travel Cargo', type: 'travel_courier', rating: 4.6, total_deliveries: 340, rate_per_kg: 18000, warehouse_kupang_address: 'Kupang, NTT' },
      { id: 'SP-003', name: 'Leste Cargo', type: 'cargo', rating: 4.7, total_deliveries: 410, rate_per_kg: 16000, warehouse_kupang_address: 'Kupang, NTT' }
    ];
  }

  // POST /api/cross-border/checkout
  checkout(req, res) {
    try {
      const { product_id, quantity = 1, shipping_partner_id } = req.body || {};
      const partner = this.partners.find(p => p.id === shipping_partner_id) || this.partners[0];
      const unit_price = 5000000; // Mock price
      const shipping_fee = partner.rate_per_kg;
      const total_amount = unit_price * quantity + shipping_fee;
      const commission = total_amount * 0.05;

      const order_code = `CB-${Date.now()}`;

      res.json({
        ok: true,
        order_code,
        breakdown: {
          unit_price,
          quantity,
          subtotal: unit_price * quantity,
          shipping_fee,
          commission,
          total_amount
        },
        partner: {
          id: partner.id,
          name: partner.name,
          rate_per_kg: partner.rate_per_kg,
          eta_days: '2-4 hari',
          route: 'Kupang -> Dili'
        }
      });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  }

  // POST /api/shipping/resi-scan
  resiScan(req, res) {
    const { tracking_number, location, status = 'in_transit' } = req.body || {};
    res.json({
      ok: true,
      tracking_number,
      status,
      location,
      updated_at: new Date().toISOString()
    });
  }

  // POST /api/escrow/release
  releaseEscrow(req, res) {
    const { order_id } = req.body || {};
    res.json({
      ok: true,
      order_id,
      escrow_status: 'released',
      released_at: new Date().toISOString()
    });
  }

  // GET /api/shipping/partners
  listPartners(req, res) {
    res.json({ ok: true, partners: this.partners });
  }
}

export default new CrossBorderController();