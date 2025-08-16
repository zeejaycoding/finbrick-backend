const express=require('express');
const {registeration,login, userInfo, updateEmail, updatePhone,updateAddress, sendVerificationCode,
    verifyCode, changePassword}=require('../controllers/userController');
const auth=require('../middleware/auth.middleware');

const router=express.Router();

router.post('/register',registeration);
router.post('/login',login);
router.get('/profile/:user_id',auth,userInfo);
router.put('/updateEmail/:user_id',auth,updateEmail);
router.put('/updatePhone/:user_id',auth,updatePhone);
router.put('/updateAddress/:user_id',auth,updateAddress);
router.post('/sendVerificationCode', auth, sendVerificationCode);
router.post('/verifyCode', auth, verifyCode);
router.put('/changePassword',auth,changePassword);
module.exports=router;