const express = require('express');
const { ok } = require('../utils/responseEnvelope');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(ok({ status: 'ok' }));
});

module.exports = router;
