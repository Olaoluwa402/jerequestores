const express = require("express");
const router = express.Router({mergeParams: true});
const Product = require("../models/product");
const Review = require("../models/review");
const middleware = require("../middleware");


// ***************************
// REVIEW ROTE
// ****************************
router.get("/new", middleware.isLoggedIn, async (req, res) => {
    let product
  try{
        product =  await Product.findOne({"slug": req.params.slug});
        res.render("reviews/new", {product: product});
  }catch{
        if(!product){
         req.flash("error", 'No associated product found');
        res.redirect("/")
      } else{
         req.flash("error", 'No associated product found2');
        res.redirect("/")
      }
        // if(err || !book){
        // req.flash("error", "No associated book found")
        //  res.redirect("back")
        // }
  } 
});

// Reviews Create
router.post("/", middleware.isLoggedIn, middleware.checkReviewExistence, async (req, res) => {
    //lookup book using ID

    try{
            const foundProduct = await Product.findOne({"slug":req.params.slug}).populate("reviews").exec();
            const newReview = new Review({
              text: req.body.text,
              rating: parseInt(req.body.rating)
            });

             console.log(req.body.rating)
            const review = await Review.create(newReview); 
            //add author username/id and associated book to the review
            review.author.id = req.user._id;
            review.author.lastName = req.user.lastName;
            //save review
            await review.save();
            foundProduct.reviews.push(review);
            // calculate the new average review for the campground
            foundProduct.rating = calculateAverage(foundProduct.reviews);
            //save campground
            await foundProduct.save();
            req.flash("success", "Your review has been successfully added.");
            res.redirect('/products/' + foundProduct.slug);
    } catch (e) {
        console.log(e);
             req.flash("error", "Error creating review. Pls try again");
            return res.redirect("back");
    }
    
 });

// Reviews Edit
router.get("/:review_id/edit", middleware.checkReviewOwnership, function(req, res){
            Product.findOne({"slug": req.params.slug}, function(err, foundProduct){
            if(err || !foundProduct){
                req.flash("error", "No product found")
                return res.redirect("/")
            }
            Review.findById(req.params.review_id, function(err, foundReview){
            if(err || !foundReview){
                req.flash("error", "Review not found");
                res.redirect("/");
            }else{
                 console.log("This is foundProduct" + foundProduct)
                   console.log("This is foundReview" + foundReview)
                     console.log(req.params.review_id)
                res.render("reviews/edit", {product_id: req.params.slug, review: foundReview});
            }
         });
        })
         

    // // res.send("review")
    //         let foundReview
    //     try{
    //          foundReview = await Review.findById(req.params.review_id);
    //          res.render("reviews/edit", {book_id: req.params.id, review: foundReview});
    //     }   catch{
    //             req.flash("error", "Review not found");
    //             res.redirect("/books");
    //          } 
        });

router.put("/:review_id", middleware.checkReviewOwnership, async (req, res) => {
          
            let product
            let review
    try{    
            review = await Review.findById(req.params.review_id);
            review.text = req.body.text,
            review.rating = req.body.rating
            await review.save();
            // const updatedReview = await Review.findByIdAndUpdate(req.params.review_id, newReview, {new: true});
            product = await Product.findOne({"slug": req.params.slug}).populate("reviews").exec();
            // recalculate book average
            product.rating = calculateAverage(product.reviews);
            //save changes
            await product.save();
            req.flash("success", "Your review was successfully edited.");
            res.redirect('/products/' + product.slug);
    } catch {
            if(review != null){
                res.render("reviews/edit", {product_id: req.params.slug, review: review})
              } else{
                 req.flash("error", "Pls try again, something went wrong");
                return res.redirect("back");
              }
           
    }
});

// Reviews Delete
router.delete("/:review_id", middleware.checkReviewOwnership, async (req, res) => {
    let review
    let product
    try{
        review = await Review.findById(req.params.review_id);
        await review.remove();
        product = await Product.findOneAndUpdate({"slug": req.params.slug}, {$pull: {reviews: req.params.review_id}}, {new: true}).populate("reviews").exec()
         // recalculate book average
            product.rating = calculateAverage(product.reviews);
            //save changes
            product.save();
            req.flash("success", "Your review was deleted successfully.");
            res.redirect("/products/" + req.params.slug);
    } catch(err){
            console.log(err);
            req.flash("error", 'Could not remove review. Try again');
            return res.redirect("back");
    }
});


function calculateAverage(reviews) {
    if (reviews.length === 0) {
        return 0;
    }
    var sum = 0;
    reviews.forEach(function (element) {
        sum += element.rating;
    });
    return sum / reviews.length;
}

module.exports = router;
