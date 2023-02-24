const {promisify} =require('util')
const User=require('./../models/userModel')
const catchAsync=require('./../utils/catchAsync')
const AppError = require("../utils/appError")
const jwt = require('jsonwebtoken')
const sendEmail=require('./../utils/email')
const crypto=require('crypto')

const signToken=(id)=>{
  return jwt.sign({id}, process.env.JWT_SECRET,{
    expiresIn: process.env.JWT_EXPIRES_IN
  })
}
const createSendToken=(user,statusCode,res)=>{

  const token=signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN*24*60*60*1000
    ),
    httpOnly:true
  };

  if(process.env.NODE_ENV==='production') cookieOptions.secure=true;

  //remove password from output
  user.password=undefined

  res.status(statusCode).json({
    status:'success',
    token,
    data:{
      user
    }
  });
}

const filterObj=(obj,...allowedFields)=>{
  const newObj={}
  Object.keys(obj).forEach(el => {
    if(allowedFields.includes(el)) newObj[el]=obj[el];
  })
  return newObj;
}

exports.signup=catchAsync(async(req,res,next)=>{
  const newUser=await User.create(({
    name:req.body.name,
    email:req.body.email,
    password:req.body.password,
    passwordConfirm:req.body.passwordConfirm
  }))

  createSendToken(newUser,201,res);
  // const token=signToken(newUser._id)

  // res.status(201).json({
  //   status:'success',
  //   token,
  //   data:{
  //     user:newUser
  //   }
  // })
})

exports.login=catchAsync(async(req,res,next)=>{
  const {email,password}=req.body;
  
  //Check if email and password exists
  if(!email || !password){
    return next(new AppError('Please provide email and password!',400))
  }

  //Check if user exists && password is correct
  const user = await User.findOne({email}).select('+password')

  if(!user || !(await user.correctPassword(password, user.password))){
    return next(new AppError('Incorrect email or password', 400))
  }

  //If everything is OK, send token to client
  createSendToken(user,200,res);

  // const token=signToken(user._id)
  // res.status(200).json({
  //   status:'success',
  //   token
  // })
})

exports.protect= catchAsync(async(req,res,next)=>{
  //1. Getting token and checking if it's there
  let token;
  if( req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
    token =req.headers.authorization.split(' ')[1];
  }

  console.log(token);

  if(!token){
    return next(new AppError('You are not logged in! Please log in to get access.',401))
  }

  //2.Verification token
  const decoded=await promisify(jwt.verify)(token, process.env.JWT_SECRET)

  //3. Check if user still exists
  const freshUser = await User.findById(decoded.id);
  if(!freshUser){
    return new AppError('The user belonging to this token does no longer exists.',401)
  }


  //4. Check if user changed password after the token was issued
  if(freshUser.changedPasswordAfter(decoded.iat)){
    return new AppError('User recently changed password! Please log in again', 401)
  }



  //GRANT ACCESS TO PROTECTED ROUTE
  req.user=freshUser
  next()
  
})

exports.restrictTo=(...roles)=>{
  return (req,res,next)=>{
    //roles=['admin','lead-blogger']
    if(!roles.includes(req.user.role)){
      return next(new AppError('You do not have permission to perform this action',403))
    }
    next()
  }
}

exports.forgotPassword=catchAsync(async(req,res,next)=>{
  //1. Get user based on POSTed email
  const user=await User.findOne({email:req.body.email})
  if(!user){
    next(new AppError('There is no user with this email address',404))
  }

  //2.Generate the random reset token
  const resetToken = user.createPasswordResetToken()
  await user.save({validateBeforeSave:false})

  //3. Send it to User's email
  const resetURL=`${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

  const message =`Forgot your password? Submit a PATCH request with your new password and passswordConfirm to: ${resetURL}.\n If you didn't forget your password, please ignore this email!`;

  try{
    await sendEmail({
      email:'cef1a309-84a6-48b8-a82a-6fa74fd3b318@mailslurp.mx',//user.email
      subject:'Your password reset token(valid for 10 minutes',
      message
    });

    res.status(200).json({
      status:'success',
      message:'Token sent to email!'
    });
  }catch(err){
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({validateBeforeSave:false});

    return next(new AppError('There was an error sending the email. Try again later!',500))

  }
})

exports.resetPassword=catchAsync(async(req,res,next)=>{
  //1. Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex')

  const user=await User.findOne({
    passwordResetToken:hashedToken,
    passwordResetExpires:{$gt: Date.now()}
  });

  //2. If token not expired and there exist user for provided token then set the new password
  if(!user){
    return next(new AppError('Token is invalid or has expired!',400))
  }
  user.password=req.body.password;
  user.passwordConfirm=req.body.passwordConfirm;
  user.passwordResetToken = undefined
  user.passwordResetExpires = undefined
  await user.save()

  //3. Update changedPasswordAt property for the user
  //done in userModel.js using pre save method

  //4. Log the user in by sending the JWT token
  createSendToken(user,201,res);

  // const token=signToken(user._id)
  // res.status(200).json({
  //   status:'success',
  //   token
  // });

})

exports.updatePassword = catchAsync(async(req,res,next)=>{
  //1. Get user from collection
  const user=await User.findById(req.user.id).select('+password');

  //2. Check if POSTed current password is correct
  if(!(await user.correctPassword(req.body.passwordCurrent,user.password))){
    return next(new AppError('Your current password is wrong, Please try again!','400'))
  }

  //3. If so, update password
  user.password=req.body.password
  user.passwordConfirm=req.body.passwordConfirm
  await user.save();

  //4. Log user in, send JWT
  createSendToken(user,200,res)
  // const token=signToken(user._id)
  // res.status(200).json({
  //   status:'success',
  //   token
  // });
})

exports.updateMe=catchAsync(async(req,res,next)=>{
  //1. check if password is present in req.body
  if(req.body.password || req.body.passwordConfirm){
    return next(new AppError('This route is not for password update. Please use /updatePassword',400))
  }

  //2. Filter out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');

  //3. Update user document
  const updatedUser= await User.findByIdAndUpdate(req.user.id, filteredBody,{
    new:true,
    runValidators:true
  });

  res.status(200).json({
    status:'success',
    data:{
      user:updatedUser
    }
  })

})

exports.deleteMe=catchAsync(async(req,res,next)=>{
  await User.findByIdAndUpdate(req.user.id,{active:false})

  res.status(204).json({
    status:'success',
    data:null
  })

})