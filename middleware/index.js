const Product = require("../models/product");
const Review = require("../models/review");
const Comment = require("../models/comment");



// all the middleare goes here
let middlewareObj = {};

middlewareObj.checkCommentOwnership = function(req, res, next) {
 if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, foundComment){
           if(err || !foundComment){
               res.redirect("back");
           }  else {
               // does user own the comment?
            if(foundComment.author.id.equals(req.user._id)) {
                next();
            } else {
                req.flash("error", "You don't have permission to do that");
                res.redirect("back");
            }
           }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};

middlewareObj.checkReviewOwnership = function(req, res, next) {
    if(req.isAuthenticated()){
        Review.findById(req.params.review_id, function(err, foundReview){
            if(err || !foundReview){
                req.flash("error", "Review not found");
                res.redirect("/");
            }  else {
                // does user own the review?
                if(foundReview.author.id.equals(req.user._id) || req.user.isAdmin) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};

middlewareObj.adminAccess = function(req, res, next) {
    if(req.isAuthenticated()){
        if(req.user.isAdmin){
            next();
        } else {
            req.flash("error", "You don't have permission to do that");
            res.redirect("back");
        }
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};


middlewareObj.checkReviewExistence = function (req, res, next) {
    if (req.isAuthenticated()) {
        Product.findOne({"slug": req.params.slug}).populate("reviews").exec(function (err, foundProduct) {
            if (err || !foundProduct) {
                req.flash("error", "Product not found.");
                res.redirect("back");
            } else {
                // check if req.user._id exists in foundBook.reviews
                const foundUserReview = foundProduct.reviews.some(function (review) {
                    return review.author.id.equals(req.user._id);
                });
                if (foundUserReview) {
                    req.flash("error", "You already wrote a review.");
                    return res.redirect("/products/" + foundProduct.slug);
                }
                // if the review was not found, go to the next middleware
                next();
            }
        });
    } else {
        req.flash("error", "You need to login first.");
        res.redirect("back");
    }
};

// middlewareObj.validate = (schema, property) => {
//     return (req, res, next) => {
//         const {error} = Joi.validate(req[property], schema);
//         const valid = error == null;
//         if (valid){next();}
//         else{
//             const {details} = error;
//             const message = details.map(i=>i.message).join(',');
//             console.log("error", message);
//             res.status(422).json({error:message});
//         }
//     };
// };


middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/users/login");
};

module.exports = middlewareObj;