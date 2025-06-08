const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'auto-dev-bridge-server',
    version: '1.0.0'
  });
});

module.exports = router;