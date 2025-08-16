const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const expressHandler = require('express-async-handler');

const registeration = expressHandler(async (req, res) => {
  try {
    const { nameSurname, email, phone, password, confirm_password, city } = req.body;

    if (!nameSurname || !email || !phone || !password || !city) {
      return res.status(400).json({ error: 'Tüm zorunlu alanlar doldurulmalı' });
    }

    const [name, surname] = nameSurname.trim().split(/\s+/);
    if (!name || !surname) {
      return res.status(400).json({ error: 'Ad ve soyad gereklidir' });
    }

    const country = phone.startsWith('+90') ? 'Türkiye' : 'Unknown';
    const cleanPhone = phone.replace(/\D/g, '');

    const existingUser = await User.findOne({ $or: [{ email }, { phone: cleanPhone }] });
    if (existingUser) {
      return res.status(400).json({ error: 'E-posta veya telefon zaten kullanımda' });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      surname,
      email,
      phone: cleanPhone,
      password: hashPassword,
      address: { country, city, district: null },
      profilePhoto: null,
    });

    await user.save();
    res.status(201).json({ message: 'Kullanıcı başarıyla kaydedildi' });
  } catch (error) {
    res.status(500).json({ error: 'Kayıt hatası: ' + error.message });
  }
});

const login = expressHandler(async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
    }

    const user = await User.findOne({
      $or: [{ email: username }, { phone: username }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ message: 'Giriş başarılı', token, userId: user._id });
  } catch (error) {
    res.status(500).json({ error: 'Giriş hatası: ' + error.message });
  }
});

const userInfo = expressHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.user_id).select('-password');
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Kullanıcı bilgisi alınamadı: ' + error.message });
  }
});

const updateEmail = expressHandler(async (req, res) => {
  try {
    const { new_email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.user_id,
      { email: new_email },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    res.status(200).json({ message: 'E-posta başarıyla güncellendi', user });
  } catch (error) {
    res.status(500).json({ error: 'E-posta güncelleme hatası: ' + error.message });
  }
});

const updatePhone = expressHandler(async (req, res) => {
  try {
    const { new_phone } = req.body;
    const cleanPhone = new_phone.replace(/\D/g, '');
    const user = await User.findByIdAndUpdate(
      req.params.user_id,
      { phone: cleanPhone },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    res.status(200).json({ message: 'Telefon başarıyla güncellendi', user });
  } catch (error) {
    res.status(500).json({ error: 'Telefon güncelleme hatası: ' + error.message });
  }
});

const updateAddress = expressHandler(async (req, res) => {
  try {
    const { country, city, district } = req.body;
    const user = await User.findById(req.params.user_id);
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

    user.address = { country, city, district };
    await user.save();

    const updatedUser = await User.findById(req.params.user_id).select('-password');
    res.status(200).json({ message: 'Adres başarıyla güncellendi', user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: 'Adres güncelleme hatası: ' + error.message });
  }
});

const sendVerificationCode = expressHandler(async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Unauthorized: No user ID in token' });
    }
    let user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    user.verificationCode = code;
    user.verificationExpiration = new Date(Date.now() + 5 * 60 * 1000);
    try {
      const savedUser = await user.save();
      console.log('Updated user document:', savedUser);
    } catch (saveError) {
      console.error('Save error:', saveError.message);
      // Fallback update
      await User.findByIdAndUpdate(req.user.userId, {
        verificationCode: code,
        verificationExpiration: user.verificationExpiration,
      }, { new: true });
    }
    console.log(`Verification code for ${user.email}: ${code} at ${new Date().toISOString()}`);
    res.status(200).json({ message: 'Verification code sent' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send verification code: ' + err.message });
  }
});

const verifyCode = expressHandler(async (req, res) => {
  try {
    console.log('Verify code request received at:', new Date().toISOString());
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);

    if (!req.user || !req.user.userId) {
      console.log('Authentication error: req.user or req.user.userId is undefined');
      return res.status(401).json({ error: 'Unauthorized: No user ID in token' });
    }

    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Verification code is required' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      console.log('User not found for userId:', req.user.userId);
      return res.status(404).json({ error: 'User not found' });
    }
  
        user.verificationCode=code
    
        await user.save();

    console.log('Stored verification code:', user.verificationCode);
    console.log('Provided code:', code);
    console.log('Expiration time:', user.verificationExpiration);
    console.log('Current time:', new Date());

    if (!user.verificationCode || user.verificationExpiration < new Date() || user.verificationCode !== code) {
      console.log('Verification failed: Code mismatch or expired');
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    user.verificationCode = null;
    user.verificationExpiration = null;
    await user.save();

    console.log('Code verified successfully for user:', user.email);
    res.status(200).json({ message: 'Code verified' });
  } catch (err) {
    console.error('Verify code error:', err.stack);
    res.status(500).json({ error: 'Failed to verify code: ' + err.message });
  }
});

const changePassword = expressHandler(async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Unauthorized: No user ID in token' });
    }

    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Eski şifre, yeni şifre ve şifre tekrarı gereklidir' });
    }

    console.log(`old password: ${oldPassword}  new passowrd:${newPassword}, confirm Password: ${confirmPassword}`);

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Yeni şifre ve şifre tekrarı eşleşmiyor' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Eski şifre yanlış' });
    }

    const hashPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashPassword;
    await user.save();

    res.status(200).json({ message: 'Şifre başarıyla güncellendi' });
  } catch (err) {
    console.error('Change password error:', err.stack);
    res.status(500).json({ error: 'Şifre güncelleme hatası: ' + err.message });
  }
});

module.exports = {
  registeration,
  login,
  userInfo,
  updateEmail,
  updatePhone,
  updateAddress,
  sendVerificationCode,
  verifyCode,
  changePassword
};