const ErrorHander = require("../utils/errorhander");
const catchAsyncError = require("./catchAsyncError");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

exports.isAuthenticatedUser = catchAsyncError(async (req,res,next) =>{
    
     const {token} = req.cookies;

     if(!token){
        return next(new ErrorHander("please login to access this resource" , 401))
     }

     const decodeData = jwt.verify(token,process.env.JWT_SECRET);

    req.user =  await User.findById(decodeData.id);

    next();
})

exports.authorizeRoles = (...roles) =>{
    return (req,res,next)=>{
       
        if(!roles.includes(req.user.role)){
        return next(
            new ErrorHander(`Role :${req.user.role} is not allowed to access this resource`,403)
        )}
        ;
        next();
    }
}
