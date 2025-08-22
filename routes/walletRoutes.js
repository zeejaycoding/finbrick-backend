// routes/walletRoutes.js
const express = require('express');
const { getWalletInfo, updateWallet } = require('../controllers/walletController');
const auth = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/wallet', auth, getWalletInfo);
router.put('/wallet', auth, updateWallet);

module.exports = router;