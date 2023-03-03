const User = require("../models/userModel")
const AppError = require("../utils/appError")
const catchAsync=require('./../utils/catchAsync')


exports.getAllUsers=catchAsync(async(req,res,next)=>{
  const allUsers=await User.find()

  res.status(200).json({
    status:'successs',
    results:allUsers.length,
    data:{
      allUsers
    }
  })
})



exports.createUser=(req,res)=>{
  res.status(500).json({
    status:'error;-',
    message:'This route is not defined....'
  })
}
exports.updateUser=(req,res)=>{
  res.status(500).json({
    status:'error;-',
    message:'This route is not defined....'
  })
}
exports.deleteUser=(req,res)=>{
  res.status(500).json({
    status:'error;-',
    message:'This route is not defined....'
  })
}
exports.getUser=catchAsync(async(req,res)=>{

  try{
    const user=await User.findById(req.params.id)

    if(!user){
      return next(new AppError('No blog found with that ID',404))
    }

    res.status(200).json({
      status:'successs',
      data:{
        user
      }
    })
  }
  catch(err){
   next(err);
  }
});
