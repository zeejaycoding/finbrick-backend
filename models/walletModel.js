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
    label: String,
    value: Number,
    isPositive: Boolean,
  }],
  liabilities: [{
    label: String,
    value: Number,
    isPositive: Boolean,
  }],
  investments: [{
    type: {
      type: String,
      required: true,
    },
    kod: {
      type: String,
      required: true,
    },
    adet: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return !isNaN(parseFloat(v)) && isFinite(v);
        },
        message: 'Adet must be a valid number string'
      }
    },
    anlik: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return !isNaN(parseFloat(v)) && isFinite(v);
        },
        message: 'Anlik must be a valid number string'
      }
    },
    kz: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return !isNaN(parseFloat(v)) && isFinite(v);
        },
        message: 'K/Z must be a valid number string'
      }
    },
    toplam: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return !isNaN(parseFloat(v)) && isFinite(v);
        },
        message: 'Toplam must be a valid number string'
      }
    },
  }],
  fixedAssets: [{
    title: String,
    subtitle: String,
    value: Number,
  }],
  debts: [{
    type: String,
    details: [String],
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