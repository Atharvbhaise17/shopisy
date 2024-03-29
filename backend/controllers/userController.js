const ErrorHander = require("../utils/errorhander");
const catchAsyncError = require("../middleware/catchAsyncError");
const User = require("../models/userModel");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const cloudinary  = require("cloudinary")

// register a user 

exports.registerUser = catchAsyncError (async(req,res,next)=> {


    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar , {
        folder : "avatars",
        width : 150,
        crop : "scale",
    })

    const {name ,email , password} = req.body;

    const user = await User.create({
        name ,email,password,
        avatar:{
            public_id : myCloud.public_id,
            url : myCloud.secure_url ,
        }
    });


        sendToken(user,201,res);
})




exports.loginUser = catchAsyncError (async(req,res,next) =>{ 
    const { email, password} = req.body ;

    // checking user has given email and password 
    if(!email || !password){
        return next(new ErrorHander("please enter email and password",400));
    }

    const user = await User.findOne( { email } ).select("+password");

    if(!user){
        return next(new ErrorHander("invalid email or password"),401);
    }

    const isPasswordMatched = await user.comparePassword(password);

    if(!isPasswordMatched){
        return next(new ErrorHander("invalid email or password"),401);
    }

    sendToken(user,200,res);
});

// logout user 

exports.logout = catchAsyncError (async(req,res,next)=>{

    res.cookie("token",null,{
        expires :new Date( Date.now()),
        httpOnly : true
    })
    res.status(200).json({
        success : true,
        message : "Logged out"
}
    )
})


// forgot password 

exports.forgotPassword = catchAsyncError (async (req,res,next) =>{

    const user = await User.findOne({email:req.body.email});

    if(!user){
        return next(new ErrorHander("user not found",404) );
    }


    // get reset password token 
   const resetToken =  user.getResetPasswordToken();

   await user.save({validateBeforeSave:false});

   const resetPasswordUrl = `${req.protocol}://${req.get(
    "host"
  )}/password/reset/${resetToken}`;


   const message = `your password reset token is :- \n\n ${resetPasswordUrl} \n\n if you have not requested this email
   then please ignore it.` ;

   try {

    await sendEmail({
        email : user.email,
        subject: `shopisy password recovery`,
        message

    }) 
    res.status(200).json({
        success:true,
        message : `email sent to ${user.email} successfully`
    })
    
   } catch (error) {
    user.resetPasswordToken =undefined ;
    user.resetPasswordExpire =undefined ;

    await user.save({validateBeforeSave:false});
    
    return next(new ErrorHander(error.message,500));
   }

})



exports.resetPassword = catchAsyncError (async (req,res,next) =>{

    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
        resetPasswordToken ,
        resetPasswordExpire : {$gt : Date.now()},
    })

    if(!user){
        return next(new ErrorHander("Reset password token is invalid",400) );
    }

    if(req.body.password !== req.body.confirmPassword){
        return next(new ErrorHander("password doesnt match",400) );
    }

    user.password = req.body.password ;
    user.resetPasswordToken =undefined ;
    user.resetPasswordExpire =undefined ;

    await user.save();

    sendToken(user,200,res);
    
})

// get user details 

exports.getUserDetails = catchAsyncError(async(req,res,next)=> {

    const user = await User.findById(req.user.id);

    res.status(200).json({
        success:true,
        user,
    })
})


// update user password 

exports.updatePassword = catchAsyncError(async(req,res,next)=> {

    const user = await User.findById(req.user.id).select("+password");

    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

    if(!isPasswordMatched){
        return next(new ErrorHander("old password is incorrect",400));
    }

    if(req.body.newPassword !== req.body.confirmPassword){
        return next(new ErrorHander(" password does not match",400));
    }

    user.password = req.body.newPassword;

    await user.save();

    sendToken(user,200,res);
})


// update user profile 

exports.updateProfile = catchAsyncError(async(req,res,next)=> {

    
  

    const newUserDate = {
        name : req.body.name,
        email : req.body.email,
    }

    if(req.body.avatar !== " "){
        const user = await User.findById(req.user.id)
        const imageId = user.avatar.public_id;
        await cloudinary.v2.uploader.destroy(imageId);


        const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar , {
            folder : "avatars",
            width : 150,
            crop : "scale",
        })

        newUserDate.avatar = {
           public_id : myCloud.public_id ,
           url : myCloud.secure_url ,
        }
    }


    const user =await User.findByIdAndUpdate(req.user.id,newUserDate,{
        new:true,
        runValidators:true,
        useFindModify : false,
    })



    res.status(200).json({
       success : true,
    })
    
})


// get all users (admin)

exports.getAllUser = catchAsyncError(async(req,res,next)=> {


const users =  await User.find();

res.status(200).json({
    success:true,
    users
})

})

// get sinfle users (admin)

exports.getSingleUser = catchAsyncError(async(req,res,next)=> {


    const user =  await User.findById(req.params.id);

    if(!user){
        return next(new ErrorHander (`user does not exis with Id : ${req.params.id}`))
    }
    
    res.status(200).json({
        success:true,
        user
    })
    
    })




    // update user Role  --Admin

exports.updateUserRole = catchAsyncError(async(req,res,next)=> {

    const newUserDate = {
        name : req.body.name,
        email : req.body.email,
        role : req.body.role,
    }


    const user =await User.findByIdAndUpdate(req.params.id,newUserDate,{
        new:true,
        runValidators:true,
        useFindModify : false,
    })



    res.status(200).json({
       success : true,
    })
    
})


 
//delete user profile  --Admin

exports.deleteUser = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);
  
    if (!user) {
      return next(
        new ErrorHander(`User does not exist with Id: ${req.params.id}`, 400)
      );
    }
  
    const imageId = user.avatar.public_id;
  
    await cloudinary.v2.uploader.destroy(imageId);
  
    await user.remove();
  
    res.status(200).json({
      success: true,
      message: "User Deleted Successfully",
    });
  });


