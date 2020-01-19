
 

// module.exports = mongoose.model("User", UserSchema);

const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new mongoose.Schema({
    email: {type:String, required:true, unique:true},
    firstName: {type:String, required:true},
    lastName: {type:String, required: true},
    isAdmin: {type:Boolean, default: false},
    password: String,
    resetPasswordToken: {type:String},
    resetPasswordExpires: Date,
    createdAt: {type:Date,required: true, default: Date.now}
});
 
 UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);