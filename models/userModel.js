const mongoose=require('mongoose');

const userSchema=new mongoose.Schema({
    name:{type:String, required:true},
    surname:{type:String, required:true},
    nickname:{type:String},
    email:{type:String},
    phone:{type:String,required:true},
    password:{type:String, required:true},
    username: {type:String},
    address: {
    country: {type:String,required:true},
    city: {type:String,required:true},
    district: {type:String},
    gender: {type:String},
    dateOfBirth: {type:Date},
    placeOfBirth:{type:String},
    profession: {type:String},
    profilePhoto: {type:String},
    verificationCode: { type: String }, 
  verificationExpiration: { type: Date }, 
wallet: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet' },
  },
})

module.exports = mongoose.model('User', userSchema);