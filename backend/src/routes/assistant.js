'use strict';

const express         = require('express');
const rateLimit       = require('express-rate-limit');
const router          = express.Router();
const { queryAssistant } = require('../controllers/assistantController');

// Tighter rate limit for AI endpoint (costly per call)
const assistantLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      10,
  message:  { success: false, error: 'Demasiadas consultas al asistente. Espere un momento.' },
});

router.post('/query', assistantLimiter, queryAssistant);

module.exports = router;
