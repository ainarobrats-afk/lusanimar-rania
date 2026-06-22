import express from 'express';
const router = express.Router();

// TODO: implement listing routes
router.get('/', (req, res) => res.json({ message: 'GET listings' }));

export default router;
