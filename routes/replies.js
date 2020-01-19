const express = require("express");
const router  = express.Router({mergeParams: true});
const Blog = require("../models/blog");
const Comment = require("../models/comment");
const Reply = require("../models/reply");
const middleware = require("../middleware");

//Reply
router.get("/new", middleware.isLoggedIn, function(req, res){
    // find blog by id
    Blog.findOne({"slug": req.params.slug}, function(err, blog){
        if(err || !blog){
            console.log(err);
            req.flash("error", 'No blog found');
        } else {
          const comment_id = req.params.comment_id;
          res.render("replies/new", {blog: blog, comment_id: comment_id});
        }
    });
});

// //Comments Create
router.post("/", middleware.isLoggedIn, function(req, res){
   //lookup campground using ID
   Comment.findById(req.params.comment_id).populate({
      path: "replies",
      options: {sort: {createdAt: -1}}
      }).exec( function(err, comment){
       if(err){
           console.log(err);
           res.redirect("/blog");
       } else {
        Reply.create(req.body.reply, function(err, reply){
           if(err){
               req.flash("error", "Something went wrong");
               console.log(err);
           } else {
               //add username and id to comment
               reply.author.id = req.user._id;
               reply.author.lastName = req.user.lastName;
        
               //save comment
               reply.save();
               comment.replies.push(reply);
               // comment.populate("replies").exec();
               comment.save();
               req.flash("success", "Successfully added reply");
               res.redirect('/blog/' + req.params.slug);
           }
        });
       }
   });
});


// // EDIT reply ROUTE
// router.get("/:reply_id/edit", middleware.checkCommentOwnership, function(req, res){
//    Blog.findById(req.params.id, function(err, foundBlog){
//             if(err || !foundBlog){
//                 req.flash("error", "No blog found");
//                 return res.redirect("/blogs");
//             }
//             Comment.findById(req.params.comment_id, function(err, foundComment){
//             if(err || !foundComment){
//                 req.flash("error", "Comment not found");
//                 res.redirect("/blogs");
//             }else{
//                 res.render("comments/edit", {blog_id: req.params.id, comment: foundComment});
//             }
//          });
//         });
         
// });



    
module.exports = router;