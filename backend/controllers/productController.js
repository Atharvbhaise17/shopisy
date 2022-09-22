const Product = require("../models/productModel");
const ErrorHander = require("../utils/errorhander");
const catchAsyncError = require("../middleware/catchAsyncError");
const ApiFeatures = require("../utils/apifeatures");


// create product 

exports.createProduct = catchAsyncError(async (req, res, next) => {

  req.body.user = req.user.id;

  const product = await Product.create(req.body);
  res.status(201).json({
    success: true,
    product
  })
})

// get all product 
exports.getAllProducts = catchAsyncError(async (req, res) => {

  const resultPerPage = 5;
  const productCount = await Product.countDocuments();

  const apifeatures = new ApiFeatures(Product.find(), req.query).search().filter().pagination(resultPerPage);
  const products = await apifeatures.query;
  res.status(200).json({
    success: true,
    products,
    productCount
  });
})


// update product 
exports.updateProduct = catchAsyncError(async (req, res) => {

  let product = Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHander("product not found", 404))
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false
  })

  res.status(200).json({
    success: true,
    product
  })
})

// delete product 

exports.deleteProduct = catchAsyncError(async (req, res, next) => {

  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHander("product not found", 404))
  }

  await product.remove()

  res.status(200).json({
    success: true,
    message: "product Delete successfully "
  })
})


// get product details 

exports.getproductDetails = catchAsyncError(async (req, res, next) => {

  const product = await Product.findById(req.params.id);


  if (!product) {
    return next(new ErrorHander("product not found", 404))
  }

  res.status(200).json({
    success: true,
    product
  })


})


// create new review or update the review 


exports.createProductReview = catchAsyncError(async (req, res, next) => {


  const { rating, comment, productId } = req.body

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  }


  const product = await Product.findById(productId);

  const isReviewed = product.reviews.find(rev => rev.user.toString() === req.user.id.toString());

  if (isReviewed) {

    product.reviews.forEach(rev => {
      if (rev.user.toString() === req.user.id.toString()) {
        rev.rating = rating,
          rev.comment = comment
      }
    })
  } else {
    product.reviews.push(review);
    product.numOfReviews = product.reviews.length
  }

  let avg = 0;

  product.ratings = product.reviews.forEach(rev => {
    avg += rev.rating
  })

  product.ratings = avg / product.reviews.length;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true
  })
})


// Get all reviews of a single product 

exports.getProductReviews = catchAsyncError(async (req, res, next) => {


  const product = await Product.findById(req.query.id);

  if (!product) {
    return next(new ErrorHander("product not found", 404))
  }

  res.status(200).json({
    success: true,
   reviews : product.reviews
  })

})


// Delete review 

exports.deleteReview = catchAsyncError(async (req, res, next) => {


  const product = await Product.findById(req.query.productId);

  if (!product) {
    return next(new ErrorHander("product not found", 404))
  }

  const reviews = product.reviews.filter(rev => rev._id.toString() !== req.query.id.toString());

  let avg = 0;

  reviews.forEach((rev) => {
    avg += rev.rating
  })

  const ratings = avg / reviews.length;

  const numOfReviews = reviews.length

  await Product.findByIdAndUpdate(req.query.productId, {
    reviews,
    ratings,
    numOfReviews
  },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  )

  res.status(200).json({
    success: true,
  })
})