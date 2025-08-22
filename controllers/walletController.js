// controllers/walletController.js
const Wallet = require('../models/walletModel');
const expressHandler = require('express-async-handler');

const getWalletInfo = expressHandler(async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Unauthorized: No user ID in token' });
    }

    let wallet = await Wallet.findOne({ userId: req.user.userId });
    if (!wallet) {
      wallet = new Wallet({
        userId: req.user.userId,
        assets: [
          { label: 'Varlıklar', value: 0, isPositive: true },
          { label: 'Borçlar', value: 0, isPositive: false },
          { label: 'Net Varlık', value: 0, isPositive: true },
          { label: 'Aylık Gelir', value: 0, isPositive: true },
          { label: 'Aylık Gider', value: 0, isPositive: false },
          { label: 'Fark', value: 0, isPositive: false },
          { label: 'Yatırımlar', value: 0, isPositive: true },
          { label: 'Yedek Akçe', value: 0, isPositive: true },
          { label: 'Tasarruf', value: 0, isPositive: true },
          { label: 'Tasarruf Getirisi', value: 0, isPositive: true },
        ],
        investments: [],
        fixedAssets: [],
        debts: [],
      });
      await wallet.save();
    }

    res.status(200).json(wallet);
  } catch (err) {
    console.error('Get wallet error:', err.stack);
    res.status(500).json({ error: 'Failed to fetch wallet: ' + err.message });
  }
});

const updateWallet = expressHandler(async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Unauthorized: No user ID in token' });
    }

    const { balance, assets, liabilities, investments, fixedAssets, debts } = req.body;
    const updateData = {
      balance,
      assets,
      liabilities,
      investments,
      fixedAssets,
      debts,
      netWorth: (balance || 0) +
        (assets?.reduce((sum, a) => sum + (a.value || 0), 0) || 0) -
        (liabilities?.reduce((sum, l) => sum + (l.value || 0), 0) || 0),
      updatedAt: Date.now(),
    };

    const wallet = await Wallet.findOneAndUpdate(
      { userId: req.user.userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    res.status(200).json({ message: 'Wallet updated', wallet });
  } catch (err) {
    console.error('Update wallet error:', err.stack);
    res.status(500).json({ error: 'Failed to update wallet: ' + err.message });
  }
});

module.exports = { getWalletInfo, updateWallet };