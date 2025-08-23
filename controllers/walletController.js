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

    // Calculate aggregates for response
    const totalInvestments = wallet.investments.reduce((sum, inv) => sum + parseFloat(inv.toplam || 0), 0);
    const totalFixedAssets = wallet.fixedAssets.reduce((sum, fa) => sum + (fa.value || 0), 0);
    const totalAssetsValue = wallet.assets.find(a => a.label === 'Varlıklar')?.value || 0;
    const totalDebtsValue = wallet.assets.find(a => a.label === 'Borçlar')?.value || 0;
    const investmentsValue = wallet.assets.find(a => a.label === 'Yatırımlar')?.value || 0;

    // Update assets array for relevant fields
    wallet.assets = wallet.assets.map(asset => {
      if (asset.label === 'Yatırımlar') {
        return { ...asset, value: totalInvestments };
      } else if (asset.label === 'Varlıklar') {
        return { ...asset, value: totalInvestments + totalFixedAssets + (wallet.balance || 0) };
      } else if (asset.label === 'Net Varlık') {
        return { ...asset, value: (totalInvestments + totalFixedAssets + (wallet.balance || 0)) - totalDebtsValue };
      }
      return asset;
    });

    await wallet.save();

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

    // Validate and parse investments
    let validatedInvestments = investments;
    if (typeof validatedInvestments === 'string') {
      try {
        validatedInvestments = JSON.parse(validatedInvestments);
      } catch (e) {
        console.error('Invalid investments JSON:', e);
        return res.status(400).json({ error: 'Invalid investments JSON format' });
      }
    }

    if (validatedInvestments && !Array.isArray(validatedInvestments)) {
      console.error('Invalid investments format: expected array, got:', typeof validatedInvestments, validatedInvestments);
      return res.status(400).json({ error: 'Investments must be an array' });
    }

    // Validate each investment object
    if (validatedInvestments) {
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
    }

    // Calculate aggregates
    const totalInvestments = validatedInvestments ? validatedInvestments.reduce((sum, inv) => sum + parseFloat(inv.toplam || 0), 0) : 0;
    const totalFixedAssets = fixedAssets ? fixedAssets.reduce((sum, fa) => sum + (fa.value || 0), 0) : 0;
    const totalDebtsValue = assets?.find(a => a.label === 'Borçlar')?.value || 0;

    // Update assets array
    const updatedAssets = assets ? assets.map(asset => {
      if (asset.label === 'Yatırımlar') {
        return { ...asset, value: totalInvestments };
      } else if (asset.label === 'Varlıklar') {
        return { ...asset, value: totalInvestments + totalFixedAssets + (balance || 0) };
      } else if (asset.label === 'Net Varlık') {
        return { ...asset, value: (totalInvestments + totalFixedAssets + (balance || 0)) - totalDebtsValue };
      }
      return asset;
    }) : undefined;

    const updateData = {
      ...(balance !== undefined && { balance }),
      ...(updatedAssets !== undefined && { assets: updatedAssets }),
      ...(liabilities !== undefined && { liabilities }),
      ...(validatedInvestments !== undefined && { investments: validatedInvestments }),
      ...(fixedAssets !== undefined && { fixedAssets }),
      ...(debts !== undefined && { debts }),
      netWorth: (balance || 0) +
        (updatedAssets?.reduce((sum, a) => sum + (a.value || 0), 0) || 0) -
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

module.exports = { getWalletInfo, updateWallet };