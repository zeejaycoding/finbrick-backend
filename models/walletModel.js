// models/walletModel.js
const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
  assets: [{
    label: String, // e.g., 'Varlıklar', 'Aylık Gelir'
    value: Number,
    isPositive: Boolean,
  }],
  liabilities: [{
    label: String, // e.g., 'Borçlar', 'Aylık Gider'
    value: Number,
    isPositive: Boolean,
  }],
  investments: [{
    type: String, // e.g., 'Yatırım Fonu', 'Hisse Senedi', 'Altın'
    kod: String, // e.g., 'Bimas', 'FBC'
    adet: String,
    anlik: String,
    kz: String,
    toplam: String,
  }],
  fixedAssets: [{
    title: String, // e.g., 'Mercedes'
    subtitle: String, // e.g., 'S220 - 2018'
    value: Number,
  }],
  debts: [{
    type: String, // e.g., 'Kredi Kartı', 'Kredi Borcu'
    details: [String], // e.g., ['Garanti', '1.500 ₺', '15.000 ₺']
  }],
  netWorth: {
    type: Number,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Wallet', walletSchema);