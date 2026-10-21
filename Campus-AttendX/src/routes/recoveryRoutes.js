const express = require('express');
const router = express.Router();
const { requestOtp,verifyOtp } = require('../controllers/recoveryController');

router.post('/request-otp',requestOtp);
router.post('/verify-otp', verifyOtp);

module.exports = router;