const expressHandler = require('express-async-handler');
const Wallet = require('../models/walletModel');

const updateWallet = expressHandler(async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Unauthorized: No user ID in token' });
    }

    const { balance, assets, liabilities, investments, fixedAssets, debts } = req.body;

    // Validate and parse investments
    let validatedInvestments = investments;
    if (typeof investments === 'string') {
      try {
        validatedInvestments = JSON.parse(investments);
      } catch (e) {
        console.error('Invalid investments format: expected JSON array, got string:', investments);
        return res.status(400).json({ error: 'Investments must be a valid JSON array' });
      }
    }

    if (!Array.isArray(validatedInvestments)) {
      console.error('Invalid investments format: expected array, got:', typeof validatedInvestments, validatedInvestments);
      return res.status(400).json({ error: 'Investments must be an array' });
    }

    // Validate each investment object
    for (const inv of validatedInvestments) {
      if (!inv || typeof inv !== 'object' || 
          !inv.type || typeof inv.type !== 'string' ||
          !inv.kod || typeof inv.kod !== 'string' ||
          !inv.adet || typeof inv.adet !== 'string' ||
          !inv.anlik || typeof inv.anlik !== 'string' ||
          !inv.kz || typeof inv.kz !== 'string' ||
          !inv.toplam || typeof inv.toplam !== 'string') {
        console.error('Invalid investment object:', inv);
        return res.status(400).json({ 
          error: 'Each investment must be an object with type, kod, adet, anlik, kz, and toplam as strings' 
        });
      }
    }

    const updateData = {
      balance,
      assets,
      liabilities,
      investments: validatedInvestments, // Use the validated array
      fixedAssets,
      debts,
      netWorth: (balance || 0) +
        (assets?.reduce((sum, a) => sum + (a.value || 0), 0) || 0) -
        (liabilities?.reduce((sum, l) => sum + (l.value || 0), 0) || 0),
      updatedAt: Date.now(),
    };

    const wallet = await Wallet.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    res.status(200).json({ message: 'Wallet updated', wallet });
  } catch (err) {
    console.error('Update wallet error:', err.stack);
    res.status(500).json({ error: `Failed to update wallet: ${err.message}` });
  }
});

module.exports = { updateWallet, getWalletInfo };