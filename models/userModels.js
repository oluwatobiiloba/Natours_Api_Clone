const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        trim: true,
        require:[true,'User must have a name']
    },
    email: {
        type:String,
        unique:true,
        require:[true,"User must provide an email address"],
        lowercase: true,
        validate:[validator.isEmail,'Invalid Email']
    },
     photo:{
        type:String,
        default:'default.jpg'
        
    },
     role:{
        type:String,
        enum:['admin','guide','lead-guide','user'],
        default: 'user'
     }
    ,
    password:{
        type:String,
        require:[true,"User must provide a password"],
        minlength: 8,
        select: false

    },
     passwordConfirm:{
        type:String,
        require:[true,"Re-enter password"],
        validate: {
            //only works on .create and .save
            validator: function(pass){
                return pass === this.password;
            }
        },
        message: 'Passwords do not match'

    },

    passwordChanged: {
        type:Date,
        
    },
    active:{
        type: Boolean,
        default:true,
        select:false
    },

    passwordResetToken: String,
    passwordResetExpires:Date,

});

userSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// //middleware

userSchema.pre(/^find/,function(next){
//this points to current query
this.find({active:{$ne:false}});
next()
})
//instance method
userSchema.methods.correctPassword = async function(candidatePassword,userPassword){
    return await bcrypt.compare(candidatePassword,userPassword);
}

userSchema.methods.changedPasswordAfter = async function (JWTTimestamp) {
    if(this.passwordChanged){
       const changedate = parseInt(this.passwordChanged.getTime()/1000,10)
        return JWTTimestamp > changedate
    }
    return false;
    
} 

userSchema.methods.createPasswordResetToken = function(){
        const resetToken = crypto.randomBytes(32).toString('hex');

       this.passwordResetToken =  crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

        console.log({resetToken},this.passwordResetToken)

        this.passwordResetExpires = Date.now() + (10*60*1000);

        return resetToken;
}

const Users = mongoose.model('User',userSchema)

module.exports = Users
