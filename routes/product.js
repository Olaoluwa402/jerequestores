const express = require("express");
const router = express.Router({mergeParams: true});
const passport = require("passport");
const _ = require('lodash');



const Product = require("../models/product");
const Category = require("../models/category");
const Review = require("../models/review");
const Cart     = require("../models/cart");
const Order     = require("../models/order");
const ProductLimit     = require("../models/product_limit");
let request = require('request');
let {initializePayment, verifyPayment} = require('../config/paystack')(request);

// const imageMineTypes = ['image/jpeg', 'image/png', 'image/gif'];

 const middleware = require("../middleware");


 // multer and cloudinary confiq
  const multer = require('multer');
  const storage = multer.diskStorage({
    filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
const imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
// const upload = multer(
// 	{ storage: storage, limits:{fileSize: 1500000},fileFilter: imageFilter}
// 	).array('myfiles[]', 4);

const upload = multer(
	{ storage: storage, limits:{fileSize: 1500000},fileFilter: imageFilter}
	).any(
      [
      	{
      		name: "image",
      		maxCount: 1
      	},
      	{
      		name: "image_1",
      		maxCount: 1
      	},
      	{
      		name: "image_2",
      		maxCount: 1
      	},
      ]

	);

const cloudinary = require('cloudinary').v2;

cloudinary.config({ 
  cloud_name: 'oladan', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});







// All books page
// Book.find().populate({'path': 'category', match:{'name':'Medical'}})
// router.get("/", async (req, res, next) => {
//   const limit = await ProductLimit.findOne({});
//   const limitResult = parseInt(limit.product_limit);

//   let query = Product.find().sort({createdAt: 'desc'}).limit(limitResult);
//   if (req.query.product_title != null && req.query.product_title != ''){
//     query = query.regex('product_title', new RegExp(req.query.product_title, 'i'));
//   }
//    try {
//     const products = await query.exec();
//     const myTotal = await Product.find();
//       res.render("product/landing", {
//         products: products,
//         searchOptions: req.query,
//         limitResult: limitResult,
//         myTotal: myTotal
//       });
//    } catch(error){
//       if(error){
//         console.log(error);
//         // res.redirect("/users/login");
//       }
//    }
// });

// ajax call
router.get("/get-products/:page/:limit", async (req, res) => {

  const page = req.params.page;
  const limit =req.params.limit;

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
   try{
    const  products = await Product.find().sort({createdAt: 'desc'}).skip(parseInt(startIndex)).limit(parseInt(req.params.limit));
    res.send(products);
   } catch(error){
      if(error){
        console.log(error);
      }
   }
})


// create books route
router.post("/",  middleware.adminAccess, async (req, res, next) => {
    upload(req, res, async(err) =>{
          if(err){
          	// console.log(err);
            req.flash('error', err.message + ' ' + "Total Image size should not exceed 1.5mb");
            res.redirect('/products/new')
          }else{
            // console.log(req.files)
         

           let res_promises = req.files.map(file => new Promise((resolve, reject) => {
              cloudinary.uploader.upload(file.path, {width:800, height:800}, function(error, result){
                 if(error){
                  console.log(error);
                  req.flash('error', "Something went wrong with the file upload. Please try again");
                  res.redirect('/products/new')
                 } else resolve(result)
                  // reject(error)
               })
             })
           )
            
           // promise.all will fire when all promises are resolved
           Promise.all(res_promises)
             .then(result => {
                
                 // console.log(result[0].secure_url)

                 // console.log(result)
                const   product_title = req.body.product_title; 
                const   availability = req.body.availability;
                const   price = req.body.price;
                const   category = req.body.category;
                const   description = req.sanitize(req.body.description);
                const   image = req.body.image = result[0].secure_url;
                const   imageId = req.body.imageId = result[0].public_id;
                const   image_1 = req.body.image_1 = result[1].secure_url;
                const   imageId_1 = req.body.imageId_1 = result[1].public_id;
                const   image_2 = req.body.image_2 = result[2].secure_url;
                const   imageId_2 = req.body.imageId_2 = result[2].public_id;

                const newProduct = {
                product_title: product_title, 
                price: price,
                category: category,
                description: description,
                availability: availability, 
                image: image,
                imageId:imageId, 
                image_1:image_1 ,
                imageId_1:imageId_1,
                image_2:image_2, 
                imageId_2 :imageId_2,
              }

                   // save to db
                 Product.create(newProduct, function(err, newlyCreated){
                 if(err){
                  console.log(err);
                 req.flash("error", "error saving to database. Please ensure all fields are fill");
                 res.redirect("/products/new");
                 } else{
                 //redirect back to books page

                 res.redirect("/products/" + newlyCreated.slug);
                  }
             });
  

            })
            .catch((error)=> {console.log(error)})
        }  
    })
});


// create new books route
router.get("/new", middleware.adminAccess, async (req, res) => {
  renderNewPage(res, new Product());
 
});



// SHOW - shows more info about one book
router.get("/:slug", function(req, res){
    //find the campground with provided ID
    Product.findOne({"slug": req.params.slug}).populate({path:"categories"}).populate({
      path: "reviews",
      options: {sort: {createdAt: -1}}
      }).exec(function(err, foundProduct){
        if(err || !foundProduct){
            req.flash("error", "Product not found*")
           res.redirect("/")
        } else {
           res.locals.metaTags = { 
              title: "Jereque stores categories of product", 
              description: "categories categories ",   
              keywords: "Jereque store online shopping blog post" 
          }; 

          res.locals.metaTagsProduct = {
                meta: foundProduct, 
            }; 
            //render show template with that Book
            res.render("product/show", {
               layout: "layouts/layout",
              product: foundProduct

            });
        }
    });
});

// edit route
router.get("/:slug/edit", middleware.adminAccess, function(req, res){
       Product.findOne({"slug": req.params.slug}, function(err, product){
        if(err || !product){
          req.flash("error", "Product not found")
          res.redirect("/");
        }else{
          renderEditPage(res, product)
        }
       });
   
});

   //update route
 
router.put("/:id",  middleware.adminAccess, function (req, res)  {
     Product.findById(req.params.id, async (err, product) => {
        if(err){
            console.log(err);
              if(product != null){
                renderEditPage(res, product, true)
              } else{
                res.redirect("/");
              }
        } else {
              upload(req, res, async (err) =>{
              		if(err){
                    console.log("upload err" + err)
                    req.flash('error', err.message + ' ' + "Image size should not exceed 1mb");
                    res.redirect('/products/new')
                  }else{

                  		if (req.files) {
                  			let res_promises = req.files.map(file => new Promise((resolve, reject) => {
                            cloudinary.uploader.upload(file.path, {width:800, height:800}, function(error, result){
                                if(error){
                                  req.flash('error', "Something went wrong with the file upload. Please try again");
                                  res.redirect('/products/new')
                                 } else resolve(result)
                         })
                       })
                      )
                                   // promise.all will fire when all promises are resolved
                         Promise.all(res_promises)
                         .then( async (result) => {
                         	 // console.log(result)
                         	 
                         	  
                         	 // console.log("product" + product)
	                      	if(result[0]){
	                         await cloudinary.uploader.destroy(product.imageId);
	                        product.image =  result[0].secure_url;
	                              product.imageId =  result[0].public_id;
	                      }
	                      if(result[1]){
	                         await cloudinary.uploader.destroy(product.imageId_1);
	                        product.image_1 =  result[1].secure_url;
	                              product.imageId_1 =  result[1].public_id;
	                      }
	                      if(result[2]){
	                         await cloudinary.uploader.destroy(product.imageId_2);
	                        product.image_2 =  result[2].secure_url;
	                              product.imageId_2 =  result[2].public_id;
	                     }


	                      product.product_title = req.body.product_title; 
                             product.description = req.body.description;
                             product.price = req.body.price;
                             product.availability = req.body.availability
                             product.category = req.body.category;
                         
                             product.save();
                             // console.log("new" + product)

                             req.flash("success","Successfully Updated!");
                             res.redirect("/");
	                 
	                    
                         })
                         .catch(error => {console.log(error)})
                     }         
                  }
              });         
        }
     });
});



// Delete route
router.delete("/:slug", middleware.adminAccess,  async (req, res) => {
  console.log("slug delete" + req.params.slug)
  let product
  try{
      product = await Product.findOne({"slug": req.params.slug});
       // deletes all reviews associated with the Book
        await Review.deleteOne({"_id": {$in: product.reviews}});  
      // delete the book 
        await cloudinary.uploader.destroy(product.imageId);
        await cloudinary.uploader.destroy(product.imageId_1);
        await cloudinary.uploader.destroy(product.imageId_2);
        await product.deleteOne();
        req.flash("success", "Product deleted successfully!");
        res.redirect("/");
  } catch(e){
    console.log(e);
      if(product != null){
         // new Error('Only image files are allowed!')
         req.flash("error", 'Could not remove product. Please ensure internect connection');
         res.redirect("back")
        // res.render("product/show", {product:product})
      } else{
        res.redirect("/")
      }
  } 
 
});


async function renderNewPage(res, product, error = false){
	 try{
  		const categories = await Category.find({});
  		const params =  {
   		 	   categories: categories,
               product: product
    		 }
    		 if(error){
          console.log(error)
           req.flash("error", 'Unable to edit product');
        }
   		     res.render("product/new", params);
   }catch(error){
   	 if(error){
   		 res.redirect("/products/new");
   	  }
    }

 }

async function renderEditPage(res, product, error = false){
   try{
      const categories = await Category.find({});
      const params =  {
           categories: categories,
               product: product
         }
         if(error){
          console.log(error)
           req.flash("error", 'Unable to edit product');
        }
           res.render("product/edit", params);
   }catch(error){
     if(error){
       res.redirect("/products/new");
     }
  }
}


function isLoggedIn (req, res, next){
  if (req.isAuthenticated()){
    return next();
  }
  req.session.oldUrl = req.url;
  res.redirect("/users/login");
}

module.exports = router;
