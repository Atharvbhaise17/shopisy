const ErrorHander = require("../utils/errorhander");
const ErrorHandler = require("../utils/errorhander");


module.exports= (err,req,res,next) =>{
    err.statusCode = err.statusCode || 500 ;
    err.message = err.message || "internal server error"


    // wrong mongodb id error 
    if(err.name === "castError"){
         const message = `resource not found, invalid ${err.path}`;
         err = new ErrorHander(message,400);
    }


// mongoose duplicate key error 
if(err.code === 11000){
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`
    err = new ErrorHander(message,400);
}

// wrong jwt error ;

if(err.name === "JsonWebTokenError"){
    const message = `Json Web Token is invalid try again`;
    err = new ErrorHander(message,400);
}

//  jwt EXPIRE error ;

if(err.name === "TokenExpiredError"){
    const message = `Json Web Token is Expired, try again`;
    err = new ErrorHander(message,400);
}

    res.status(err.statusCode).json({
        success : false,
        message : err.message,
    })
}