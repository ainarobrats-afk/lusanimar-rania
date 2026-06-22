import express from 'express';
const router = express.Router();

// Xendit webhook endpoint
router.post('/xendit', (req, res) => {
  // handle webhook
  res.status(200).send('OK');
});

export default router;
