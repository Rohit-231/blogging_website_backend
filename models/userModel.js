const mongoose=require('mongoose')
const validator=require('validator')
const bcrypt=require('bcryptjs')
const crypto=require('crypto')

//name,email,photo,password,passworConfirm
const userSchema=new mongoose.Schema({
  name:{
    type:String,
    required:[true,'Please tell us your name']
  },
  email:{
    type:String,
    required:[true,'Please provide us your email'],
    unique:[true,'This email is already used for registration'],
    lowercase:true,
    validate:[validator.isEmail,'Please provide a valid email']
  },
  photo:String,
  password:{
    type:String,
    required:[true,'Please provide a password'],
    minlength:[8,"Length of password should be atleast 8"],
    select:false
  },
  passwordConfirm:{
    type:String,
    required:[true,'Please confirm your password'],
    validate:{
      validator:function(el){
        return el===this.password
      },
      message:'Passwords are not same'
    }
  },
  passwordChangedAt:Date,
  role:{
    type:String,
    enum:['admin','user','lead-blogger','blogger'],
    default:'user'
  },
  passwordResetToken:String,
  passwordResetExpires:Date,
  active:{
    type:Boolean,
    default:true,
    select:false
  }
})

userSchema.pre('save', async function(next){
  //Only run this function if password was actually modified
  if(!this.isModified('password'))return next();

  //Hash the password with cost 12(here 12 represent the intensiveness of the cpu computation)
  this.password=await bcrypt.hash(this.password,12)

  //Delete passwordConfirm field
  this.passwordConfirm=undefined;
  next()

})

userSchema.pre('save', function(next){
  if(!this.isModified('password')|| this.isNew) return next();

  this.passwordChangedAt = Date.now()-1000;
  next()
})

userSchema.pre(/^find/, function(next){
  //this ponts to the current query
  this.find({active:{$ne:false}})
  next();
})

userSchema.methods.correctPassword=async function(candidatePassword, userPassword){
  return await bcrypt.compare(candidatePassword, userPassword)
}

userSchema.methods.changedPasswordAfter = function(JWTTimestamp){
  if(this.passwordChangedAt){
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime()/1000,10);
  
    return JWTTimestamp < changedTimestamp
  }

  //false means NOT changed
  return false
}

userSchema.methods.createPasswordResetToken=function(){
  //generating 32 byte token
  const resetToken = crypto.randomBytes(32).toString('hex');

  //encoding it and storing in DB
  this.passwordResetToken= crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')

  console.log({resetToken}, this.passwordResetToken);

  this.passwordResetExpires = Date.now()+10*60*1000; //in milli seconds ie 10minutes

  return resetToken
}

const User=mongoose.model('User',userSchema)
module.exports=User