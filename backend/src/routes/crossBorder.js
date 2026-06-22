import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/rbac.js';
import crossBorderController from '../controllers/crossBorderController.js';

const router = Router();

// POST /api/cross-border/checkout
router.post('/checkout', authenticate, requirePermission('market.post'), (req, res) => crossBorderController.checkout(req, res));

// POST /api/shipping/resi-scan
router.post('/shipping/resi-scan', authenticate, requirePermission('market.post'), (req, res) => crossBorderController.resiScan(req, res));

// POST /api/escrow/release
router.post('/escrow/release', authenticate, requirePermission('market.post'), (req, res) => crossBorderController.releaseEscrow(req, res));

// GET /api/shipping/partners
router.get('/shipping/partners', (req, res) => crossBorderController.listPartners(req, res));

export default router;