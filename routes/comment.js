const express = require("express");
const router  = express.Router({mergeParams: true});
const Blog = require("../models/blog");
const Comment = require("../models/comment");
const middleware = require("../middleware");

//Comments New
router.get("/new", middleware.isLoggedIn, function(req, res){
    // find blog by id
    Blog.findOne({"slug": req.params.slug}, function(err, blog){
        if(err || !blog){
            console.log(err);
            req.flash("error", 'No blog found');
            res.redirect("/blog");
        } else {
             res.render("comments/new", {blog: blog});
        }
    });
});

// //Comments Create
router.post("/", middleware.isLoggedIn, function(req, res){
   //lookup campground using ID
   Blog.findOne({"slug": req.params.slug}, function(err, blog){
       if(err){
           console.log(err);
           res.redirect("/blog");
       } else {
        Comment.create(req.body.comment, function(err, comment){
           if(err){
               req.flash("error", "Something went wrong");
                res.redirect("/blog");
           } else {
               //add username and id to comment
               comment.author.id = req.user._id;
               comment.author.lastName = req.user.lastName;
               //save comment
               comment.save();
               blog.comments.push(comment);
               blog.save();
               console.log(comment);
               req.flash("success", "Successfully added comment");
               res.redirect('/blog/' + blog.slug);
           }
        });
       }
   });
});


// // COMMENT EDIT ROUTE
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
   Blog.findOne({"slug": req.params.slug}, function(err, foundBlog){
            if(err || !foundBlog){
                req.flash("error", "No blog found");
                return res.redirect("/blog");
            }
            Comment.findById(req.params.comment_id, function(err, foundComment){
            if(err || !foundComment){
                req.flash("error", "Comment not found");
                res.redirect("/blog");
            }else{
                res.render("comments/edit", {slug: req.params.slug, comment: foundComment});
            }
         });
        });
         
});

// COMMENT UPDATE
router.put("/:comment_id", middleware.checkCommentOwnership, async (req, res) =>{
  let updatedComment;
  try{ 
     updatedComment = await Comment.findById(req.params.comment_id);
     updatedComment.text = req.body.comment.text;
     await updatedComment.save();
     
     req.flash("success", "comment was successfully updated!");
     res.redirect("/blog" + req.params.slug);
     
  } catch(error){
       res.redirect("back");
  }
});


// // COMMENT DESTROY ROUTE
router.delete("/:comment_id", middleware.checkCommentOwnership, async (req, res) =>{
    //findByIdAndRemove
    let comment
    let blog
      try{
           comment = await Comment.findById(req.params.comment_id);
           await comment.remove();
           blog = await Blog.findOneAndUpdate({"slug": req.params.slug}, {$pull: {comments: req.params.comment_id}}, {new: true}).populate("comments").exec()
        
            //save changes
            blog.save();
            req.flash("success", "Your comment was deleted successfully.");
            res.redirect("/blog/" + req.params.slug);
    } catch(err){
      console.log(err);
            req.flash("error", 'Could not remove comment. Try again');
            return res.redirect("back");
    }
});

    
module.exports = router;